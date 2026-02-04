import https from 'https';
import fs from 'fs';
import path from 'path';

export async function checkForPuppeteerUpdates(): Promise<void> {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageName = packageJson.dependencies.puppeteer
      ? 'puppeteer'
      : packageJson.dependencies['puppeteer-core']
        ? 'puppeteer-core'
        : null;

    if (!packageName) return;

    const currentVersion = packageJson.dependencies[packageName].replace(
      /[\^~]/g,
      ''
    );

    console.log(`Checking for the latest ${packageName} version...`);
    const latestVersion = await getLatestPuppeteerVersion(packageName);

    if (latestVersion) {
      console.log(
        `Latest ${packageName} version: ${latestVersion} is already installed`
      );
      if (isNewer(latestVersion, currentVersion)) {
        console.log(
          '\x1b[33m%s\x1b[0m',
          '------------------------------------------------------------'
        );
        console.log(
          '\x1b[33m%s\x1b[0m',
          `A new version of ${packageName} is available: ${latestVersion}`
        );
        console.log('\x1b[33m%s\x1b[0m', `Current version: ${currentVersion}`);
        console.log(
          '\x1b[33m%s\x1b[0m',
          `Please visit: https://pptr.dev/CHANGELOG`
        );
        console.log(
          '\x1b[33m%s\x1b[0m',
          'To align with the latest Chrome releases, consider updating:'
        );
        console.log('\x1b[33m%s\x1b[0m', `npm install ${packageName}@latest`);
        console.log(
          '\x1b[33m%s\x1b[0m',
          '------------------------------------------------------------'
        );
      }
    } else {
      console.log(`Could not retrieve the latest ${packageName} version.`);
    }
  } catch (error) {
    // Silently fail to not interrupt the main process
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
