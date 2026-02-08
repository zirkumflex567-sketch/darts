# Realtime Autoscoring Pipeline

Stand: 2026-02-08

## Ziel
Echte, kontinuierliche Treffer-Erkennung in Live-Frames auf dem Device, ohne Cloud.

## Technischer Stack
- `react-native-vision-camera` mit Frame Processor
- `vision-camera-resize` fuer Downscale + RGB-Buffer
- Heuristik (Frame-Differenz) im Worklet, Ergebnis an JS
- Kalibrierung (Board-Mitte, Skalierung, Rotation + 4-Punkt-Homographie)

## Implementierung (aktuell)
1. **Frame Processor** verarbeitet Live-Frames (ca. 6 FPS).
2. Frame wird auf 96x96 RGB heruntergerechnet.
3. Baseline-Frame wird im Worklet gespeichert.
4. Differenzanalyse pro Frame:
   - Pixel-Diff > Threshold
   - Count zwischen Min/Max
   - ROI: Kreis um Board-Mitte
5. Trefferpunkt wird als normalisierte Koordinate (0..1) an JS uebergeben.
6. JS mappt Koordinate auf Board-Segment (Kalibrierung + Score-Logik).
7. Baseline wird nach Treffer aktualisiert.

## Bedienung
- `Baseline`: Setzt den Referenzzustand (leeres Board).
- `Auto Start`: Aktiviert kontinuierliche Analyse.
- `Auto Stop`: Deaktiviert Analyse.

## Grenzen der Heuristik
- Starke Lichtwechsel oder Hand im Bild erzeugen False Positives.
- Kleine Darts oder schlechte Ausleuchtung reduzieren Trefferquote.
- Perspektivische Verzerrung braucht 4-Punkt-Kalibrierung.

## Naechster Schritt (ML)
- Datenerfassung direkt aus der App.
- Training YOLOv8n oder MobileNet SSD.
- TFLite/CoreML Inference im Frame Processor.
Siehe auch: `docs/DATASET_CAPTURE.md` und `ml/README.md`.
