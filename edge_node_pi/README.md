# Edge Node (Raspberry Pi) – Real‑Time Agriculture Bot

This folder contains the Raspberry Pi edge node that reads a camera stream, detects leaves with YOLO, estimates disease severity, and controls a sprinkler based on the decision logic.

## Architecture (High‑Level)

- **Entry points**
  - `main_camera.py`: live webcam loop (recommended). Shows a window with detections and controls the sprinkler in real time.
  - `main.py`: single image pipeline for testing, using `input_images/test.jpg`.
- **Modules**
  - `camera/Camera`: wraps OpenCV camera capture (device id, resolution).
  - `inference/LeafDetector`: YOLO leaf detection (`models/best.pt` or `models/best.onnx`).
  - `inference/SeverityEstimator`: ONNX model (`models/severity_model.onnx`) to estimate infection percentage for a cropped leaf.
  - `decision/decision_engine.decide`: takes plant‑level infection percentage and returns a high‑level action/decision.
  - `actuator/Sprinkler`: controls a GPIO pin (via `RPi.GPIO`) to trigger the sprinkler with max duration and cooldown safety.
  - `config.yaml`: runtime configuration (camera settings, sprinkler GPIO pin, durations, capture interval, feature toggles).
  - `models/`: model weights (YOLO and severity estimator).
  - `input_images/`: sample or test images for offline runs.

Data flow:

Camera → YOLO `LeafDetector` → `SeverityEstimator` (per leaf) → aggregate plant infection → `decide(...)` → `Sprinkler.spray(...)`.

## Requirements

- Raspberry Pi (or any Linux/Windows machine with a camera; GPIO functions are Pi‑specific).
- Python 3.9+ recommended.
- System packages for OpenCV/NumPy as needed (on Raspberry Pi OS you may need `libatlas-base-dev`, `libjpeg-dev`, etc.).
- Python packages from `requirement.txt`:
  - `opencv-python`, `pyyaml`, `onnxruntime`, `numpy`, `RPi.GPIO`, `ultralytics`.

## Setup

From the repo root:

```bash
cd edge_node_pi

# (Recommended) create and activate a virtualenv
python -m venv venv
# Windows
venv\\Scripts\\activate
# Linux/Raspberry Pi
# source venv/bin/activate

# Install Python dependencies
pip install -r requirement.txt
```

Then configure the node:

1. Edit `config.yaml` to match your hardware:
   - Under `sprinkler`: `gpio_pin`, `max_duration_sec`, `cooldown_sec`, `enabled` (true/false).
   - Under `camera`: `device_id` (usually `0`), optional `width`/`height`.
   - Top‑level: `capture_interval_sec` for how often to run heavy inference.
2. Ensure model files exist in `models/`:
   - `best.pt` (YOLO model)
   - `best.onnx` (optional ONNX variant)
   - `severity_model.onnx` (severity estimator)
3. (Optional) Put a test image at `input_images/test.jpg` if you want to use `main.py`.

## Running

### Live camera mode (recommended)

Runs continuous webcam capture, periodic inference, and sprinkler control. Press `q` in the OpenCV window to stop.

```bash
cd edge_node_pi
python main_camera.py
```

### Single image test mode

Runs the full pipeline on `input_images/test.jpg` once, prints detections, average infection percentage, and decision.

```bash
cd edge_node_pi
python main.py
```

If `sprinkler.enabled` is true in `config.yaml`, both modes will call `Sprinkler.spray(...)` according to the decision; if false, they will only log the decision without triggering GPIO.
