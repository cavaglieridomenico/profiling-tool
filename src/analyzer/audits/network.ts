import { Page, Browser } from 'puppeteer';
import { IAudit, AuditResult } from '../engine';

export class NetworkWaterfallAudit implements IAudit {
  name = 'Network Waterfall';

  async run(page: Page, browser: Browser, mode: string): Promise<AuditResult> {
    const resources: any[] = [];

    // Attach listeners
    page.on('response', (response) => {
      const request = response.request();
      resources.push({
        url: request.url(),
        resourceType: request.resourceType(),
        method: request.method(),
        status: response.status(),
        size: response.headers()['content-length']
          ? parseInt(response.headers()['content-length'])
          : 0,
        timing: response.timing()
      });
    });

    // We assume the page is already navigated, so we might have missed some.
    // However, the analyzer engine can be adjusted to start listening BEFORE navigation.
    // For now, let's just use what's available in the browser's performance buffer.

    const performanceResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry: any) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        duration: entry.duration,
        transferSize: entry.transferSize,
        decodedBodySize: entry.decodedBodySize,
        nextHopProtocol: entry.nextHopProtocol
      }));
    });

    const largestResources = performanceResources
      .sort((a: any, b: any) => b.transferSize - a.transferSize)
      .slice(0, 5);

    const observations: string[] = [];
    largestResources.forEach((res: any) => {
      if (res.transferSize > 500000) {
        // > 500KB
        observations.push(
          `Large resource found: ${res.name.split('/').pop()} (${(res.transferSize / 1024).toFixed(2)} KB)`
        );
      }
    });

    return {
      name: this.name,
      passed: observations.length === 0,
      data: {
        totalResources: performanceResources.length,
        largestResources
      },
      observations
    };
  }
}
