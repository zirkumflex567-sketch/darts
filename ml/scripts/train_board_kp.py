#!/usr/bin/env python3
import argparse
import datetime as dt
import os
from pathlib import Path
import random
import sys

try:
    import tensorflow as tf
except Exception as exc:
    raise SystemExit("tensorflow missing. Install with: pip install tensorflow") from exc


ORDER = ["20_top", "6_right", "3_bottom", "11_left"]


def parse_args():
    p = argparse.ArgumentParser(description="Train board keypoint regressor (8 floats)")
    p.add_argument("--data", required=True, help="Dataset root from export_board_kp.py")
    p.add_argument("--out", default="runs/board_kp", help="Output directory")
    p.add_argument("--epochs", type=int, default=80)
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--img", type=int, default=320)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--version", default=None, help="Model version string (default: today)")
    p.add_argument("--verbose", type=int, default=0, help="Keras fit verbosity (0,1,2)")
    return p.parse_args()


def list_samples(images_dir: Path, labels_dir: Path):
    samples = []
    for img_path in images_dir.glob("*"):
        if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
            continue
        label_path = labels_dir / f"{img_path.stem}.txt"
        if not label_path.exists():
            continue
        with open(label_path, "r", encoding="utf-8") as f:
            raw = f.read().strip().split()
        if len(raw) != 8:
            continue
        try:
            values = [float(v) for v in raw]
        except Exception:
            continue
        samples.append((str(img_path), values))
    return samples


def find_split_dirs(root: Path, split: str):
    # Format A: root/images/split, root/labels/split
    img_a = root / "images" / split
    lbl_a = root / "labels" / split
    if img_a.exists() and lbl_a.exists():
        return img_a, lbl_a
    # Format B: root/split/images, root/split/labels (Roboflow)
    img_b = root / split / "images"
    lbl_b = root / split / "labels"
    if img_b.exists() and lbl_b.exists():
        return img_b, lbl_b
    return None, None


def build_dataset(samples, img_size, batch, seed, training):
    paths = [s[0] for s in samples]
    labels = [s[1] for s in samples]
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(buffer_size=len(paths), seed=seed, reshuffle_each_iteration=True)

    def _load(path, label):
        data = tf.io.read_file(path)
        img = tf.image.decode_image(data, channels=3, expand_animations=False)
        img = tf.image.convert_image_dtype(img, tf.float32)
        img = tf.image.resize(img, [img_size, img_size], method=tf.image.ResizeMethod.BILINEAR)
        return img, tf.cast(label, tf.float32)

    ds = ds.map(_load, num_parallel_calls=tf.data.AUTOTUNE)

    if training:
        # Photometric augmentation only (no geometry) to keep labels valid
        aug = tf.keras.Sequential(
            [
                tf.keras.layers.RandomBrightness(0.1),
                tf.keras.layers.RandomContrast(0.1),
            ]
        )
        ds = ds.map(lambda x, y: (aug(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE)

    ds = ds.batch(batch).prefetch(tf.data.AUTOTUNE)
    return ds


def build_model(img_size):
    inputs = tf.keras.Input(shape=(img_size, img_size, 3))
    base = tf.keras.applications.MobileNetV3Small(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights="imagenet",
        minimalistic=True,
    )
    base.trainable = False
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(8, activation="sigmoid", name="kp_out")(x)
    model = tf.keras.Model(inputs, outputs)
    return model


def main():
    args = parse_args()
    random.seed(args.seed)
    tf.random.set_seed(args.seed)
    # Some environments have stdout flush issues; guard against them.
    _real_flush = sys.stdout.flush
    def _safe_flush():
        try:
            _real_flush()
        except OSError:
            pass
    sys.stdout.flush = _safe_flush

    data_root = Path(args.data)
    train_img, train_lbl = find_split_dirs(data_root, "train")
    val_img, val_lbl = find_split_dirs(data_root, "val")
    if not val_img or not val_lbl:
        val_img, val_lbl = find_split_dirs(data_root, "valid")

    train_samples = list_samples(train_img, train_lbl) if train_img and train_lbl else []
    val_samples = list_samples(val_img, val_lbl) if val_img and val_lbl else []
    if not train_samples:
        raise SystemExit("No training samples found")
    if not val_samples:
        raise SystemExit("No validation samples found")

    train_ds = build_dataset(train_samples, args.img, args.batch, args.seed, training=True)
    val_ds = build_dataset(val_samples, args.img, args.batch, args.seed, training=False)

    model = build_model(args.img)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=args.lr),
        loss=tf.keras.losses.Huber(delta=0.02),
        metrics=[tf.keras.metrics.MeanAbsoluteError(name="mae")],
    )

    out_root = Path(args.out)
    version = args.version or dt.date.today().isoformat()
    run_dir = out_root / f"{version}"
    run_dir.mkdir(parents=True, exist_ok=True)

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(run_dir / "best.keras"),
            monitor="val_mae",
            save_best_only=True,
            save_weights_only=False,
        ),
        tf.keras.callbacks.EarlyStopping(monitor="val_mae", patience=12, restore_best_weights=True),
    ]

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=args.verbose,
    )

    # Save SavedModel (Keras 3 export)
    saved_model_dir = run_dir / "saved_model"
    model.export(saved_model_dir)

    # Export TFLite (float32)
    converter = tf.lite.TFLiteConverter.from_saved_model(str(saved_model_dir))
    tflite_model = converter.convert()
    tflite_path = run_dir / f"board_kp_{version}.tflite"
    with open(tflite_path, "wb") as f:
        f.write(tflite_model)

    meta_path = run_dir / "meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        f.write(
            "{\n"
            f"  \"version\": \"{version}\",\n"
            f"  \"order\": {ORDER},\n"
            "  \"input\": \"320x320 rgb float32 0..1\",\n"
            "  \"output\": \"8 floats: x20 y20 x6 y6 x3 y3 x11 y11\"\n"
            "}\n"
        )

    print(f"Saved: {tflite_path}")
    print("Upload to: /var/www/html/models/")


if __name__ == "__main__":
    main()
