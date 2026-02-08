# ML Training Pipeline (YOLOv8n)

Stand: 2026-02-08

## Voraussetzungen
- Python 3.10+
- `pip install ultralytics`

## 1) Dataset vom Handy auf VPS kopieren
Siehe `docs/DATASET_CAPTURE.md` (adb pull).

Erwartete Struktur:
```
ml/raw/dataset/index.json
ml/raw/dataset/sample_*.jpg
```

## 2) Export in YOLO-Format
```bash
python3 ml/scripts/export_yolo.py \
  --index ml/raw/dataset/index.json \
  --images-dir ml/raw/dataset \
  --out ml/dataset
```

## 3) Training (YOLOv8n)
```bash
yolo detect train \
  data=ml/dataset/dart-tip.yaml \
  model=yolov8n.pt \
  epochs=80 \
  imgsz=640
```

## 4) Export (TFLite)
```bash
yolo export model=runs/detect/train/weights/best.pt format=tflite
```

## 5) Naechste Schritte
- TFLite in die App integrieren (Native Inference Bridge).
- On-device Inference im Frame Processor.
