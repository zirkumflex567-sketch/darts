#!/usr/bin/env python3
import argparse
import itertools
import math
import shutil
from pathlib import Path


TARGET_ANGLES = [
    -math.pi / 2,  # top (20)
    0.0,           # right (6)
    math.pi / 2,   # bottom (3)
    math.pi,       # left (11)
]


def parse_args():
    p = argparse.ArgumentParser(description="Convert YOLO object dataset to board keypoint regression dataset")
    p.add_argument("--data", required=True, help="YOLO dataset root (train/valid/test) with labels")
    p.add_argument("--out", required=True, help="Output dataset root")
    p.add_argument(
        "--cal-classes",
        default="1,2,3,4",
        help="Comma-separated class indices for calibration points (default: 1,2,3,4)",
    )
    return p.parse_args()


def ang_diff(a, b):
    diff = (a - b + math.pi) % (2 * math.pi) - math.pi
    return abs(diff)


def order_points(points):
    # points: list of (x,y)
    cx = sum(p[0] for p in points) / 4
    cy = sum(p[1] for p in points) / 4
    angles = [math.atan2(p[1] - cy, p[0] - cx) for p in points]
    best = None
    best_cost = 1e9
    for perm in itertools.permutations(range(4)):
        cost = 0.0
        for i, idx in enumerate(perm):
            cost += ang_diff(angles[idx], TARGET_ANGLES[i])
        if cost < best_cost:
            best_cost = cost
            best = perm
    return [points[i] for i in best]


def parse_label_file(path, cal_classes):
    points = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 5:
                continue
            try:
                cls = int(float(parts[0]))
                x = float(parts[1])
                y = float(parts[2])
            except Exception:
                continue
            if cls in cal_classes:
                points.append((x, y))
    return points


def process_split(split_dir: Path, out_dir: Path, cal_classes):
    images_dir = split_dir / "images"
    labels_dir = split_dir / "labels"
    if not images_dir.exists() or not labels_dir.exists():
        return 0

    (out_dir / "images").mkdir(parents=True, exist_ok=True)
    (out_dir / "labels").mkdir(parents=True, exist_ok=True)

    kept = 0
    for label_file in labels_dir.glob("*.txt"):
        stem = label_file.stem
        img_file = None
        for ext in [".jpg", ".jpeg", ".png", ".webp"]:
            cand = images_dir / f"{stem}{ext}"
            if cand.exists():
                img_file = cand
                break
        if img_file is None:
            continue

        points = parse_label_file(label_file, cal_classes)
        if len(points) < 4:
            continue

        # keep first 4 points if more present
        points = points[:4]
        ordered = order_points(points)

        # write label
        flat = []
        for x, y in ordered:
            flat.extend([x, y])
        label_out = out_dir / "labels" / f"{stem}.txt"
        with open(label_out, "w", encoding="utf-8") as f:
            f.write(" ".join([f"{v:.6f}" for v in flat]) + "\n")

        shutil.copy2(img_file, out_dir / "images" / img_file.name)
        kept += 1

    return kept


def main():
    args = parse_args()
    cal_classes = {int(x.strip()) for x in args.cal_classes.split(",") if x.strip()}

    src = Path(args.data)
    dst = Path(args.out)
    dst.mkdir(parents=True, exist_ok=True)

    totals = {}
    for split in ["train", "valid", "val", "test"]:
        split_dir = src / split
        if split_dir.exists():
            out_split = dst / split
            totals[split] = process_split(split_dir, out_split, cal_classes)

    print("Converted splits:")
    for k, v in totals.items():
        print(f"  {k}: {v} samples")
    print(f"Output: {dst}")


if __name__ == "__main__":
    main()
