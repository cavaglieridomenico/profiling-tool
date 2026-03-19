import { Page, Browser } from 'puppeteer';
import { IAudit, AuditResult } from '../engine';

export class ImageOptimizationAudit implements IAudit {
  name = 'Image Optimization';

  async run(page: Page, browser: Browser, mode: string): Promise<AuditResult> {
    const images = (await page.evaluate(() => {
      const imgElements = Array.from(document.querySelectorAll('img'));
      return imgElements.map((img) => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
        alt: img.alt,
        complete: img.complete
      }));
    })) as any[];

    const observations: string[] = [];
    const data = {
      totalImages: images.length,
      unoptimized: [] as any[]
    };

    images.forEach((img) => {
      // Check for oversized images (natural size > 2x display size)
      if (img.width > img.displayWidth * 2 && img.displayWidth > 0) {
        const issue = `Oversized image: ${img.src.split('/').pop()} (Natural: ${img.width}x${img.height}, Display: ${img.displayWidth}x${img.displayHeight})`;
        observations.push(issue);
        data.unoptimized.push({ src: img.src, reason: 'Oversized' });
      }

      // Check for missing alt text
      if (!img.alt || img.alt.trim() === '') {
        observations.push(`Missing alt text: ${img.src.split('/').pop()}`);
        data.unoptimized.push({ src: img.src, reason: 'Missing alt' });
      }
    });

    return {
      name: this.name,
      passed: observations.length === 0,
      data,
      observations
    };
  }
}
