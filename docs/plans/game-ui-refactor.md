# AMIO Game UI Refactor Plan v2 (Audience-Aligned, Visual+Flow)

## Product Alignment

AMIO is not a generic puzzle app. It is a fan-emotion product where gameplay is a daily ritual that reinforces belonging.

Design and flow priorities:
- Emotion first, data second
- One primary action per state
- Shortest path from Starlight entry to play
- Theme-consistent visuals for shark-star and sakura

## Scope

In scope:
- Starlight information architecture and card flow
- In-game shell and failure-state tone
- Thumbnail productization for game cards
- Theme token compliance for key components
- Lightweight UI funnel instrumentation (local storage)

Out of scope:
- Gameplay rules, chest formula, scheduler logic
- Backend telemetry
- Theme-system architecture changes
- Reactivating unused `GameSettlement` component

## Deliverables

1. Starlight structure: header, planet anchor, chest state, primary today action card, milestones
2. Today card with explicit display context (no hardcoded inline copy logic)
3. Tokenized styles for `TodayGameCard`, `PreferenceFeedback`, `StreakMilestones`
4. Visual thumbnails for 3-Tiles and Sudoku
5. Game shell split by game type (`3tiles` vs `sudoku`)
6. Debug UI gates for production cleanliness
7. New `ui-event-logger` service for funnel checkpoints

## Implementation Phases

### Phase 0: UX Contract
- Create copy matrix per user state
- Keep language warm, calm, and world-consistent
- Keep one primary CTA and one optional secondary CTA max

### Phase 1: Starlight Flow Refactor
- Reorder sections to align with ritual flow
- Keep today action as visual focal point
- Keep feedback module post-completion only
- Gate debug controls to development/test environment

### Phase 2: Token Compliance
- Remove hardcoded colors from targeted components
- Reuse existing tokens and SCSS mixins

### Phase 3: Thumbnail Productization
- Replace emoji-only thumbnails with mini visual scenes
- Keep theme-responsive using `--t-*` tokens

### Phase 4: In-Game Shell Unification by Game Type
- 3-Tiles: atmospheric and celebratory shell
- Sudoku: cleaner, focus-biased shell with restrained motion
- Standardize failure modal wording and hierarchy
- Hide debug CTA in production

### Phase 5: Motion and Accessibility
- Add lightweight transition cues that connect actions to meaning
- Reduce ambient motion during active solving
- Add reduced-motion safeguards

### Phase 6: Validation and KPI Tracking
- Add local funnel events for:
  - Starlight CTA exposure
  - Starlight CTA click
  - Game started
  - Game cleared / failed
  - Hero prompt shown
  - Hero accepted

## Acceptance Criteria

- Starlight and game pages visually align with AMIO emotional tone
- At least one clear primary CTA per state with no competing priorities
- Theme switching covers all modified components
- Debug controls hidden in production
- New UI events are persisted and queryable from local storage
- Existing tests remain green

## Reference Files

- `amio-app/src/pages/starlight/index.tsx`
- `amio-app/src/pages/starlight/index.scss`
- `amio-app/src/components/TodayGameCard/index.tsx`
- `amio-app/src/components/TodayGameCard/index.scss`
- `amio-app/src/pages/game/index.tsx`
- `amio-app/src/pages/game/index.scss`
- `amio-app/src/games/sudoku/index.scss`
- `amio-app/src/services/ui-event-logger.ts`
