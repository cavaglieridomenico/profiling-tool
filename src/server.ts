import path from 'path';
import dotenv from 'dotenv';
import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { Page, Browser } from 'puppeteer';
import { handleTap, sendResponse } from './utils';
import { TAP_CONFIG } from './tapConfig';
import { routeHandlers } from './routes';
import { getTargetPage } from './page';

const env = process.env.PUPPETEER_ENV;
const envPath = env
  ? path.resolve(process.cwd(), `.env.${env}`)
  : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

export function startCommandServer(
  browser: Browser,
  initialPage: Page,
  mode: string
) {
  let activePage = initialPage;

  const server = http.createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const requestUrl = new URL(req.url || '', `http://${req.headers.host}`);
      const { pathname } = requestUrl;

      // Ensure activePage is valid
      if (activePage.isClosed()) {
        console.log('Active page is closed. Recovering...');
        try {
          activePage = await getTargetPage(browser, '');
          console.log('Recovered with new active page.');
        } catch (error: any) {
          console.error(`Failed to recover page: ${error.message}`);
          sendResponse(res, 500, 'Browser page is closed and recovery failed.');
          return;
        }
      }

      const handler = routeHandlers[pathname];

      if (handler) {
        await handler(req, res, activePage, requestUrl, mode);
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
    }
  );

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
