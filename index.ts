import { initializeBrowser } from './src/browser';
import { getTargetPage } from './src/page';
import { startCommandServer } from './src/server';
import { checkForPuppeteerUpdates } from './src/version-checker';
import { validateEnv, getErrorMessage } from './src/utils';

(async () => {
  const mode = process.argv[2] || 'mobile'; // Default to mobile
  const url = process.argv[3];

  // Async check for updates (don't await to avoid delaying startup)
  checkForPuppeteerUpdates();

  // Validate critical env vars if auth might be used
  try {
    if (process.env.PUPPETEER_USERNAME || process.env.PUPPETEER_PASSWORD) {
      validateEnv(['PUPPETEER_USERNAME', 'PUPPETEER_PASSWORD']);
    }

    const browserInstance = await initializeBrowser(mode);
    const pageForTracing = await getTargetPage(browserInstance, url);
    startCommandServer(browserInstance, pageForTracing, mode);
  } catch (err: unknown) {
    console.error('Error:', getErrorMessage(err));
    if (mode === 'mobile') {
      console.error(
        'Please ensure that the adb forward command was successful and that Chrome is running on your device.'
      );
    } else if (mode === 'desktop') {
      console.error(
        'Please ensure Puppeteer can launch Chrome on your desktop.'
      );
    }
    process.exit(1);
  }
})();
