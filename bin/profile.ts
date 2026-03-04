import { testCases } from '../src/testCases';
import { ensureDeviceIsCool } from '../src/thermal';
import { sendCommand, getErrorMessage, logger } from '../src/utils';
// 1. Import the dictionary
import { urls } from '../src/urls';

function sleep(ms: number): Promise<void> {
  if (ms === 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runTestCase(
  name: string,
  traceName?: string,
  targetUrl?: string
) {
  const steps = testCases[name];
  if (!steps) {
    throw new Error(`Test case "${name}" not found.`);
  }

  const requiresUrl = steps.some((step) => step.command.includes('TARGET_URL'));
  if (requiresUrl && !targetUrl) {
    throw new Error(
      `Test case "${name}" requires a target URL, but none was provided in the terminal.`
    );
  }

  let resolvedUrl = targetUrl;
  if (targetUrl && targetUrl.startsWith('urls.')) {
    const key = targetUrl.substring(5);
    resolvedUrl = (urls as any)[key] || targetUrl;
  }

  logger.info(`Running test case: ${name}`);
  try {
    for (const step of steps) {
      let { command } = step;

      // Inject the fully resolved URL into the placeholder
      if (resolvedUrl) {
        command = command.replace(/TARGET_URL/g, resolvedUrl);
      }

      if (
        (command.startsWith('devtools:start') ||
          command.startsWith('perfetto:start')) &&
        traceName
      ) {
        command = `${command}?name=${traceName}`;
      }

      const data = await sendCommand(command);
      logger.info(`Response from ${command}: ${data}`);

      if (step.delay) {
        await sleep(step.delay);
      }
    }
    logger.success(`Test case "${name}" completed successfully.`);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    logger.error(`An error occurred during test case "${name}": ${msg}`);
    throw new Error(msg);
  }
}

if (require.main === module) {
  const testCaseName = process.argv[2];
  const traceName = process.argv[3];
  const targetUrl = process.argv[4];

  if (!testCaseName) {
    logger.error('Please provide a test case name to run.');
    logger.info(
      'Usage: npx ts-node bin/profile.ts <test_case_name> [trace_name] [target_url]'
    );
    const cases = Object.keys(testCases) as (keyof typeof testCases)[];
    logger.info(`Available test cases: ${cases.join(', ')}`);
    process.exit(1);
  }

  runTestCase(testCaseName, traceName, targetUrl).catch((err: unknown) => {
    const msg = getErrorMessage(err);
    logger.error(`Execution Blocked: ${msg}`);
    process.exit(1);
  });
}
