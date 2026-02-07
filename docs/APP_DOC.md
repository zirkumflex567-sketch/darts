# Dartsmind Doku (Produkt, Features, Prompting)

Stand: 2026-02-07
Quelle der Faktenbasis: `/root/darts/info.md` (Zusammenfassung, ohne externe Verifikation)

## Zweck dieser Doku
Diese Doku beschreibt die App, die einzelnen Funktionen und das gewünschte Verhalten so klar, dass wir daraus zielgerichtete Codex-Prompts entwickeln und Umsetzungen beauftragen können.

## Überblick
Dartsmind ist eine mobile App, die ein Smartphone oder Tablet in ein automatisches Dart-Scoring-System verwandelt. Die App nutzt die Rückkamera des Geräts zur Erkennung von Dartwürfen und zählt Punkte automatisch, ohne zusätzliche Hardware. Sie läuft lokal auf dem Gerät, unterstützt Online-Spiele und bietet zahlreiche Spielmodi.

## Zielgruppe
- Hobby- und Vereinsspieler, die schnell Punkte erfassen möchten
- Turnierspieler, die Statistiken und Trainingstools nutzen
- Online-Spieler, die Matches mit Video-Unterstützung spielen

## Kernversprechen
- Autoscoring ohne zusätzliche Hardware
- Reibungsloses Spielerlebnis, auch offline
- Breite Auswahl an Spielmodi
- Detaillierte Statistiken und Trainingsfunktionen

## Nicht-Ziele (zum Scope-Schutz)
- Keine Unterstützung für Emulatoren oder Chromebooks
- Kein Ziel, alle externen Kameras zu unterstützen
- Kein Fokus auf proprietäre Board-Hardware

## Plattformen und Mindestvoraussetzungen
- iOS/iPadOS mit A12-Chip oder neuer
- Android 9.0+ mit ausreichender CPU/GPU-Leistung
- Dual-Device-Modus optional für höhere Präzision

## Terminologie
- Throw: einzelner Dartwurf
- Visit: bis zu drei Würfe eines Spielers
- Leg: abgeschlossene Spielrunde
- Match: mehrere Legs mit definierten Regeln
- Checkout: letzter Wurf zum Beenden eines X01-Spiels

## Feature-Übersicht
- Autoscoring per Kamera
- KI-gestützte Erkennung on-device
- Spielmodi: X01, Cricket, Training, Party
- DartBot (KI-Gegner)
- Statistiken und Historie
- Online-Spiel mit Lobby und Video
- Monetarisierung via Abo und Coins

## Funktionale Anforderungen im Detail

### 1) Onboarding und Gerätekontrolle
Ziele:
- Nutzer verstehen die Kamera-Anforderungen
- Gerätetauglichkeit wird geprüft

Anforderungen:
- Erststart prüft Performance für Echtzeit-Inference
- Klarer Hinweis bei nicht unterstützten Geräten
- Kurzer Setup-Flow zur Positionierung des Geräts

Akzeptanzkriterien:
- Der Nutzer sieht innerhalb von 30 Sekunden, ob Autoscoring möglich ist
- Fehlermeldung beschreibt, welche Funktion betroffen ist

### 2) Kamera-Setup und Autoscoring
Ziele:
- Erkennung von Darttreffern ohne Zusatzhardware
- Robuste Ergebnisse aus unterschiedlichen Winkeln

Anforderungen:
- Unterstützung der Rückkamera
- Autoscoring läuft lokal und offline
- Manuelle Korrektur pro Wurf möglich
- Erkennung mehrerer Treffer pro Visit

Edge Cases:
- Okklusion durch Hand oder Dartkörper
- Geringes Licht oder Spiegelungen
- Dart prallt ab oder landet außerhalb

Akzeptanzkriterien:
- Wurf wird innerhalb weniger Sekunden verarbeitet
- Nutzer kann Ergebnis korrigieren und fortfahren

### 3) Dual-Device-Modus
Ziele:
- Höhere Präzision durch zweiten Kamerawinkel

Anforderungen:
- Geräte koppeln via QR oder Code
- Synchronisierte Spielstände
- Fallback auf Single-Device

Akzeptanzkriterien:
- Verbindungsabbruch stoppt nicht das Spiel
- Mindestens ein Gerät kann weiterlaufen

### 4) Spielmodi

#### 4.1 X01 Serie
Anforderungen:
- Startwerte 210 bis 1501
- Double-Out und Single-Out konfigurierbar
- Checkout-Vorschläge optional

Akzeptanzkriterien:
- Leg endet nur bei gültigem Checkout
- Ungültiger Wurf wird abgelehnt

#### 4.2 Cricket Varianten
Anforderungen:
- Standard Cricket
- No Score Cricket
- Tactic Cricket
- Random Cricket
- Cut-Throat Cricket

Akzeptanzkriterien:
- Regeln pro Variante sind reproduzierbar
- Fortschrittsanzeige pro Spieler

#### 4.3 Trainingsspiele
Anforderungen:
- Around the Clock
- JDC Challenge
- Catch 40
- 9 Darts Double Out
- 99 Darts at XX
- Bob’s 27
- Random Checkout
- 170
- Cricket Count Up
- Count Up Party Games

Akzeptanzkriterien:
- Jede Übung hat eine klare Punkteregel
- Ergebnis kann gespeichert werden

#### 4.4 Party- und Fun-Modi
Anforderungen:
- Hammer Cricket
- Half It
- Killer
- Shanghai
- Bermuda
- Gotcha

Akzeptanzkriterien:
- Modusregeln sind transparent
- Strafen und Sonderregeln werden angezeigt

### 5) DartBot (KI-Gegner)
Ziele:
- KI-Gegner mit mehreren Schwierigkeitsstufen

Anforderungen:
- Konfigurierbare Schwierigkeit
- Trennung nach Modus (X01, Cricket)

Akzeptanzkriterien:
- DartBot verhält sich konsistent über Matches
- Statistiken für DartBot optional

### 6) Statistiken und Historie
Ziele:
- Analyse von Spielverlauf und Leistung

Anforderungen:
- Historie nach Match, Leg, Visit
- Kennzahlen wie Average, Checkout-Rate, Trefferquote
- Export (CSV/JSON) optional

Akzeptanzkriterien:
- Statistiken sind für jede Spielart verfügbar
- Historie ist filterbar

### 7) Online Play und Lobby
Ziele:
- Online-Matches mit Video und Coins

Anforderungen:
- Lobby für öffentliche und private Spiele
- Video-Streaming optional
- Coins pro Match für Videoverbindung

Akzeptanzkriterien:
- Spiel funktioniert ohne Video
- Coins werden nur für Video verbraucht

### 8) Monetarisierung
Ziele:
- Kostenloser Einstieg, Premium-Funktionen optional

Anforderungen:
- In-App-Käufe und Abos
- Feature-Gates klar sichtbar

Akzeptanzkriterien:
- Feature-Gates blockieren keine Kernfunktionen
- Abo-Status wird offline sicher cached

### 9) Offline-Modus
Ziele:
- Kernfunktionen laufen ohne Internet

Anforderungen:
- Autoscoring und lokale Statistik offline
- Online-Funktionen mit Statusanzeige

Akzeptanzkriterien:
- Keine Abhängigkeit von Cloud für Scoring

## Datenmodell (Vorschlag)
- User
- Device
- Match
- Leg
- Visit
- Throw
- Player
- GameMode
- GameRules
- Stats
- Purchase
- CoinTransaction

## UX-Flows

### Flow A: Neues Match (X01)
1. Modus wählen
2. Spieler hinzufügen
3. Startwert und Regeln setzen
4. Kamera-Setup bestätigen
5. Spiel starten

### Flow B: Autoscoring Korrektur
1. Wurf erkannt
2. Ergebnis zeigt Segment und Punktzahl
3. Nutzer korrigiert Segment falls nötig
4. Wurf wird bestätigt

### Flow C: Online-Match
1. Lobby öffnen
2. Match erstellen oder beitreten
3. Video aktivieren oder deaktivieren
4. Spiel starten

## Risiken und technische Unschärfen
- KI-Modell und Training sind nicht in diesem Repo enthalten
- Gerätekompatibilität muss real getestet werden
- Dual-Device Synchronisation benötigt niedrige Latenz

## Schnellstart (für Codex-basierte Umsetzung)

### 1) Scope und Ziel definieren
Ziel: MVP mit X01, Autoscoring-Placeholder, manuelle Korrektur, lokale Stats

### 2) Architektur-Entscheidung
- Native (iOS/Android) oder Cross-Platform (Flutter/React Native)
- Lokales Inference-Modul (zuerst als Stub)

### 3) Projektgrundlage erzeugen
- Repo-Struktur anlegen
- Build-Pipeline, Linting, Tests
- CI-Workflow

### 4) Feature-Priorität
1. Spiel-Engine (X01) und Datenmodell
2. UI für Spielstand und Korrektur
3. Kamera-Integration (Stub oder einfache Erkennung)
4. Stats und Match-Historie
5. Weitere Spielmodi

### 5) Qualitätskriterien
- Reproduzierbare Regeln
- Saubere Abbruch- und Fehlerpfade
- Lokale Persistenz

## Codex Prompt Pack (Vorlagen)

### Prompt 1: Architektur-Kickoff
"Erstelle eine Architektur-Entscheidungsvorlage für eine mobile Dart-Scoring-App. Berücksichtige Autoscoring on-device, Offline-First, Stats, und optionales Online-Play. Gib 2 Optionen mit Tradeoffs."

### Prompt 2: Repo-Struktur und Tooling
"Lege eine Projektstruktur für [STACK] an, inklusive Linting, Tests und CI. Erzeuge eine minimale App-Shell mit Startscreen und Navigationsrahmen."

### Prompt 3: Datenmodell und Regeln
"Entwirf ein Datenmodell für X01 und Cricket. Definiere Entitäten, Beziehungen, und Speicherschema. Ergänze Regeln für Checkout und ungültige Würfe."

### Prompt 4: X01 Game Engine
"Implementiere eine X01-Engine mit Startwerten 210–1501, Double-Out optional, Visit-Verarbeitung und Undo. Schreibe Tests für typische und fehlerhafte Fälle."

### Prompt 5: Cricket Engine
"Implementiere Cricket-Varianten (Standard, Cut-Throat). Definiere Scoring und Anzeige pro Spieler. Schreibe Tests."

### Prompt 6: Autoscoring Stub
"Implementiere eine Schnittstelle `ScoringProvider` mit einem Dummy-Kamera-Provider. UI soll Wurfvorschläge anzeigen und Korrekturen zulassen."

### Prompt 7: Statistiken
"Berechne Average, Checkout-Rate, Trefferquoten pro Match und pro Leg. Persistiere Stats lokal und baue eine Übersichtsliste."

### Prompt 8: Online-Lobby (MVP)
"Skizziere eine einfache Online-Lobby mit Match-Erstellung und Join. Implementiere nur UI und lokale Mock-Daten."

### Prompt 9: Monetarisierung-Gates
"Füge Feature-Gates für Premium-Modi hinzu. Implementiere eine lokale Entitlement-Schnittstelle mit Mock-Abo-Status."

### Prompt 10: Teststrategie
"Erstelle eine Teststrategie für Game Engine, Statistikberechnung und UI-Flows. Markiere priorisierte Tests für MVP."

## Definition of Done (MVP)
- X01 funktioniert durchgängig mit Undo
- Kamera-Stub liefert manuell korrigierbare Ergebnisse
- Lokale Persistenz für Matches und Stats
- Kein Crash bei Offline-Betrieb
- Grundlegende UI-Flows abgeschlossen

## Änderungslog
- 2026-02-07: Erstdoku erstellt
