# Prompt 06: UI-Shell und Navigation

## Auftrag
Implementiere eine MVP-UI-Shell mit Navigation und zentralen Screens.

## Anforderungen
- Startscreen
- Modusauswahl mit mindestens X01 und Cricket sichtbar
- Spieler-Setup
- Spielscreen mit Scoreboard
- Settings

## UI-Funktionen
- Scoreboard zeigt aktuellen Spieler
- Buttons für Start, Pause, Undo
- Anzeige von verbleibenden Punkten (X01)
- Anzeige geschlossener Zahlen (Cricket)

## Navigation
- React Navigation mit Stack
- Routen: `Home`, `ModeSelect`, `PlayerSetup`, `Game`, `Settings`, `Lobby`
- Startscreen führt zu ModeSelect
- ModeSelect führt zu PlayerSetup
- PlayerSetup führt zu Game
- Settings ist global erreichbar

## Implementierungsdetails
- Screens unter `src/ui/screens/`
- Komponenten unter `src/ui/components/`
- Navigation-Konfiguration unter `src/ui/navigation/`

## Output-Format
- Code-Diff
- Screens mit Platzhalterdaten

## Akzeptanzkriterien
- Navigation funktioniert ohne Fehler.
- Alle Screens sind erreichbar.
- UI rendert stabil.
