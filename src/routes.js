const { COMMANDS } = require('./commands');
const traceManager = require('./traceManager');
const {
  handleNavigation,
  handleCleanState,
  handleConfigOverrides,
  sendResponse,
} = require('./utils');

const routeHandlers = {
  [COMMANDS.TRACE_START]: async (req, res, page, url) => {
    try {
      const traceName = url.searchParams.get('name');
      const tracePath = await traceManager.startTrace(page, traceName);
      sendResponse(res, 200, `Tracing started. Saving to ${tracePath}`);
    } catch (error) {
      sendResponse(res, 404, error.message);
    }
  },
  [COMMANDS.TRACE_STOP]: async (req, res, page) => {
    try {
      console.log(`Tracing stopped... Saving...`);
      const traceFile = await traceManager.stopTrace(page);
      sendResponse(res, 200, `Tracing stopped. File ${traceFile} saved.`);
    } catch (error) {
      sendResponse(res, 404, error.message);
    }
  },
  [COMMANDS.DEVICE_CLEAN_STATE]: async (req, res, page, url, mode) => {
    await handleCleanState(page, res, mode);
  },
  [COMMANDS.CONFIG_OVERRIDES]: async (req, res, page, url) => {
    const target = url.searchParams.get('target');
    const replacement = url.searchParams.get('replacement');
    await handleConfigOverrides(page, target, replacement, res);
  },
  [COMMANDS.NAVIGATE_REFRESH]: async (req, res, page) => {
    if (page) {
      await page.reload();
      sendResponse(res, 200, 'Page refreshed.');
    } else {
      sendResponse(res, 404, 'No page available for refreshing.');
    }
  },
  [COMMANDS.NAVIGATE_URL]: async (req, res, page, url) => {
    if (page) {
      const urlToNavigate = url.searchParams.get('url');
      if (urlToNavigate) {
        await handleNavigation(page, urlToNavigate, res);
      } else {
        sendResponse(res, 400, 'No URL provided for navigation.');
      }
    } else {
      sendResponse(res, 404, 'No page available for navigation.');
    }
  },
};

module.exports = { routeHandlers };
