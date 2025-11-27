const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const { exec } = require('child_process');
const path = require('path');
const { handleTap } = require('./utils');

let traceCounter = 0;

// Function to find the next available trace file number
function getNextTraceNumber() {
  let i = 0;
  while (fs.existsSync(`trace-${i}.json`)) {
    i++;
  }
  return i;
}

function startCommandServer(pageForTracing) {
  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = requestUrl;

    if (pathname === '/trace:start') {
      if (pageForTracing) {
        traceCounter = getNextTraceNumber();
        const tracePath = `trace-${traceCounter}.json`;
        await pageForTracing.tracing.start({
          path: tracePath,
          screenshots: true,
        });
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Tracing started. Saving to ${tracePath}\n`);
        console.log(`Tracing started. Saving to ${tracePath}`);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No page available for tracing.\n');
        console.log('No page available for tracing.');
      }
    } else if (pathname === '/trace:stop') {
      if (pageForTracing) {
        console.log(`Tracing stopped... Saving...`);
        await pageForTracing.tracing.stop();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Tracing stopped. File trace-${traceCounter}.json saved.\n`);
        console.log(`Tracing stopped. File trace-${traceCounter}.json saved.`);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No page available for tracing (was tracing ever started?).\n');
        console.log(
          'No page available for tracing (was tracing ever started?).'
        );
      }
    } else if (pathname === '/navigate:refresh') {
      if (pageForTracing) {
        await pageForTracing.reload();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Page refreshed.\n');
        console.log('Page refreshed.');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No page available for refreshing.\n');
        console.log('No page available for refreshing.');
      }
    } else if (pathname === '/input:tap-vm-video') {
      handleTap(res, 760, 370, 'Tapped vm-video.');
    } else if (pathname === '/input:tap-vm-vmp-continue') {
      handleTap(res, 530, 2050, 'Tapped on vm-vmp-continue.');
    } else if (pathname === '/input:tap-vm-vmp-rec') {
      handleTap(res, 555, 2030, 'Tapped on vm-vmp-rec.');
    } else if (pathname === '/input:tap-vm-multivm-open') {
      handleTap(res, 100, 1680, 'Tapped on vm-multivm-open.');
    } else if (pathname === '/input:tap-vm-multivm-close') {
      handleTap(res, 100, 1680, 'Tapped on vm-multivm-close.');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(
        'Not Found. See README.md for a full list of available commands.\n'
      );
    }
  });

  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Command server listening on http://localhost:${PORT}`);
    console.log('  - Send GET to /trace:start');
    console.log('  - Send GET to /trace:stop');
    console.log('  - Send GET to /navigate:refresh');
    console.log('  - Send GET to /input:tap-vm-video');
    console.log('  - Send GET to /input:tap-vm-vmp-continue');
    console.log('  - Send GET to /input:tap-vm-vmp-rec');
    console.log('  - Send GET to /input:tap-vm-multivm-open');
    console.log('  - Send GET to /input:tap-vm-multivm-close');
    console.log('  - Send GET to /profile:vm-tc10');
  });
}

module.exports = { startCommandServer };
