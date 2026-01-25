import cv2
import numpy as np
import onnxruntime as ort


class SeverityEstimator:
    def __init__(self, model_path):
        self.session = ort.InferenceSession(
            model_path,
            providers=["CPUExecutionProvider"],
        )
        self.input_name = self.session.get_inputs()[0].name

    def preprocess(self, leaf):
        # Resize and normalize to [0,1]; channels-first as most PyTorch exports expect
        leaf = cv2.resize(leaf, (224, 224))
        leaf = leaf.astype(np.float32) / 255.0
        leaf = np.transpose(leaf, (2, 0, 1))  # HWC -> CHW
        return leaf[np.newaxis, :]

    def estimate(self, leaf):
        """Estimate infected area percentage for a cropped leaf image.

        Handles common ONNX segmentation output shapes, including
        [N, 1, H, W] and [N, 2, H, W] (background/foreground).
        """

        inp = self.preprocess(leaf)
        output = self.session.run(None, {self.input_name: inp})[0]

        output = np.asarray(output)

        # Typical cases:
        # - Binary mask:  [N, 1, H, W]
        # - Two-channel:  [N, 2, H, W] (bg, fg)
        # - Direct mask:  [N, H, W]
        if output.ndim == 4:
            # [N, C, H, W]
            n, c, h, w = output.shape
            if c == 1:
                logits = output[0, 0]
            else:
                # assume channel 1 is "infected" / foreground
                logits = output[0, 1]
        elif output.ndim == 3:
            # [N, H, W]
            logits = output[0]
        else:
            # Fallback: squeeze to 2D mask
            logits = output.squeeze()

        # If model outputs probabilities in [0,1], this is a prob mask;
        # if logits, 0 is the usual decision boundary.
        # Start with 0.5 threshold; can be tuned.
        mask = logits > 0.5

        infected_pixels = int(np.count_nonzero(mask))
        total_pixels = int(mask.size)
        if total_pixels == 0:
            return 0.0

        percent = (infected_pixels / total_pixels) * 100.0
        return float(percent)
