import cv2
import yaml
import time
from collections import deque

from camera.camera import Camera
from inference.leaf_detector import LeafDetector
from inference.severity_estimator import SeverityEstimator
from decision.decision_engine import decide
from actuator.sprinkle import Sprinkler


# =============================
# LOAD CONFIG
# =============================
with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

spr_cfg = config["sprinkler"]
cam_cfg = config.get("camera", {})
CAPTURE_INTERVAL = config.get("capture_interval_sec", 2)

# YOLO class IDs that correspond to infected leaves.
# This can be overridden from config.yaml under key:
#   yolo:
#     infected_class_ids: [1]
yolo_cfg = config.get("yolo", {})
INFECTED_CLASS_IDS = set(yolo_cfg.get("infected_class_ids", [1]))


# =============================
# INITIALIZE COMPONENTS
# =============================
camera = Camera(
    device_id=cam_cfg.get("device_id", 0),
    width=cam_cfg.get("width", 640),
    height=cam_cfg.get("height", 480),
)

print("📷 Camera initialized")

detector = LeafDetector("models/yolov11n.pt", base_conf=0.2)
severity_estimator = SeverityEstimator("models/severity_model.onnx")

sprinkler = Sprinkler(
    pin=spr_cfg["gpio_pin"],
    max_duration=spr_cfg["max_duration_sec"],
    cooldown=spr_cfg["cooldown_sec"],
)

print("✅ SYSTEM READY (RASPBERRY PI MODE)")


# =============================
# STATE VARIABLES
# =============================
last_inference_time = 0.0
last_boxes = []
last_plant_percent = 0.0
last_decision = "N/A"

# Last captured frame (for visualization)
last_frame = None

# For temporal smoothing
BOX_HISTORY = deque(maxlen=3)

# FPS tracking
last_frame_time = time.time()
fps = 0.0


# =============================
# MAIN LOOP
# =============================
try:
    print("🔁 Live camera started (press 'q' to exit)")

    while True:
        now = time.time()

        # ---- Periodic inference ----
        if now - last_inference_time >= CAPTURE_INTERVAL:
            print("\n📸 Running inference...")

            frame = camera.capture()
            if frame is None:
                time.sleep(0.05)
                continue

            # ---- FPS calculation (time since last capture) ----
            dt = now - last_frame_time
            if dt > 0:
                fps = 0.9 * fps + 0.1 * (1.0 / dt) if fps > 0 else (1.0 / dt)
            last_frame_time = now

            H, W, _ = frame.shape
            boxes = detector.detect(frame)

            # ---- FILTER BY YOLO CLASS (ONLY INFECTED LEAVES) ----
            boxes = [
                (cls, x1, y1, x2, y2, score)
                for cls, x1, y1, x2, y2, score in boxes
                if cls in INFECTED_CLASS_IDS
            ]

            # ---- GEOMETRIC FILTERING ----
            filtered = []
            img_area = H * W

            for cls, x1, y1, x2, y2, score in boxes:
                bw = x2 - x1
                bh = y2 - y1
                area = bw * bh
                aspect = bw / (bh + 1e-6)

                if area < 0.01 * img_area:
                    continue
                if area > 0.5 * img_area:
                    continue
                if aspect < 0.3 or aspect > 3.0:
                    continue

                filtered.append((cls, x1, y1, x2, y2, score))

            boxes = filtered[:5]  # limit leaves per frame

            # ---- TEMPORAL SMOOTHING ----
            BOX_HISTORY.append(boxes)
            boxes = max(BOX_HISTORY, key=len, default=boxes)

            infected_values = []

            for cls, x1, y1, x2, y2, score in boxes:
                leaf = frame[y1:y2, x1:x2]

                if leaf.size == 0:
                    continue
                if leaf.shape[0] < 64 or leaf.shape[1] < 64:
                    continue

                # Preprocess for segmentation
                leaf = cv2.GaussianBlur(leaf, (5, 5), 0)
                leaf = cv2.cvtColor(leaf, cv2.COLOR_BGR2RGB)

                percent = severity_estimator.estimate(leaf)
                infected_values.append(percent)

                print(f"🌿 Leaf severity: {percent:.2f}% | conf={score:.2f}")

            if infected_values:
                plant_percent = sum(infected_values) / len(infected_values)
            else:
                plant_percent = 0.0

            decision = decide(plant_percent)

            print(f"🌱 Plant infection: {plant_percent:.2f}%")
            print(f"🚿 Decision: {decision}")

            if spr_cfg["enabled"]:
                sprinkler.spray(decision)

            last_frame = frame
            last_boxes = boxes
            last_plant_percent = plant_percent
            last_decision = decision
            last_inference_time = now

        # =============================
        # VISUALIZATION
        # =============================
        if last_frame is None:
            time.sleep(0.02)
            continue

        display = last_frame.copy()

        for cls, x1, y1, x2, y2, score in last_boxes:
            cv2.rectangle(display, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                display,
                f"{score:.2f}",
                (x1, y1 - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                1,
            )

        status = (
            f"Infection: {last_plant_percent:.1f}% | "
            f"Decision: {last_decision} | FPS: {fps:.1f}"
        )

        cv2.putText(
            display,
            status,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )

        cv2.imshow("AI Plant Monitoring (Pi)", display)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

        time.sleep(0.02)


# =============================
# CLEANUP
# =============================
except KeyboardInterrupt:
    print("\n🛑 Stopped by user")

finally:
    camera.release()
    sprinkler.cleanup()
    cv2.destroyAllWindows()
    print("🧹 Cleanup complete")
