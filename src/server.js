const http = require('http');
const fs = require('fs');

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
    if (req.url === '/trace:start') {
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
    } else if (req.url === '/trace:stop') {
      if (pageForTracing) {
        await pageForTracing.tracing.stop();
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`Tracing stopped. File trace-${traceCounter}.json saved.\n`);
        console.log(
          `Tracing stopped. File trace-${traceCounter}.json saved.`
        );
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(
          'No page available for tracing (was tracing ever started?).\n'
        );
        console.log(
          'No page available for tracing (was tracing ever started?).'
        );
      }
    } else if (req.url === '/navigate:refresh') {
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
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(
        'Not Found. Use /trace:start, /trace:stop, or /navigate:refresh\n'
      );
    }
  });

  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Command server listening on http://localhost:${PORT}`);
    console.log('  - Send GET to /trace:start to begin tracing.');
    console.log('  - Send GET to /trace:stop to end tracing.');
    console.log('  - Send GET to /navigate:refresh to refresh the page.');
  });
}

module.exports = { startCommandServer };
