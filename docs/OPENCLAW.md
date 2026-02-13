# OpenClaw Guide for This Repo

Purpose: make agent-assisted work predictable and safe.

## Scope

OpenClaw agents may:
- refactor docs and code
- run tests/lint/build commands
- propose architecture and implementation changes

Agents must not:
- leak secrets
- publish credentials/tokens
- perform destructive cleanup without explicit instruction

## Expected workflow

1. Read this file and `AGENTS.md` at repo root.
2. Inspect current state (`git status`, key docs, project structure).
3. Propose concise plan for non-trivial tasks.
4. Execute with minimal disruption.
5. Update docs when behavior/contracts change.
6. Commit with clear message; push only when asked.

## Repo-specific rules

- Treat `src/domain` as deterministic core logic.
- Keep platform-specific changes isolated (`*.native.tsx`, `*.web.tsx`).
- Don’t commit accidental local outputs (`.expo-web.log`, temp assets, ad-hoc dumps).
- Prefer archive over deletion for legacy docs.

## Documentation policy

- Active docs live under `docs/`.
- Historical docs go into `docs/archive/<date>/`.
- `README.md` must remain the single entry point with links to active docs.
