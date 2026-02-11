import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { Page, HTTPRequest, Protocol } from 'puppeteer';
import { ServerResponse } from 'http';
import { getAdbPath } from './browser';
import { urls } from './urls';

const env = process.env.PUPPETEER_ENV;
const envPath = env
  ? path.resolve(process.cwd(), `.env.${env}`)
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

// State to track active overrides
let activeOverrides: Record<string, string> = {};
let isInterceptionEnabled = false;

export function getNextTraceNumber(
  name: string,
  dir: string,
  ext: string
): number {
  let i = 1;
  while (fs.existsSync(path.join(dir, `${name}-${i}.${ext}`))) {
    i++;
  }
  return i;
}

/**
 * Resolves a URL from the predefined list of aliases or returns the original string.
 * @param urlOrAlias The URL or alias to resolve.
 * @returns The resolved URL string.
 */
export function resolveUrl(urlOrAlias: string): string {
  const resolved = urls[urlOrAlias] || urlOrAlias;

  // 1. Return as-is if a protocol is already explicitly defined
  if (
    resolved.startsWith('http://') ||
    resolved.startsWith('https://') ||
    resolved.startsWith('about:') ||
    resolved.startsWith('file://') ||
    resolved.startsWith('data:')
  ) {
    return resolved;
  }

  // 2. Default to http:// for local testing environments
  if (
    resolved.startsWith('localhost') ||
    resolved.startsWith('127.0.0.1') ||
    resolved.match(/^192\.168\./) ||
    resolved.match(/^10\./)
  ) {
    return `http://${resolved}`;
  }

  // 3. Otherwise, safely default to https:// for production/staging domains
  return `https://${resolved}`;
}

export function handleTap(
  res: ServerResponse,
  x: number,
  y: number,
  message: string
): void {
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

export async function handleNavigation(
  page: Page,
  url: string,
  res: ServerResponse
): Promise<void> {
  try {
    const { PUPPETEER_USERNAME, PUPPETEER_PASSWORD } = process.env;
    const resolvedUrl = resolveUrl(url);

    if (PUPPETEER_USERNAME && PUPPETEER_PASSWORD) {
      await page.authenticate({
        username: PUPPETEER_USERNAME,
        password: PUPPETEER_PASSWORD,
      });
      console.log(
        'Using authentication credentials from environment variables.'
      );
    }

    await page.goto(resolvedUrl);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Navigated to ${resolvedUrl}.\n`);
    console.log(`Navigated to ${resolvedUrl}.`);
  } catch (err: any) {
    console.error(`Navigation Error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Navigation failed: ${err.message}\n`);
  }
}

export async function handleCleanState(
  page: Page,
  res: ServerResponse,
  mode: string,
  targetUrl: string | null
): Promise<void> {
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

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Target URL is required for clean state.\n');
    return;
  }

  try {
    const resolvedUrl = resolveUrl(targetUrl);
    const browser = page.browser();
    let pages = await browser.pages();
    let targetPage = page;

    // Robustness: Check if the passed 'page' is actually still valid/attached
    // If 'page' is not in the current list of pages, it's likely detached/zombie.
    if (!pages.includes(page)) {
      console.warn(
        'Warning: Current page reference is stale or detached. Switching to first available page.'
      );
      if (pages.length > 0) {
        targetPage = pages[0];
      } else {
        targetPage = await browser.newPage();
        pages = await browser.pages(); // refresh list
      }
    }

    console.log('Starting Mobile Device Clean State...');

    // 1. Connect to CDP for Low-Level Control
    const client = await targetPage.target().createCDPSession();

    // 2. Targeted Storage Wipe
    const origin = new URL(resolvedUrl).origin;
    await client.send('Storage.clearDataForOrigin', {
      origin: origin,
      storageTypes: 'all',
    });
    console.log(`- Storage cleared for origin: ${origin}`);

    // 3. Environment Hygiene: Close background tabs & Disable Cache
    let closedCount = 0;
    for (const p of pages) {
      if (p !== targetPage) {
        try {
          await p.close();
          closedCount++;
        } catch (e) {
          console.warn('Failed to close a background tab:', e);
        }
      }
    }
    if (closedCount > 0)
      console.log(`- Closed ${closedCount} background tabs.`);

    await client.send('Network.setCacheDisabled', {
      cacheDisabled: true,
    } as Protocol.Network.SetCacheDisabledRequest);
    console.log('- Network Cache disabled.');

    // 4. Active View Reset: Navigate to about:blank
    await targetPage.goto('about:blank');
    console.log('- Navigated to about:blank.');

    // 5. Memory Sanitization: "Collect garbage"
    await client.send('HeapProfiler.collectGarbage');
    console.log('- Garbage Collection forced (Heap cleared).');

    // 6. Detach CDP Session
    await client.detach();
    console.log('- CDP Session detached.');

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(
      `Mobile Clean State complete for ${origin}: Storage wiped, Cache disabled, bg tabs closed, GC executed.\n`
    );
    console.log('Mobile Clean State complete.');
  } catch (err: any) {
    console.error(`Clean State Error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Clean State failed: ${err.message}\n`);
  }
}

export async function handleConfigOverrides(
  page: Page,
  targetUrl: string | null,
  localFilePath: string | null,
  res: ServerResponse
): Promise<void> {
  if (!page) return;

  try {
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
  } catch (err: any) {
    console.error(`Config Overrides Error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Config Overrides failed: ${err.message}\n`);
  }
}

// Helper to standardize HTTP responses
export function sendResponse(
  res: ServerResponse,
  statusCode: number,
  message: string
): void {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  res.end(message + '\n');
  if (statusCode < 400) {
    console.log(message);
  } else {
    console.error(message);
  }
}
