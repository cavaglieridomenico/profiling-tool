import { runCleanDevice, getErrorMessage } from '../src/utils';

const urlArg = process.argv.find((arg) => !arg.startsWith('-') && !arg.includes('ts-node') && !arg.endsWith('clean.ts'));
const preserveCookies = process.argv.includes('--preserve-cookies');

if (!urlArg) {
  console.error('Please provide a URL or a URL alias as an argument.');
  console.error('Usage: ts-node bin/clean.ts <url> [--preserve-cookies]');
  process.exit(1);
}

console.log(
  `🧹 Cleaning device state for ${urlArg}${
    preserveCookies ? ' (PRESERVING COOKIES)' : ''
  }...`
);

runCleanDevice(urlArg, 'mobile', preserveCookies)
  .then((data) => {
    console.log(`✅ ${data}`);
  })
  .catch((err: unknown) => {
    console.error(`❌ Error cleaning state:`, getErrorMessage(err));
    process.exit(1);
  });
