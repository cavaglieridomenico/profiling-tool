import { execSync } from 'child_process';
import { getAdbPath } from '../src/browser';

export function emergencyRestore() {
  const adb = getAdbPath();
  console.log('🚨 STARTING EMERGENCY RESTORE PROCEDURE 🚨');

  try {
    // 1. Force Kill ADB Server (Desktop side)
    console.log('[1/4] Killing ADB Server...');
    try {
      execSync(`${adb} kill-server`);
    } catch (e) {
      /* Ignore if already dead */
    }

    // 2. Restart ADB Server
    console.log('[2/4] Restarting ADB Server...');
    execSync(`${adb} start-server`);

    // 3. Check Device Connectivity
    console.log('[3/4] Waiting for device...');
    const devices = execSync(`${adb} devices`).toString();
    if (!devices.includes('\tdevice')) {
      throw new Error(
        '❌ No device found! Please Unplug/Replug USB cable manually.'
      );
    }

    // 4. Reset Port Forwarding (Crucial for Puppeteer/DevTools)
    console.log('[4/4] Resetting Port Forwarding...');
    execSync(`${adb} forward --remove-all`);
    execSync(`${adb} forward tcp:9222 localabstract:chrome_devtools_remote`);

    console.log('✅ RESTORE COMPLETE. You can now restart your test.');
  } catch (error: any) {
    console.error(`💥 RESTORE FAILED: ${error.message}`);
  }
}

// Allow running directly: npx ts-node src/restore.ts
if (require.main === module) {
  emergencyRestore();
}
