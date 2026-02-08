# Prompt Ablauf und Spielregeln

Diese Prompt-Sammlung führt Codex Schritt für Schritt zu einer lauffähigen MVP-App. Jeder Prompt ist detailliert, baut auf dem vorherigen auf und setzt klare Akzeptanzkriterien.

## Quelle
- Produkt- und Feature-Definition: `docs/APP_DOC.md`

## Reihenfolge
1. `01-architektur.md`
2. `02-repo-bootstrap.md`
3. `03-domain-model.md`
4. `04-x01-engine.md`
5. `05-cricket-engine.md`
6. `06-ui-shell.md`
7. `07-autoscoring-stub.md`
8. `08-stats-history.md`
9. `09-persistence-sync.md`
10. `10-online-lobby-mock.md`
11. `11-monetization-gates.md`
12. `12-qa-release.md`
13. `13-camera-setup-calibration.md`
14. `14-autoscoring-heuristic-poc.md`
15. `15-ml-dataset-training.md`
16. `16-native-inference-bridge.md`

## Festgelegter Stack
- React Native (Expo)
- TypeScript
- Android + iOS + Web
- npm
- GitHub Actions

## VPS-Test-Workflow (Alma Linux)
Die App muss auf dem VPS jederzeit testbar sein.

Empfohlene Standardkommandos:
```bash
npm install
npm run dev
npm run dev:web
npm run dev:tunnel
```

Erwartetes Verhalten:
- `npm run dev` startet Expo für Android-Geräte und lokale Simulatoren.
- `npm run dev:web` startet den Web-Client im Browser.
- `npm run dev:tunnel` erlaubt Gerätezugriff ohne direkte LAN-Verbindung.

Hinweis zu iOS:
- iOS-Builds werden über EAS Build erstellt, weil kein macOS auf dem VPS verfügbar ist.

## Grundregeln für Codex
- Keine Annahmen über externe Services oder APIs.
- Wenn Informationen fehlen, eine minimalistische Default-Variante wählen und dokumentieren.
- Jede funktionale Einheit bekommt Tests.
- Änderungen ausschließlich als diff oder vollständige Dateiinhalte ausgeben.
- Keine stillen Breaking Changes.
- Domain-Logik bleibt UI-unabhängig.

## Erfolgskriterien
Am Ende existiert eine lauffähige MVP-App mit:
- X01-Engine
- Autoscoring-Stub mit manueller Korrektur
- Lokaler Persistenz
- Statistiken und Historie
- Navigierbarer UI-Shell
- Web-Client, der im Browser läuft
