import { initializeBrowser } from './src/browser';
import { getTargetPage } from './src/page';
import { startCommandServer } from './src/server';

(async () => {
  const mode = process.argv[2] || 'mobile'; // Default to mobile
  const url = process.argv[3];

  try {
    const browserInstance = await initializeBrowser(mode);
    const pageForTracing = await getTargetPage(browserInstance, url);
    startCommandServer(browserInstance, pageForTracing, mode);
  } catch (err: any) {
    console.error('Error:', err.message);
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
