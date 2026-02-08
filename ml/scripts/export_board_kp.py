#!/usr/bin/env python3
import argparse
import json
import random
import shutil
from pathlib import Path


ORDER = ["20_top", "6_right", "3_bottom", "11_left"]


def parse_args():
    p = argparse.ArgumentParser(description="Export board keypoints dataset from app index.json")
    p.add_argument("--index", required=True, help="Path to index.json")
    p.add_argument("--images-dir", required=True, help="Directory with sample images")
    p.add_argument("--out", required=True, help="Output directory")
    p.add_argument("--train", type=float, default=0.85, help="Train split ratio")
    p.add_argument("--seed", type=int, default=42, help="Random seed")
    return p.parse_args()


def extract_points(sample):
    # Prefer calibration points from settings snapshot
    snap = sample.get("settingsSnapshot") or {}
    points = snap.get("calibrationPoints") or sample.get("calibrationPoints")
    if not points or len(points) != 4:
        return None
    out = []
    for pt in points:
        try:
            x = float(pt["x"])
            y = float(pt["y"])
        except Exception:
            return None
        if x < 0 or y < 0:
            return None
        out.append((x, y))
    return out


def main():
    args = parse_args()
    with open(args.index, "r", encoding="utf-8") as f:
        samples = json.load(f)

    pairs = []
    for sample in samples:
        file_name = sample.get("fileName")
        if not file_name:
            continue
        points = extract_points(sample)
        if not points:
            continue
        pairs.append((file_name, points))

    if not pairs:
        print("No samples with calibrationPoints found in index.json")
        return

    random.seed(args.seed)
    random.shuffle(pairs)
    split_idx = int(len(pairs) * args.train)
    train_pairs = pairs[:split_idx]
    val_pairs = pairs[split_idx:]

    out_dir = Path(args.out)
    train_img = out_dir / "images" / "train"
    val_img = out_dir / "images" / "val"
    train_lbl = out_dir / "labels" / "train"
    val_lbl = out_dir / "labels" / "val"

    for d in [train_img, val_img, train_lbl, val_lbl]:
        d.mkdir(parents=True, exist_ok=True)

    def write_sample(file_name, points, img_dir, lbl_dir):
        src_path = Path(args.images_dir) / file_name
        dst_path = img_dir / file_name
        if not dst_path.exists():
            shutil.copy2(src_path, dst_path)

        flat = []
        for x, y in points:
            flat.extend([x, y])
        label = " ".join([f"{v:.6f}" for v in flat]) + "\n"
        label_path = lbl_dir / f"{Path(file_name).stem}.txt"
        with open(label_path, "w", encoding="utf-8") as out:
            out.write(label)

    for file_name, points in train_pairs:
        write_sample(file_name, points, train_img, train_lbl)
    for file_name, points in val_pairs:
        write_sample(file_name, points, val_img, val_lbl)

    meta = {
        "order": ORDER,
        "format": "x20 y20 x6 y6 x3 y3 x11 y11",
        "train": len(train_pairs),
        "val": len(val_pairs),
    }
    with open(out_dir / "meta.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Exported {len(train_pairs)} train / {len(val_pairs)} val samples")
    print(f"Dataset root: {out_dir}")


if __name__ == "__main__":
    main()
