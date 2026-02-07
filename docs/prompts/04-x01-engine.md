# Prompt 04: X01 Game Engine

## Auftrag
Implementiere eine testgetriebene X01-Engine gemäß `docs/DOMAIN_MODEL.md`.

## Anforderungen
- Startwerte 210–1501
- Double-Out optional
- Visit mit bis zu drei Würfen
- Bust-Logik exakt
- Undo für letzten Visit
- Persistierbare Events

## API-Design
- Reine Logik-Schicht ohne UI
- TypeScript in `src/domain/x01/`
- Public API in `src/domain/x01/index.ts`
- Funktionen für Neues Spiel, Visit anwenden, Visit rückgängig, Status lesen

## Testanforderungen
- Tests unter `tests/domain/x01/`
- Normaler Spielverlauf
- Bust in Wurf 1, 2 und 3
- Double-Out aktiviert und deaktiviert
- Undo und Re-Apply
- Spielende korrekt erkannt

## Output-Format
- Code-Diff
- Tests mit kurzen Erklärungen

## Akzeptanzkriterien
- Alle Tests grün.
- API ist stabil und leicht für UI nutzbar.
- Keine Logik in der UI.
