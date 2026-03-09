import fs from 'fs';
import path from 'path';
import { parseTrace } from '../src/trace-parser';
import { TRACES_OUTPUT_DIR } from '../src/config/constants';
import { logger, getErrorMessage } from '../src/utils';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    logger.error('Please provide a trace file name to extract metrics from.');
    logger.info('Usage: npm run extract <trace-file-name>');
    process.exit(1);
  }

  let tracePath = args[0];

  // Auto-resolve from TRACES_OUTPUT_DIR if not found
  if (!fs.existsSync(tracePath)) {
    const resolvedPath = path.join(TRACES_OUTPUT_DIR, tracePath);
    if (fs.existsSync(resolvedPath)) {
      tracePath = resolvedPath;
    } else {
      logger.error(`File not found: ${tracePath} or ${resolvedPath}`);
      process.exit(1);
    }
  }

  logger.start(`Extracting metrics from: ${path.basename(tracePath)}`);
  try {
    const metrics = parseTrace(tracePath);
    const csvLines: string[] = [];

    // Header
    csvLines.push(
      ',Long tasks > 100 ms,Long tasks > 500 ms,Longest task (ms),JS heap min (MB),JS heap max (MB),INP,CLS,DevTools issues'
    );

    // Test #1 Row (Placeholder for test identifier)
    csvLines.push(`Test #1,,,,,,,No Data,No Data`);

    // Sort threads to have "Main thread" first
    const threadEntries = Object.entries(metrics.threads).sort((a, b) => {
      if (a[1].name === 'Main thread') return -1;
      if (b[1].name === 'Main thread') return 1;
      return a[1].name.localeCompare(b[1].name);
    });

    let workerCount = 1;
    for (const [, threadMetrics] of threadEntries) {
      let label = threadMetrics.name;
      if (label === 'Web Worker') {
        label = `Web Worker #${workerCount++}`;
      }

      const line = [
        label,
        threadMetrics.longTasks100,
        threadMetrics.longTasks500,
        threadMetrics.longestTask.toFixed(2),
        threadMetrics.jsHeapMin.toFixed(2),
        threadMetrics.jsHeapMax.toFixed(2),
        label === 'Main thread' ? metrics.inp.toFixed(2) : '',
        label === 'Main thread' ? metrics.cls.toFixed(4) : '',
        label === 'Main thread' ? metrics.devToolsIssues : ''
      ].join(',');
      csvLines.push(line);
    }

    const outputFileName = path.basename(tracePath, '.json') + '.csv';
    const outputPath = path.join(path.dirname(tracePath), outputFileName);

    fs.writeFileSync(outputPath, csvLines.join('\n'));
    logger.success(`Metrics extracted and saved to: ${outputPath}`);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    logger.error(`Failed to extract metrics: ${msg}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err: unknown) => {
    const msg = getErrorMessage(err);
    logger.error(`Execution Blocked: ${msg}`);
    process.exit(1);
  });
}
