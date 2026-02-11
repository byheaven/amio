# Game Plugin Spec

## Scope
This document defines the stable plugin interface for AMIO multi-game support.

## Required contract
Each game plugin must implement `GamePlugin` from `amio-app/src/types/game-plugin.ts`.

### Required fields
- `id`: unique plugin id, e.g. `3tiles` or `sudoku`.
- `meta`: UI metadata for the Starlight card.
- `ratingConfig`: chest rating thresholds.
- `initGame(config)`: creates initial state for a new session.
- `handleAction(state, action)`: state transition for user actions.
- `getStatus(state)`: returns `idle | playing | cleared | failed | quit`.
- `getPerformance(state)`: returns normalized performance metrics.
- `getTools()`: returns tool definitions.
- `useTool(state, toolId)`: applies one tool usage.
- `getHeroConfig()`: returns hero mode capability.
- `GameComponent`: render component for game host page.

## Type safety rules
- Use strict TypeScript types.
- Do not use `any` in plugin contracts.
- Use `Record<string, unknown>` for extensible payloads.

## Compatibility rule
Framework files must not require changes when adding a new game plugin. A new game should only need:
1. plugin implementation
2. plugin registration
3. optional game-specific feature tests
