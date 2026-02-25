import { IncomingMessage, ServerResponse } from 'http';
import { Page } from 'puppeteer';
import { URL } from 'url';
import { COMMANDS } from './commands';
import devtoolsTraceManager from './devtools-trace-manager';
import perfettoTraceManager from './perfetto-trace-manager';
import {
  handleNavigation,
  handleCleanState,
  handleCloseAllTabs,
  handleConfigOverrides,
  sendResponse,
  getErrorMessage,
} from './utils';
import { getDeviceTemperature, ensureDeviceIsCool } from './thermal';
import { RouteHandlers } from './types';

export const routeHandlers: RouteHandlers = {
  [COMMANDS.PERFETTO_START]: async (req, res, page, url) => {
    try {
      const traceName = url.searchParams.get('name') || undefined;
      perfettoTraceManager.startPerfetto(traceName || null);
      sendResponse(res, 200, 'Perfetto tracing started (background).');
    } catch (error: unknown) {
      sendResponse(res, 500, `Failed to start Perfetto: ${getErrorMessage(error)}`);
    }
  },
  [COMMANDS.PERFETTO_STOP]: async (req, res, page, url) => {
    try {
      const tracePath = perfettoTraceManager.stopPerfetto();
      sendResponse(res, 200, `Perfetto tracing stopped. Saved to: ${tracePath}`);
    } catch (error: unknown) {
      sendResponse(res, 500, `Failed to stop Perfetto: ${getErrorMessage(error)}`);
    }
  },
  [COMMANDS.DEVTOOLS_START]: async (req, res, page, url) => {
    try {
      const traceName = url.searchParams.get('name');
      const tracePath = await devtoolsTraceManager.startTrace(page, traceName);
      sendResponse(res, 200, `Tracing started. Saving to ${tracePath}`);
    } catch (error: unknown) {
      sendResponse(res, 404, getErrorMessage(error));
    }
  },
  [COMMANDS.DEVTOOLS_STOP]: async (req, res, page) => {
    try {
      console.log(`Tracing stopped... Saving...`);
      const traceFile = await devtoolsTraceManager.stopTrace(page);
      sendResponse(res, 200, `Tracing stopped. File ${traceFile} saved.`);
    } catch (error: unknown) {
      sendResponse(res, 404, getErrorMessage(error));
    }
  },
  [COMMANDS.DEVICE_GET_TEMPERATURE]: async (req, res) => {
    try {
      const temp = await getDeviceTemperature();
      console.log(`Device temperature: ${temp.toFixed(1)}°C`);
      sendResponse(res, 200, `Device temperature: ${temp.toFixed(1)}°C`);
    } catch (error: unknown) {
      sendResponse(res, 500, `Failed to get device temperature`);
    }
  },
  [COMMANDS.DEVICE_COOLDOWN]: async (req, res) => {
    try {
      await ensureDeviceIsCool();
      const temp = await getDeviceTemperature();
      sendResponse(res, 200, `Device is now cool: ${temp.toFixed(1)}°C`);
    } catch (error: unknown) {
      sendResponse(res, 500, `Failed to ensure device cooldown`);
    }
  },
  [COMMANDS.DEVICE_CLEAN_STATE]: async (req, res, page, url, mode) => {
    if (mode) {
      const targetUrl = url.searchParams.get('url');
      await handleCleanState(page, res, mode, targetUrl);
    } else {
      sendResponse(res, 400, 'Mode is required for clean state.');
    }
  },
  [COMMANDS.DEVICE_CLOSE_ALL_TABS]: async (req, res, page) => {
    await handleCloseAllTabs(page, res);
  },
  [COMMANDS.CONFIG_OVERRIDES]: async (req, res, page, url) => {
    const target = url.searchParams.get('target');
    const replacement = url.searchParams.get('replacement');
    await handleConfigOverrides(page, target, replacement, res);
  },
  [COMMANDS.NAVIGATE_REFRESH]: async (req, res, page) => {
    if (page) {
      try {
        await page.reload();
        sendResponse(res, 200, 'Page refreshed.');
      } catch (error: unknown) {
        sendResponse(res, 500, `Failed to refresh page: ${getErrorMessage(error)}`);
      }
    } else {
      sendResponse(res, 404, 'No page available for refreshing.');
    }
  },
  [COMMANDS.NAVIGATE_URL]: async (req, res, page, url) => {
    if (page) {
      const urlToNavigate = url.searchParams.get('url');
      const waitUntil = (url.searchParams.get('waitUntil') as any) || 'load';
      if (urlToNavigate) {
        await handleNavigation(page, urlToNavigate, res, waitUntil);
      } else {
        sendResponse(res, 400, 'No URL provided for navigation.');
      }
    } else {
      sendResponse(res, 404, 'No page available for navigation.');
    }
  },
};
