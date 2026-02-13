# QA Summary

Stand: 2026-02-07

## Tests ausgefuehrt
- `npm test -- --runInBand`

## Ergebnis
- Alle Domain- und Repository-Tests erfolgreich.

## Bekannte Risiken
- UI-Render-Tests fuer React Navigation sind nicht enthalten.
- SQLite-Verhalten auf Web wird durch LocalStorage ersetzt (funktional, aber ohne SQL-Features).
- Autoscoring-Stub simuliert Treffer und ersetzt kein ML-Modell.

## Build-Status
- Web-Client kann via `npm run dev:web` gestartet werden.
- Native Builds benoetigen Expo/EAS-Konfiguration.
