# AMIO Game UI Refactor Plan v2 (Audience-Aligned, Visual+Flow)

## Summary
This refactor should not be treated as a pure “beautify CSS” task.  
AMIO’s product promise is emotional connection first, gameplay second, and data third.

From `/Users/yubai/amio/docs/AMIO_MVP_PRD_完整版_V3.md:45` and `/Users/yubai/amio/docs/SharkStar_UI_Layout.md:30`, the core audience is fan-driven, non-hardcore users who want warmth, narrative meaning, and low pressure.  
From `/Users/yubai/amio/docs/SharkStar_UI_Layout.md:22` and `/Users/yubai/amio/docs/SharkStar_UI_Layout.md:25`, the UI must keep one primary focus and shortest daily action path.

Your current plan is directionally correct, but it is still mostly a styling plan. It needs product-flow alignment, content tone alignment, and measurable validation.

## Plan Review Findings
1. `P0` Missing IA/flow alignment with Starlight design principle.  
Current plan focuses card cosmetics, but the product spec emphasizes planet anchor + chest + single primary action path.  
Refs: `/Users/yubai/amio/docs/plans/game-ui-refactor.md:62`, `/Users/yubai/amio/docs/SharkStar_UI_Layout.md:59`, `/Users/yubai/amio/docs/SharkStar_UI_Layout.md:145`.

2. `P0` Narrative tone mismatch is not addressed.  
Current runtime copy is generic (`Start`, `Close`, `Challenge failed`, `One-Click Win`) and breaks “poetic, low-pressure” tone.  
Refs: `/Users/yubai/amio/amio-app/src/components/TodayGameCard/index.tsx:45`, `/Users/yubai/amio/amio-app/src/pages/game/index.tsx:313`, `/Users/yubai/amio/amio-app/src/pages/game/index.tsx:335`, `/Users/yubai/amio/docs/SharkStar_UI_Layout.md:26`.

3. `P1` Scope includes low-ROI unused component.  
`GameSettlement` is currently not mounted anywhere, so restyling it should be deprioritized.  
Refs: `/Users/yubai/amio/docs/plans/game-ui-refactor.md:51`, `/Users/yubai/amio/amio-app/src/components/GameSettlement/index.tsx:1`, `/Users/yubai/amio/amio-app/src/pages/game/index.tsx:347`.

4. `P1` Production cleanliness is missing.  
Debug controls are visible in user-facing Starlight/game flows; plan should include environment gating.  
Refs: `/Users/yubai/amio/amio-app/src/pages/starlight/index.tsx:282`, `/Users/yubai/amio/amio-app/src/pages/game/index.tsx:312`.

5. `P1` No success instrumentation.  
Without UI-level events, you cannot prove refactor impact on start rate or Hero conversion. Existing logs capture results but not funnel interaction.  
Refs: `/Users/yubai/amio/amio-app/src/services/game-logger.ts:1`.

## Decision-Complete Implementation Plan

## Phase 0: UX Contract (before UI edits)
1. Lock a copy matrix for every major state in Starlight and Game pages.
2. Keep language world-consistent and low-pressure.
3. Define one primary CTA per state and one optional secondary CTA max.

Output files:
- `/Users/yubai/amio/docs/plans/game-ui-refactor.md` (replace with v2 sections).
- `/Users/yubai/amio/docs/plans/game-ui-copy-matrix.md` (new).

## Phase 1: Starlight Flow Refactor (structure first, visuals second)
1. Reorder and simplify Starlight sections: header, planet anchor, chest state, primary today action card, milestones.
2. Ensure “today action” remains one dominant visual target.
3. Move feedback UI to post-completion state only.
4. Hide debug controls outside development builds.

Primary files:
- `/Users/yubai/amio/amio-app/src/pages/starlight/index.tsx`
- `/Users/yubai/amio/amio-app/src/pages/starlight/index.scss`
- `/Users/yubai/amio/amio-app/src/components/TodayGameCard/index.tsx`
- `/Users/yubai/amio/amio-app/src/components/TodayGameCard/index.scss`

## Phase 2: Theme Token Compliance and Component Cleanup
1. Convert hardcoded colors in `TodayGameCard`, `PreferenceFeedback`, `StreakMilestones` to theme tokens/mixins.
2. Skip `GameSettlement` styling in this cycle unless component is reintroduced.
3. Keep all new styles based on existing mixins/tokens.

Primary files:
- `/Users/yubai/amio/amio-app/src/components/TodayGameCard/index.scss`
- `/Users/yubai/amio/amio-app/src/components/PreferenceFeedback/index.scss`
- `/Users/yubai/amio/amio-app/src/components/StreakMilestones/index.scss`
- Token references: `/Users/yubai/amio/amio-app/src/styles/themes/_mixins.scss:4`, `/Users/yubai/amio/amio-app/src/styles/_variables.scss:6`

## Phase 3: Thumbnail Productization
1. Replace text-only thumbnails with CSS mini-scenes for 3-Tiles and Sudoku.
2. Add dedicated SCSS modules for each thumbnail.
3. Preserve theme responsiveness via `--t-*` tokens only.

Primary files:
- `/Users/yubai/amio/amio-app/src/games/3tiles/thumbnail.tsx`
- `/Users/yubai/amio/amio-app/src/games/3tiles/thumbnail.scss` (new)
- `/Users/yubai/amio/amio-app/src/games/sudoku/thumbnail.tsx`
- `/Users/yubai/amio/amio-app/src/games/sudoku/thumbnail.scss` (new)

## Phase 4: In-Game Shell Unification by Game Type
1. Split shell styling concerns for `3tiles` and `sudoku` instead of one shared atmosphere treatment.
2. Keep 3-Tiles shell atmospheric and celebratory.
3. Keep Sudoku shell clean and focus-biased with restrained motion.
4. Replace debug/test CTA in production.
5. Standardize failure modal copy/visual tone to brand language.

Primary files:
- `/Users/yubai/amio/amio-app/src/pages/game/index.tsx`
- `/Users/yubai/amio/amio-app/src/pages/game/index.scss`
- `/Users/yubai/amio/amio-app/src/games/sudoku/index.scss`

## Phase 5: Motion and Return-Loop Meaning
1. Add lightweight “action caused world change” transitions.
2. Avoid heavy continuous motion during puzzle-solving.
3. Add reduced-motion safeguards.

Primary files:
- `/Users/yubai/amio/amio-app/src/pages/starlight/index.scss`
- `/Users/yubai/amio/amio-app/src/pages/game/index.scss`
- `/Users/yubai/amio/amio-app/src/styles/_keyframes.scss`

## Phase 6: Validation and KPI Tracking
1. Add UI event logging for funnel checkpoints.
2. Track at minimum: Starlight CTA exposure/click, game start, clear/fail, Hero prompt shown, Hero accepted.
3. Compare baseline vs refactor after fixed sample size.

Primary files:
- `/Users/yubai/amio/amio-app/src/services/ui-event-logger.ts` (new)
- `/Users/yubai/amio/amio-app/src/pages/starlight/index.tsx`
- `/Users/yubai/amio/amio-app/src/pages/game/index.tsx`

## Important Interface/Type Changes
1. `TodayGameCardProps` should support explicit display context instead of deriving all labels inline.  
File: `/Users/yubai/amio/amio-app/src/components/TodayGameCard/index.tsx`
2. Add `UIEvent` type and `uiEventLogger.append(...)` contract.  
File: `/Users/yubai/amio/amio-app/src/services/ui-event-logger.ts`
3. Add `isDebugUiEnabled` decision gate on Starlight/Game pages.  
Files: `/Users/yubai/amio/amio-app/src/pages/starlight/index.tsx`, `/Users/yubai/amio/amio-app/src/pages/game/index.tsx`

## Test Cases and Scenarios
1. Starlight state matrix: `idle`, `playing`, `completed`, `hero`, `done` with chest states `none/locked/unlocked/expired`.
2. Theme switching regression: shark-star and sakura render all modified components correctly.
3. Daily scheduler parity: both game types still render correct card metadata and thumbnails.
4. Interaction regression: start game, Hero challenge, exit paths, retry/loss modal paths.
5. Responsive checks: 375px, 430px, 768px.
6. Platform checks: H5 and WeChat mini program visual sanity.
7. Automated checks: run existing `npm test` suite without weakening tests.

## Assumptions and Defaults
1. Chosen scope is `Visual+Flow` (confirmed).
2. No gameplay logic changes to rules/chest math/scheduler.
3. No backend/API dependency; all logging remains local for MVP.
4. Existing two-theme system remains the base; no new theme pack in this refactor.
5. `GameSettlement` remains out of scope unless reactivated in runtime.
