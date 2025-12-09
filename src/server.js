const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const path = require('path');
const { COMMANDS } = require('./commands');
const { handleTap } = require('./utils');

let traceCounter = 0;
let traceName = '';

// Function to find the next available trace file number
function getNextTraceNumber(name = 'trace') {
  let i = 1;
  while (fs.existsSync(`${name}-${i}.json`)) {
    i++;
  }
  return i;
}

function startCommandServer(pageForTracing) {
  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = requestUrl;

    if (pathname === COMMANDS.TRACE_START) {
      if (pageForTracing) {
        const traceUrl = requestUrl.searchParams.get('name');
        traceName = traceUrl || 'trace';
        traceCounter = getNextTraceNumber(traceName);
        const tracePath = `${traceName}-${traceCounter}.json`;
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
    } else if (pathname === COMMANDS.TRACE_STOP) {
      if (pageForTracing) {
        console.log(`Tracing stopped... Saving...`);
        await pageForTracing.tracing.stop();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(
          `Tracing stopped. File ${traceName}-${traceCounter}.json saved.\n`
        );
        console.log(
          `Tracing stopped. File ${traceName}-${traceCounter}.json saved.`
        );
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No page available for tracing (was tracing ever started?).\n');
        console.log(
          'No page available for tracing (was tracing ever started?).'
        );
      }
    } else if (pathname === COMMANDS.NAVIGATE_REFRESH) {
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
    } else if (pathname === COMMANDS.NAVIGATE_URL) {
      if (pageForTracing) {
        const urlToNavigate = requestUrl.searchParams.get('url');
        if (urlToNavigate) {
          await pageForTracing.goto(urlToNavigate);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(`Navigated to ${urlToNavigate}.\n`);
          console.log(`Navigated to ${urlToNavigate}.`);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('No URL provided.\n');
          console.log('No URL provided for navigation.');
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('No page available for navigation.\n');
        console.log('No page available for navigation.');
      }
    } else if (pathname === COMMANDS.INPUT_TAP_VM_UPLOAD) {
      handleTap(res, 550, 370, 'Tapped vm-upload.');
    } else if (pathname === COMMANDS.INPUT_TAP_VM_VIDEO) {
      handleTap(res, 760, 370, 'Tapped vm-video.');
    } else if (pathname === COMMANDS.INPUT_TAP_VM_CONTINUE) {
      handleTap(res, 530, 2050, 'Tapped on vm-vmp-continue.');
    } else if (pathname === COMMANDS.INPUT_TAP_VM_REC) {
      handleTap(res, 555, 2030, 'Tapped on vm-vmp-rec.');
    } else if (pathname === COMMANDS.INPUT_TAP_MULTIVM_OPEN) {
      handleTap(res, 100, 1680, 'Tapped on vm-multivm-open.');
    } else if (pathname === COMMANDS.INPUT_TAP_MULTIVM_CLOSE) {
      handleTap(res, 100, 1680, 'Tapped on vm-multivm-close.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMCORE_VMP_PDPLIGHT) {
      handleTap(res, 540, 1240, 'Tapped on vmcore-vmp-pdplight.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMCORE_VMP_REC) {
      handleTap(res, 100, 2040, 'Tapped on vmcore-vmp-rec.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMCORE_VMP_IMAGE) {
      handleTap(res, 100, 1680, 'Tapped on vmcore-vmp-image.');
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
    console.log('  - Send GET to /trace:start?name=<TRACE_NAME>');
    console.log('  - Send GET to /trace:stop');
    console.log('  - Send GET to /navigate:refresh');
    console.log('  - Send GET to /navigate:url?url=<URL>');
    console.log('  - Send GET to /input:tap-vm-video');
    console.log('  - Send GET to /input:tap-vm-vmp-continue');
    console.log('  - Send GET to /input:tap-vm-vmp-rec');
    console.log('  - Send GET to /input:tap-vm-multivm-open');
    console.log('  - Send GET to /input:tap-vm-multivm-close');
    console.log('  - Send GET to /input:tap-vmcore-vmp-pdplight');
    console.log('  - Send GET to /input:tap-vmcore-vmp-rec');
    console.log('  - Send GET to /input:tap-vmcore-vmp-image');
  });
}

module.exports = { startCommandServer };
