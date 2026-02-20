import puppeteer, { Browser } from 'puppeteer';
import http from 'http';
import path from 'path';
import { getErrorMessage } from './utils';

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
                    reject(new Error(`Failed to parse WebSocket info: ${getErrorMessage(e)}`));
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
    console.log(`Connected to mobile browser! version: ${await browserInstance.version()}`);
  } else if (mode === 'desktop') {
    console.log('Launching desktop Chrome...');
    browserInstance = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--start-maximized', '--use-fake-ui-for-media-stream'],
      defaultViewport: null, // Ensure desktop rendering
    });
    console.log(`Desktop Chrome launched! version: ${await browserInstance.version()}`);
  } else {
    console.error('Invalid mode specified. Use "mobile" or "desktop".');
    process.exit(1);
  }
  return browserInstance;
}
