# Operations

## Daily developer checklist

- `npm install` (if deps changed)
- `npm test`
- `npm run lint`
- run app in target environment (`dev`, `dev:web`, device)

## Before merge / release

1. Confirm tests pass
2. Confirm lint passes
3. Smoke test critical flows:
   - start match (X01 + Cricket)
   - score entry/update
   - history/statistics view
   - settings persistence
4. For native scoring features, verify on real device
5. Update docs if behavior/contracts changed

## Git hygiene

- Do not commit transient logs/build outputs.
- Keep `.expo-web.log`, local caches, and machine-specific artifacts ignored.
- Prefer small, reviewable commits.

## Large artifact policy

Current repo includes heavy local artifacts (`runs/`, model binaries, local env folders).
Recommendation:
- keep only required runtime artifacts in Git
- move training outputs/checkpoints to external artifact storage

## Incident/debug quick steps

- reproduce with minimal scenario
- capture relevant log excerpts + app state
- identify whether issue is domain/data/ui/native boundary
- create regression test where feasible
