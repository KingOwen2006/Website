// A single accelerometer can estimate the opening only while the other half stays flat.
export function makeFoldTiltControl(onAngle: (angle: number | undefined) => void) {
  const control = document.createElement("button");
  const status = document.createElement("p");
  control.type = "button";
  control.textContent = "Test live tilt";
  status.textContent = "Open the phone flat on a table to calibrate.";
  let enabled = false;
  let generation = 0;
  let flatSign = 0;
  let filteredAngle: number | undefined;
  let sampleTime = 0;
  let watchdog = 0;

  function stop(message = "Open the phone flat on a table to calibrate.") {
    generation++;
    enabled = false;
    flatSign = 0;
    filteredAngle = undefined;
    clearTimeout(watchdog);
    window.removeEventListener("devicemotion", sample);
    onAngle(undefined);
    control.textContent = "Test live tilt";
    status.textContent = message;
  }

  function sample(event: DeviceMotionEvent) {
    const gravity = event.accelerationIncludingGravity;
    if (!gravity || gravity.x == null || gravity.y == null || gravity.z == null) return;
    const { x, y, z } = gravity;
    const length = Math.hypot(x, y, z);
    // Ignore large linear accelerations while the device is being picked up.
    if (!Number.isFinite(length) || length < 7.5 || length > 12) return;
    clearTimeout(watchdog);
    watchdog = window.setTimeout(() => stop("Motion readings stopped. You can retry with the phone flat."), 4000);
    if (!flatSign) {
      if (Math.abs(z / length) < .985) {
        status.textContent = "Lay both halves flat, inner screen facing up.";
        return;
      }
      flatSign = Math.sign(z);
    }
    const degrees = Math.acos(Math.max(-1, Math.min(1, flatSign * z / length))) * 180 / Math.PI;
    const angle = degrees < 3 ? 180 : 180 - degrees;
    const now = performance.now();
    const weight = 1 - Math.exp(-(now - sampleTime) / 55);
    filteredAngle = filteredAngle === undefined ? angle : filteredAngle + weight * (angle - filteredAngle);
    sampleTime = now;
    const rounded = Math.round(filteredAngle);
    onAngle(rounded);
    const message = `Estimated opening ${rounded}°. Lift one half slowly. If the number stays still, try the other half.`;
    if (status.textContent !== message) status.textContent = message;
  }

  control.addEventListener("click", async () => {
    if (enabled) { stop(); return; }
    const sensor = window.DeviceMotionEvent as (typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<string>;
    }) | undefined;
    if (!sensor) { stop("Motion readings are unavailable in this browser."); return; }
    enabled = true;
    const attempt = ++generation;
    control.textContent = "Stop live tilt";
    try {
      const permission = await sensor.requestPermission?.();
      if (attempt !== generation) return;
      if (permission && permission !== "granted") { stop("Motion access was declined."); return; }
      status.textContent = "Waiting for motion readings. Keep both halves flat.";
      window.addEventListener("devicemotion", sample, { passive: true });
      watchdog = window.setTimeout(() => stop("No motion readings received. Check the browser’s motion sensor permission."), 4000);
    } catch {
      if (attempt === generation) stop("This browser could not start its motion sensor.");
    }
  });
  return { control, status, stop };
}
