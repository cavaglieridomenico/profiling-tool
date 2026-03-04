import { runCleanDevice, getErrorMessage, logger } from '../src/utils';

const urlArg = process.argv.find(
  (arg) =>
    !arg.startsWith('-') &&
    !arg.includes('ts-node') &&
    !arg.endsWith('clean.ts')
);
const preserveCookies = process.argv.includes('--preserve-cookies');

if (!urlArg) {
  logger.error('Please provide a URL or a URL alias as an argument.');
  logger.error('Usage: ts-node bin/clean.ts <url> [--preserve-cookies]');
  process.exit(1);
}

logger.info(
  `🧹 Cleaning device state for ${urlArg}${
    preserveCookies ? ' (PRESERVING COOKIES)' : ''
  }...`
);

runCleanDevice(urlArg, 'mobile', preserveCookies)
  .then((data) => {
    logger.success(data);
  })
  .catch((err: unknown) => {
    logger.error(`Error cleaning state: ${getErrorMessage(err)}`);
    process.exit(1);
  });
