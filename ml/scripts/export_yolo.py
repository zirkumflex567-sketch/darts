#!/usr/bin/env python3
import argparse
import json
import os
import random
import shutil
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="Export dataset index.json to YOLO format")
    parser.add_argument("--index", required=True, help="Path to index.json")
    parser.add_argument("--images-dir", required=True, help="Directory with sample images")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--train", type=float, default=0.8, help="Train split ratio")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    return parser.parse_args()


def main():
    args = parse_args()
    with open(args.index, "r", encoding="utf-8") as f:
        samples = json.load(f)

    samples = [s for s in samples if "annotation" in s and s.get("annotation")]
    if not samples:
        print("No annotated samples found.")
        return

    random.seed(args.seed)
    random.shuffle(samples)
    split_idx = int(len(samples) * args.train)
    train_samples = samples[:split_idx]
    val_samples = samples[split_idx:]

    out_dir = Path(args.out)
    train_img = out_dir / "images" / "train"
    val_img = out_dir / "images" / "val"
    train_lbl = out_dir / "labels" / "train"
    val_lbl = out_dir / "labels" / "val"

    for d in [train_img, val_img, train_lbl, val_lbl]:
        d.mkdir(parents=True, exist_ok=True)

    def write_sample(sample, img_dir, lbl_dir):
        file_name = sample["fileName"]
        src_path = Path(args.images_dir) / file_name
        dst_path = img_dir / file_name
        if not dst_path.exists():
            shutil.copy2(src_path, dst_path)

        ann = sample["annotation"]
        # YOLO format: class x y w h (normalized)
        # We store a tiny box around the dart tip
        x = ann["x"]
        y = ann["y"]
        w = 0.02
        h = 0.02
        label = f"0 {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n"
        label_path = lbl_dir / f"{Path(file_name).stem}.txt"
        with open(label_path, "w", encoding="utf-8") as out:
            out.write(label)

    for sample in train_samples:
        write_sample(sample, train_img, train_lbl)
    for sample in val_samples:
        write_sample(sample, val_img, val_lbl)

    yaml_path = out_dir / "dart-tip.yaml"
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write("""# Dart tip dataset
path: .
train: images/train
val: images/val
nc: 1
names: ['dart_tip']
""")

    print(f"Exported {len(train_samples)} train / {len(val_samples)} val samples")
    print(f"Dataset YAML: {yaml_path}")


if __name__ == "__main__":
    main()
