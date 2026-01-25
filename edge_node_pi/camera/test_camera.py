from camera import Camera
import cv2

print("initializing camera")
cam = Camera(device_id=0)

print("capture")
frame = cam.capture()

cv2.imshow("camera test", frame)
print("camera working")

cv2.waitKey(0)
cv2.destroyAllWindows()

cam.release()