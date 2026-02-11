import { resolveUrl, sendCommand } from '../src/utils';

const urlArg = process.argv[2];

if (!urlArg) {
  console.error('Please provide a URL or a URL alias as an argument.');
  process.exit(1);
}

const url = resolveUrl(urlArg);
const command = `navigate:url?url=${encodeURIComponent(url)}`;

sendCommand(command)
  .then((data) => {
    console.log(`Response: ${data}`);
  })
  .catch((err) => {
    console.error(`Error sending navigation command:`, err.message);
  });
