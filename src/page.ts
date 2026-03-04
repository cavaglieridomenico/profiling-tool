import { Browser, Page } from 'puppeteer';
import { logger } from './utils';

export async function getTargetPage(
  browserInstance: Browser,
  url: string
): Promise<Page> {
  let pageForTracing: Page;
  const pages = await browserInstance.pages();
  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      logger.error(
        'Invalid URL. Please provide a full URL starting with http:// or https://'
      );
      process.exit(1);
    }
    logger.info(`Navigating to ${url}...`);
    pageForTracing = await browserInstance.newPage();
    await pageForTracing.setCacheEnabled(false);
    await pageForTracing.goto(url);
    logger.success('Navigation complete.');
  } else if (pages.length > 0) {
    pageForTracing = pages[0];
    await pageForTracing.setCacheEnabled(false);
    logger.info(
      `Using first open page for tracing: ${await pageForTracing.url()}`
    );
  } else {
    logger.info('No open pages. A new page will be created for tracing.');
    pageForTracing = await browserInstance.newPage();
    await pageForTracing.setCacheEnabled(false);
  }
  return pageForTracing;
}
