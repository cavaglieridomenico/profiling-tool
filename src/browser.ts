import puppeteer, { Browser } from 'puppeteer';
import http from 'http';
import path from 'path';
import { execSync } from 'child_process';
import { getErrorMessage } from './utils';

// Configuration
const ADB_PORT = 9222;
const DEVTOOLS_SOCKET = 'localabstract:chrome_devtools_remote';

// Function to determine the path to the adb executable
export const getAdbPath = (): string => {
  // 1. Use ADB_PATH environment variable if available
  if (process.env.ADB_PATH) {
    console.log(`Using adb from ADB_PATH: ${process.env.ADB_PATH}`);
    return process.env.ADB_PATH;
  }
  // 2. Use ANDROID_HOME environment variable if available
  if (process.env.ANDROID_HOME) {
    // Construct path to adb within the Android SDK
    const adbPathResult = path.join(
      process.env.ANDROID_HOME,
      'platform-tools',
      'adb'
    );
    console.log(`Using adb from ANDROID_HOME: ${adbPathResult}`);
    return adbPathResult;
  }
  // 3. Fallback to assuming 'adb' is in the system's PATH
  console.log("Assuming 'adb' is in the system's PATH.");
  return 'adb';
};

/**
 * Standardizes the ADB connection by setting up port forwarding.
 */
export function standardConnection() {
  const adbPath = getAdbPath();
  console.log('🔌 STARTING STANDARD ADB CONNECTION...');

  try {
    // STEP 1: Check ADB Availability and Device Status
    console.log('[1/3] Checking connected devices...');
    const devicesOutput = execSync(`${adbPath} devices`).toString().trim();

    // Check if the output contains a device state (ignoring the header)
    const deviceLines = devicesOutput
      .split('\n')
      .slice(1)
      .filter((line) => line.trim() !== '');

    if (deviceLines.length === 0) {
      throw new Error(
        '❌ No Android device found. Please connect via USB and enable USB Debugging.'
      );
    }

    if (deviceLines.some((line) => line.includes('unauthorized'))) {
      throw new Error(
        '❌ Device found but UNAUTHORIZED. Check the phone screen to allow debugging.'
      );
    }

    if (deviceLines.some((line) => line.includes('offline'))) {
      throw new Error(
        '❌ Device is OFFLINE. Try unplugging and replugging the USB cable.'
      );
    }

    console.log(`✅ Device detected: ${deviceLines[0].split('\t')[0]}`);

    // STEP 2: Clean and Set Port Forwarding
    console.log('[2/3] Configuring Port Forwarding (9222)...');

    // Optional: Remove old rules to prevent conflicts (Clean Slate)
    try {
      execSync(`${adbPath} forward --remove tcp:${ADB_PORT}`);
    } catch (e) {
      // Ignore error if rule didn't exist
    }

    // Set the new rule
    execSync(`${adbPath} forward tcp:${ADB_PORT} ${DEVTOOLS_SOCKET}`);
    console.log(
      `✅ Port forwarded: localhost:${ADB_PORT} -> ${DEVTOOLS_SOCKET}`
    );

    // STEP 3: Verification
    console.log('[3/3] Verifying connection integrity...');
    const forwardList = execSync(`${adbPath} forward --list`).toString();

    if (
      forwardList.includes(`tcp:${ADB_PORT}`) &&
      forwardList.includes(DEVTOOLS_SOCKET)
    ) {
      console.log('\n🚀 CONNECTION SUCCESSFUL! You are ready to profile.');
    } else {
      throw new Error(
        '❌ Verification Failed: The port forwarding rule does not appear in the active list.'
      );
    }
  } catch (error: unknown) {
    console.error('\n💥 CONNECTION FAILED 💥');
    const msg = getErrorMessage(error);
    console.error(`Reason: ${msg}`);

    // If it's a specific ADB execution error, show stderr if available
    if ((error as any).stderr) {
      console.error(`ADB Output: ${(error as any).stderr.toString()}`);
    }

    throw error;
  }
}

// Helper function to get the WebSocket endpoint for mobile
function getMobileWebSocketEndpoint(): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get('http://localhost:9222/json/version', (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const version = JSON.parse(data);
            resolve(version.webSocketDebuggerUrl);
          } catch (e: unknown) {
            reject(
              new Error(`Failed to parse WebSocket info: ${getErrorMessage(e)}`)
            );
          }
        });
      })
      .on('error', (err: unknown) => {
        reject(
          new Error(
            `Cannot connect to the device. Please check if the device is connected and the port forwarding is configured correctly. Details: ${getErrorMessage(err)}`
          )
        );
      });
  });
}

export async function initializeBrowser(mode: string): Promise<Browser> {
  let browserInstance: Browser | undefined;
  if (mode === 'mobile') {
    console.log('Connecting to mobile device...');
    const browserWSEndpoint = await getMobileWebSocketEndpoint();
    console.log('WebSocket endpoint:', browserWSEndpoint);

    browserInstance = await puppeteer.connect({
      browserWSEndpoint,
      defaultViewport: null,
    });
    console.log(
      `Connected to mobile browser! version: ${await browserInstance.version()}`
    );
  } else if (mode === 'desktop') {
    console.log('Launching desktop Chrome...');
    browserInstance = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--start-maximized', '--use-fake-ui-for-media-stream'],
      defaultViewport: null, // Ensure desktop rendering
    });
    console.log(
      `Desktop Chrome launched! version: ${await browserInstance.version()}`
    );
  } else {
    console.error('Invalid mode specified. Use "mobile" or "desktop".');
    process.exit(1);
  }
  return browserInstance;
}
