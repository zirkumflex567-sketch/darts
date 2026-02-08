#!/usr/bin/env python3
import argparse
from pathlib import Path

try:
    import tensorflow as tf
except Exception as exc:
    raise SystemExit("tensorflow missing. Install with: pip install tensorflow") from exc


ORDER = ["20_top", "6_right", "3_bottom", "11_left"]


def parse_args():
    p = argparse.ArgumentParser(description="Validate board keypoint tflite output")
    p.add_argument("--model", required=True, help="Path to board_kp_*.tflite")
    p.add_argument("--image", required=True, help="Image path")
    p.add_argument("--img", type=int, default=320)
    return p.parse_args()


def load_image(path, img_size):
    data = tf.io.read_file(path)
    img = tf.image.decode_image(data, channels=3, expand_animations=False)
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = tf.image.resize(img, [img_size, img_size])
    return img


def main():
    args = parse_args()
    img = load_image(args.image, args.img)
    input_data = tf.expand_dims(img, 0).numpy()

    interpreter = tf.lite.Interpreter(model_path=args.model)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    interpreter.set_tensor(input_details[0]["index"], input_data)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]["index"]).reshape(-1)

    if output.size < 8:
        raise SystemExit(f"Unexpected output size: {output.size}")

    points = []
    for i in range(0, 8, 2):
        x = float(output[i])
        y = float(output[i + 1])
        points.append((x, y))

    for label, (x, y) in zip(ORDER, points):
        print(f"{label}: {x:.4f}, {y:.4f}")


if __name__ == "__main__":
    main()
