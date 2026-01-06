const path = require('path');
const env = process.env.PUPPETEER_ENV;
const envPath = env
  ? path.resolve(process.cwd(), `.env.${env}`)
  : path.resolve(process.cwd(), '.env');

require('dotenv').config({ path: envPath });

const http = require('http');
const { URL } = require('url');
const { handleTap, sendResponse } = require('./utils');
const { TAP_CONFIG } = require('./tapConfig');
const { routeHandlers } = require('./routes');

function startCommandServer(pageForTracing, mode) {
  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = requestUrl;

    const handler = routeHandlers[pathname];

    if (handler) {
      await handler(req, res, pageForTracing, requestUrl, mode);
    } else if (TAP_CONFIG[pathname]) {
      const { x, y, msg } = TAP_CONFIG[pathname];
      handleTap(res, x, y, msg);
    } else {
      sendResponse(
        res,
        404,
        'Not Found. See README.md for a full list of available commands.'
      );
    }
  });

  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Command server listening on http://localhost:${PORT}`);
    // Log available commands
    Object.keys(routeHandlers).forEach((cmd) =>
      console.log(`  - Send GET to ${cmd}`)
    );
    Object.keys(TAP_CONFIG).forEach((cmd) =>
      console.log(`  - Send GET to ${cmd}`)
    );
  });
}

module.exports = { startCommandServer };

