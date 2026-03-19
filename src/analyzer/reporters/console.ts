import { AuditResult } from '../engine';
import { getTimestampCET } from '../../utils';

export function formatReport(results: AuditResult[], mode: string): string {
  let report = '\n--- 📊 ANALYSIS REPORT SUMMARY ---\n';
  report += `📅 Timestamp: ${getTimestampCET()}\n`;
  report += `🖥️  Mode: ${mode.toUpperCase()}\n`;

  results.forEach((res) => {
    const status = res.passed ? '✅' : '❌';
    report += `\n${status} [${res.name.toUpperCase()}]\n`;

    // Key Performance Indicators (KPIs)
    if (res.data) {
      if (res.name === 'Core Web Vitals') {
        const { LCP, CLS, FID, FCP, TTFB } = res.data;
        report += `   ⏱️  Metrics:\n`;
        report += `      LCP: ${LCP.toFixed(2)}ms\n`;
        report += `      CLS: ${CLS.toFixed(4)}\n`;
        report += `      FID: ${FID.toFixed(2)}ms\n`;
        report += `      FCP: ${FCP.toFixed(2)}ms\n`;
        report += `      TTFB: ${TTFB.toFixed(2)}ms\n`;
      }
      if (res.name === 'Network Waterfall') {
        report += `   🌐 Network:\n`;
        report += `      Total Resources: ${res.data.totalResources}\n`;
        if (res.data.largestResources?.length > 0) {
          report += `      Top 3 Largest:\n`;
          res.data.largestResources.slice(0, 3).forEach((r: any) => {
            report += `        - ${(r.transferSize / 1024).toFixed(1)} KB | ${r.name.split('/').pop()}\n`;
          });
        }
      }
      if (res.name === 'Image Optimization') {
        report += `   🖼️  Images:\n`;
        report += `      Total Found: ${res.data.totalImages}\n`;
        report += `      Issues: ${res.data.unoptimized.length}\n`;
      }
      if (res.name === 'Lighthouse Audit' && res.data) {
        report += `   🕯️  Scores:\n`;
        report += `      Performance: ${res.data.performance.toFixed(0)}\n`;
        report += `      Accessibility: ${res.data.accessibility.toFixed(0)}\n`;
        report += `      Best Practices: ${res.data.bestPractices.toFixed(0)}\n`;
        report += `      SEO: ${res.data.seo.toFixed(0)}\n`;
        report += `      Config: ${res.data.config}\n`;
      }
    }

    // Observations / Warnings
    if (res.observations.length > 0) {
      report += `   🔎 Observations:\n`;
      res.observations.forEach((obs: string) => (report += `      - ${obs}\n`));
    } else {
      report += '   🔎 No issues detected.\n';
    }
  });

  report += '\n----------------------------------\n';
  return report;
}

export function reportToConsole(results: AuditResult[], mode: string) {
  console.log(formatReport(results, mode));
}
