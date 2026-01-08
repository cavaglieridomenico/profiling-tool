import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { Page, HTTPRequest, Protocol } from 'puppeteer';
import { ServerResponse } from 'http';
import { getAdbPath } from './browser';

const env = process.env.PUPPETEER_ENV;
const envPath = env
  ? path.resolve(process.cwd(), `.env.${env}`)
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

// State to track active overrides
let activeOverrides: Record<string, string> = {};
let isInterceptionEnabled = false;

export function handleTap(res: ServerResponse, x: number, y: number, message: string): void {
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

export async function handleNavigation(page: Page, url: string, res: ServerResponse): Promise<void> {
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

export async function handleCleanState(page: Page, res: ServerResponse, mode: string): Promise<void> {
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
    await client.send('Network.setCacheDisabled', {
      cacheDisabled: true,
    } as Protocol.Network.SetCacheDisabledRequest);
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
  } catch (err: any) {
    console.error(`Clean State Error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Clean State failed: ${err.message}\n`);
  }
}

export async function handleConfigOverrides(page: Page, targetUrl: string | null, localFilePath: string | null, res: ServerResponse): Promise<void> {
  if (!page) return;

  // If no params provided, disable overrides
  if (!targetUrl || !localFilePath) {
    activeOverrides = {};
    if (isInterceptionEnabled) {
      await page.setRequestInterception(false);
      isInterceptionEnabled = false;
      console.log('Overrides disabled. Request interception turned off.');
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Overrides disabled.\n');
    return;
  }

  // Activate Overrides
  activeOverrides[targetUrl] = localFilePath;
  console.log(`Configuring override: ${targetUrl} -> ${localFilePath}`);

  if (!isInterceptionEnabled) {
    await page.setRequestInterception(true);
    isInterceptionEnabled = true;

    page.on('request', (request: HTTPRequest) => {
      const url = request.url();
      // Check if this URL matches any of our overrides
      // We look for partial matches (contains) or exact matches
      const matchKey = Object.keys(activeOverrides).find((key) =>
        url.includes(key)
      );

      if (matchKey) {
        const filePath = activeOverrides[matchKey];
        const absolutePath = path.resolve(process.cwd(), filePath);

        if (fs.existsSync(absolutePath)) {
          console.log(`[Override] Serving local file for: ${url}`);

          // Determine correct MIME type
          const ext = path.extname(absolutePath).toLowerCase();
          let contentType = 'application/javascript'; // Default
          if (ext === '.wasm') contentType = 'application/wasm';
          if (ext === '.css') contentType = 'text/css';
          if (ext === '.json') contentType = 'application/json';

          // Respond with the local file content
          request.respond({
            status: 200,
            contentType: contentType,
            body: fs.readFileSync(absolutePath),
          });
          return;
        } else {
          console.error(
            `[Override Error] Local file not found: ${absolutePath}`
          );
        }
      }
      // Continue normal network request if no match
      request.continue();
    });
    console.log('Request interception enabled.');
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Override active for ${targetUrl}\n`);
}

// Helper to standardize HTTP responses
export function sendResponse(res: ServerResponse, statusCode: number, message: string): void {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  res.end(message + '\n');
  if (statusCode < 400) {
    console.log(message);
  } else {
    console.error(message);
  }
}
