import fs from 'fs';
import { Page } from 'puppeteer';

class TraceManager {
  traceCounter: number;
  traceName: string;

  constructor() {
    this.traceCounter = 0;
    this.traceName = '';
  }

  // Function to find the next available trace file number
  getNextTraceNumber(name: string = 'trace'): number {
    let i = 1;
    while (fs.existsSync(`${name}-${i}.json`)) {
      i++;
    }
    return i;
  }

  async startTrace(page: Page, name: string | null): Promise<string> {
    if (!page) {
      throw new Error('No page available for tracing.');
    }
    this.traceName = name || 'trace';
    this.traceCounter = this.getNextTraceNumber(this.traceName);
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
