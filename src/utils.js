const path = require('path');
const env = process.env.PUPPETEER_ENV;
const envPath = env
  ? path.resolve(process.cwd(), `.env.${env}`)
  : path.resolve(process.cwd(), '.env');

require('dotenv').config({ path: envPath });

const { exec } = require('child_process');
const { getAdbPath } = require('./browser');

function handleTap(res, x, y, message) {
  const adbPath = getAdbPath();
  exec(`${adbPath} shell input tap ${x} ${y}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Failed to execute tap command: ${error.message}\n`);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${message}\n`);
    console.log(message);
  });
}

async function handleNavigation(page, url, res) {
  const { PUPPETEER_USERNAME, PUPPETEER_PASSWORD } = process.env;

  if (PUPPETEER_USERNAME && PUPPETEER_PASSWORD) {
    await page.authenticate({
      username: PUPPETEER_USERNAME,
      password: PUPPETEER_PASSWORD,
    });
    console.log('Using authentication credentials from environment variables.');
  }

  await page.goto(url);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Navigated to ${url}.\n`);
  console.log(`Navigated to ${url}.`);
}

async function handleCleanState(page, res, mode) {
  if (mode !== 'mobile') {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('This command is only available for mobile mode.\n');
    return;
  }

  if (!page) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('No page available to clean.\n');
    return;
  }

  try {
    await page.goto('about:blank');
    console.log('Navigated to about:blank.');
    
    console.log('Starting Mobile Device Clean State...');

    // 1. Tab Hygiene: Close background tabs to isolate CPU/Memory
    // We iterate through all open pages and close anything that isn't the current one.
    const browser = page.browser();
    const pages = await browser.pages();
    let closedCount = 0;

    for (const p of pages) {
      if (p !== page) {
        await p.close();
        closedCount++;
      }
    }
    if (closedCount > 0)
      console.log(`- Closed ${closedCount} background tabs.`);

    // 2. Connect to CDP for Low-Level Control
    const client = await page.target().createCDPSession();

    // 3. Network Enforcement: "Disable cache" (Matches DevTools checkbox)
    // This affects this session only. It does not delete your history.
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    console.log('- Network Cache disabled.');

    // 4. Memory Sanitization: "Collect garbage" (Matches Trash Icon)
    // This forces the V8 engine to release memory immediately.
    await client.send('HeapProfiler.collectGarbage');
    console.log('- Garbage Collection forced (Heap cleared).');

    // NOTE: We intentionally skip Storage/Cookie clearing to keep you logged in.

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(
      `Mobile Clean State complete: GC executed, Cache disabled, ${closedCount} bg tabs closed.\n`
    );
    console.log('Mobile Clean State complete.');
  } catch (err) {
    console.error(`Clean State Error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Clean State failed: ${err.message}\n`);
  }
}

module.exports = { handleTap, handleNavigation, handleCleanState };
