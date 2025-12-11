const path = require('path');
const env = process.env.PUPPETEER_ENV;
const envPath = env
  ? path.resolve(process.cwd(), `.env.${env}`)
  : path.resolve(process.cwd(), '.env');

require('dotenv').config({ path: envPath });

const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const { COMMANDS } = require('./commands');
const { handleTap, handleNavigation, handleCleanState } = require('./utils');

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

function startCommandServer(pageForTracing, mode) {
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
    } else if (pathname === COMMANDS.DEVICE_CLEAN_STATE) {
      await handleCleanState(pageForTracing, res, mode);
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
          await handleNavigation(pageForTracing, urlToNavigate, res);
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
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_UPLOAD) {
      handleTap(res, 550, 370, 'Tapped vmmv-upload.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_VIDEO) {
      handleTap(res, 760, 370, 'Tapped vmmv-video.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_CONTINUE) {
      handleTap(res, 530, 2050, 'Tapped on vmmv-vmp-continue.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_REC) {
      handleTap(res, 555, 2030, 'Tapped on vmmv-vmp-rec.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_MULTIVM_OPEN) {
      handleTap(res, 100, 1680, 'Tapped on vmmv-multivm-open.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_MULTIVM_CLOSE) {
      handleTap(res, 100, 1680, 'Tapped on vmmv-close.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_CLOSE) {
      handleTap(res, 980, 360, 'Tapped on vmmv-close.');
    } else if (pathname === COMMANDS.INPUT_TAP_VMMV_WIDGET) {
      handleTap(res, 550, 850, 'Tapped on vmmv-widget.');
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
    console.log('  - Send GET to /input:tap-vmmv-video');
    console.log('  - Send GET to /input:tap-vmmv-vmp-continue');
    console.log('  - Send GET to /input:tap-vmmv-vmp-rec');
    console.log('  - Send GET to /input:tap-vmmv-multivm-open');
    console.log('  - Send GET to /input:tap-vmmv-multivm-close');
    console.log('  - Send GET to /input:tap-vmmv-close');
    console.log('  - Send GET to /input:tap-vmmv-widget');
    console.log('  - Send GET to /input:tap-vmcore-vmp-pdplight');
    console.log('  - Send GET to /input:tap-vmcore-vmp-rec');
    console.log('  - Send GET to /input:tap-vmcore-vmp-image');
  });
}

module.exports = { startCommandServer };
