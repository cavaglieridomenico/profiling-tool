import { exec } from 'child_process';
import { getAdbPath } from './browser';

// Samsung devices usually map the main SoC temp to zone 0 or 1.
// We divide by 1000 because raw value is in millidegrees (e.g., 42000 = 42°C).
const THERMAL_ZONE_CMD = 'cat /sys/class/thermal/thermal_zone0/temp';

// Threshold: 40°C is a safe starting point.
// Above 42-45°C, most phones start mild throttling.
const MAX_START_TEMP = 40;

function getDeviceTemperature(): Promise<number> {
  const adbPath = getAdbPath();
  return new Promise((resolve, reject) => {
    exec(`${adbPath} shell ${THERMAL_ZONE_CMD}`, (error, stdout) => {
      if (error) {
        console.warn('[Thermal] Could not read temp, assuming safe.');
        return resolve(0);
      }
      const raw = parseInt(stdout.trim(), 10);
      // Handle potential bad data or different units
      const temp = isNaN(raw) ? 0 : raw > 1000 ? raw / 1000 : raw;
      resolve(temp);
    });
  });
}

export async function ensureDeviceIsCool(): Promise<void> {
  let temp = await getDeviceTemperature();

  if (temp === 0) return; // Sensor read failed, proceed blindly

  if (temp < MAX_START_TEMP) {
    console.log(
      `[Thermal] Device is cool (${temp.toFixed(1)}°C). Starting test.`
    );
    return;
  }

  console.log(
    `[Thermal] ⚠️ Device is HOT (${temp.toFixed(1)}°C). Cooling down...`
  );

  // Wait loop
  while (temp >= MAX_START_TEMP) {
    process.stdout.write('.'); // Progress indicator
    await new Promise((r) => setTimeout(r, 5000)); // Wait 5s
    temp = await getDeviceTemperature();
  }

  console.log(`\n[Thermal] Cooldown complete. Now ${temp.toFixed(1)}°C.`);
}
