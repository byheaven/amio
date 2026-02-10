# Plan v2: Expand Theme System — Icons-first + Theme runtime foundation
## Problem statement
The current theme system is primarily a CSS-class switch (`theme-${id}`) driven by `amio-app/src/hooks/useTheme.ts`, with theme metadata in `amio-app/src/constants/themes.ts` and tile icons in `amio-app/src/constants/icons.ts`. Tool icons are inline React SVG components in `amio-app/src/components/ToolBar/ToolBar.tsx`. This makes icons (and later animations/layout) theme-unaware and harder to extend.
## Goals (this PR)
- Introduce a JSON-serializable `ThemeConfig` model and a small theme “runtime” (registry + resolver + context/provider) under `amio-app/src/themes/`.
- Make tile icons and toolbar tool icons theme-aware.
- Keep existing SCSS theme files and existing `theme-${id}` class behavior working.
- Minimize migration risk by keeping the existing `useTheme()` API available as a compatibility layer.
## Non-goals (explicitly out of scope for this PR)
- Layout theming (removing hardcoded `36px/32px` in `Board.tsx`, slot sizes in SCSS).
- Animation theming (tokenizing keyframes/timings).
- AI-generated themes, schema validation, theme editor UI.
- Cross-platform SVG rendering changes beyond what the app already does today (see Risks).
## Current state (relevant files)
- Theme switching + persistence + event sync: `amio-app/src/hooks/useTheme.ts`
- Theme picker data: `amio-app/src/constants/themes.ts`
- Tile SVG strings: `amio-app/src/constants/icons.ts`
- Tile rendering: `amio-app/src/components/Tile/Tile.tsx` (uses `dangerouslySetInnerHTML`)
- ToolBar rendering: `amio-app/src/components/ToolBar/ToolBar.tsx` (inline SVG components)
- Root wrapper: `amio-app/src/app.tsx` (`<View className={themeClass}>{children}</View>`)
## Proposed design
### Theme model (JSON-serializable)
Add `amio-app/src/themes/types.ts`:
- `ThemeId = string`
- `ThemeTabBar` (same shape as today)
- `ThemeIconSet`:
  - `tiles: Record<TileType, string>` (SVG string)
  - `tools: { undo: string; remove: string; shuffle: string }` (SVG string)
- `ThemeConfig`:
  - `id: ThemeId`
  - `name: string`
  - `icon: string` (emoji)
  - `previewColors: [string, string, string]` (for Home gradient)
  - `themeClass: string` (e.g. `theme-shark-star`, to preserve SCSS behavior)
  - `tabBar: ThemeTabBar`
  - `icons: ThemeIconSet`
  - `layoutVariant?: 'compact' | 'default' | 'spacious'` (reserved)
  - `animations?: {}` (reserved placeholder type for future)
  - `colors?: Record<string, string>` (reserved for future runtime CSS var overrides)
### Theme registry (static presets for now)
Add `amio-app/src/themes/registry.ts`:
- Import preset theme configs (so bundlers include them).
- `const THEME_REGISTRY: Record<string, ThemeConfig> = { ... }` (avoid `Map` to keep things simple and serializable-friendly).
- `getThemeConfigById(id: string): ThemeConfig` with fallback to `'shark-star'`.
- `getAllThemeConfigs(): ThemeConfig[]`.
Note: If we later need dynamic registration, add `registerTheme(config)` then, but don’t commit to it in this PR.
### Theme context/provider
Add `amio-app/src/themes/ThemeContext.tsx`:
- `ResolvedTheme`:
  - `config: ThemeConfig`
  - `themeId: string`
  - `themeClass: string`
  - `icons: ThemeIconSet`
  - `switchTheme(newId: string): void`
- `ThemeProvider` responsibilities:
  - Load initial theme id from storage (reuse existing `getThemePreference()` / `setThemePreference()` from `amio-app/src/utils/storage`).
  - Apply tab bar style on mount and on switch (same try/catch pattern as current `useTheme.ts`).
  - Cross-page sync using `Taro.eventCenter` with the existing event name (`theme:change`).
  - Render a root `<View className={themeClass}>` wrapper around children to preserve the current SCSS approach.
- Hooks:
  - `useThemeContext()` returns `ResolvedTheme`.
  - `useTileIcon(type: TileType)` returns `icons.tiles[type]`.
  - `useToolIcons()` returns `icons.tools`.
### Backward-compatible hook
Modify `amio-app/src/hooks/useTheme.ts`:
- Keep `export function useTheme()` signature returning `{ themeId, themeClass, switchTheme }`.
- Internally delegate to `useThemeContext()`.
- Keep (or move) the `applyTabBarStyle`/event sync logic only in one place (prefer ThemeProvider), so we don’t duplicate side effects.
This reduces migration risk: existing components can migrate gradually without breaking imports.
## Icon theming (this PR focus)
### Preset structure
Add preset modules:
- `amio-app/src/themes/presets/shark-star/icons.ts`
- `amio-app/src/themes/presets/shark-star/index.ts`
- `amio-app/src/themes/presets/sakura/icons.ts`
- `amio-app/src/themes/presets/sakura/index.ts`
### Shark-star icons
- Move the existing 9 SVG tile strings from `amio-app/src/constants/icons.ts` into `shark-star/icons.ts`.
- Convert ToolBar’s 3 inline SVG components into SVG strings and include them under `icons.tools`.
### Sakura icons (scope control)
- Provide a distinct icon set without turning this PR into a full “icon redesign” effort.
- Recommended approach for this PR: start from shark-star SVGs and adjust palette (fills/strokes) + minor tweaks only.
- Full shape redesign can be a follow-up PR once the pipeline is proven.
## Wiring changes
### App root
Modify `amio-app/src/app.tsx`:
- Replace `const { themeClass } = useTheme()` + `<View className={themeClass}>` with `<ThemeProvider>{children}</ThemeProvider>`.
- Keep the existing launch/redirect logic in `App` unchanged.
### Tile
Modify `amio-app/src/components/Tile/Tile.tsx`:
- Replace `ICONS[type]` with `useTileIcon(type)`.
- Keep the existing rendering mechanism and fallback text behavior.
### ToolBar
Modify `amio-app/src/components/ToolBar/ToolBar.tsx`:
- Remove inline `UndoIcon/PopIcon/ShuffleIcon` components.
- Read `icons.tools` from theme context and render with the same SVG injection approach used by `Tile` (consistent surface area).
### Home theme switcher
Modify `amio-app/src/pages/home/index.tsx`:
- Replace `THEMES` import with `getAllThemeConfigs()`.
- Replace `useTheme()` usage with either `useTheme()` (compat) or `useThemeContext()`.
- Drive the picker UI from `ThemeConfig` fields: `icon`, `name`, `previewColors`.
## Deletions (only after migration)
After all references are removed:
- Delete `amio-app/src/constants/icons.ts`.
- Delete `amio-app/src/constants/themes.ts`.
Do not delete `amio-app/src/hooks/useTheme.ts` in this PR; it becomes a compatibility shim.
## Verification
- `cd amio-app && npm run dev:h5`:
  - App loads with default theme.
  - Switching theme changes SCSS colors (existing behavior) and also changes tile/tool icons.
  - Refresh persists the selected theme.
  - Switching on Home, navigating to Game keeps theme (event sync + storage).
- `cd amio-app && npm test` (existing tests should still pass).
- Codebase sanity checks:
  - No remaining imports of `amio-app/src/constants/icons.ts`.
  - No remaining imports of `amio-app/src/constants/themes.ts`.
## Risks and notes
- SVG rendering is currently implemented via `dangerouslySetInnerHTML` in `Tile.tsx`, which is reliably H5-focused. This PR keeps the existing rendering approach to avoid broad platform work.
- If WeChat/Douyin mini-program support is required for themed SVGs, plan a follow-up to replace HTML injection with a cross-platform rendering strategy (e.g., Taro `RichText` nodes or image/data-uri pipeline).
## File changes (expected)
### New files
- `amio-app/src/themes/types.ts`
- `amio-app/src/themes/registry.ts`
- `amio-app/src/themes/ThemeContext.tsx`
- `amio-app/src/themes/presets/shark-star/icons.ts`
- `amio-app/src/themes/presets/shark-star/index.ts`
- `amio-app/src/themes/presets/sakura/icons.ts`
- `amio-app/src/themes/presets/sakura/index.ts`
### Modified files
- `amio-app/src/app.tsx`
- `amio-app/src/hooks/useTheme.ts`
- `amio-app/src/components/Tile/Tile.tsx`
- `amio-app/src/components/ToolBar/ToolBar.tsx`
- `amio-app/src/pages/home/index.tsx`
### Deleted files
- `amio-app/src/constants/icons.ts`
- `amio-app/src/constants/themes.ts`
## Follow-up work (separate PRs)
- Layout theming: move `Board.tsx` hardcoded spacing and Slot/TempSlot hardcoded widths into layout tokens.
- Animation theming: introduce `--t-anim-*` tokens and theme-specific keyframes.
- Theme schema validation + patch/merge utilities for AI/runtime customization.
