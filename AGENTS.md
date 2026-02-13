# AGENTS.md

Instructions for coding agents (OpenClaw, Codex, Claude Code, etc.) working in this repository.

## Mission

Keep Dartsmind stable while iterating quickly on:
- game logic
- UI/UX
- camera-assisted scoring
- maintainable docs

## Priorities

1. Correctness of domain logic (`src/domain/*`)
2. Clear boundaries between domain/data/ui
3. Reproducible dev workflow
4. Small, understandable commits

## Hard rules

- Never commit secrets or credentials.
- Avoid destructive file removals; archive docs instead.
- Don’t rewrite history on shared branches.
- Run lint/tests for meaningful code changes.

## Documentation rules

- Keep `README.md` as primary entry.
- Keep active docs in `docs/`.
- Move superseded docs to `docs/archive/<YYYY-MM-DD>/`.
- If architecture or model contracts change, update docs in same PR.

## Commit style

Use concise, explicit messages, e.g.:
- `docs: rebuild project documentation and archive legacy docs`
- `fix(domain): correct cricket scoring edge-case`
- `feat(ui): add camera calibration helper state`

## When uncertain

State assumptions explicitly in commit message or PR notes.
