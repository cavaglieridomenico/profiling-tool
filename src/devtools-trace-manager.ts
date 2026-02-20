import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';
import { getNextTraceNumber } from './utils';
import { TRACES_OUTPUT_DIR } from './config/constants';

class DevtoolsTraceManager {
  traceCounter: number;
  traceName: string;

  constructor() {
    this.traceCounter = 0;
    this.traceName = '';
  }

  async startTrace(page: Page, name: string | null): Promise<string> {
    if (!page) {
      throw new Error('No page available for tracing.');
    }
    this.traceName = name || 'trace';

    // Ensure output directory exists before we start
    if (!fs.existsSync(TRACES_OUTPUT_DIR)) {
      fs.mkdirSync(TRACES_OUTPUT_DIR, { recursive: true });
    }

    this.traceCounter = getNextTraceNumber(
      this.traceName,
      TRACES_OUTPUT_DIR,
      'json'
    );
    const tracePath = path.join(
      TRACES_OUTPUT_DIR,
      `${this.traceName}-${this.traceCounter}.json`
    );

    await page.tracing.start({
      path: tracePath,
      screenshots: true,
    });

    return tracePath;
  }

  async stopTrace(page: Page): Promise<string> {
    if (!page) {
      throw new Error(
        'No page available for tracing (was tracing ever started?).'
      );
    }
    await page.tracing.stop();
    return path.join(
      TRACES_OUTPUT_DIR,
      `${this.traceName}-${this.traceCounter}.json`
    );
  }
}

export default new DevtoolsTraceManager();
