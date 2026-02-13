# Prompt 07: Autoscoring-Stub und manuelle Korrektur

## Auftrag
Implementiere eine Autoscoring-Schnittstelle mit Dummy-Provider und UI-Korrektur-Flow.

## Anforderungen
- Interface `ScoringProvider` mit `start`, `stop`, `status`
- Dummy-Provider generiert Treffer periodisch oder auf Knopfdruck
- Treffer enthält Segment, Multiplikator, Punkte
- UI zeigt Treffer an und erlaubt Korrektur

## Datenstruktur für Treffer
- Segment: 1–20 oder 25 (Bull)
- Multiplikator: `S`, `D`, `T`
- Punkte: Segment * Multiplikator
- Falls Bull: `S25` oder `D25`

## Flow
1. Treffer wird erkannt oder simuliert
2. UI zeigt Treffer-Dialog
3. Nutzer korrigiert Segment oder Multiplikator
4. Engine wird mit korrigiertem Wurf aktualisiert

## Implementierungsdetails
- Interface unter `src/domain/scoring/`
- Dummy-Provider unter `src/data/scoring/`
- UI-Dialog unter `src/ui/components/`

## Output-Format
- Code-Diff
- Kurze Beschreibung der Schnittstellen

## Akzeptanzkriterien
- Dummy-Provider aktivierbar.
- Korrekturen werden in der Engine verarbeitet.
- Keine UI-Blocker.
