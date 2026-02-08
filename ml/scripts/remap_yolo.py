#!/usr/bin/env python3
import argparse
import os
import shutil
from pathlib import Path

try:
    import yaml
except Exception:
    yaml = None


def parse_args():
    p = argparse.ArgumentParser(description="Remap/Filter YOLO dataset classes")
    p.add_argument("--in", dest="src", required=True, help="Input dataset root")
    p.add_argument("--out", dest="dst", required=True, help="Output dataset root")
    p.add_argument(
        "--map",
        dest="class_map",
        required=True,
        help="Class map like 'tip:dart_tip,dart:dart_tip' (old_name:new_name)",
    )
    return p.parse_args()


def load_names(src: Path):
    yaml_files = list(src.glob("*.yaml")) + list(src.glob("*.yml"))
    for y in yaml_files:
        try:
            with open(y, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) if yaml else None
            if data and "names" in data:
                names = data["names"]
                if isinstance(names, dict):
                    return [names[k] for k in sorted(names.keys(), key=lambda x: int(x))]
                if isinstance(names, list):
                    return names
        except Exception:
            continue
    return None


def parse_map(s: str):
    out = {}
    for pair in s.split(","):
        if not pair.strip():
            continue
        old, new = pair.split(":", 1)
        out[old.strip()] = new.strip()
    return out


def main():
    args = parse_args()
    src = Path(args.src)
    dst = Path(args.dst)
    dst.mkdir(parents=True, exist_ok=True)

    class_map = parse_map(args.class_map)

    names = load_names(src)
    if names is None:
        raise SystemExit("Could not find dataset names. Provide a data.yaml with 'names'.")

    old_name_to_idx = {name: i for i, name in enumerate(names)}
    new_names = []
    old_idx_to_new_idx = {}

    for old_name, new_name in class_map.items():
        if old_name not in old_name_to_idx:
            raise SystemExit(f"Class '{old_name}' not found in names: {names}")
        if new_name not in new_names:
            new_names.append(new_name)
        old_idx_to_new_idx[old_name_to_idx[old_name]] = new_names.index(new_name)

    def remap_split(split_dir: Path, out_dir: Path):
        images_dir = split_dir / "images"
        labels_dir = split_dir / "labels"
        if not images_dir.exists() or not labels_dir.exists():
            return
        (out_dir / "images").mkdir(parents=True, exist_ok=True)
        (out_dir / "labels").mkdir(parents=True, exist_ok=True)

        for label_file in labels_dir.glob("*.txt"):
            rel = label_file.stem
            out_label = out_dir / "labels" / f"{rel}.txt"
            out_lines = []
            with open(label_file, "r", encoding="utf-8") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) < 5:
                        continue
                    try:
                        cls = int(float(parts[0]))
                    except Exception:
                        continue
                    if cls not in old_idx_to_new_idx:
                        continue
                    new_cls = old_idx_to_new_idx[cls]
                    out_lines.append(" ".join([str(new_cls)] + parts[1:]) + "\n")

            if not out_lines:
                continue

            # copy image
            img_file = None
            for ext in [".jpg", ".jpeg", ".png", ".webp"]:
                candidate = images_dir / f"{rel}{ext}"
                if candidate.exists():
                    img_file = candidate
                    break
            if img_file is None:
                continue

            shutil.copy2(img_file, out_dir / "images" / img_file.name)
            with open(out_label, "w", encoding="utf-8") as f:
                f.writelines(out_lines)

    # Roboflow exports use train/valid/test
    for split in ["train", "valid", "val", "test"]:
        split_dir = src / split
        if split_dir.exists():
            remap_split(split_dir, dst / split)

    # write new yaml
    yaml_path = dst / "data.yaml"
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(
            """# Remapped YOLO dataset
path: .
train: train/images
val: valid/images
nc: {nc}
names: {names}
""".format(
                nc=len(new_names), names=new_names
            )
        )

    print(f"Done. New dataset: {dst}")


if __name__ == "__main__":
    main()
