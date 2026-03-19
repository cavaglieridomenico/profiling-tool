import { initializeBrowser, standardConnection } from '../src/browser';
import { getTargetPage } from '../src/page';
import { logger, getErrorMessage } from '../src/utils';
import { AnalyzerEngine } from '../src/analyzer/engine';
import { CoreWebVitalsAudit } from '../src/analyzer/audits/vitals';
import { NetworkWaterfallAudit } from '../src/analyzer/audits/network';
import { LighthouseAudit } from '../src/analyzer/audits/lighthouse';
import { ImageOptimizationAudit } from '../src/analyzer/audits/images';
import { reportToConsole } from '../src/analyzer/reporters/console';
import { reportToFile, reportToTxt } from '../src/analyzer/reporters/file';

async function main() {
  const args = process.argv.slice(2);
  const url = args[0] || 'https://www.google.com';
  const mode = args[1] || 'desktop';

  logger.info(`Starting Analyzer in ${mode} mode for URL: ${url}`);

  try {
    if (mode === 'mobile') {
      standardConnection();
    }

    const browser = await initializeBrowser(mode);
    const page = await getTargetPage(browser, url);

    logger.success(`Analyzer connected to ${await page.url()}`);

    const engine = new AnalyzerEngine(browser, page);

    // Register audits
    engine
      .addAudit(new CoreWebVitalsAudit())
      .addAudit(new NetworkWaterfallAudit())
      .addAudit(new ImageOptimizationAudit())
      .addAudit(new LighthouseAudit());

    const results = await engine.runAll(mode);

    reportToConsole(results, mode);
    reportToFile(results, url, mode);
    reportToTxt(results, url, mode);

    await browser.close();
    logger.success('Analyzer finished.');
  } catch (error) {
    logger.error(`Analyzer failed: ${getErrorMessage(error)}`);
    process.exit(1);
  }
}

main();
