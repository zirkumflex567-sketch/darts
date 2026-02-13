# Architecture

## High-level

Dartsmind follows a practical layered layout:

- **Domain (`src/domain`)**
  - pure game rules and scoring engines
  - independent from UI/platform
- **Data (`src/data`)**
  - repository interfaces + implementations
  - persistence adapters (SQLite/local storage/in-memory)
  - entitlement/scoring providers
- **UI (`src/ui`)**
  - screens, components, navigation, stores
  - camera-scoring integration points

## Module map

- `src/domain/x01/*`  
  X01 engine + types

- `src/domain/cricket/*`  
  Cricket engine + types

- `src/domain/stats/*`  
  stats aggregation/logic

- `src/data/repositories/*`  
  repository implementations:
  - SQLite
  - LocalStorage
  - in-memory fallback

- `src/ui/screens/*`  
  app flows (home/game/history/settings/lobby)

- `src/ui/components/*`  
  reusable UI and camera-scoring views (`*.native.tsx`, `*.web.tsx` split)

- `src/ui/store/*`  
  state stores (Zustand)

## Runtime data flow (typical game turn)

1. UI dispatches action (e.g., score input / detected hit)
2. Domain engine validates and computes state transition
3. Updated state persisted via repository
4. UI store updates and re-renders
5. Stats update from domain/data layer

## Platform strategy

- Shared TypeScript code for domain/data/UI logic
- Platform-specific implementations where needed (`.native`, `.web` suffixes)
- Expo + React Native as primary runtime

## Design goals

- keep game logic deterministic and testable
- isolate platform side effects in data/ui boundaries
- allow fallback storage/provider implementations for resilience
