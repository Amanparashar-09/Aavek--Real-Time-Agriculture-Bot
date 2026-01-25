from ultralytics import YOLO


class LeafDetector:
    """Simple wrapper around Ultralytics YOLO.

    Runs detection directly on the input frame and returns
    (cls, x1, y1, x2, y2, score) in original image coordinates.
    """

    def __init__(self, model_path, base_conf=0.3):
        self.model = YOLO(model_path)
        self.base_conf = base_conf

    def detect(self, image, conf=None):
        if conf is None:
            conf = self.base_conf

        h, w = image.shape[:2]

        results = self.model(
            image,
            conf=conf,
            device="cpu",
            verbose=False,
        )[0]

        boxes = []

        for box in results.boxes:
            cls = int(box.cls[0].item())
            score = float(box.conf[0].item())

            xyxy = box.xyxy[0]
            x1 = int(xyxy[0].item())
            y1 = int(xyxy[1].item())
            x2 = int(xyxy[2].item())
            y2 = int(xyxy[3].item())

            # clamp to image bounds
            x1 = max(0, min(x1, w - 1))
            x2 = max(0, min(x2, w - 1))
            y1 = max(0, min(y1, h - 1))
            y2 = max(0, min(y2, h - 1))

            if x2 <= x1 or y2 <= y1:
                continue

            boxes.append((cls, x1, y1, x2, y2, score))

        return boxes
