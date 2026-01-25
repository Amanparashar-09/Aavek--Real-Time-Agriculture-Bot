import os

import cv2
import yaml

from inference.leaf_detector import LeafDetector
from inference.severity_estimator import SeverityEstimator
from decision.decision_engine import decide
from actuator.sprinkle import Sprinkler


# -----------------------------
# LOAD CONFIG
# -----------------------------
with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

spr_cfg = config["sprinkler"]


# -----------------------------
# IMAGE INPUT (PT OR ONNX)
# -----------------------------
IMAGE_PATH = "input_images/test.jpg"
BACKEND = "pt"  # "pt" for best.pt, "onnx" for best.onnx

if BACKEND == "pt":
    yolo_model_path = "models/best.pt"
else:
    yolo_model_path = "models/best.onnx"

if not os.path.exists(IMAGE_PATH):
    raise FileNotFoundError(f"Image not found: {IMAGE_PATH}")

frame = cv2.imread(IMAGE_PATH)
if frame is None:
    raise RuntimeError("Failed to load image")

print(f"🖼 Image loaded: {IMAGE_PATH}")


# -----------------------------
# INITIALIZE MODELS
# -----------------------------
detector = LeafDetector(yolo_model_path, base_conf=0.3)
severity_estimator = SeverityEstimator("models/severity_model.onnx")

sprinkler = Sprinkler(
    pin=spr_cfg["gpio_pin"],
    max_duration=spr_cfg["max_duration_sec"],
    cooldown=spr_cfg["cooldown_sec"],
)

print("✅ SYSTEM READY (IMAGE MODE)")


try:
    print("🌿 Running YOLO detection")
    boxes = detector.detect(frame)

    # boxes: (cls, x1, y1, x2, y2, score)
    boxes = sorted(boxes, key=lambda b: b[5], reverse=True)
    MAX_LEAVES_PER_FRAME = 5
    boxes = boxes[:MAX_LEAVES_PER_FRAME]

    print(f"🔍 Detected {len(boxes)} leaf candidates")

    infected_percents = []

    for cls, x1, y1, x2, y2, score in boxes:
        leaf = frame[y1:y2, x1:x2]
        if leaf.size == 0:
            continue

        percent = severity_estimator.estimate(leaf)
        infected_percents.append(percent)

        class_label = "healthy_class" if cls == 0 else "infected_class"
        print(f"🦠 Leaf ({class_label}) severity: {percent:.2f}% (conf={score:.2f})")

    if infected_percents:
        plant_percent = sum(infected_percents) / len(infected_percents)
    else:
        plant_percent = 0.0

    print(f"🌱 Plant infection average: {plant_percent:.2f}%")

    decision = decide(plant_percent)
    print(f"🚿 Decision: {decision}")

    if spr_cfg.get("enabled", False):
        sprinkler.spray(decision)

except Exception as e:
    print("❌ Runtime error:", e)

finally:
    sprinkler.cleanup()
    print("🧹 Cleanup done")
