# Prompt 09: Persistenz und Offline-First

## Auftrag
Implementiere lokale Persistenz für Matches, Legs, Visits, Throws und Stats.

## Anforderungen
- Lokale DB über `expo-sqlite`
- Repository-Interfaces
- Migrationen oder Schema-Versionierung
- Offline-First, kein Sync

## Datenobjekte
- Match
- Leg
- Visit
- Throw
- Player
- Stats

## Repository-Schnittstellen
- `saveMatch(match)`
- `loadMatch(matchId)`
- `listMatches(filters)`
- `saveStats(stats)`
- `loadStats(matchId)`

## Implementierungsdetails
- DB-Initialisierung in `src/data/db/`
- Repositories in `src/data/repositories/`
- Test-Repositories mit In-Memory-Adapter

## Output-Format
- Code-Diff
- Tests für Repository-Methoden

## Akzeptanzkriterien
- Daten bleiben nach Neustart erhalten.
- CRUD-Operationen stabil.
- Keine Abhängigkeit von Netzwerk.
