# Architecture (MVP)

Stand: 2026-02-07
Stack: React Native (Expo) + TypeScript
Target: Android + iOS + Web

## Kurzueberblick
Die App besteht aus einer UI-Schicht (React Native), einer Domain-Schicht fuer Spielregeln (X01, Cricket), einer Daten-Schicht fuer Persistenz (SQLite oder Web-Storage) und optionalen Adapter-Modulen (Autoscoring-Stub, Online-Lobby Mock). Die Domain-Logik ist strikt UI-unabhaengig und wird durch eine State-Schicht (Zustand) in der App verwaltet.

## Ziele
- Lauffaehige MVP-App mit X01, Autoscoring-Stub, manueller Korrektur
- Offline-First, lokale Persistenz von Matches und Statistiken
- Web-Client laeuft im Browser
- Saubere Modulgrenzen, testbare Domain-Logik

## Nicht-Ziele
- Kein echtes ML/Autoscoring im MVP (nur Stub)
- Kein echtes Online-Matchmaking oder Streaming (nur Mock UI)
- Kein iOS-Build auf dem VPS (EAS Build spaeter)
- Keine proprietaeren Board-Integrationen

## Komponenten und Verantwortlichkeiten

### UI (src/ui)
- Screens, Navigation, visuelle Komponenten
- Anzeige von Spielstand, Korrektur-Dialog, Historie
- Keine Scoring-Logik

### State/Store (src/ui/store)
- Zustand als zentraler Store
- Orchestriert Domain-Engines, Persistenz, UI-Events
- Enthaelt UI-spezifische Flags (z.B. Dialog offen)

### Domain (src/domain)
- X01-Engine, Cricket-Engine
- Stats-Berechnungen
- Scoring-Modelle und Validierungen
- Keine Abhaengigkeit von React oder Persistenz

### Data (src/data)
- SQLite-Adapter ueber expo-sqlite
- Repositories fuer Match und Stats
- Web-Fallback ueber LocalStorage
- Mock-Daten fuer Lobby
- Autoscoring-Dummy-Provider

### Shared (src/shared)
- Types, Constants, Utilities

## Datenfluesse

### Scoring-Flow (Wurf -> Ergebnis)
1. ScoringProvider (Dummy) liefert Treffer-Ereignis
2. UI zeigt Treffer-Dialog
3. Nutzer korrigiert Segment/Multiplikator
4. Store ruft Domain-Engine `applyVisit` mit Wurf(en)
5. Domain gibt neuen Spielstatus + Events
6. Store persistiert Match und Stats
7. UI rendert aktuellen Score

### History-Flow (Matchabschluss -> Historie)
1. Domain markiert Match als beendet
2. Store loest Stats-Berechnung aus
3. Stats werden gespeichert
4. Historie-Screen listet Matches aus Repository
5. Detail-Screen laedt Match und Stats

### Persistenz-Flow (App-Start)
1. Repositories initialisieren DB
2. Historie wird geladen
3. UI bietet Resume oder Neustart

## Module und Schnittstellen

### Domain APIs
- `x01/startGame(config, players)` -> state
- `x01/applyVisit(state, visit)` -> {state, events}
- `x01/undoLastVisit(state)` -> {state, events}
- `cricket/startGame(config, players)` -> state
- `cricket/applyVisit(state, visit)` -> {state, events}
- `cricket/undoLastVisit(state)` -> {state, events}
- `stats/calcMatchStats(match)` -> stats

### Data APIs
- `MatchRepository.save(match)`
- `MatchRepository.load(id)`
- `MatchRepository.list(filters)`
- `StatsRepository.save(stats)`
- `StatsRepository.load(matchId)`

### ScoringProvider
- `start()`
- `stop()`
- `status()`
- `onHit(callback)`

## State-Management Ansatz
- Zustand als zentraler Store
- Domain-Logik wird im Store aufgerufen
- UI kommuniziert ausschliesslich ueber Actions
- Store enthaelt serialisierbare States

## Persistenz-Strategie
- expo-sqlite als lokale DB
- Schema-Versionierung mit migrations
- Web: LocalStorage als Fallback
- ID-Strategie: UUID-like IDs
- Transactions fuer konsistente Writes

## MVP-Prioritaeten
1. Repo-Bootstrap + App-Shell
2. X01-Engine + Tests
3. Autoscoring-Stub + Korrektur-UI
4. Persistenz (SQLite/LocalStorage) + Historie
5. Stats-Berechnung
6. Cricket-Engine
7. Online Lobby Mock
8. Monetarisierungs-Gates

## Risiken und offene Annahmen
- Expo Web unterscheidet sich in Kamera-APIs (Stub bleibt stabil)
- SQLite-Verhalten unterscheidet sich minimal zwischen Plattformen
- Performance auf Low-End Android unbekannt
- Autoscoring-ML wird spaeter integriert, API muss stabil bleiben

## Technische Abhaengigkeiten
- Expo SDK (aktuelle LTS)
- React Native
- React Navigation
- Zustand
- expo-sqlite
- Jest, React Native Testing Library
- ESLint, Prettier
