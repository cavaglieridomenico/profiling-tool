import { resolveUrl, sendCommand, getErrorMessage, logger } from '../src/utils';

const urlArg = process.argv[2];

if (!urlArg) {
  logger.error('Please provide a URL or a URL alias as an argument.');
  process.exit(1);
}

const url = resolveUrl(urlArg);
const command = `navigate:url?url=${encodeURIComponent(url)}`;

sendCommand(command)
  .then((data) => {
    logger.success(`Response: ${data}`);
  })
  .catch((err: unknown) => {
    logger.error(`Error sending navigation command: ${getErrorMessage(err)}`);
  });
