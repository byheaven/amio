# AMIO Theme System Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple UI styling from game logic by building a theme system that allows runtime theme switching via CSS class toggling, with the current "Shark Star" look as the default theme.

**Architecture:** Three-layer token system (Primitive -> Semantic -> Component). Each theme is a `.theme-xxx` CSS class block defining `--t-*` semantic CSS variables. All component SCSS files reference only semantic tokens. Runtime switching is done by changing the class on the root `<View>` in `app.ts`. Non-themeable values (spacing, radius, z-index, fonts, transitions) stay in a shared `:root` block.

**Tech Stack:** SCSS (Taro built-in), CSS Custom Properties, React state for runtime switching, Taro.getStorageSync for persistence.

---

## Task 1: Create styles directory and extract non-themeable tokens

**Files:**
- Create: `amio-app/src/styles/_variables.scss`
- Create: `amio-app/src/styles/_keyframes.scss`
- Create: `amio-app/src/styles/_reset.scss`

**Step 1: Create `_variables.scss`**

Extract lines 75-119 from `src/app.scss` (typography, spacing, radius, transitions, z-index) into this file. These tokens are theme-independent and stay in `:root`.

```scss
// src/styles/_variables.scss
// Non-themeable design tokens - shared across all themes

:root {
  // Typography
  --font-display: 'ZCOOL KuaiLe', 'Noto Sans SC', system-ui, sans-serif;
  --font-body: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;

  --font-size-xs: 10px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  --font-size-3xl: 40px;

  // Spacing (unified - removed duplicate --spacing-* aliases)
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  // Border Radius (fixed: removed conflicting second :root definition)
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  // Transitions
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  --transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  // Z-Index
  --z-base: 1;
  --z-elevated: 10;
  --z-sticky: 50;
  --z-overlay: 100;
  --z-modal: 200;
  --z-toast: 300;
}
```

**Step 2: Create `_keyframes.scss`**

Extract all `@keyframes` blocks from `src/app.scss` (lines 122-263). Copy them exactly as-is. Note: `glow` and `slotPulse` keyframes reference `var(--color-aqua-glow)` — these must be updated to use semantic tokens `var(--t-accent-primary-glow)` during migration. For now, keep the old variable names to avoid breaking anything; they'll still resolve from the theme file.

```scss
// src/styles/_keyframes.scss
// Global animation keyframes

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0.5); }
  60% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px var(--t-accent-primary-glow); }
  50% { box-shadow: 0 0 40px var(--t-accent-primary-glow); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.9; }
}

@keyframes celebrate {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-3deg); }
  50% { transform: scale(1.1) rotate(3deg); }
  75% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes matchClear {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes slotPulse {
  0%, 100% {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1), 0 0 0 0 var(--t-accent-primary-glow);
  }
  50% {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1), 0 0 0 4px var(--t-accent-primary-glow);
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes tileClick {
  0% { transform: scale(1); }
  50% { transform: scale(0.92); }
  100% { transform: scale(1); }
}
```

**Step 3: Create `_reset.scss`**

Extract global reset and utility classes from `src/app.scss` (lines 265-366).

```scss
// src/styles/_reset.scss
// Global reset and utility classes

page {
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(180deg, var(--t-bg-app-primary) 0%, var(--t-bg-app-secondary) 50%, var(--t-bg-app-tertiary) 100%);
  min-height: 100vh;
  color: var(--t-text-primary);
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--t-text-muted); border-radius: 2px; }

// Text alignment
.text-center { text-align: center; }
.text-right { text-align: right; }

// Flexbox
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 4px; }
.gap-8 { gap: 8px; }
.gap-16 { gap: 16px; }

// Animations
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.4s ease-out; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-pulse { animation: pulse 2s ease-in-out infinite; }
.animate-glow { animation: glow 2s ease-in-out infinite; }
```

**Step 4: Run dev server to verify files created correctly**

Run: `cd amio-app && npm run dev:h5`

Expected: Server starts (these files aren't imported yet, so no visual change)

**Step 5: Commit**

```bash
git add amio-app/src/styles/_variables.scss amio-app/src/styles/_keyframes.scss amio-app/src/styles/_reset.scss
git commit -m "feat: create styles directory with extracted design tokens, keyframes, and reset"
```

---

## Task 2: Create Shark Star theme file with all semantic tokens

**Files:**
- Create: `amio-app/src/styles/themes/_shark-star.scss`

**Step 1: Create the complete theme file**

Map every hardcoded color value across all 18 SCSS files to a semantic token. The `.theme-shark-star` class must reproduce the current visual appearance exactly.

```scss
// src/styles/themes/_shark-star.scss
// Shark Star (鲨之星) - Default ocean-dark theme

.theme-shark-star {
  // === Surface / Background ===
  --t-bg-app-primary: #0a0a1a;
  --t-bg-app-secondary: #1a1a3e;
  --t-bg-app-tertiary: #0f0f2a;
  --t-bg-surface: rgba(255, 255, 255, 0.98);
  --t-bg-surface-alt: rgba(247, 250, 252, 0.95);
  --t-bg-surface-dim: rgba(237, 242, 247, 0.92);
  --t-bg-surface-elevated: rgba(235, 248, 255, 0.95);
  --t-bg-glass: rgba(255, 255, 255, 0.08);
  --t-bg-glass-light: rgba(255, 255, 255, 0.12);
  --t-bg-glass-solid: rgba(255, 255, 255, 0.92);
  --t-bg-glass-full: rgba(255, 255, 255, 0.15);
  --t-bg-overlay: rgba(13, 33, 55, 0.95);
  --t-bg-overlay-alt: rgba(26, 54, 93, 0.95);
  --t-bg-muted: rgba(255, 255, 255, 0.05);
  --t-bg-muted-hover: rgba(255, 255, 255, 0.1);
  --t-bg-dark-inset: rgba(0, 0, 0, 0.2);

  // === Text ===
  --t-text-primary: rgba(255, 255, 255, 0.95);
  --t-text-secondary: rgba(255, 255, 255, 0.7);
  --t-text-tertiary: rgba(255, 255, 255, 0.5);
  --t-text-muted: rgba(255, 255, 255, 0.3);
  --t-text-on-primary: #ffffff;
  --t-text-on-surface: #4a5568;
  --t-text-on-surface-secondary: #718096;
  --t-text-link: #4a9eff;
  --t-text-warm: rgba(255, 200, 150, 0.9);
  --t-text-warm-bright: rgba(255, 220, 150, 0.95);
  --t-text-dark: #333;

  // === Border ===
  --t-border-default: rgba(255, 255, 255, 0.1);
  --t-border-subtle: rgba(255, 255, 255, 0.2);
  --t-border-glass: rgba(255, 255, 255, 0.18);
  --t-border-light: rgba(255, 255, 255, 0.25);
  --t-border-solid: rgba(255, 255, 255, 0.9);
  --t-border-surface: #e2e8f0;
  --t-border-surface-light: #edf2f7;

  // === Interactive / Accent ===
  --t-accent-primary: #4a9eff;
  --t-accent-primary-end: #6a5af9;
  --t-accent-primary-glow: rgba(74, 158, 255, 0.4);
  --t-accent-secondary: #f56565;
  --t-accent-secondary-end: #e53e3e;
  --t-accent-secondary-glow: rgba(245, 101, 101, 0.35);
  --t-accent-warm: rgba(255, 100, 50, 0.2);
  --t-accent-warm-border: rgba(255, 200, 100, 0.3);
  --t-accent-warm-bg: linear-gradient(135deg, rgba(255, 200, 100, 0.2) 0%, rgba(255, 150, 50, 0.1) 100%);
  --t-accent-gold: #ffd700;
  --t-accent-gold-end: #ffaa00;
  --t-accent-disabled-bg: linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%);

  // === Status / Feedback ===
  --t-status-success: #48bb78;
  --t-status-warning: rgba(245, 101, 101, 0.3);
  --t-status-warning-border: #feb2b2;
  --t-status-error: rgba(255, 100, 100, 0.8);
  --t-status-info: #63b3ed;
  --t-status-expired-bg: rgba(100, 100, 100, 0.1);
  --t-status-expired-border: rgba(100, 100, 100, 0.3);

  // === Game: Board ===
  --t-game-board-bg-start: rgba(144, 205, 244, 0.08);
  --t-game-board-bg-mid: rgba(99, 179, 237, 0.04);
  --t-game-board-bg-end: rgba(66, 153, 225, 0.08);
  --t-game-board-border: rgba(255, 255, 255, 0.25);
  --t-game-board-inner-glow: rgba(255, 255, 255, 0.1);
  --t-game-board-corner: rgba(99, 179, 237, 0.3);

  // === Game: Tile ===
  --t-game-tile-bg: rgba(255, 255, 255, 0.98);
  --t-game-tile-bg-mid: rgba(247, 250, 252, 0.95);
  --t-game-tile-bg-end: rgba(237, 242, 247, 0.92);
  --t-game-tile-border: rgba(255, 255, 255, 0.9);
  --t-game-tile-border-bottom: #e2e8f0;
  --t-game-tile-highlight: rgba(255, 255, 255, 0.6);
  --t-game-tile-disabled-shadow: inset 0 0 15px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.08);
  --t-game-tile-icon-shadow: rgba(0, 0, 0, 0.12);

  // === Game: Slot ===
  --t-game-slot-bg: rgba(255, 255, 255, 0.98);
  --t-game-slot-bg-end: rgba(247, 250, 252, 0.95);
  --t-game-slot-border: rgba(255, 255, 255, 0.9);
  --t-game-slot-border-bottom: #edf2f7;
  --t-game-slot-divider: #e2e8f0;
  --t-game-slot-shadow: 0 6px 20px rgba(0, 0, 0, 0.1), 0 -2px 10px rgba(255, 255, 255, 0.5);

  // === Game: Tool ===
  --t-game-tool-bg: rgba(255, 255, 255, 0.98);
  --t-game-tool-bg-end: rgba(247, 250, 252, 0.95);
  --t-game-tool-border: rgba(255, 255, 255, 0.9);
  --t-game-tool-border-bottom: #e2e8f0;

  // === Game: Temp Slot ===
  --t-game-tempslot-bg: rgba(255, 255, 255, 0.95);
  --t-game-tempslot-bg-accent: rgba(254, 215, 215, 0.3);
  --t-game-tempslot-inset: rgba(0, 0, 0, 0.05);
  --t-game-tempslot-empty-bg: rgba(200, 200, 200, 0.15);
  --t-game-tempslot-empty-bg-end: rgba(200, 200, 200, 0.05);

  // === Shadow ===
  --t-shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
  --t-shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.12);
  --t-shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.16);
  --t-shadow-premium: 0 4px 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(144, 205, 244, 0.2);
  --t-shadow-tile: 0 4px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  --t-shadow-tile-hover: 0 6px 16px rgba(0, 0, 0, 0.15), 0 0 20px rgba(99, 179, 237, 0.4);

  // === Glass ===
  --t-glass-blur: blur(12px);
  --t-glass-blur-heavy: blur(20px);

  // === Chest ===
  --t-chest-diamond: #00d4ff;
  --t-chest-diamond-glow: rgba(0, 212, 255, 0.4);
  --t-chest-gold: #ffd700;
  --t-chest-gold-glow: rgba(255, 215, 0, 0.4);
  --t-chest-silver: #c0c0c0;
  --t-chest-silver-glow: rgba(192, 192, 192, 0.4);
  --t-chest-bronze: #cd7f32;
  --t-chest-bronze-glow: rgba(205, 127, 50, 0.4);
  --t-chest-diamond-gradient: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%);
  --t-chest-gold-gradient: linear-gradient(135deg, #fff8e1 0%, #ffe082 50%, #ffca28 100%);
  --t-chest-silver-gradient: linear-gradient(135deg, #fafafa 0%, #e0e0e0 50%, #bdbdbd 100%);
  --t-chest-bronze-gradient: linear-gradient(135deg, #efebe9 0%, #d7ccc8 50%, #bcaaa4 100%);

  // === Hero Mode Overrides ===
  --t-hero-bg: #0a192f;
  --t-hero-header-bg: rgba(255, 255, 255, 0.1);
  --t-hero-text: #ffffff;

  // === Shimmer ===
  --t-shimmer: rgba(255, 255, 255, 0.15);
  --t-shimmer-strong: rgba(255, 255, 255, 0.3);
}
```

**Step 2: Verify the file has no syntax errors**

Run: `cd amio-app && npx sass --no-source-map --style=compressed src/styles/themes/_shark-star.scss /dev/null 2>&1 || echo "Sass not standalone, will verify via dev server later"`

Expected: Either compiles cleanly or Taro will validate it when imported.

**Step 3: Commit**

```bash
git add amio-app/src/styles/themes/_shark-star.scss
git commit -m "feat: create shark-star theme with all semantic tokens"
```

---

## Task 3: Create mixins and barrel import, rewire app.scss

**Files:**
- Create: `amio-app/src/styles/themes/_mixins.scss`
- Create: `amio-app/src/styles/index.scss`
- Modify: `amio-app/src/app.scss` (replace entire contents)

**Step 1: Create `_mixins.scss`**

```scss
// src/styles/themes/_mixins.scss
// Theme-aware SCSS mixins for repeated patterns

@mixin glass-card {
  background: var(--t-bg-glass);
  backdrop-filter: var(--t-glass-blur);
  -webkit-backdrop-filter: var(--t-glass-blur);
  border: 1.5px solid var(--t-border-glass);
}

@mixin glass-card-solid {
  background: linear-gradient(165deg, var(--t-bg-surface) 0%, var(--t-bg-surface-alt) 100%);
  border: 1.5px solid var(--t-game-tile-border);
  border-bottom: 3px solid var(--t-border-surface);
}

@mixin overlay-bg {
  background: linear-gradient(180deg, var(--t-bg-overlay) 0%, var(--t-bg-overlay-alt) 100%);
  backdrop-filter: var(--t-glass-blur-heavy);
  -webkit-backdrop-filter: var(--t-glass-blur-heavy);
}

@mixin btn-primary {
  color: var(--t-text-on-primary);
  background: linear-gradient(135deg, var(--t-accent-primary) 0%, var(--t-accent-primary-end) 100%);
  box-shadow: 0 4px 20px var(--t-accent-primary-glow);
}

@mixin btn-gold {
  color: var(--t-text-dark);
  background: linear-gradient(135deg, var(--t-accent-gold) 0%, var(--t-accent-gold-end) 100%);
}

@mixin card-warm {
  background: linear-gradient(135deg, rgba(255, 200, 100, 0.2) 0%, rgba(255, 150, 50, 0.1) 100%);
  border: 1px solid var(--t-accent-warm-border);
}
```

**Step 2: Create `index.scss` barrel**

```scss
// src/styles/index.scss
// Design system barrel import

@import 'variables';
@import 'keyframes';
@import 'themes/shark-star';
@import 'themes/mixins';
@import 'reset';
```

**Step 3: Replace `app.scss` contents**

Replace the entire `src/app.scss` (all 367 lines) with:

```scss
// AMIO Design System
@import './styles/index';
```

**Step 4: Run dev server and verify zero visual regression**

Run: `cd amio-app && npm run dev:h5`

Expected: App loads normally. At this point the theme class is not yet applied, so `_reset.scss` references like `var(--t-bg-app-primary)` won't resolve. The page background may break temporarily. This is expected and will be fixed in Task 4 when we add the theme wrapper.

**Step 5: Commit**

```bash
git add amio-app/src/styles/themes/_mixins.scss amio-app/src/styles/index.scss amio-app/src/app.scss
git commit -m "feat: create barrel import and mixins, rewire app.scss"
```

---

## Task 4: Add theme wrapper to app.ts and theme storage

**Files:**
- Create: `amio-app/src/hooks/useTheme.ts`
- Modify: `amio-app/src/utils/storage.ts` (add 2 functions at end)
- Modify: `amio-app/src/app.ts` (wrap children in themed View)

**Step 1: Add theme storage functions to `storage.ts`**

Append at the end of `src/utils/storage.ts`:

```typescript
// === Theme Preference ===
// Stored separately from GameProgress to survive daily resets

const THEME_KEY = 'amio_theme';

export const getThemePreference = (): string => {
  try {
    return Taro.getStorageSync(THEME_KEY) || 'shark-star';
  } catch {
    return 'shark-star';
  }
};

export const setThemePreference = (themeId: string): void => {
  try {
    Taro.setStorageSync(THEME_KEY, themeId);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
};
```

**Step 2: Create `useTheme` hook**

Create directory `src/hooks/` first, then create the file:

```typescript
// src/hooks/useTheme.ts
import { useState, useCallback } from 'react'
import { getThemePreference, setThemePreference } from '../utils/storage'

export function useTheme() {
  const [themeId, setThemeId] = useState(() => getThemePreference())

  const themeClass = `theme-${themeId}`

  const switchTheme = useCallback((newThemeId: string) => {
    setThemePreference(newThemeId)
    setThemeId(newThemeId)
  }, [])

  return { themeId, themeClass, switchTheme }
}
```

**Step 3: Modify `app.ts` to wrap children**

Replace `src/app.ts` content. Key changes:
- Import `View` from `@tarojs/components`
- Import `getThemePreference` from storage
- Wrap `children` in `<View className={themeClass}>`

```typescript
import { PropsWithChildren, useEffect, useState } from 'react'
import { View } from '@tarojs/components'
import Taro, { useLaunch } from '@tarojs/taro'
import { loadProgress, getThemePreference } from './utils/storage'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)
  const [themeClass] = useState(() => `theme-${getThemePreference()}`)

  useLaunch(() => {
    console.log('App launched.')
  })

  useEffect(() => {
    const progress = loadProgress()
    const currentPath = Taro.getCurrentInstance().router?.path || ''
    const hash = window.location.hash
    console.log('App useEffect - path:', currentPath, 'hash:', hash, 'hasSeenIntro:', progress?.hasSeenIntro)

    const isRootPath = !hash || hash === '#' || hash === '' || hash === '#/' || hash === '#/pages/starlight/index' || hash === '#/pages/intro/index'
    const isIntro = currentPath.includes('/pages/intro/index')

    if (isRootPath && !isIntro) {
      console.log('Root access: redirecting to intro')
      Taro.navigateTo({ url: '/pages/intro/index' })
    }

    setIsFirstLaunch(!progress?.hasSeenIntro)
  }, [])

  return <View className={themeClass}>{children}</View>
}

export default App
```

**Step 4: Run dev server and verify**

Run: `cd amio-app && npm run dev:h5`

Expected: The app loads with `.theme-shark-star` class on the root View. The `_reset.scss` page background now resolves `var(--t-bg-app-primary)` etc. from the theme class. Page background should display correctly. Existing component styles still use old variables, which is fine — they still resolve from the now-deleted `:root` block... wait, we removed the old `:root` in Task 3. **IMPORTANT:** We need to keep the old `:root` color variables temporarily as a backward-compatibility bridge until all components are migrated. Add this to the bottom of `_shark-star.scss`:

```scss
// === Legacy bridge (remove after all components migrated) ===
// These map old :root variable names to theme tokens
// so components not yet migrated still work
.theme-shark-star {
  // Old color primitives referenced by non-migrated components
  --color-ocean-900: #0d2137;
  --color-ocean-800: #1a365d;
  --color-ocean-700: #234876;
  --color-ocean-600: #2c5282;
  --color-ocean-500: #3182ce;
  --color-ocean-400: #4299e1;
  --color-ocean-300: #63b3ed;
  --color-ocean-200: #90cdf4;
  --color-ocean-100: #bee3f8;
  --color-ocean-50: #ebf8ff;
  --color-silver-900: #1a202c;
  --color-silver-800: #2d3748;
  --color-silver-700: #4a5568;
  --color-silver-600: #718096;
  --color-silver-500: #a0aec0;
  --color-silver-400: #cbd5e0;
  --color-silver-300: #e2e8f0;
  --color-silver-200: #edf2f7;
  --color-silver-100: #f7fafc;
  --color-coral-600: #e53e3e;
  --color-coral-500: #f56565;
  --color-coral-400: #fc8181;
  --color-coral-300: #feb2b2;
  --color-coral-200: #fed7d7;
  --color-aqua-glow: rgba(99, 179, 237, 0.4);
  --color-aqua-soft: rgba(144, 205, 244, 0.2);
  --color-shimmer: rgba(255, 255, 255, 0.15);
  --color-diamond: #00d4ff;
  --color-diamond-glow: rgba(0, 212, 255, 0.4);
  --color-gold: #ffd700;
  --color-gold-glow: rgba(255, 215, 0, 0.4);
  --color-silver-chest: #c0c0c0;
  --color-silver-chest-glow: rgba(192, 192, 192, 0.4);
  --color-bronze: #cd7f32;
  --color-bronze-glow: rgba(205, 127, 50, 0.4);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-bg-light: rgba(255, 255, 255, 0.12);
  --glass-bg-solid: rgba(255, 255, 255, 0.92);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-blur: blur(12px);
  --glass-blur-heavy: blur(20px);
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.16);
  --shadow-premium: 0 4px 20px rgba(0, 0, 0, 0.1), 0 0 40px rgba(144, 205, 244, 0.2);
  --shadow-tile: 0 4px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  --shadow-tile-hover: 0 6px 16px rgba(0, 0, 0, 0.15), 0 0 20px rgba(99, 179, 237, 0.4);
  --color-bg-primary: #0a0a1a;
  --color-bg-secondary: #1a1a3e;
  --color-bg-tertiary: #0f0f2a;
  --color-accent: #4a9eff;
  --color-accent-glow: rgba(74, 158, 255, 0.4);
  --color-text-primary: rgba(255, 255, 255, 0.95);
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-tertiary: rgba(255, 255, 255, 0.5);
  --color-text-muted: rgba(255, 255, 255, 0.3);
  --color-border: rgba(255, 255, 255, 0.1);
}
```

Re-run dev server, confirm zero visual regression on all pages.

**Step 5: Run tests**

Run: `cd amio-app && npm test`

Expected: All tests pass (app.ts change wraps in View, shouldn't break tests since tests mock Taro)

**Step 6: Commit**

```bash
git add amio-app/src/hooks/useTheme.ts amio-app/src/utils/storage.ts amio-app/src/app.ts amio-app/src/styles/themes/_shark-star.scss
git commit -m "feat: add theme wrapper to app, theme storage, and legacy bridge variables"
```

---

## Task 5: Migrate Tile component (pattern validation)

**Files:**
- Modify: `amio-app/src/components/Tile/Tile.scss`

**Step 1: Replace all hardcoded values in Tile.scss with semantic tokens**

Replace the entire file with:

```scss
.tile {
  background: linear-gradient(
    165deg,
    var(--t-game-tile-bg) 0%,
    var(--t-game-tile-bg-mid) 50%,
    var(--t-game-tile-bg-end) 100%
  );

  border-radius: var(--radius-md);
  border: 1.5px solid var(--t-game-tile-border);
  border-bottom: 3px solid var(--t-game-tile-border-bottom);
  box-shadow: var(--t-shadow-tile);

  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  transition: all var(--transition-base);
  user-select: none;
  animation: popIn 0.35s var(--transition-smooth);

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    height: 40%;
    background: linear-gradient(
      180deg,
      var(--t-game-tile-highlight) 0%,
      transparent 100%
    );
    border-radius: calc(var(--radius-md) - 2px) calc(var(--radius-md) - 2px) 0 0;
    pointer-events: none;
  }

  &:not(.disabled) {
    cursor: pointer;

    &:active {
      animation: tileClick 0.2s ease-out;
      border-bottom-width: 1px;
      transform: translateY(2px);
    }

    &:hover {
      box-shadow: var(--t-shadow-tile-hover);
    }
  }

  &.disabled {
    filter: brightness(0.7) saturate(0.6);
    box-shadow: var(--t-game-tile-disabled-shadow);
    z-index: 0;

    &::before {
      display: none;
    }
  }

  .icon-container {
    width: 60%;
    height: 60%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 1;

    svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 2px 3px var(--t-game-tile-icon-shadow));
    }
  }

  .content {
    font-size: var(--font-size-base);
    color: var(--t-text-on-surface);
    position: relative;
    z-index: 1;
  }
}
```

**Step 2: Verify visually**

Run dev server, play a game, confirm tiles look identical to before.

**Step 3: Commit**

```bash
git add amio-app/src/components/Tile/Tile.scss
git commit -m "refactor: migrate Tile component to theme tokens"
```

---

## Task 6: Migrate Board component

**Files:**
- Modify: `amio-app/src/components/Board/Board.scss`

**Step 1: Replace hardcoded values**

Replace the board-container background, border, shadow, and corner decoration colors with semantic tokens:

- `rgba(144, 205, 244, 0.08)` -> `var(--t-game-board-bg-start)`
- `rgba(99, 179, 237, 0.04)` -> `var(--t-game-board-bg-mid)`
- `rgba(66, 153, 225, 0.08)` -> `var(--t-game-board-bg-end)`
- `rgba(255, 255, 255, 0.15)` -> `var(--t-bg-glass-full)`
- `rgba(255, 255, 255, 0.25)` -> `var(--t-border-light)`
- `rgba(255, 255, 255, 0.1)` -> `var(--t-game-board-inner-glow)`
- `rgba(0, 0, 0, 0.08)` -> use `var(--t-shadow-soft)` or inline
- `rgba(99, 179, 237, 0.3)` -> `var(--t-game-board-corner)`

Keep `var(--glass-blur)`, `var(--radius-xl)`, `var(--space-*)`, `var(--transition-smooth)` as-is (they resolve from `:root` or legacy bridge).

**Step 2: Verify visually, commit**

```bash
git add amio-app/src/components/Board/Board.scss
git commit -m "refactor: migrate Board component to theme tokens"
```

---

## Task 7: Migrate Slot component

**Files:**
- Modify: `amio-app/src/components/Slot/Slot.scss`

**Step 1: Replace hardcoded values**

- Glass bg gradient: use `var(--t-game-slot-bg)` and `var(--t-game-slot-bg-end)`
- Border: use `var(--t-game-slot-border)`
- Border-bottom: use `var(--t-game-slot-border-bottom)`
- Box-shadow `rgba(0,0,0,0.1)` and `rgba(255,255,255,0.5)`: use `var(--t-game-slot-shadow)`
- Divider: already uses `var(--color-silver-300)`, change to `var(--t-game-slot-divider)`
- Nearly-full warning shadow `rgba(245, 101, 101, 0.3)`: use `var(--t-status-warning)`

**Step 2: Verify visually, commit**

```bash
git add amio-app/src/components/Slot/Slot.scss
git commit -m "refactor: migrate Slot component to theme tokens"
```

---

## Task 8: Migrate TempSlot and ToolBar components

**Files:**
- Modify: `amio-app/src/components/TempSlot/TempSlot.scss`
- Modify: `amio-app/src/components/ToolBar/ToolBar.scss`

**Step 1: Replace hardcoded values in both files**

TempSlot:
- `rgba(255, 255, 255, 0.95)` -> `var(--t-game-tempslot-bg)`
- `rgba(254, 215, 215, 0.3)` -> `var(--t-game-tempslot-bg-accent)`
- `rgba(0, 0, 0, 0.05)` -> `var(--t-game-tempslot-inset)`
- `rgba(200, 200, 200, 0.15/0.05)` -> `var(--t-game-tempslot-empty-bg)` / `var(--t-game-tempslot-empty-bg-end)`

ToolBar:
- `rgba(255, 255, 255, 0.98)` -> `var(--t-game-tool-bg)`
- `rgba(247, 250, 252, 0.95)` -> `var(--t-game-tool-bg-end)`

**Step 2: Verify visually, commit**

```bash
git add amio-app/src/components/TempSlot/TempSlot.scss amio-app/src/components/ToolBar/ToolBar.scss
git commit -m "refactor: migrate TempSlot and ToolBar to theme tokens"
```

---

## Task 9: Migrate Starlight page (biggest win)

**Files:**
- Modify: `amio-app/src/pages/starlight/index.scss`

This is the most impactful migration: 44 hardcoded colors, 0 var() usage. Replace every hardcoded color with the appropriate semantic token. Key mappings:

- `#0a0a1a` -> `var(--t-bg-app-primary)`
- `#1a1a3e` -> `var(--t-bg-app-secondary)`
- `#0f0f2a` -> `var(--t-bg-app-tertiary)`
- `rgba(255, 100, 50, 0.2)` -> `var(--t-accent-warm)`
- `rgba(255, 200, 150, 0.9)` -> `var(--t-text-warm)`
- `rgba(255, 255, 255, 0.6)` -> `var(--t-text-secondary)` (close enough to 0.7)
- `rgba(255, 255, 255, 0.05)` -> `var(--t-bg-muted)`
- `rgba(255, 255, 255, 0.2)` -> `var(--t-border-subtle)`
- `rgba(255, 200, 100, 0.2/0.3)` -> `var(--t-accent-warm-border)` and warm variants
- `rgba(255, 220, 150, 0.95)` -> `var(--t-text-warm-bright)`
- `#4a9eff` -> `var(--t-accent-primary)`
- `#6a5af9` -> `var(--t-accent-primary-end)`
- `#ffd700` / `#ffaa00` -> `var(--t-accent-gold)` / `var(--t-accent-gold-end)`
- `#333` -> `var(--t-text-dark)`
- `rgba(0, 0, 0, 0.9)` -> use overlay token
- `white` -> `var(--t-text-on-primary)`
- Keyframe colors in `chest-glow` and `button-pulse` -> use token variables

Also replace inline `font-size` values with `var(--font-size-*)` where they match.

**Step 1: Replace all values, Step 2: Verify visually, Step 3: Commit**

```bash
git add amio-app/src/pages/starlight/index.scss
git commit -m "refactor: migrate Starlight page to theme tokens (44 colors)"
```

---

## Task 10: Migrate Star Ocean and Home pages

**Files:**
- Modify: `amio-app/src/pages/starocean/index.scss`
- Modify: `amio-app/src/pages/home/index.scss`

Same pattern as starlight — these two pages share the same dark gradient background and similar hardcoded colors. Map all hardcoded values to the token system established above. Both use `#0a0a1a`, `#1a1a3e`, `#0f0f2a`, `#4a9eff`, etc.

**Step 1: Replace all values in both files**
**Step 2: Verify visually**
**Step 3: Commit**

```bash
git add amio-app/src/pages/starocean/index.scss amio-app/src/pages/home/index.scss
git commit -m "refactor: migrate StarOcean and Home pages to theme tokens"
```

---

## Task 11: Migrate Game page and remaining modals

**Files:**
- Modify: `amio-app/src/pages/game/index.scss`
- Modify: `amio-app/src/components/ChestModal/ChestModal.scss`
- Modify: `amio-app/src/components/ChestRewardModal/index.scss`
- Modify: `amio-app/src/components/StoryModal/StoryModal.scss`

These files already use many `var()` references but still have 18-21 hardcoded values each. Replace remaining hardcoded values with tokens. Hero mode colors use `--t-hero-*` tokens.

**Step 1: Replace remaining hardcoded values in all 4 files**
**Step 2: Verify game page (normal + hero mode), chest modal, story modal**
**Step 3: Commit**

```bash
git add amio-app/src/pages/game/index.scss amio-app/src/components/ChestModal/ChestModal.scss amio-app/src/components/ChestRewardModal/index.scss amio-app/src/components/StoryModal/StoryModal.scss
git commit -m "refactor: migrate Game page and modal components to theme tokens"
```

---

## Task 12: Migrate remaining components (PlanetView, StarTrail, World, Intro)

**Files:**
- Modify: `amio-app/src/components/PlanetView/index.scss`
- Modify: `amio-app/src/components/StarTrail/index.scss`
- Modify: `amio-app/src/pages/intro/index.scss`
- Modify: `amio-app/src/pages/world/index.scss`
- Modify: `amio-app/src/components/WorldScene/index.scss`

PlanetView is the most complex — 42 hardcoded values across 6 planet stages. Add `--t-planet-*` tokens to the shark-star theme file for each stage (desolate, sprout, construction, prosperity, launch, landing).

**Step 1: Add planet tokens to `_shark-star.scss`**
**Step 2: Replace all hardcoded values in all 5 files**
**Step 3: Verify each page visually**
**Step 4: Commit**

```bash
git add amio-app/src/styles/themes/_shark-star.scss amio-app/src/components/PlanetView/index.scss amio-app/src/components/StarTrail/index.scss amio-app/src/pages/intro/index.scss amio-app/src/pages/world/index.scss amio-app/src/components/WorldScene/index.scss
git commit -m "refactor: migrate PlanetView, StarTrail, Intro, and World to theme tokens"
```

---

## Task 13: Remove legacy bridge and final cleanup

**Files:**
- Modify: `amio-app/src/styles/themes/_shark-star.scss` (remove legacy bridge section)

**Step 1: Search for any remaining old variable references**

Run: `grep -r "var(--color-" amio-app/src/ --include="*.scss" | grep -v "_shark-star"`
Run: `grep -r "var(--glass-" amio-app/src/ --include="*.scss" | grep -v "_shark-star" | grep -v "_keyframes"`
Run: `grep -r "var(--shadow-" amio-app/src/ --include="*.scss" | grep -v "_shark-star" | grep -v "_keyframes"`

Expected: No results (all migrated to `--t-*` tokens)

**Step 2: If any remain, migrate them. Then remove the legacy bridge block from `_shark-star.scss`**

**Step 3: Run full visual check on all pages**

Run: `cd amio-app && npm run dev:h5`

Check: starlight, game (normal + hero), home, starocean, intro, chest modal

**Step 4: Run tests**

Run: `cd amio-app && npm test`

Expected: All tests pass

**Step 5: Commit**

```bash
git add amio-app/src/styles/themes/_shark-star.scss
git commit -m "refactor: remove legacy bridge variables, migration complete"
```

---

## Task 14: Verify theme switching works end-to-end

**Step 1: Open browser DevTools on the running H5 dev server**

**Step 2: In the Elements panel, find the root `<div class="theme-shark-star">` and change it to `class=""`**

Expected: All themed colors disappear (fallback to browser defaults), proving the tokens are working.

**Step 3: Change it back to `class="theme-shark-star"`**

Expected: All colors restore instantly, no layout shift.

**Step 4: In the Console, test storage**

```javascript
localStorage.setItem('amio_theme', 'test')
location.reload()
```

Expected: Root View has class `theme-test`, which has no matching CSS, so styles break. This confirms the storage -> class pipeline works.

**Step 5: Restore**

```javascript
localStorage.setItem('amio_theme', 'shark-star')
location.reload()
```

Expected: Everything looks normal again.

**Step 6: Final commit with all tests passing**

```bash
cd amio-app && npm test
```

---

## Summary of file changes

| Action | File |
|--------|------|
| Create | `src/styles/_variables.scss` |
| Create | `src/styles/_keyframes.scss` |
| Create | `src/styles/_reset.scss` |
| Create | `src/styles/themes/_shark-star.scss` |
| Create | `src/styles/themes/_mixins.scss` |
| Create | `src/styles/index.scss` |
| Create | `src/hooks/useTheme.ts` |
| Replace | `src/app.scss` (367 lines -> 2 lines) |
| Modify | `src/app.ts` (add View wrapper) |
| Modify | `src/utils/storage.ts` (add 2 functions) |
| Migrate | `src/components/Tile/Tile.scss` |
| Migrate | `src/components/Board/Board.scss` |
| Migrate | `src/components/Slot/Slot.scss` |
| Migrate | `src/components/TempSlot/TempSlot.scss` |
| Migrate | `src/components/ToolBar/ToolBar.scss` |
| Migrate | `src/pages/starlight/index.scss` |
| Migrate | `src/pages/starocean/index.scss` |
| Migrate | `src/pages/home/index.scss` |
| Migrate | `src/pages/game/index.scss` |
| Migrate | `src/components/ChestModal/ChestModal.scss` |
| Migrate | `src/components/ChestRewardModal/index.scss` |
| Migrate | `src/components/StoryModal/StoryModal.scss` |
| Migrate | `src/components/PlanetView/index.scss` |
| Migrate | `src/components/StarTrail/index.scss` |
| Migrate | `src/pages/intro/index.scss` |
| Migrate | `src/pages/world/index.scss` |
| Migrate | `src/components/WorldScene/index.scss` |
