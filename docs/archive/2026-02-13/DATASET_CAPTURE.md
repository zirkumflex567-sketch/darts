# Dataset Capture & Annotation

Stand: 2026-02-08

## Ziel
Frames direkt auf dem Handy erfassen und als Trainingsdaten exportieren.

## Speicherort (Device)
- Basisordner: `FileSystem.documentDirectory/dataset/`
- Index-Datei: `index.json`
- Samples: `sample_<timestamp>.jpg`

## Ablauf
1. Kamera-Setup korrekt einstellen (Zoom, Mitte, Rotation, ggf. 4-Punkt-Kalibrierung).
2. `Capture` druecken.
3. Im Annotation-Dialog die Dartspitze antippen.
4. `Speichern` bestaetigen.

## JSON-Struktur (index.json)
```json
[
  {
    "id": "1707350000000",
    "fileName": "sample_1707350000000.jpg",
    "uri": "file:///.../dataset/sample_1707350000000.jpg",
    "width": 3000,
    "height": 4000,
    "capturedAt": "2026-02-08T01:20:00.000Z",
    "annotation": { "x": 0.53, "y": 0.42 },
    "settingsSnapshot": {
      "centerX": 0.5,
      "centerY": 0.48,
      "scale": 0.95,
      "rotationDeg": -1,
      "calibrationPoints": [
        { "x": 0.52, "y": 0.12 },
        { "x": 0.84, "y": 0.52 },
        { "x": 0.50, "y": 0.86 },
        { "x": 0.16, "y": 0.50 }
      ]
    }
  }
]
```

## Export auf VPS
- Dataset vom Handy exportieren (z.B. `adb pull` vom App-Sandbox-Ordner).
- Index + Bilder in `ml/raw/` ablegen.

Beispiel (Pfad variiert je nach Device):
```bash
adb shell run-as org.zirkumflex567.dartsmind ls /data/data/org.zirkumflex567.dartsmind/files/dataset
adb pull /data/data/org.zirkumflex567.dartsmind/files/dataset ./ml/raw/dataset
```

## Naechster Schritt
- Training via `ml/README.md` (YOLOv8n / MobileNet).
