const fs = require('fs');

class TraceManager {
  constructor() {
    this.traceCounter = 0;
    this.traceName = '';
  }

  // Function to find the next available trace file number
  getNextTraceNumber(name = 'trace') {
    let i = 1;
    while (fs.existsSync(`${name}-${i}.json`)) {
      i++;
    }
    return i;
  }

  async startTrace(page, name) {
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

  async stopTrace(page) {
    if (!page) {
      throw new Error('No page available for tracing (was tracing ever started?).');
    }
    await page.tracing.stop();
    return `${this.traceName}-${this.traceCounter}.json`;
  }
}

module.exports = new TraceManager();
