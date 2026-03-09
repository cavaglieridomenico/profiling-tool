import fs from 'fs';
import path from 'path';
import { parseTrace } from '../src/trace-parser';
import { TRACES_OUTPUT_DIR } from '../src/config/constants';
import { logger, getErrorMessage } from '../src/utils';

/**
 * Extracts metrics from a single trace file and saves them to a CSV.
 */
function extractFromFile(tracePath: string) {
  try {
    const metrics = parseTrace(tracePath);
    const csvLines: string[] = [];

    // Header with 2 empty columns between each value
    const headers = [
      '',
      'Long tasks > 100 ms',
      'Long tasks > 500 ms',
      'Longest task (ms)',
      'JS heap min (MB)',
      'JS heap max (MB)',
      'INP',
      'CLS',
      'DevTools issues'
    ];
    csvLines.push(headers.join(',,,'));

    // Test #1 Row (Placeholder for test identifier)
    csvLines.push(`Test #1${',,,'.repeat(headers.length - 1)}`);

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

      const values = [
        label,
        threadMetrics.longTasks100.toString(),
        threadMetrics.longTasks500.toString(),
        threadMetrics.longestTask.toFixed(2),
        threadMetrics.jsHeapMin.toFixed(2),
        threadMetrics.jsHeapMax.toFixed(2),
        label === 'Main thread' ? metrics.inp.toFixed(2) : '',
        label === 'Main thread' ? metrics.cls.toFixed(4) : '',
        label === 'Main thread' ? metrics.devToolsIssues.toString() : ''
      ];
      
      // Join with 3 commas to leave 2 empty columns between each value
      csvLines.push(values.join(',,,'));
    }

    const baseDir = path.dirname(tracePath);
    const baseName = path.basename(tracePath, '.json');
    
    let outputPath = path.join(baseDir, `${baseName}.csv`);
    
    // Numbering logic for existing CSV files
    if (fs.existsSync(outputPath)) {
      let counter = 1;
      while (fs.existsSync(path.join(baseDir, `${baseName}-${counter}.csv`))) {
        counter++;
      }
      outputPath = path.join(baseDir, `${baseName}-${counter}.csv`);
    }

    fs.writeFileSync(outputPath, csvLines.join('\n'));
    logger.success(`Extracted: ${path.basename(outputPath)}`);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    logger.error(`Failed to extract from ${path.basename(tracePath)}: ${msg}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // BATCH MODE: No arguments provided
  if (args.length === 0) {
    logger.info(`No file specified. Scanning ${TRACES_OUTPUT_DIR} for traces...`);
    
    if (!fs.existsSync(TRACES_OUTPUT_DIR)) {
      logger.error(`Traces directory not found: ${TRACES_OUTPUT_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(TRACES_OUTPUT_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      logger.warn('No .json trace files found in the output directory.');
      process.exit(0);
    }

    logger.start(`Processing ${files.length} trace files...`);
    for (const file of files) {
      const fullPath = path.join(TRACES_OUTPUT_DIR, file);
      extractFromFile(fullPath);
    }
    logger.success('Batch extraction complete.');
    process.exit(0);
  }

  // SINGLE MODE: File specified in arguments
  let tracePath = args.join(' ');

  // Auto-resolve from TRACES_OUTPUT_DIR if not found locally
  if (!fs.existsSync(tracePath)) {
    const resolvedPath = path.join(TRACES_OUTPUT_DIR, tracePath);
    if (fs.existsSync(resolvedPath)) {
      tracePath = resolvedPath;
    } else {
      logger.error(`File not found: "${tracePath}"`);
      process.exit(1);
    }
  }

  logger.start(`Extracting metrics from: ${path.basename(tracePath)}`);
  extractFromFile(tracePath);
}

if (require.main === module) {
  main().catch((err: unknown) => {
    const msg = getErrorMessage(err);
    logger.error(`Execution Blocked: ${msg}`);
    process.exit(1);
  });
}
