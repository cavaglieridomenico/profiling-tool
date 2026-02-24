import { runCleanDevice, getErrorMessage } from '../src/utils';

const urlArg = process.argv[2];

if (!urlArg) {
  console.error('Please provide a URL or a URL alias as an argument.');
  process.exit(1);
}

console.log(`🧹 Cleaning device state for ${urlArg}...`);

runCleanDevice(urlArg)
  .then((data) => {
    console.log(`✅ ${data}`);
  })
  .catch((err: unknown) => {
    console.error(`❌ Error cleaning state:`, getErrorMessage(err));
    process.exit(1);
  });
