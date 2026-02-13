# Game UI Copy Matrix (v2)

## Principles

- Keep copy calm, short, and emotionally supportive
- Avoid mechanical or admin-like wording
- Prefer action phrases tied to Starlight world framing

## Starlight: Today Action Card

| State | Badge | Primary CTA | Secondary CTA | Supporting Copy |
|------|-------|-------------|---------------|-----------------|
| idle | `Today Mission` | `Light Up Today` | none | `A small play session still brightens the planet.` |
| playing | `Mission Active` | `Continue Journey` | none | `Your progress is waiting in this round.` |
| completed | `Mission Cleared` | `Enter Hero Trial` | `Rest for Today` | `Hero mode can upgrade today's chest.` |
| hero | `Hero In Progress` | none | `Return to Starlight` | `Your base chest is safe even if Hero fails.` |
| done | `Today Complete` | none | `Return to Starlight` | `Thank you for adding starlight today.` |

## Starlight: Chest States

| State | Title | Description | Action |
|------|-------|-------------|--------|
| none | `No chest yet` | `Clear today’s mission to receive tomorrow’s reward chest.` | none |
| locked | `Supply chest in transit` | `Unlocks in {countdown}.` | none |
| unlocked | `Starlight chest ready` | `Tap to claim your reward.` | `Claim` |
| expired | `Chest expired` | `The reward window has closed for this chest.` | none |

## In-Game Header / Failure

| Context | Copy |
|--------|------|
| attempt line | `Run {attempts}` |
| tools line | `Tools used: {toolsUsed}` |
| fail title | `This round slipped away` |
| retry button | `Try Again` |
| hero keep button | `Keep Current Chest` |
| exit button | `Return to Starlight` |

## Debug UI Labels (dev/test only)

- `Clear Data`
- `Instant Clear`
- `Skip Chest Timer`
- `Next Day`
- `State Snapshot`
