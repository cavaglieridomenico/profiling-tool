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
    } else if (pathname === '/devtools:mobile') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('DevTools instance starting...\n');
      console.log('DevTools instance starting...');

      (async () => {
        let devtoolsUrl;
        try {
          const browser = pageForTracing.browser();
          const wsEndpoint = browser.wsEndpoint();
          const hostMatch = wsEndpoint.match(/ws:\/\/([^/]+)/);
          if (!hostMatch) {
            throw new Error(
              'Could not determine host from WebSocket endpoint.'
            );
          }
          const host = hostMatch[1];

          const targetsResponse = await new Promise((resolve, reject) => {
            http
              .get(`http://${host}/json/list`, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                  try {
                    resolve(JSON.parse(data));
                  } catch (e) {
                    reject(e);
                  }
                });
              })
              .on('error', reject);
          });

          const pageUrl = pageForTracing.url();
          const pageTargetInfo = targetsResponse.find(
            (t) => t.type === 'page' && t.url === pageUrl
          );

          if (pageTargetInfo && pageTargetInfo.devtoolsFrontendUrl) {
            devtoolsUrl = `http://${host}${pageTargetInfo.devtoolsFrontendUrl}`;
          } else {
            // Fallback for about:blank or other cases
            const firstPage = targetsResponse.find((t) => t.type === 'page');
            if (firstPage && firstPage.devtoolsFrontendUrl) {
              devtoolsUrl = `http://${host}${firstPage.devtoolsFrontendUrl}`;
            }
          }
        } catch (err) {
          console.error('Error getting specific DevTools URL:', err.message);
        }

        if (devtoolsUrl) {
          console.log(`Opening DevTools at: ${devtoolsUrl}`);
          exec(`start "" "${devtoolsUrl}"`);
        } else {
          console.log(
            'Could not determine specific DevTools URL, opening generic inspector.'
          );
          exec('start chrome://inspect/#devices');
        }
      })();
    } else if (pathname === '/input:tap-vm-video') {
      handleTap(res, 760, 370, 'Tapped vm-video.');
    } else if (pathname === '/input:tap-vm-vmp-continue') {
      handleTap(res, 530, 2050, 'Tapped on vm-vmp-continue.');
    } else if (pathname === '/input:tap-vm-vmp-rec') {
      handleTap(res, 555, 2030, 'Tapped at (194, 635).');
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
    console.log('  - Send GET to /devtools:mobile');
    console.log('  - Send GET to /input:tap-vm-video');
    console.log('  - Send GET to /input:tap-vm-vmp-continue');
    console.log('  - Send GET to /input:tap-vm-vmp-rec');
    console.log('  - Send GET to /input:tap-vm-multivm-open');
    console.log('  - Send GET to /input:tap-vm-multivm-close');
  });
}

module.exports = { startCommandServer };
