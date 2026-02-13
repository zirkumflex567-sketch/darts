# Dartsmind (darts)

React Native / Expo app for darts scoring with:
- classic game modes (X01, Cricket)
- local persistence (SQLite / fallback storage)
- camera-assisted scoring pipeline (native)
- ML assets + training/export workflow

## Quick start

```bash
npm install
npm run dev
```

Useful variants:

```bash
npm run dev:web
npm run android
npm run ios
npm test
npm run lint
```

## Project structure

- `src/domain/` game engines and pure domain logic
- `src/data/` repositories, storage, entitlement, scoring providers
- `src/ui/` screens, components, stores, camera/scoring helpers
- `ml/` model-related scripts/assets
- `tests/` domain/data tests
- `docs/` project documentation

## Documentation index

- **Project docs index:** [`docs/README.md`](docs/README.md)
- Setup & local dev: [`docs/SETUP.md`](docs/SETUP.md)
- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- ML + model lifecycle: [`docs/ML_PIPELINE.md`](docs/ML_PIPELINE.md)
- Operations & release checklist: [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- OpenClaw collaboration guide: [`docs/OPENCLAW.md`](docs/OPENCLAW.md)

## Archived legacy docs

Previous documentation was archived to:

- [`docs/archive/2026-02-13/`](docs/archive/2026-02-13/)

## Notes

- This repo currently contains large local artifacts (`runs/`, `.venv*`, model binaries). For long-term hygiene, keep only required, reproducible assets in Git and publish heavy artifacts via release storage.
- Camera/ML features are native-first; web mode is best for UI/dev workflow, not full camera inference parity.
