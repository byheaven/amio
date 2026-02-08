# Plan: Add 3D World Entry on Starlight Page

## Summary

Add a Three.js-powered 3D explorable world to the AMIO app. The PlanetView on the Starlight page becomes clickable — tapping it navigates to a new fullscreen 3D page where the user can walk around the "鲨之星" surface in third person. MVP focuses on H5 only.

## New Files

### 1. `src/pages/world/index.tsx` — World page
- Fullscreen page with back button, loading overlay, "under construction" banner
- Wraps the `WorldScene` component
- Navigation: `Taro.navigateBack()` with fallback to `Taro.switchTab('/pages/starlight/index')`

### 2. `src/pages/world/index.scss` — World page styles
- Fullscreen `100vw × 100vh`, black background
- Overlaid UI: semi-transparent back button (top-left), loading spinner, construction banner (bottom)

### 3. `src/components/WorldScene/WorldScene.tsx` — Three.js scene component
- `useRef<HTMLDivElement>` container + Three.js renderer appended inside `useEffect`
- **Scene contents:**
  - Terrain: `PlaneGeometry(200,200,50,50)` with sine-wave vertex displacement, flat-shaded dark blue material, rotated to XZ plane
  - Grid overlay: `GridHelper` for sci-fi aesthetic
  - Character: `CapsuleGeometry` placeholder, blue emissive material, positioned at origin
  - Skybox: 2000 procedural star `Points` on a large sphere
  - Lighting: ambient + directional + point light following character
  - 5 gold cone markers as placeholder "buildings"
- **Controls:**
  - WASD/arrow keys for desktop (via `keydown`/`keyup` on `window`)
  - Virtual joystick overlay for mobile touch (bottom-left, `touchstart`/`touchmove`/`touchend`)
  - Camera-relative movement: forward = camera facing direction
- **Camera:** Third-person follow with lerp smoothing, offset `(0, 5, 10)` behind character
- **Cleanup:** `useEffect` return disposes renderer, all geometry/materials, removes canvas from DOM

### 4. `src/components/WorldScene/index.ts` — Barrel export
### 5. `src/components/WorldScene/index.scss` — Canvas container + joystick styles

## Modified Files

### 6. `src/app.config.ts` (line 7)
Add `'pages/world/index'` to the `pages` array (after `pages/game/index`).

### 7. `src/components/PlanetView/PlanetView.tsx` (lines 6-11, 13-18, 26)
- Add `onClick?: () => void` to `PlanetViewProps` interface
- Destructure `onClick` in component params
- Apply `onClick` to the outermost `<View>` container + `cursor: pointer` when clickable

### 8. `src/pages/starlight/index.tsx` (lines 56-62, 247-249)
- Add `handlePlanetClick` function: `Taro.navigateTo({ url: '/pages/world/index' })`
- Pass `onClick={handlePlanetClick}` to `<PlanetView>`
- Add "点击探索星球" hint text below PlanetView

### 9. `src/pages/starlight/index.scss`
- Add `.explore-hint` style (centered, subtle text with pulse animation)

## Dependencies

```bash
cd amio-app
npm install three
npm install -D @types/three
```

No webpack config changes needed — Three.js works with webpack 5 out of the box. Webpack's existing code-splitting (`chunkFilename` in config/index.ts) ensures Three.js only loads when the world page is visited.

## Implementation Order

1. Install `three` and `@types/three`
2. Create `WorldScene` component (core 3D scene)
3. Create world page (wraps WorldScene with UI overlays)
4. Register world page in `app.config.ts`
5. Add `onClick` prop to `PlanetView`
6. Wire up Starlight page: planet click → navigate to world
7. Test with `npm run dev:h5`

## Key Technical Notes

- **Taro H5 renders standard DOM** — `<View>` compiles to `<div>`, so `ref.current` is an `HTMLDivElement` at runtime. Cast ref as `any` when passing to Taro components.
- **Taro's pxTransform**: 3D canvas uses raw `window.innerWidth/Height`, not Taro units. SCSS uses `100vw/100vh` for the container.
- **Touch conflicts**: Joystick needs `e.stopPropagation()` and `touch-action: none` CSS.
- **Performance**: Limit `devicePixelRatio` to 2, disable antialias on mobile, pause animation loop via `useDidHide`.

## Verification

1. `cd amio-app && npm run dev:h5` — should start without errors
2. Open localhost:10086, navigate to Starlight tab
3. Verify "点击探索星球" hint text visible below planet
4. Click planet → should navigate to fullscreen 3D world
5. Verify: terrain visible, character capsule at center, stars in background
6. Desktop: WASD keys move character, camera follows
7. Mobile: touch joystick (bottom-left) moves character
8. Back button (top-left) → returns to Starlight page
9. "建设中" banner visible at bottom
10. Run `npm test` — existing tests should still pass
