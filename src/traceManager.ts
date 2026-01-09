import fs from 'fs';
import { Page } from 'puppeteer';
import { getNextTraceNumber } from './utils';

class TraceManager {
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
    this.traceCounter = getNextTraceNumber(
      this.traceName,
      process.cwd(),
      'json'
    );
    const tracePath = `${this.traceName}-${this.traceCounter}.json`;

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
    return `${this.traceName}-${this.traceCounter}.json`;
  }
}

export default new TraceManager();
