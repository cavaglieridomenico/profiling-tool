import { testCases } from './src/testCases';
import http from 'http';

function sendCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:8080/${command}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Response from ${command}: ${data}`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`Error sending command ${command}:`, err.message);
      reject(err);
    });
  });
}

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
    for (const step of steps) {
      let { command } = step;
      if (
        (command.startsWith('trace:start') ||
          command.startsWith('perfetto:start')) &&
        traceName
      ) {
        command = `${command}?name=${traceName}`;
      }
      await sendCommand(command);
      if (step.delay) {
        await sleep(step.delay);
      }
    }
    console.log(`Test case "${name}" completed successfully.`);
  } catch (error) {
    console.error(`An error occurred during test case "${name}":`, error);
    process.exit(1);
  }
}

const testCaseName = process.argv[2];
const traceName = process.argv[3];

if (!testCaseName) {
  console.error('Please provide a test case name to run.');
  console.log('Usage: node profile.js <test_case_name> [trace_name]');
  console.log('Available test cases:', Object.keys(testCases).join(', '));
  process.exit(1);
}

runTestCase(testCaseName, traceName);
