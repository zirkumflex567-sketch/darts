# Training Prompt (Stronger Machine)

You are Codex in the repo. Goal: train and export a dartboard keypoint model for auto-calibration.

## Current App Expectations
- Model filename pattern: `board_kp_${VERSION}.tflite` (currently `VERSION = 2026-02-08`).
- Remote hosting expected at: `https://h-town.duckdns.org/models/board_kp_${VERSION}.tflite`.
- Input size: 320x320 RGB, float32 normalized to 0..1.
- Output: 8 floats, interpreted as 4 keypoints in this order:
  - `20 (oben)`, `6 (rechts)`, `3 (unten)`, `11 (links)`
  - Output layout: `[x20, y20, x6, y6, x3, y3, x11, y11]`.
  - Values in 0..1 are treated as normalized; values >1 are treated as pixel coords and divided by 320.

## Recommended Datasets (Public)
Use any combination that fits the license and quality needs:
- Roboflow Universe: `dataset_darts_kpts` (keypoint dataset, CC BY 4.0).
- Roboflow Universe: `DartboardDetection` (object detection, MIT) for optional board ROI crop.
- Roboflow Universe: `tip-2` (keypoint dataset for dart tips, CC BY 4.0).
- DeepDarts dataset (IEEE Dataport, referenced in the DeepDarts repo); includes calibration points and dart locations.

## Existing Projects / Models (Reference Only)
- Dart Sense uses a YOLOv8 model to detect dart positions plus 4 calibration points, but its license is non-commercial. Use only as a reference unless you get permission.

## Training Plan (Keypoints)
Pick one path:

Path A (Simple Regressor, easiest to match app output)
1. Download a keypoint dataset and map labels to the 4 required points.
2. Build a small CNN regressor (e.g., MobileNetV3 backbone + 8-float head).
3. Train on 320x320 crops, heavy augmentation: rotation, perspective, brightness, blur.
4. Export to TFLite (float32). Ensure output order is the 4 points in the required order.

Path B (YOLOv8-pose fine-tuning)
1. Train YOLOv8-pose on 4 keypoints.
2. Export to TFLite and add a small post-processing adapter that outputs 8 floats in the expected order.
3. Validate output order and normalization before deploying.

## Roboflow Dataset Download (Example)
Set API key in the environment (do NOT commit):

```bash
export ROBOFLOW_API_KEY=your_key_here
```

Download via the Roboflow SDK (example for dataset_darts_kpts):

```python
from roboflow import Roboflow
rf = Roboflow(api_key=os.environ["ROBOFLOW_API_KEY"])
project = rf.workspace("smartdartsystem").project("dataset_darts_kpts")
version = project.version(1)
# Choose format that matches your training pipeline
dataset = version.download("yolov8")
```

## Repo Clone on Training Machine
```bash
git clone git@github.com:zirkumflex567-sketch/darts.git
cd darts
```

## Export + Deploy
1. Export model to `board_kp_${VERSION}.tflite`.
2. Upload to server path used by nginx: `/var/www/html/models/board_kp_${VERSION}.tflite`.
3. If the version changes, update `KP_MODEL_VERSION` in `src/ui/components/CameraScoringView.native.tsx`.

## Validation Checklist
- Run inference on the bundled test image and verify 4 points land on 20/6/3/11.
- Confirm points are within 0..1 normalized coordinates.
- Verify the app's auto-calibration sets center/scale/rotation correctly.

## Notes
- If you add new user images, keep a small `holdout/` split to track generalization.
- Prefer datasets with explicit license terms (Roboflow Universe lists license in the dataset page).
