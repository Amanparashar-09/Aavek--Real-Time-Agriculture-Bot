import cv2
import time


class Camera:
    def __init__(
        self,
        device_id=0,
        width=640,
        height=480,
        warmup_frames=5
    ):
        """
        device_id: usually 0 for USB webcam
        width, height: capture resolution
        warmup_frames: discard initial frames (important)
        """
        self.cap = cv2.VideoCapture(device_id)

        if not self.cap.isOpened():
            raise RuntimeError("❌ Webcam not detected")

        # Set resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)

        # Warm up camera (VERY IMPORTANT)
        for _ in range(warmup_frames):
            self.cap.read()
            time.sleep(0.05)

        print("✅ Camera initialized")

    def capture(self):
        """
        Capture a SINGLE image (snapshot)
        """
        ret, frame = self.cap.read()
        if not ret:
            raise RuntimeError("❌ Failed to capture image from webcam")
        return frame

    def release(self):
        """
        Release camera safely
        """
        if self.cap is not None:
            self.cap.release()
            print("📷 Camera released")
