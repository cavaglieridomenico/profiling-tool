import https from 'https';
import fs from 'fs';
import path from 'path';
import { logger } from './utils';

export async function checkForPuppeteerUpdates(): Promise<boolean> {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageName = packageJson.dependencies.puppeteer
      ? 'puppeteer'
      : packageJson.dependencies['puppeteer-core']
        ? 'puppeteer-core'
        : null;

    if (!packageName) return false;

    const currentVersion = packageJson.dependencies[packageName].replace(
      /[\^~]/g,
      ''
    );

    logger.info(`Checking for the latest ${packageName} version...`);
    const latestVersion = await getLatestPuppeteerVersion(packageName);

    if (latestVersion) {
      if (isNewer(latestVersion, currentVersion)) {
        logger.warn(
          `The latest ${packageName} version available is ${latestVersion}.`
        );
        logger.warn(
          '------------------------------------------------------------'
        );
        logger.warn(
          `A new version of ${packageName} is available: ${latestVersion}`
        );
        logger.warn(`Current version: ${currentVersion}`);
        logger.warn(`Please visit: https://pptr.dev/CHANGELOG`);
        logger.warn(
          'To align with the latest Chrome releases, consider updating:'
        );
        logger.warn(`npm install ${packageName}@latest`);
        logger.warn(
          '------------------------------------------------------------'
        );
        return true;
      } else {
        logger.success(
          `The latest version of ${packageName} is in use. (${currentVersion}).`
        );
        return false;
      }
    } else {
      logger.warn(`Could not retrieve the latest ${packageName} version.`);
      return false;
    }
  } catch (error) {
    // Silently fail to not interrupt the main process
    return false;
  }
}

function getLatestPuppeteerVersion(
  packageName: string
): Promise<string | null> {
  return new Promise((resolve) => {
    https
      .get(`https://registry.npmjs.org/${packageName}/latest`, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const registryInfo = JSON.parse(data);
            resolve(registryInfo.version);
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => {
        resolve(null);
      });
  });
}

function isNewer(latest: string, current: string): boolean {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (latestParts[i] > currentParts[i]) return true;
    if (latestParts[i] < currentParts[i]) return false;
  }
  return false;
}
