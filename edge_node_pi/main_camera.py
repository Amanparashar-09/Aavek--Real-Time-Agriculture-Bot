import cv2
import yaml
import time

from camera.camera import Camera
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
cam_cfg = config.get("camera", {})

capture_interval = config.get("capture_interval_sec", 10)


# -----------------------------
# INITIALIZE CAMERA & MODELS (WEBCAM LOOP)
# -----------------------------
camera = Camera(
    device_id=cam_cfg.get("device_id", 0),
    width=cam_cfg.get("width", 640),
    height=cam_cfg.get("height", 480),
)

print("📷 Camera ready (webcam loop)")

detector = LeafDetector("models/best.pt", base_conf=0.3)
severity_estimator = SeverityEstimator("models/severity_model.onnx")

sprinkler = Sprinkler(
    pin=spr_cfg["gpio_pin"],
    max_duration=spr_cfg["max_duration_sec"],
    cooldown=spr_cfg["cooldown_sec"],
)

print("✅ SYSTEM READY (WEBCAM MODE)")


# -----------------------------
# PIPELINE EXECUTION (LIVE VIEW + PERIODIC INFERENCE)
# -----------------------------
try:
    print("🔁 Live webcam started (press 'q' to stop)")

    # For controlling how often we run heavy inference
    last_inference_time = 0.0
    last_plant_percent = 0.0
    last_decision = "N/A"
    last_boxes = []  # list of (cls, x1, y1, x2, y2, score)

    # For FPS (frames per second) measurement
    last_frame_time = time.time()
    fps = 0.0

    while True:
        # Always grab latest frame for smooth live view
        frame = camera.capture()

        if frame is None:
            raise RuntimeError("Failed to capture frame from camera")

        now = time.time()

        # Update FPS using time between frames (simple smoothing)
        dt = now - last_frame_time
        if dt > 0:
            current_fps = 1.0 / dt
            fps = 0.9 * fps + 0.1 * current_fps if fps > 0 else current_fps
        last_frame_time = now
        run_inference = (now - last_inference_time) >= capture_interval

        if run_inference:
            print("\n📸 Capturing frame for analysis...")
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

            if spr_cfg["enabled"]:
                sprinkler.spray(decision)

            # Store results for visualization on subsequent frames
            last_inference_time = now
            last_plant_percent = plant_percent
            last_decision = decision
            last_boxes = boxes

        # ----- Visualize live camera with last known results -----
        display_frame = frame.copy()

        # Draw bounding boxes from last inference (if any)
        for cls, x1, y1, x2, y2, score in last_boxes:
            color = (0, 255, 0) if cls == 0 else (0, 0, 255)
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
            label_text = f"{score:.2f}"
            cv2.putText(
                display_frame,
                label_text,
                (x1, max(0, y1 - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                1,
                cv2.LINE_AA,
            )

        status_text = f"Infection: {last_plant_percent:.1f}% | Decision: {last_decision} | FPS: {fps:.1f}"
        cv2.putText(
            display_frame,
            status_text,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.imshow("Live Camera", display_frame)

        # Small delay so OpenCV can refresh window & catch keypress
        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            print("\n🛑 'q' pressed, stopping live view")
            break

        # Light sleep to avoid maxing out CPU
        time.sleep(0.03)

except KeyboardInterrupt:
    print("\n🛑 Stopped by user (Ctrl+C)")

except Exception as e:
    print("❌ Runtime error:", e)

finally:
    camera.release()
    sprinkler.cleanup()
    cv2.destroyAllWindows()
    print("🧹 Cleanup done")
