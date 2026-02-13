# Prompt 12: QA, Tests und Release-Check

## Auftrag
Sichere die Stabilität des MVP, führe Tests aus und dokumentiere Risiken.

## Anforderungen
- Alle Unit-Tests ausführen
- Fehlende Tests ergänzen
- Linting und Formatierung prüfen
- Build-Check für Zielplattform

## Erwartete Kommandos
- `npm run lint`
- `npm test`
- `npm run dev:web`
- `npx expo export --platform web`
- `eas build -p android --profile preview` (falls EAS konfiguriert)
- `eas build -p ios --profile preview` (falls EAS konfiguriert)

## Output-Format
- Code-Diff
- Test-Zusammenfassung
- Liste der bekannten Risiken
- Liste fehlender Voraussetzungen, falls Builds nicht möglich sind

## Akzeptanzkriterien
- Tests laufen grün.
- Web-Client läuft lokal.
- Risiken sind dokumentiert und priorisiert.
