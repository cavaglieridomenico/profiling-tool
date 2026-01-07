import http from 'http';
import { urls } from './src/urls';

const urlArg = process.argv[2];

if (!urlArg) {
  console.error('Please provide a URL or a URL alias as an argument.');
  process.exit(1);
}

const url = urls[urlArg] || urlArg;

const req = http.get(`http://localhost:8080/navigate:url?url=${encodeURIComponent(url)}`, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Response: ${data}`);
  });
});

req.on('error', (err) => {
  console.error(`Error sending navigation command:`, err.message);
});
