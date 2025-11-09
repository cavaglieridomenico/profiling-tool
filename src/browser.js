const puppeteer = require('puppeteer');
const http = require('http');

// Helper function to get the WebSocket endpoint for mobile
function getMobileWebSocketEndpoint() {
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
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => {
        reject(
          new Error(
            `Cannot connect to the device. Please check if the device is connected and the port forwarding is configured correctly. Details: ${err.message}`
          )
        );
      });
  });
}

async function initializeBrowser(mode) {
  let browserInstance;
  if (mode === 'mobile') {
    console.log('Connecting to mobile device...');
    const browserWSEndpoint = await getMobileWebSocketEndpoint();
    console.log('WebSocket endpoint:', browserWSEndpoint);

    browserInstance = await puppeteer.connect({
      browserWSEndpoint,
      defaultViewport: null,
    });
    console.log('Connected to mobile browser!');
  } else if (mode === 'desktop') {
    console.log('Launching desktop Chrome...');
    browserInstance = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--start-maximized', '--use-fake-ui-for-media-stream'],
      defaultViewport: null, // Ensure desktop rendering
    });
    console.log('Desktop Chrome launched!');
  } else {
    console.error('Invalid mode specified. Use "mobile" or "desktop".');
    process.exit(1);
  }
  return browserInstance;
}

module.exports = { initializeBrowser };
