import { Page, Browser } from 'puppeteer';
import { IAudit, AuditResult } from '../engine';

export class CoreWebVitalsAudit implements IAudit {
  name = 'Core Web Vitals';

  async run(page: Page, browser: Browser, mode: string): Promise<AuditResult> {
    const vitals = (await page.evaluate(async () => {
      return new Promise((resolve) => {
        const results: any = {
          LCP: 0,
          CLS: 0,
          FID: 0,
          INP: 0,
          FCP: 0,
          TTFB: 0
        };

        // Get TTFB from PerformanceTiming
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          results.TTFB = navigation.responseStart - navigation.startTime;
        }

        // FCP
        const fcpEntries = performance.getEntriesByName('first-contentful-paint');
        if (fcpEntries.length > 0) {
          results.FCP = fcpEntries[0].startTime;
        } else {
          new PerformanceObserver((entryList) => {
            const entry = entryList.getEntries().find((e) => e.name === 'first-contentful-paint');
            if (entry) results.FCP = entry.startTime;
          }).observe({ type: 'paint', buffered: true });
        }

        // LCP
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          results.LCP = lcpEntries[lcpEntries.length - 1].startTime;
        } else {
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            results.LCP = lastEntry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }

        // CLS
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              results.CLS += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        // FID
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            results.FID = entry.duration;
          }
        }).observe({ type: 'first-input', buffered: true });

        // Wait a bit to collect metrics
        setTimeout(() => {
          resolve(results);
        }, 2000);
      });
    })) as any;

    const observations: string[] = [];
    if (vitals.LCP > 2500)
      observations.push(`LCP is slow: ${vitals.LCP.toFixed(2)}ms`);
    if (vitals.CLS > 0.1)
      observations.push(`CLS is high: ${vitals.CLS.toFixed(4)}`);
    if (vitals.FID > 100)
      observations.push(`FID is slow: ${vitals.FID.toFixed(2)}ms`);

    return {
      name: this.name,
      passed: observations.length === 0,
      data: vitals,
      observations
    };
  }
}
