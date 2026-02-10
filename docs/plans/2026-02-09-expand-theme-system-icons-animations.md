# Plan: Expand Theme System — Icons, Animations, Layouts

## Context

The current theme system only handles **color palette switching** via ~170 CSS custom properties. Icons (hardcoded SVGs in `constants/icons.ts`), animations (static keyframes in `_keyframes.scss`), and layouts (hardcoded pixels like `tile.x * 36px`) are all theme-unaware.

**Goal**: Evolve to a full "design system runtime" where each theme is a complete package (colors + icons + animations + layout). The architecture must be JSON-serializable so a future AI integration can generate theme configs at runtime.

**This PR scope**: Architecture foundation + Icon theming (highest priority per user).

---

## Architecture Overview

```
ThemeConfig (JSON-serializable)
  |-- colors: Record<string, string>     <- existing SCSS stays, this is for runtime overrides
  |-- icons: ThemeIconSet                <- NEW: per-theme tile + tool icons
  |-- animations: ThemeAnimations        <- FUTURE: animation timing tokens
  |-- layout: LayoutVariant | BoardLayout <- FUTURE: switchable layout presets
  |-- meta: name, icon, previewColors, tabBar

ThemeProvider (React Context)
  |-- resolves ThemeConfig -> ResolvedTheme
  |-- wraps app root (replaces bare <View className={themeClass}>)
  |-- syncs across pages via Taro.eventCenter (kept for cross-page compat)
  |-- injects runtime CSS overrides via inline style (for future AI themes)

Components
  |-- Tile: useTileIcon(type) instead of ICONS[type]
  |-- ToolBar: useThemeContext().icons.tools instead of hardcoded SVGs
  |-- Board: useBoardLayout() instead of hardcoded 36/32px (future phase)
  |-- All SCSS: var(--t-anim-*) instead of hardcoded keyframe refs (future phase)
```

---

## Phase 1: Theme Architecture Foundation

### 1.1 Create type definitions

**New file**: `src/themes/types.ts`

- `ThemeConfig` — complete JSON-serializable theme definition
- `ThemeIconSet` — `{ tiles: Record<TileType, string>, tools: { undo, pop, shuffle } }`
- `ThemeAnimations` — keyframe names + timing strings
- `BoardLayout` — all dimension numbers (tileSpacingX/Y, tileWidth/Height, etc.)
- `LayoutVariant` — `'compact' | 'default' | 'spacious'`
- `ThemePatch` — partial override type for future AI customization

### 1.2 Create defaults

**New file**: `src/themes/defaults.ts`

- `LAYOUT_PRESETS: Record<LayoutVariant, BoardLayout>` — compact/default/spacious dimensions
- `DEFAULT_ANIMATIONS: ThemeAnimations` — current timing values as defaults

### 1.3 Create Theme Registry

**New file**: `src/themes/registry.ts`

- `THEME_REGISTRY: Map<string, ThemeConfig>`
- `getThemeConfigById(id)` — falls back to shark-star
- `getAllThemeConfigs()` — returns all registered themes
- `registerTheme(config)` — for future dynamic themes

### 1.4 Create ThemeProvider + Context

**New file**: `src/themes/ThemeContext.tsx`

- `ThemeContext` with `ResolvedTheme` value type
- `ResolvedTheme` includes: `id, name, themeClass, icons, layout, animations, switchTheme`
- `ThemeProvider` component:
  - useState for themeId (loaded from localStorage)
  - useMemo to resolve ThemeConfig into ResolvedTheme (fill defaults for layout/animations)
  - Renders root View with themeClass + optional inline color overrides
  - eventCenter listener for cross-page sync
  - switchTheme updates storage + eventCenter + Taro tab bar style
- Hooks:
  - `useThemeContext()` — full ResolvedTheme
  - `useTileIcon(tileType)` — returns SVG string for a tile type
  - `useBoardLayout()` — returns resolved BoardLayout (future use)

### 1.5 Wire into app.tsx

**Modify**: `src/app.tsx`

- Replace `useTheme()` hook + bare `<View className={themeClass}>` with `<ThemeProvider>`
- ThemeProvider internally renders the same `<View className="theme-shark-star">` wrapper

---

## Phase 2: Icon Theming (This PR Priority)

### 2.1 Create per-theme icon modules

**New file**: `src/themes/presets/shark-star/icons.ts`
- Move all 9 SVG strings from current `src/constants/icons.ts`
- Add 3 tool SVG strings extracted from ToolBar.tsx inline components (UndoIcon, PopIcon, ShuffleIcon)
- Exports `sharkStarIcons: ThemeIconSet`

**New file**: `src/themes/presets/sakura/icons.ts`
- Create sakura-themed icon variants: warm colors (pinks, soft corals, lavender), rounder/softer shapes
- Same 9 tile types + 3 tools, visually distinct from shark-star
- Exports `sakuraIcons: ThemeIconSet`

### 2.2 Create theme config modules

**New file**: `src/themes/presets/shark-star/index.ts`
- Exports `sharkStarTheme: ThemeConfig` with id, name, icon, previewColors, tabBar, icons, layout='default', animations={}, colors={}

**New file**: `src/themes/presets/sakura/index.ts`
- Same structure with sakura values

### 2.3 Update Tile component

**Modify**: `src/components/Tile/Tile.tsx`

- Remove `import { ICONS } from '../../constants/icons'`
- Add `import { useTileIcon } from '../../themes/ThemeContext'`
- Replace `ICONS[type]` with `useTileIcon(type)`
- Icon rendering logic unchanged (existing SVG injection pattern, all SVGs are developer-controlled)

### 2.4 Update ToolBar component

**Modify**: `src/components/ToolBar/ToolBar.tsx`

- Remove 3 inline SVG components (UndoIcon, PopIcon, ShuffleIcon)
- Get tool icons from `useThemeContext().icons.tools`
- Render via View with SVG injection (same trusted pattern as Tile)

### 2.5 Update Home page theme switcher

**Modify**: `src/pages/home/index.tsx`

- Replace `THEMES` import from `constants/themes` with `getAllThemeConfigs()` from registry
- Replace `useTheme()` import with `useThemeContext()` from ThemeContext
- Theme picker logic unchanged, just different data source

### 2.6 Remove old files

- Delete `src/constants/icons.ts` (replaced by per-theme icon modules)
- Delete `src/constants/themes.ts` (replaced by registry + per-theme configs)
- Delete `src/hooks/useTheme.ts` (replaced by ThemeContext hooks)

---

## Future Phases (documented, not this PR)

### Phase 3: Animation Theming
- Add `--t-anim-*` CSS custom properties as defaults in `_variables.scss`
- Theme SCSS files override: `.theme-sakura { --t-anim-tile-appear: scaleIn 0.5s ease }`
- Components reference `animation: var(--t-anim-tile-appear)` instead of hardcoded
- Themes can define custom @keyframes in their SCSS (e.g. sakura-float)

### Phase 4: Layout Theming
- Board.tsx uses `useBoardLayout()` for `tile.x * layout.tileSpacingX`
- Slot/TempSlot read slotTileWidth/Height from layout
- 3 presets: compact, default, spacious

### Phase 5: AI Integration Prep
- JSON Schema validation for ThemeConfig
- `applyThemePatch(base, patch)` merge function
- Runtime color injection via style attribute
- Theme editor UI with natural language input

---

## Files Summary

### New files (8)
| File | Purpose |
|------|---------|
| `src/themes/types.ts` | Type definitions (ThemeConfig, ThemeIconSet, BoardLayout, ThemePatch) |
| `src/themes/defaults.ts` | Layout presets + animation defaults |
| `src/themes/registry.ts` | Central theme registry |
| `src/themes/ThemeContext.tsx` | React Context, Provider, hooks |
| `src/themes/presets/shark-star/index.ts` | Shark Star config |
| `src/themes/presets/shark-star/icons.ts` | Shark Star icon set (moved from constants/icons.ts) |
| `src/themes/presets/sakura/index.ts` | Sakura config |
| `src/themes/presets/sakura/icons.ts` | Sakura icon set (new, visually distinct) |

### Modified files (4)
| File | Change |
|------|--------|
| `src/app.tsx` | Wrap with ThemeProvider instead of useTheme + bare View |
| `src/components/Tile/Tile.tsx` | useTileIcon(type) replaces ICONS[type] |
| `src/components/ToolBar/ToolBar.tsx` | Theme-resolved tool icons replace hardcoded SVGs |
| `src/pages/home/index.tsx` | getAllThemeConfigs() + useThemeContext() replace old imports |

### Deleted files (3)
| File | Replaced by |
|------|-------------|
| `src/constants/icons.ts` | `themes/presets/*/icons.ts` |
| `src/constants/themes.ts` | `themes/registry.ts` + `themes/presets/*/index.ts` |
| `src/hooks/useTheme.ts` | `themes/ThemeContext.tsx` |

### Unchanged
- `src/styles/themes/_shark-star.scss` and `_sakura.scss` — color tokens stay in SCSS
- All 403 existing `var(--t-*)` usages across 21 SCSS files — completely unaffected

---

## Verification

1. `cd amio-app && npm run dev:h5` — app loads with shark-star theme
2. Home page theme switcher: click Sakura -> colors change AND tile/tool icons change
3. Game play: tiles render with themed icons, match-3 clearing works
4. Persistence: switch theme -> refresh -> same theme active
5. Cross-page sync: switch on Home -> go to Game -> correct theme
6. `npm test` — all existing tests pass
