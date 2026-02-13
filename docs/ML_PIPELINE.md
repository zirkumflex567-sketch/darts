# ML Pipeline

This project uses on-device models for camera-assisted scoring/calibration.

## Current model artifacts in repo

- `dart_tip.tflite`
- training checkpoints and exports under `runs/` (local-heavy)
- helper binaries: `yolo26n.pt`, `yolov8n.pt`

## Recommended lifecycle

1. **Collect / curate dataset**
   - keep raw/annotated data outside Git if large
   - keep only minimal sample assets in repo

2. **Train**
   - use reproducible scripts + pinned deps
   - store experiment metadata (config, commit hash, metrics)

3. **Export**
   - export target models for mobile inference (`.tflite`)
   - include model version in filename or metadata

4. **Validate**
   - functional checks on known reference frames
   - drift checks for board calibration points

5. **Release**
   - publish large artifacts via release storage (not main Git history)
   - update app model version constants in one place

## Model contract discipline

Define and keep stable:
- input shape and normalization
- output tensor schema/order
- coordinate system conventions

## Best-practice notes

- Avoid committing full training outputs (`runs/`) to main branch.
- Track model provenance (dataset version + code commit + training config).
- Keep a compact "golden sample" regression set for quick sanity checks.

## Related file

- Legacy training brief: `TRAINING_PROMPT.md`
