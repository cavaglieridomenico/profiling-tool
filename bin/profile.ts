import { testCases } from '../src/testCases';
import { ensureDeviceIsCool } from '../src/thermal';
import { sendCommand, getErrorMessage } from '../src/utils';
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

  console.log(`Running test case: ${name}`);
  try {
    await ensureDeviceIsCool();

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
      console.log(`Response from ${command}: ${data}`);

      if (step.delay) {
        await sleep(step.delay);
      }
    }
    console.log(`Test case "${name}" completed successfully.`);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error(`An error occurred during test case "${name}":`, msg);
    throw new Error(msg);
  }
}

if (require.main === module) {
  const testCaseName = process.argv[2];
  const traceName = process.argv[3];
  const targetUrl = process.argv[4];

  if (!testCaseName) {
    console.error('Please provide a test case name to run.');
    console.log(
      'Usage: npx ts-node bin/profile.ts <test_case_name> [trace_name] [target_url]'
    );
    console.log('Available test cases:', Object.keys(testCases).join(', '));
    process.exit(1);
  }

  runTestCase(testCaseName, traceName, targetUrl).catch((err: unknown) => {
    const msg = getErrorMessage(err);
    console.error(`\n[Error] Execution Blocked: ${msg}\n`);
    process.exit(1);
  });
}
