import { runCleanDevice, getErrorMessage, logger } from '../src/utils';

const urlArg = process.argv.find(
  (arg) =>
    !arg.startsWith('-') &&
    !arg.includes('ts-node') &&
    !arg.endsWith('clean.ts')
);
const preserveCookies = process.argv.includes('--preserve-cookies');
const preserveSession = process.argv.includes('--preserve-session');

if (!urlArg) {
  logger.error('Please provide a URL or a URL alias as an argument.');
  logger.error('Usage: ts-node bin/clean.ts <url> [--preserve-cookies] [--preserve-session]');
  process.exit(1);
}

logger.info(
  `🧹 Cleaning device state for ${urlArg}${
    preserveSession
      ? ' (PRESERVING COOKIES AND SESSION)'
      : preserveCookies
        ? ' (PRESERVING COOKIES)'
        : ''
  }...`
);

runCleanDevice(urlArg, 'mobile', preserveCookies, preserveSession)
  .then((data) => {
    logger.success(data);
  })
  .catch((err: unknown) => {
    logger.error(`Error cleaning state: ${getErrorMessage(err)}`);
    process.exit(1);
  });
