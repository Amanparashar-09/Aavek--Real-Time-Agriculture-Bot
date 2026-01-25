import RPi.GPIO as GPIO
import time

PIN = 21

print(f"initialize GPIO {PIN}")
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN, GPIO.OUT)

try:
    print("Relay On (3sec)")
    GPIO.output(PIN, GPIO.HIGH)
    time.sleep(3)

    print("relay off")
    GPIO.output(PIN, GPIO.LOW)
    time.sleep(2)

finally:
     GPIO.cleanup()
     print("GPIO cleaned up")
