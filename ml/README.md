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

---

# Board Keypoints (Auto-Kalibrierung)

Ziel: `board_kp_${VERSION}.tflite` mit 4 Punkten (20 oben, 6 rechts, 3 unten, 11 links).

## Voraussetzungen
- Python 3.10+
- `pip install tensorflow`

## 1) Dataset exportieren (aus App-Capture)
Erwartete Struktur:
```
ml/raw/dataset/index.json
ml/raw/dataset/sample_*.jpg
```

Export:
```bash
python3 ml/scripts/export_board_kp.py \
  --index ml/raw/dataset/index.json \
  --images-dir ml/raw/dataset \
  --out ml/board_kp
```

## 1b) Alternative: DeepDarts YOLOv8 (Roboflow)
```bash
python3 ml/scripts/roboflow_download.py \
  --workspace testing-zzmc9 \
  --project deepdarts-yolov8 \
  --version 3 \
  --format yolov8 \
  --out ml/external/deepdarts_yolov8

python3 ml/scripts/export_board_kp_from_yolo.py \
  --data ml/external/deepdarts_yolov8 \
  --out ml/board_kp_deepdarts
```

## 2) Training + Export (TFLite)
```bash
python3 ml/scripts/train_board_kp.py \
  --data ml/board_kp \
  --epochs 80 \
  --batch 16 \
  --version 2026-02-08
```

Das erzeugt `runs/board_kp/2026-02-08/board_kp_2026-02-08.tflite`.

## 3) Validierung (optional)
```bash
python3 ml/scripts/validate_board_kp.py \
  --model runs/board_kp/2026-02-08/board_kp_2026-02-08.tflite \
  --image assets/dartboard-default.jpg
```

## 4) Deploy
- Upload nach: `/var/www/html/models/board_kp_${VERSION}.tflite`
- In der App `KP_MODEL_VERSION` aktualisieren.
