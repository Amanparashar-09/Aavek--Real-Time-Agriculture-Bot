import time

try:
    import RPi.GPIO as GPIO  # type: ignore
    _HAS_GPIO = True
except Exception:  # ImportError on PC / non-Pi
    GPIO = None  # type: ignore
    _HAS_GPIO = False


class Sprinkler:
    """Sprinkler that works on Raspberry Pi, falls back to mock elsewhere.

    On Raspberry Pi (RPi.GPIO available):
        - controls the given GPIO pin for real spraying.

    On other platforms:
        - logs actions only, so the rest of the pipeline can be tested safely.
    """

    def __init__(self, pin, max_duration, cooldown):
        self.pin = pin
        self.max_duration = max_duration
        self.cooldown = cooldown
        self.last_spray_time = 0

        if _HAS_GPIO:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(pin, GPIO.OUT)
            GPIO.output(pin, GPIO.LOW)
            print(f"[Sprinkler] GPIO {self.pin} initialized (safe OFF)")
        else:
            print(f"[MockSprinkler] initialized on pin {self.pin} (no GPIO)")

    def spray(self, decision):
        # decision is expected to be a dict like {"spray": bool, "amount": float}
        if not decision.get("spray"):
            print("[Sprinkler] spray flag is False - skipping")
            return

        now = time.time()
        if now - self.last_spray_time < self.cooldown:
            print("[Sprinkler] cooldown active - skipping spray")
            return

        duration = min(decision.get("amount", 0), self.max_duration)

        if _HAS_GPIO:
            print(f"[Sprinkler] spraying for {duration} seconds")
            GPIO.output(self.pin, GPIO.LOW)
            time.sleep(duration)
            GPIO.output(self.pin, GPIO.HIGH)
        else:
            print(f"[MockSprinkler] would spray for {duration} seconds (mock)")
            time.sleep(duration)

        self.last_spray_time = time.time()

    def cleanup(self):
        if _HAS_GPIO and GPIO is not None:
            GPIO.output(self.pin, GPIO.HIGH)
            GPIO.cleanup()
            print("[Sprinkler] GPIO cleaned")
        else:
            print("[MockSprinkler] cleanup called (no GPIO actions)")
