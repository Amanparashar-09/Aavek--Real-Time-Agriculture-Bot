import os
import sys

import cv2
import yaml

from inference.leaf_detector import LeafDetector
from inference.severity_estimator import SeverityEstimator


def main():
    # -----------------------------
    # Parse args / defaults
    # -----------------------------
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = "input_images/test.jpg"

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    # -----------------------------
    # Load config
    # -----------------------------
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)

    spr_cfg = config.get("sprinkler", {})

    # -----------------------------
    # Backend / models
    # -----------------------------
    BACKEND = "pt"  # "pt" for best.pt, "onnx" for best.onnx

    if BACKEND == "pt":
        yolo_model_path = "models/best.pt"
    else:
        yolo_model_path = "models/best.onnx"

    if not os.path.exists(yolo_model_path):
        raise FileNotFoundError(f"YOLO model not found: {yolo_model_path}")

    severity_model_path = "models/severity_model.onnx"
    if not os.path.exists(severity_model_path):
        raise FileNotFoundError(f"Severity model not found: {severity_model_path}")

    # -----------------------------
    # Load image
    # -----------------------------
    frame = cv2.imread(image_path)
    if frame is None:
        raise RuntimeError("Failed to load image")

    print(f"🖼 Image loaded: {image_path}")

    # -----------------------------
    # Initialize models
    # -----------------------------
    detector = LeafDetector(yolo_model_path, base_conf=0.3)
    severity_estimator = SeverityEstimator(severity_model_path)

    print("✅ MODELS READY (VISUALIZATION MODE)")

    # -----------------------------
    # Run detection + segmentation
    # -----------------------------
    boxes = detector.detect(frame)
    boxes = sorted(boxes, key=lambda b: b[5], reverse=True)
    MAX_LEAVES_PER_FRAME = 5
    boxes = boxes[:MAX_LEAVES_PER_FRAME]

    print(f"🔍 Detected {len(boxes)} leaf candidates")

    vis_frame = frame.copy()

    for idx, (cls, x1, y1, x2, y2, score) in enumerate(boxes, start=1):
        leaf = frame[y1:y2, x1:x2]
        if leaf.size == 0:
            continue

        # Get segmentation mask (224x224) and infection percent
        mask, percent = severity_estimator.mask_and_percent(leaf, threshold=0.5)

        # Resize mask back to the leaf crop size
        mask_uint8 = (mask.astype("uint8") * 255)
        mask_resized = cv2.resize(
            mask_uint8,
            (leaf.shape[1], leaf.shape[0]),
            interpolation=cv2.INTER_NEAREST,
        )

        # Create red overlay where mask is positive
        overlay = leaf.copy()
        red = (0, 0, 255)
        overlay[mask_resized > 0] = red

        # Blend overlay with original leaf region
        blended = cv2.addWeighted(leaf, 0.6, overlay, 0.4, 0)
        vis_frame[y1:y2, x1:x2] = blended

        color = (0, 255, 0) if cls == 0 else (0, 0, 255)
        cv2.rectangle(vis_frame, (x1, y1), (x2, y2), color, 2)

        label = f"#{idx} {percent:.1f}% | conf={score:.2f}"
        cv2.putText(
            vis_frame,
            label,
            (x1, max(0, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            1,
            cv2.LINE_AA,
        )

        print(
            f"🦠 Leaf #{idx} | class={'healthy' if cls == 0 else 'infected'} "
            f"| severity={percent:.2f}% | conf={score:.2f}"
        )

    # -----------------------------
    # Show and save result
    # -----------------------------
    os.makedirs("output", exist_ok=True)
    base = os.path.splitext(os.path.basename(image_path))[0]
    out_path = os.path.join("output", f"{base}_vis.jpg")

    cv2.imwrite(out_path, vis_frame)
    print(f"💾 Visualization saved to: {out_path}")

    cv2.imshow("Detections + Segmentation", vis_frame)
    print("Press any key in the image window to close...")
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
