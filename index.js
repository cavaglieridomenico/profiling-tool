const { initializeBrowser } = require('./src/browser');
const { getTargetPage } = require('./src/page');
const { startCommandServer } = require('./src/server');

(async () => {
  const mode = process.argv[2] || 'mobile'; // Default to mobile
  const url = process.argv[3];

  try {
    const browserInstance = await initializeBrowser(mode);
    const pageForTracing = await getTargetPage(browserInstance, url);
    startCommandServer(pageForTracing);
  } catch (err) {
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
