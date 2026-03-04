import { getTargetPage } from './src/page';
import { startCommandServer } from './src/server';
import { performApplicationSetup } from './src/initialization';
import { getErrorMessage, logger } from './src/utils';

(async () => {
  const mode = process.argv[2] || 'mobile'; // Default to mobile
  const url = process.argv[3];

  try {
    // 1. Unified Setup Flow
    const browserInstance = await performApplicationSetup({
      mode,
      checkUpdates: true,
      checkThermal: true, // Let's enforce thermal check at startup
      skipAdb: false, // Perform ADB forwarding in index.ts for direct runs
      strictVersionCheck: process.env.STRICT_VERSION_CHECK === 'true'
    });

    // 2. Target Identification
    const pageForTracing = await getTargetPage(browserInstance, url);

    // 3. Command Server Start
    startCommandServer(browserInstance, pageForTracing, mode);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    logger.error(`💥 Startup Failed: ${msg}`);

    if (mode === 'mobile') {
      logger.error('Mobile troubleshooting:');
      logger.error('- Ensure device is connected via USB.');
      logger.error('- Ensure USB Debugging is enabled.');
      logger.error('- Ensure Chrome is open on your device.');
      logger.error('- Run `adb devices` to verify the connection.');
    } else if (mode === 'desktop') {
      logger.error('Desktop troubleshooting:');
      logger.error('- Ensure Chrome is installed and Puppeteer can access it.');
    }

    process.exit(1);
  }
})();
