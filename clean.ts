import http from 'http';
import { resolveUrl } from './src/utils';

const urlArg = process.argv[2];

if (!urlArg) {
  console.error('Please provide a URL or a URL alias as an argument.');
  process.exit(1);
}

const url = resolveUrl(urlArg);

const req = http.get(
  `http://localhost:8080/device:clean-state?url=${encodeURIComponent(url)}`,
  (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Response: ${data}`);
    });
  }
);

req.on('error', (err) => {
  console.error(`Error sending clean state command:`, err.message);
});
