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

    def _forward_to_logits(self, leaf):
        """Run the ONNX model and return a 2D logits/probability map.

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

        return logits

    def mask_and_percent(self, leaf, threshold=0.5):
        """Return boolean mask and infected area percentage for a leaf.

        If the model outputs probabilities in [0,1], this is a prob mask;
        if logits, 0 is the usual decision boundary. The default threshold
        of 0.5 can be tuned.
        """

        logits = self._forward_to_logits(leaf)
        mask = logits > threshold

        infected_pixels = int(np.count_nonzero(mask))
        total_pixels = int(mask.size)
        if total_pixels == 0:
            return mask, 0.0

        percent = (infected_pixels / total_pixels) * 100.0
        return mask, float(percent)

    def estimate(self, leaf):
        """Estimate infected area percentage for a cropped leaf image."""

        _, percent = self.mask_and_percent(leaf)
        return percent
