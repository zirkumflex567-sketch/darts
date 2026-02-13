# Prompt 05: Cricket Engine

## Auftrag
Implementiere die Cricket-Engine für Standard und Cut-Throat, testgetrieben.

## Anforderungen
- Zielzahlen klar definiert
- Schließen von Zahlen pro Spieler
- Punktevergabe abhängig von Variante
- Undo für letzten Visit

## API-Design
- Reine Logik-Schicht ohne UI
- TypeScript in `src/domain/cricket/`
- Public API in `src/domain/cricket/index.ts`
- Starten eines Spiels, Visit anwenden, Undo, Status

## Testanforderungen
- Tests unter `tests/domain/cricket/`
- Standard Cricket mit zwei Spielern
- Cut-Throat mit drei Spielern
- Schließen einer Zahl und Überschüsse
- Gleichzeitiges Schließen
- Undo auf geschlossenen Zahlen

## Output-Format
- Code-Diff
- Tests mit kurzen Erklärungen

## Akzeptanzkriterien
- Regeln stimmen mit `docs/DOMAIN_MODEL.md` überein.
- Tests decken Edge Cases ab.
