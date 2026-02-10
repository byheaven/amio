# Plan v3: Expand Theme System — Icons-first + Theme runtime foundation

## Problem Statement

The current theme system is primarily a CSS-class switch (`theme-${id}`) driven by `src/hooks/useTheme.ts`, with theme metadata in `src/constants/themes.ts` and tile icons in `src/constants/icons.ts`. Tool icons are inline React SVG components in `src/components/ToolBar/ToolBar.tsx`. This makes icons (and later animations/layout) theme-unaware and harder to extend.

## Goals (This PR)

- Introduce a JSON-serializable `ThemeConfig` model and a small theme "runtime" (registry + resolver + context/provider) under `src/themes/`
- Make tile icons and toolbar tool icons theme-aware
- Keep existing SCSS theme files and existing `theme-${id}` class behavior working
- Minimize migration risk by keeping the existing `useTheme()` API available as a compatibility layer

## Non-Goals (Explicitly Out of Scope)

- Layout theming (removing hardcoded `36px/32px` in Board.tsx, slot sizes in SCSS)
- Animation theming (tokenizing keyframes/timings)
- AI-generated themes, schema validation, theme editor UI
- Cross-platform SVG rendering changes beyond what the app already does today (see Risks)

## Current State (Relevant Files)

- Theme switching + persistence + event sync: `src/hooks/useTheme.ts`
- Theme picker data: `src/constants/themes.ts`
- Tile SVG strings: `src/constants/icons.ts` (9 tile types)
- Tile rendering: `src/components/Tile/Tile.tsx` (uses HTML injection for SVG - see security note)
- ToolBar rendering: `src/components/ToolBar/ToolBar.tsx` (3 inline SVG components: UndoIcon, PopIcon, ShuffleIcon)
- Root wrapper: `src/app.tsx` (`<View className={themeClass}>{children}</View>`)

---

## Proposed Design

### Theme Model (JSON-Serializable)

**New file**: `src/themes/types.ts`

```typescript
export type ThemeId = string

export interface ThemeTabBar {
  color: string
  selectedColor: string
  backgroundColor: string
  borderStyle: 'black' | 'white'
}

export interface ThemeIconSet {
  /** Tile icons keyed by TileType enum values (9 tile types) */
  tiles: Record<TileType, string>
  /** Tool icons (SVG strings) */
  tools: {
    undo: string
    pop: string      // "移出" tool (not "remove")
    shuffle: string
  }
}

export interface ThemeConfig {
  id: ThemeId
  name: string
  icon: string                           // Emoji for picker preview
  previewColors: [string, string, string] // Gradient [start, mid, end]
  themeClass: string                     // e.g. 'theme-shark-star' (preserves SCSS behavior)
  tabBar: ThemeTabBar
  icons: ThemeIconSet

  // Reserved for future phases (keep types minimal for now)
  layoutVariant?: 'compact' | 'default' | 'spacious'
  animations?: Record<string, string>     // Future: keyframe name + timing overrides
  colors?: Record<string, string>         // Future: runtime CSS var overrides
}
```

**Design rationale**:
- All fields are JSON-serializable (strings, objects, arrays — no functions, Maps, Sets)
- `themeClass` is explicit rather than computed to make serialization trivial
- Reserved fields (`layoutVariant`, `animations`, `colors`) are optional and typed as placeholders

### Theme Registry (Static Presets)

**New file**: `src/themes/registry.ts`

```typescript
import { sharkStarTheme } from './presets/shark-star'
import { sakuraTheme } from './presets/sakura'
import type { ThemeConfig, ThemeId } from './types'

/**
 * Central theme registry.
 * Using Record instead of Map for simpler serialization and tree-shaking.
 */
const THEME_REGISTRY: Record<ThemeId, ThemeConfig> = {
  'shark-star': sharkStarTheme,
  'sakura': sakuraTheme,
}

export function getThemeConfigById(id: ThemeId): ThemeConfig {
  return THEME_REGISTRY[id] || THEME_REGISTRY['shark-star']
}

export function getAllThemeConfigs(): ThemeConfig[] {
  return Object.values(THEME_REGISTRY)
}

// Future: add registerTheme(config) for dynamic themes if needed
```

**Design notes**:
- Imports are explicit (helps bundlers with tree-shaking)
- `Record` instead of `Map` (simpler, JSON-friendly)
- Fallback to `shark-star` for unknown IDs

### Theme Context/Provider

**New file**: `src/themes/ThemeContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, useMemo, useCallback, PropsWithChildren } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getThemePreference, setThemePreference } from '../utils/storage'
import { getThemeConfigById } from './registry'
import type { ThemeId, ThemeIconSet, TileType } from './types'

const THEME_CHANGE_EVENT = 'theme:change'

interface ResolvedTheme {
  id: ThemeId
  name: string
  themeClass: string
  icons: ThemeIconSet
  switchTheme: (newId: ThemeId) => void
}

const ThemeContext = createContext<ResolvedTheme | null>(null)

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeId, setThemeId] = useState<ThemeId>(() => getThemePreference())

  const config = useMemo(() => getThemeConfigById(themeId), [themeId])

  const switchTheme = useCallback((newId: ThemeId) => {
    setThemePreference(newId)
    setThemeId(newId)

    // Apply tab bar style
    const newConfig = getThemeConfigById(newId)
    try {
      Taro.setTabBarStyle({
        color: newConfig.tabBar.color,
        selectedColor: newConfig.tabBar.selectedColor,
        backgroundColor: newConfig.tabBar.backgroundColor,
        borderStyle: newConfig.tabBar.borderStyle,
      })
    } catch (error) {
      console.error('Failed to set tab bar style:', error)
    }

    // Cross-page sync
    Taro.eventCenter.trigger(THEME_CHANGE_EVENT, newId)
  }, [])

  // Sync theme state across tab bar pages
  useEffect(() => {
    const handler = (newId: ThemeId) => setThemeId(newId)
    Taro.eventCenter.on(THEME_CHANGE_EVENT, handler)
    return () => { Taro.eventCenter.off(THEME_CHANGE_EVENT, handler) }
  }, [])

  // Apply tab bar style on initial mount
  useEffect(() => {
    try {
      Taro.setTabBarStyle({
        color: config.tabBar.color,
        selectedColor: config.tabBar.selectedColor,
        backgroundColor: config.tabBar.backgroundColor,
        borderStyle: config.tabBar.borderStyle,
      })
    } catch (error) {
      console.error('Failed to set initial tab bar style:', error)
    }
  }, []) // Run once on mount

  // Memoize resolved theme to prevent unnecessary re-renders
  const resolved = useMemo<ResolvedTheme>(() => ({
    id: config.id,
    name: config.name,
    themeClass: config.themeClass,
    icons: config.icons,
    switchTheme,
  }), [config, switchTheme])

  return (
    <ThemeContext.Provider value={resolved}>
      <View className={resolved.themeClass}>
        {children}
      </View>
    </ThemeContext.Provider>
  )
}

export function useThemeContext(): ResolvedTheme {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return ctx
}

/** Specialized hook: returns SVG string for a specific tile type */
export function useTileIcon(type: TileType): string {
  const { icons } = useThemeContext()
  return icons.tiles[type]
}

/** Specialized hook: returns all tool icons */
export function useToolIcons() {
  const { icons } = useThemeContext()
  return icons.tools
}
```

**Design decisions**:
- `ResolvedTheme` is flat (no nested `config` field) for easier consumption
- All side effects (storage, tab bar, eventCenter) are centralized in the provider
- `useMemo` on `resolved` prevents re-renders when `config` object identity changes but values are same
- Specialized hooks (`useTileIcon`, `useToolIcons`) provide focused API for components

### Backward-Compatible Hook

**Modify**: `src/hooks/useTheme.ts`

Convert to a compatibility shim that delegates to `ThemeContext`:

```typescript
import { useThemeContext } from '../themes/ThemeContext'

/**
 * @deprecated Use useThemeContext() from themes/ThemeContext instead.
 * This hook is kept for backward compatibility during migration.
 */
export function useTheme() {
  const { id, themeClass, switchTheme } = useThemeContext()
  return {
    themeId: id,
    themeClass,
    switchTheme,
  }
}
```

**Migration strategy**:
- Existing code using `useTheme()` continues to work unchanged
- New code should use `useThemeContext()`, `useTileIcon()`, or `useToolIcons()`
- All side effect logic removed from this file (now lives in `ThemeProvider`)

---

## Icon Theming (This PR Focus)

### Preset Structure

Create modular theme packages:

```
src/themes/presets/
  shark-star/
    icons.ts        # ThemeIconSet with 9 tiles + 3 tools
    index.ts        # ThemeConfig export
  sakura/
    icons.ts        # ThemeIconSet with 9 tiles + 3 tools
    index.ts        # ThemeConfig export
```

### Shark-Star Icons

**New file**: `src/themes/presets/shark-star/icons.ts`

- Move all 9 SVG strings from `src/constants/icons.ts`
- Extract 3 tool SVG components from `ToolBar.tsx` and convert to strings:
  - `UndoIcon` → `tools.undo`
  - `PopIcon` → `tools.pop`
  - `ShuffleIcon` → `tools.shuffle`

**New file**: `src/themes/presets/shark-star/index.ts`

```typescript
import type { ThemeConfig } from '../../types'
import { sharkStarIcons } from './icons'

export const sharkStarTheme: ThemeConfig = {
  id: 'shark-star',
  name: '鲨之星',
  icon: '🦈',
  previewColors: ['#0a0a1a', '#1a1a3e', '#4a9eff'],
  themeClass: 'theme-shark-star',
  tabBar: {
    color: '#999999',
    selectedColor: '#4a9eff',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
  },
  icons: sharkStarIcons,
}
```

### Sakura Icons (Scope Control)

**Strategy for this PR**: Start with color palette adjustments only, avoiding full icon redesign.

**New file**: `src/themes/presets/sakura/icons.ts`

Color palette mapping (warm, soft, romantic):

| Tile Type | Shark-Star Color | Sakura Color | Notes |
|-----------|------------------|--------------|-------|
| star | #FFD700 (gold) | #FFB7D5 (rose gold) | Warmer metallic |
| shark | #00BFFF (sky blue) | #FF69B4 (hot pink) | Playful reinterpretation |
| bamboo | #90EE90 (light green) | #E6B8D7 (lavender) | Softer nature tone |
| dot | #FF6347 (tomato) | #FF91A4 (coral pink) | Warmer red |
| character | #FFB6C1 (light pink) | #DDA0DD (plum) | Deeper purple-pink |
| racket | #FF4500 (orange-red) | #FF6EB4 (bright pink) | More vibrant |
| medal | #FFD700 (gold) | #FFC0CB (pastel pink) | Softer achievement |
| heart | #DC143C (crimson) | #FF1493 (deep pink) | Consistent pink theme |
| pingpong | #FFFFFF (white) | #FFF0F5 (lavender blush) | Subtle warmth |

Shape tweaks (optional for initial implementation):
- Rounder corners on `character` rectangle
- Softer curves on `shark` fin
- Slightly larger stroke-width for warmer feel

**Full redesign** (e.g., petal motifs, hand-drawn sakura style) → separate PR after pipeline is proven.

**New file**: `src/themes/presets/sakura/index.ts` (same structure as shark-star)

---

## Wiring Changes

### App Root

**Modify**: `src/app.tsx`

Replace theme hook + bare View wrapper with ThemeProvider.

### Tile Component

**Modify**: `src/components/Tile/Tile.tsx`

Replace direct ICONS lookup with `useTileIcon(type)` hook.

**Security note**: SVG strings are rendered using HTML injection (existing pattern). All SVG content is developer-controlled (hardcoded in theme preset files), not user input. No sanitization needed for this use case.

### ToolBar Component

**Modify**: `src/components/ToolBar/ToolBar.tsx`

Remove inline SVG components, use `useToolIcons()` hook with same rendering pattern as Tile.

### Home Theme Switcher

**Modify**: `src/pages/home/index.tsx`

Replace constants imports with registry calls and context hook.

---

## File Deletions

**After migration is complete and all imports are removed**:

- Delete `src/constants/icons.ts` (replaced by `themes/presets/*/icons.ts`)
- Delete `src/constants/themes.ts` (replaced by `registry.ts` + preset configs)

**Do NOT delete** `src/hooks/useTheme.ts` — it becomes a compatibility shim.

---

## Performance Considerations

### Context Re-render Optimization

- `ThemeProvider` uses `useMemo` on the `resolved` value → only re-computes when `config` or `switchTheme` identity changes
- Theme switches are infrequent user actions (not every frame)

### Impact on 75-150 Tile Instances

- Each `useTileIcon(type)` call invokes `useContext(ThemeContext)` → **O(1) lookup**
- Context value identity only changes on theme switch
- **No performance regression** vs. current `ICONS[type]` direct lookup:
  - Current: object property access (O(1))
  - New: Context read (O(1)) + object property access (O(1))
  - Both approaches cause full re-render on theme change (current via SCSS class, new via Context)

### Benchmark (if needed)

```typescript
// Optional: add performance.mark in ThemeProvider.switchTheme
const start = performance.now()
switchTheme(newId)
console.log(`Theme switch took ${performance.now() - start}ms`)
```

Expected: <50ms for theme switch with 150 tiles (dominated by CSSOM recalc, not React renders).

---

## Testing

### Unit Tests

**New file**: `src/themes/__tests__/registry.test.ts`
- Test `getThemeConfigById('shark-star')` returns correct config
- Test `getThemeConfigById('unknown-id')` falls back to shark-star
- Test `getAllThemeConfigs()` returns 2 themes

**New file**: `src/themes/__tests__/ThemeContext.test.tsx`
- Test `ThemeProvider` loads initial theme from storage
- Test `switchTheme()` updates storage + triggers eventCenter
- Mock `Taro.setTabBarStyle` and verify it's called with correct values

### Integration Tests

**Modify existing Tile tests** (if any):
- Mock `useTileIcon` to return a test SVG string
- Verify HTML injection receives the mocked value

**Modify existing ToolBar tests** (if any):
- Mock `useToolIcons` to return test tool icons
- Verify all 3 tool buttons render correctly

### Manual Testing Checklist

- [ ] `cd amio-app && npm run dev:h5` — app loads with shark-star theme
- [ ] Home page theme switcher: click Sakura → colors change AND tile/tool icons change
- [ ] Game page: tiles render with themed icons, match-3 clearing works
- [ ] Persistence: switch to sakura → refresh → sakura still active
- [ ] Cross-page sync: switch on Home → navigate to Game → correct theme active
- [ ] `npm test` — all existing tests pass

### Visual Regression (Optional)

If screenshot testing is available:
- Capture Home theme picker with both themes
- Capture Game board with shark-star icons
- Capture Game board with sakura icons
- Compare against baseline

---

## Verification Checklist

### Code Sanity

- [ ] No remaining imports of `src/constants/icons.ts`
- [ ] No remaining imports of `src/constants/themes.ts`
- [ ] `src/hooks/useTheme.ts` only delegates to `useThemeContext()` (no side effects)
- [ ] TypeScript compiles without errors (`npm run build:h5`)

### Runtime Behavior

- [ ] Default theme (shark-star) loads on first launch
- [ ] Theme switch updates SCSS colors (existing behavior preserved)
- [ ] Theme switch updates tile icons (new behavior)
- [ ] Theme switch updates tool icons (new behavior)
- [ ] Theme persists across page refreshes
- [ ] Theme syncs across tab bar pages (Home ↔ Game ↔ Starlight)

---

## Risks and Mitigation

### Risk 1: SVG Rendering Compatibility

**Current state**: HTML injection for SVG works reliably on H5 but may not work on WeChat/Douyin mini-programs.

**Mitigation for this PR**: Keep existing rendering approach (H5-focused). Document the limitation.

**Future work** (separate PR):
- Test SVG rendering on WeChat/Douyin mini-program
- If broken, migrate to cross-platform alternatives:
  - Taro `RichText` component with SVG as data URI
  - Pre-convert SVGs to Base64 data URIs and use `Image` component
  - Use `Canvas` API for icon rendering

### Risk 2: Theme Config Size

**Concern**: Inline SVG strings in theme configs could bloat bundle size.

**Current state**: 9 tile SVGs + 3 tool SVGs ≈ 3-5 KB per theme (gzipped).

**Mitigation**: Acceptable for 2 themes (< 10 KB total). If we add 10+ themes, consider:
- Code-split theme presets (dynamic imports)
- SVG sprite sheets with `<use>` references
- Server-side theme config loading

### Risk 3: Migration Coordination

**Concern**: Partial migration could leave the app in inconsistent state.

**Mitigation**:
- Keep `useTheme()` as compatibility shim → gradual migration
- Deploy all changes atomically in one PR
- Feature flag (optional): `ENABLE_THEME_ICONS` in config

---

## File Changes Summary

### New Files (7)

| File | Purpose |
|------|---------|
| `src/themes/types.ts` | TypeScript types (ThemeConfig, ThemeIconSet, etc.) |
| `src/themes/registry.ts` | Central theme registry + getters |
| `src/themes/ThemeContext.tsx` | React Context, Provider, hooks |
| `src/themes/presets/shark-star/icons.ts` | Shark-star icon set (9 tiles + 3 tools) |
| `src/themes/presets/shark-star/index.ts` | Shark-star ThemeConfig |
| `src/themes/presets/sakura/icons.ts` | Sakura icon set (color-adjusted) |
| `src/themes/presets/sakura/index.ts` | Sakura ThemeConfig |

### Modified Files (5)

| File | Change |
|------|--------|
| `src/app.tsx` | Replace `useTheme()` + bare View with `<ThemeProvider>` |
| `src/hooks/useTheme.ts` | Convert to compatibility shim (delegate to `useThemeContext()`) |
| `src/components/Tile/Tile.tsx` | Use `useTileIcon(type)` instead of `ICONS[type]` |
| `src/components/ToolBar/ToolBar.tsx` | Use `useToolIcons()` instead of inline SVG components |
| `src/pages/home/index.tsx` | Use `getAllThemeConfigs()` + `useThemeContext()` |

### Deleted Files (2)

| File | Replaced By |
|------|-------------|
| `src/constants/icons.ts` | `themes/presets/*/icons.ts` |
| `src/constants/themes.ts` | `themes/registry.ts` + `themes/presets/*/index.ts` |

### Unchanged Files

- `src/styles/themes/_shark-star.scss` — color tokens stay in SCSS
- `src/styles/themes/_sakura.scss` — color tokens stay in SCSS
- All 403 existing `var(--t-*)` usages across 21 SCSS files — completely unaffected

---

## Follow-Up Work (Separate PRs)

### Phase 2: Layout Theming
- Move Board.tsx hardcoded spacing (`36px`, `32px`) into layout tokens
- Move Slot/TempSlot hardcoded widths into layout config
- Add 3 layout presets: compact, default, spacious
- Use `useBoardLayout()` hook in components

### Phase 3: Animation Theming
- Introduce `--t-anim-*` CSS custom properties in `_variables.scss`
- Theme SCSS files override animation timing/keyframe names
- Components reference `animation: var(--t-anim-tile-appear)` instead of hardcoded values
- Themes can define custom @keyframes (e.g., `sakura-float`)

### Phase 4: AI Integration
- JSON Schema validation for ThemeConfig
- `applyThemePatch(base, patch)` merge function for partial overrides
- Runtime CSS variable injection via `style` attribute
- Theme editor UI with natural language input
- Claude API integration for theme generation

---

## Implementation Order

1. **Foundation** (non-breaking):
   - Create `types.ts`, `registry.ts`, `ThemeContext.tsx`
   - Create shark-star preset (move existing icons)
   - Create sakura preset (color-adjusted icons)
   - Wire `ThemeProvider` into `app.tsx`

2. **Migration** (breaking changes):
   - Update Tile component
   - Update ToolBar component
   - Update Home page
   - Convert `useTheme()` to compatibility shim

3. **Cleanup**:
   - Delete `constants/icons.ts`
   - Delete `constants/themes.ts`
   - Add deprecation comments to `useTheme()`

4. **Testing**:
   - Add unit tests
   - Update existing tests
   - Manual QA on H5

5. **Documentation**:
   - Update CLAUDE.md with new theme system architecture
   - Add JSDoc comments to public APIs
