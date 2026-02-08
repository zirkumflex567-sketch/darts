#!/usr/bin/env python3
import argparse
import os
from pathlib import Path

try:
    from roboflow import Roboflow
except Exception as exc:
    raise SystemExit(
        "roboflow package missing. Install with: pip install roboflow"
    ) from exc


def parse_args():
    p = argparse.ArgumentParser(description="Download a Roboflow Universe dataset")
    p.add_argument("--workspace", required=True, help="Roboflow workspace slug")
    p.add_argument("--project", required=True, help="Roboflow project slug")
    p.add_argument("--version", required=True, type=int, help="Dataset version")
    p.add_argument("--format", default="yolov8", help="Export format (yolov8, yolo, etc.)")
    p.add_argument("--out", required=True, help="Output directory")
    p.add_argument("--api-key", default=None, help="Roboflow API key (or env ROBOFLOW_API_KEY)")
    return p.parse_args()


def main():
    args = parse_args()
    api_key = args.api_key or os.getenv("ROBOFLOW_API_KEY")
    if not api_key:
        raise SystemExit("Missing API key. Set ROBOFLOW_API_KEY or pass --api-key")

    rf = Roboflow(api_key=api_key)
    project = rf.workspace(args.workspace).project(args.project)
    version = project.version(args.version)
    dataset = version.download(args.format, location=args.out)

    out_dir = Path(dataset.location)
    print(f"Downloaded to: {out_dir}")


if __name__ == "__main__":
    main()
