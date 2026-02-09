# AMIO Test Suite

BDD-first testing with jest-cucumber. See `../CLAUDE.md` for full documentation.

## Quick Start

```bash
npm test                    # Run all tests
npm run test:bdd            # Run BDD tests only
npm run test:unit           # Run unit tests only
npm test -- --testPathPattern=chest  # Run specific domain
```

## Directory Structure

```
features/       # Gherkin .feature files (behavior specs)
steps/          # .steps.ts files (test implementations)
helpers/        # Shared test utilities and mocks
unit/           # Non-BDD supplemental tests
```

## BDD Workflow

1. **Write feature** → `features/domain/feature-name.feature`
2. **Create steps** → `steps/domain/feature-name.steps.ts`
3. **RED** → Tests fail (expected behavior not implemented)
4. **GREEN** → Implement production code to pass tests
5. **REFACTOR** → Clean up code while tests stay green

## Example Test

See `features/chest/chest-calculation.feature` + `steps/chest/chest-calculation.steps.ts` for a complete BDD example.

## Test Helpers

- `bdd-setup.ts` — jest-cucumber error configuration
- `tile-factory.ts` — Tile fixture creation
- `game-stats-factory.ts` — GameStats fixture creation
- `storage-mock.ts` — Taro storage mock
- `date-mock.ts` — Date mocking utilities
