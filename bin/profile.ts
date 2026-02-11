import { testCases } from '../src/testCases';
import { ensureDeviceIsCool } from '../src/thermal';
import { sendCommand } from '../src/utils';

function sleep(ms: number): Promise<void> {
  if (ms === 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTestCase(name: string, traceName?: string) {
  const steps = testCases[name];
  if (!steps) {
    console.error(`Test case "${name}" not found.`);
    console.log('Available test cases:', Object.keys(testCases).join(', '));
    process.exit(1);
  }

  console.log(`Running test case: ${name}`);
  try {
    await ensureDeviceIsCool();

    for (const step of steps) {
      let { command } = step;
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
  } catch (error: any) {
    console.error(`An error occurred during test case "${name}":`, error.message || error);
    process.exit(1);
  }
}

const testCaseName = process.argv[2];
const traceName = process.argv[3];

if (!testCaseName) {
  console.error('Please provide a test case name to run.');
  console.log('Usage: npx ts-node bin/profile.ts <test_case_name> [trace_name]');
  console.log('Available test cases:', Object.keys(testCases).join(', '));
  process.exit(1);
}

runTestCase(testCaseName, traceName);
