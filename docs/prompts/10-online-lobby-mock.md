# Prompt 10: Online-Lobby (Mock)

## Auftrag
Erstelle eine Lobby-UI mit Match-Erstellung und Beitritt über Mock-Daten.

## Anforderungen
- Öffentliche Match-Liste
- Private Matches über Join-Code
- Toggle für Video-Option
- Keine Netzwerkanbindung

## UI-Flow
1. Lobby-Screen öffnen
2. Match erstellen oder Join
3. Match-Detail-Screen (Mock)

## Implementierungsdetails
- Mock-Daten in `src/data/mocks/`
- Lobby-Screen in `src/ui/screens/LobbyScreen.tsx`
- Join-Dialog als Modal-Komponente

## Output-Format
- Code-Diff
- Mock-Datenstruktur und Beispiele

## Akzeptanzkriterien
- Lobby ist über Navigation erreichbar.
- Join-Flow führt in ein Mock-Match.
- Kein Crash ohne Netzwerk.
