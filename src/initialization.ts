import { Browser } from 'puppeteer';
import { initializeBrowser } from './browser';
import { checkForPuppeteerUpdates } from './version-checker';
import { validateEnv, getErrorMessage } from './utils';
import { standardConnection } from '../bin/connect';
import { ensureDeviceIsCool } from './thermal';

export interface SetupOptions {
  mode: string;
  checkUpdates?: boolean;
  checkThermal?: boolean;
  skipAdb?: boolean;
  strictVersionCheck?: boolean;
}

/**
 * Centralized initialization flow for the Profiling Tool.
 * Handles env validation, version checks, ADB connection, and thermal baseline.
 */
export async function performApplicationSetup(options: SetupOptions): Promise<Browser> {
  const { mode, checkUpdates = true, checkThermal = false, skipAdb = false, strictVersionCheck = false } = options;

  console.log(`🚀 Initializing Profiling Tool in ${mode} mode...`);

  // 1. Check for Puppeteer updates
  if (checkUpdates) {
    const updateAvailable = await checkForPuppeteerUpdates();
    if (updateAvailable && strictVersionCheck) {
      throw new Error('A mandatory Puppeteer update is available. Please update your dependencies to continue (Strict Mode enabled).');
    }
  }

  // 2. Validate Environment Variables
  try {
    if (process.env.PUPPETEER_USERNAME || process.env.PUPPETEER_PASSWORD) {
      validateEnv(['PUPPETEER_USERNAME', 'PUPPETEER_PASSWORD']);
    }
  } catch (e: unknown) {
    throw new Error(`Environment validation failed: ${getErrorMessage(e)}`);
  }

  // 3. Mobile-specific: ADB Connection
  if (mode === 'mobile' && !skipAdb) {
    try {
      standardConnection();
    } catch (e: unknown) {
      throw new Error(`ADB Connection failed: ${getErrorMessage(e)}`);
    }
  }

  // 4. Thermal Check (optional baseline)
  if (mode === 'mobile' && checkThermal) {
    try {
      await ensureDeviceIsCool();
    } catch (e: unknown) {
      console.warn(`Thermal check warning: ${getErrorMessage(e)}`);
    }
  }

  // 5. Initialize Browser
  try {
    const browser = await initializeBrowser(mode);
    return browser;
  } catch (e: unknown) {
    throw new Error(`Browser initialization failed: ${getErrorMessage(e)}`);
  }
}
