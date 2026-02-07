# Prompt 02: Repo-Bootstrap, Tooling und App-Shell

## Auftrag
Erzeuge ein neues React-Native-(Expo)-Projekt im bestehenden Repo. Die App muss lokal startbar sein, auf dem VPS per Browser testbar sein und eine minimale UI-Shell besitzen.

## Kontext
- Architektur: `docs/ARCHITECTURE.md`
- Produktbeschreibung: `docs/APP_DOC.md`

## Vorgaben
- Stack: React Native (Expo)
- Sprache: TypeScript
- Plattform: Android + iOS + Web
- Package Manager: npm
- CI: GitHub Actions

## Anforderungen an die Projektstruktur
- `src/` als Wurzel für Anwendungscode
- `src/domain/` für reine Spiel-Logik
- `src/data/` für Persistenz
- `src/ui/` für Screens und Komponenten
- `src/shared/` für Utilities und Konstanten
- `tests/` für Unit- und Integrationstests

## Tooling-Anforderungen
- ESLint + Prettier passend für TypeScript und React Native
- Jest + React Native Testing Library
- CI-Pipeline, die `npm run lint` und `npm test` ausführt
- Ein Smoke-Test, der die App-Shell rendert

## Expo-Konfiguration
- `app.json` oder `app.config.ts` mit Name, Slug, Version, Platforms
- Web-Unterstützung aktiv
- Einheitliche App-Icons und Splash als Platzhalter

## NPM-Skripte
- `dev` = `expo start`
- `dev:web` = `expo start --web`
- `dev:tunnel` = `expo start --tunnel`
- `test` = `jest`
- `lint` = `eslint .`
- `format` = `prettier --write .`

## App-Shell
- Startscreen mit App-Titel und zwei Buttons
- Navigation zu einem leeren Spielscreen
- Navigation zu Settings
- Platzhalter-Inhalte mit klaren Labels

## Output-Format
- Code-Diff mit allen neuen Dateien
- Kurzanleitung zum Starten und Testen

## Akzeptanzkriterien
- `npm install` und `npm run dev:web` funktionieren auf dem VPS.
- UI rendert ohne Crash.
- Mindestens ein Test läuft.
