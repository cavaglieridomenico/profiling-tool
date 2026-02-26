import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { TRACES_OUTPUT_DIR } from './config/constants';

class DevtoolsTraceManager {
  traceFileName: string;

  constructor() {
    this.traceFileName = '';
  }

  async startTrace(page: Page, name: string | null): Promise<string> {
    if (!page) throw new Error('No page available for tracing.');

    if (!fs.existsSync(TRACES_OUTPUT_DIR)) {
      fs.mkdirSync(TRACES_OUTPUT_DIR, { recursive: true });
    }

    const baseName = name || `trace-${Date.now()}`;
    const ext = '.json';

    // Always start at -1
    let counter = 1;
    let finalFileName = `${baseName}-${counter}${ext}`;
    let tracePath = path.join(TRACES_OUTPUT_DIR, finalFileName);

    // Collision Detection: Increment to -2, -3 if the file exists
    while (fs.existsSync(tracePath)) {
      counter++;
      finalFileName = `${baseName}-${counter}${ext}`;
      tracePath = path.join(TRACES_OUTPUT_DIR, finalFileName);
    }

    this.traceFileName = finalFileName;

    await page.tracing.start({
      path: tracePath,
      screenshots: true,
    });

    return tracePath;
  }

  async stopTrace(page: Page): Promise<string> {
    if (!page) throw new Error('No page available for tracing.');

    await page.tracing.stop();
    return path.join(TRACES_OUTPUT_DIR, this.traceFileName);
  }
}

export default new DevtoolsTraceManager();
