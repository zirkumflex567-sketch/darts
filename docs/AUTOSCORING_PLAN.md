# Autoscoring Plan (Live Kamera)

Stand: 2026-02-08

## Ziel
Echte, live Kamera-basierte Erkennung von Darttreffern und automatischer Score-Berechnung, on-device.

## Status heute
- In der App existiert nur ein Dummy-Scoring-Provider.
- Kein echtes Kamera- oder ML-Scoring implementiert.

## Offene Produkt-Entscheidungen (bitte festlegen)
1. Zielgeraete: exakte Android- und iOS-Modelle
2. Montage: Abstand, Winkel, Fixierung (Tripod/Wall Mount)
3. Board-Typen: Standard Steel / Soft / beides
4. Genauigkeit: Ziel-Trefferquote (z.B. >=95%)
5. Offline-Pflicht: strikt on-device oder hybrid moeglich
6. Budget/Zeit: MVP mit Heuristik vs. direkt ML-Pipeline

## Mindestanforderungen (Empfehlung)
- On-device Verarbeitung (Datenschutz + Offline)
- Realtime oder near-realtime (2-5s nach Wurf)
- Manuelle Korrektur bleibt immer moeglich
- Fehlersichere Bust-/Regel-Logik unveraendert in Domain

## Architekturuebersicht

### Module
- Camera Capture
- Board Detection + Calibration
- Dart Detection (Heuristik/ML)
- Segment Mapping (Koordinaten -> Score)
- Scoring Provider (Adapter zur App)
- Validation/Heuristics (Bounce-out, occlusion)

### Datenfluss
1. Kamera-Frame Stream
2. Board-Detection (bei Start + gelegentliches Re-Check)
3. Homographie / Koordinatentransform
4. Dart-Tip Detection
5. Segment-Mapping (radial + ring)
6. Score-Event an App
7. Optionaler Korrektur-Dialog

## Kalibrierung (MVP)
- Board wird einmal erkannt und in Koordinaten transformiert.
- Nutzer bestaetigt Board-Center oder korrigiert mit 4 Punkten.
- Daraus Homographie berechnen -> jeder Pixel wird auf Board-Koordinaten gemappt.

## Segment Mapping
- Standard Board-Ringe und Winkel-Offsets.
- Radiale Zonen: Bull, Single, Triple, Single, Double.
- Winkelbereich in 20 Segmente (mit festem Offset je Ausrichtung).

## Erkennungsansaetze

### Phase 1: Heuristik-MVP
- Background subtraction (vorher/nachher) mit Bewegungserkennung
- Kanten + Linien-Detection der Dartspitze
- Fokus auf klare, gut beleuchtete Szenen
- Ziel: Machbarkeit und UI/Flow verifizieren

### Phase 2: ML-Detection
- Object Detection fuer Dartspitze / Dartkoerper
- On-device Inference (TFLite, CoreML)
- Training auf echten Boards aus verschiedenen Winkeln

### Phase 3: Dual-Device
- Zwei Kamerawinkel fuer bessere Tiefe
- Triangulation der Dartspitze
- Synchronisierung der Treffer

## Daten- und Trainingspipeline
- Datensatz: Video/Frames mit annotierter Dartspitze
- Tools: Labeling (COCO/YOLO)
- Augmentierungen: Licht, Winkel, Motion Blur, Occlusion
- Export: TFLite (Android) + CoreML (iOS)

## Runtime-Implementierung
- Android: CameraX + TFLite
- iOS: AVFoundation + CoreML
- Alternative: OpenCV fuer Preprocessing
- React Native Bridge / Custom Dev Client (Expo Go reicht nicht)

## Performance-Ziele
- Inferenz < 200ms pro Treffer
- CPU/GPU Budget pro Frame definieren
- Throttling bei Hit-Erkennung (kein Full-Frame 60 FPS noetig)

## Fehlerszenarien
- Dart prallt ab (kein Score)
- Mehrere Darts im Board (mehrere Treffer)
- Occlusion durch Hand
- Spiegelungen oder schlechte Beleuchtung

## QA und Validierung
- Offline Tests mit aufgezeichneten Wurfsequenzen
- Live Tests in verschiedenen Lichtbedingungen
- Statistik: Trefferquote, False-Positive-Rate, Korrekturen

## Integration in die App
- Ersetzen des Dummy-Providers durch echten `ScoringProvider`
- UI fuer Kalibrierung vor dem Match
- Feature-Flag zum Aktivieren/Deaktivieren von Autoscoring

## Risiken
- ML-Modell erfordert Training und viele Daten
- Performance auf Low-End-Geraeten
- Kamerawinkel stark variabel -> Kalibrierung kritisch

## Naechste Schritte (empfohlen)
1. Zielgeraete + Montage finalisieren
2. Proof of Concept Heuristik (Phase 1)
3. Kleiner annotierter Datensatz
4. ML-Modell-Prototyp (Phase 2)
5. Integration in Custom Dev Client

## Implementierungsstatus (MVP-Phase)
- Kamera-Vorschau ueber `expo-camera` integriert.
- Tap-zu-Score: Tippen auf das Board im Kamerabild erzeugt einen Treffer und oeffnet den Korrektur-Dialog.
- Automatische Erkennung ist noch nicht aktiv (erfordert ML/Native Pipeline).

## Custom Dev Client erforderlich
- Kamera + ML Module laufen nicht in Expo Go.
- Dev Client ist Voraussetzung fuer echte Live-Erkennung.
- Setup: `docs/DEV_CLIENT.md`
