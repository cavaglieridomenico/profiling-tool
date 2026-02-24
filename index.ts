import { getTargetPage } from './src/page';
import { startCommandServer } from './src/server';
import { performApplicationSetup } from './src/initialization';
import { getErrorMessage } from './src/utils';

(async () => {
  const mode = process.argv[2] || 'mobile'; // Default to mobile
  const url = process.argv[3];

  try {
    // 1. Unified Setup Flow
    const browserInstance = await performApplicationSetup({
      mode,
      checkUpdates: true,
      checkThermal: true, // Let's enforce thermal check at startup
      skipAdb: false,     // Perform ADB forwarding in index.ts for direct runs
      strictVersionCheck: process.env.STRICT_VERSION_CHECK === 'true',
    });

    // 2. Target Identification
    const pageForTracing = await getTargetPage(browserInstance, url);

    // 3. Command Server Start
    startCommandServer(browserInstance, pageForTracing, mode);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error(`💥 Startup Failed: ${msg}`);
    
    if (mode === 'mobile') {
      console.error('Mobile troubleshooting:');
      console.error('- Ensure device is connected via USB.');
      console.error('- Ensure USB Debugging is enabled.');
      console.error('- Ensure Chrome is open on your device.');
      console.error('- Run `adb devices` to verify the connection.');
    } else if (mode === 'desktop') {
      console.error('Desktop troubleshooting:');
      console.error('- Ensure Chrome is installed and Puppeteer can access it.');
    }
    
    process.exit(1);
  }
})();
