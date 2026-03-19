import { Page, Browser } from 'puppeteer';
import { IAudit, AuditResult } from '../engine';
import { logger } from '../../utils';

export class LighthouseAudit implements IAudit {
  name = 'Lighthouse Audit';

  async run(page: Page, browser: Browser, mode: string): Promise<AuditResult> {
    const url = await page.url();
    const observations: string[] = [];

    try {
      const isRealMobile = mode === 'mobile';
      logger.info(
        `Auditing ${url} with Lighthouse (${isRealMobile ? 'Real Mobile Device' : 'Desktop Mode'})...`
      );

      // 1. Get port from wsEndpoint
      const wsUrl = new URL(browser.wsEndpoint());
      const port = parseInt(wsUrl.port);

      // 2. Import lighthouse and configs
      const lighthouse = (await import('lighthouse')).default;
      const { default: desktopConfig } = await import(
        'lighthouse/core/config/desktop-config.js'
      );

      // 3. Configure flags
      // For real devices, we disable internal emulation and use "provided" throttling
      const flags: any = {
        port,
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        logLevel: 'error'
      };

      let config = undefined;

      if (isRealMobile) {
        flags.formFactor = 'mobile';
        flags.screenEmulation = { disabled: true };
        flags.throttlingMethod = 'provided'; // Use the device's actual network/cpu
      } else {
        config = desktopConfig;
      }

      // 4. Run Lighthouse
      const result = await lighthouse(url, flags, config);

      if (!result || !result.lhr) {
        throw new Error('Lighthouse produced no results.');
      }

      const lhr = result.lhr;
      const scores = {
        performance: (lhr.categories.performance?.score ?? 0) * 100,
        accessibility: (lhr.categories.accessibility?.score ?? 0) * 100,
        bestPractices: (lhr.categories['best-practices']?.score ?? 0) * 100,
        seo: (lhr.categories.seo?.score ?? 0) * 100,
        config: isRealMobile ? 'Mobile (Real Device)' : 'Desktop (Emulated)'
      };

      // Generate observations for low scores
      Object.entries(scores).forEach(([cat, score]) => {
        if (typeof score === 'number' && score < 90) {
          observations.push(`${cat.toUpperCase()} score is ${score.toFixed(0)}`);
        }
      });

      return {
        name: this.name,
        passed: observations.length === 0,
        score: scores.performance,
        data: scores,
        observations
      };
    } catch (error: any) {
      return {
        name: this.name,
        passed: false,
        data: null,
        observations: [`Lighthouse failed: ${error.message}`]
      };
    }
  }
}
