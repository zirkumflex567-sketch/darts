# ML Bootstrap (vortrainierte Datasets + Fine-Tuning)

Stand: 2026-02-08

## Ziel
Vortrainiertes Modell (Board + Dart) nutzen und anschliessend mit eigenen Nutzer-Daten nachtrainieren.

## Empfohlene, offene Datasets

### 1) Dartboard-ROI (Board erkennen)
**DartboardDetection** – ca. 1.4k Bilder, Lizenz MIT.
- Quelle: Roboflow Universe (öffentlich)
- Zweck: Board-Rand/ROI erkennen

### 2) Dartspitze (Dart Tip)
**tip** – ca. 6.8k Bilder, Lizenz CC BY 4.0 (2 Klassen: `tip`, `4`).
- Quelle: Roboflow Universe (öffentlich)
- Zweck: Dartspitze erkennen (wir filtern nur Klasse `tip`)

Alternative:
**DartsCounter** – ca. 1.2k Bilder, Lizenz CC BY 4.0 (Klasse `Dart`).

## Download (Roboflow)
Roboflow verlangt einen API-Key.

Beispiel (YOLOv8 Export):
```bash
export ROBOFLOW_API_KEY=...your_key...

# Board-ROI
python3 ml/scripts/roboflow_download.py \
  --workspace onecamsteeldarts \
  --project dartboarddetection \
  --version 1 \
  --format yolov8 \
  --out ml/external/dartboard

# Dart Tip
python3 ml/scripts/roboflow_download.py \
  --workspace automaticdarts \
  --project tip \
  --version 1 \
  --format yolov8 \
  --out ml/external/tip
```

## Remap auf 1 Klasse (dart_tip)
```bash
python3 ml/scripts/remap_yolo.py \
  --in ml/external/tip \
  --out ml/dataset/tip \
  --map tip:dart_tip
```

Die YAML wird automatisch erstellt: `ml/dataset/tip/data.yaml`.

## Training (YOLOv8n)
```bash
yolo detect train \
  data=ml/dataset/tip/data.yaml \
  model=yolov8n.pt \
  epochs=80 \
  imgsz=640
```

## Export (TFLite)
```bash
yolo export model=runs/detect/train/weights/best.pt format=tflite
```

## Integration in die App
Die App erwartet das Modell hier:
```
<app files>/models/dart_tip.tflite
```

Beispiel Android:
```bash
adb shell mkdir -p /data/data/org.zirkumflex567.dartsmind/files/models
adb push dart_tip.tflite /data/data/org.zirkumflex567.dartsmind/files/models/dart_tip.tflite
```

## Hinweise
- CC BY 4.0 erfordert Attribution.
- Besseres Ergebnis durch eigenes Fine-Tuning mit Nutzer-Daten.

