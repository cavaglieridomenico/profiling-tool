import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseTrace } from '../src/trace-parser';
import { TRACES_OUTPUT_DIR } from '../src/config/constants';
import { logger, getErrorMessage } from '../src/utils';
import { TraceMetrics } from '../src/types';

interface GroupedMetrics {
  scenarioName: string;
  runs: {
    fileName: string;
    metrics: TraceMetrics;
  }[];
}

/**
 * Extracts a scenario name from a trace filename for tab aggregation.
 * Follows the pattern: Test Version-Test Case-Test Device
 * Example: "TV25_03-TC01-TD31_03-1 Range 2.06 s – 9.44 s.json" -> "TV25_03-TC01-TD31_03"
 */
function getScenarioName(fileName: string): string {
  const base = path.basename(fileName, '.json');
  const parts = base.split('-');
  
  // We aggregate by the first 3 parts (Version-Case-Device)
  if (parts.length >= 3) {
    return parts.slice(0, 3).join('-');
  }
  
  return base;
}

/**
 * Adds metrics for a single run to an Excel worksheet.
 */
function addRunToWorksheet(
  worksheet: ExcelJS.Worksheet,
  runName: string,
  metrics: TraceMetrics,
  startRow: number
): number {
  let currentRow = startRow;

  // Add a sub-header for the specific run
  const runHeaderRow = worksheet.getRow(currentRow++);
  runHeaderRow.getCell(1).value = runName;
  runHeaderRow.getCell(1).font = { bold: true };
  runHeaderRow.commit();

  // Sort threads: Main thread first, then others
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

    const rowValues = [
      label,
      null, null, // 2 empty columns
      threadMetrics.longTasks100,
      null, null, // 2 empty columns
      threadMetrics.longTasks500,
      null, null, // 2 empty columns
      threadMetrics.longestTask,
      null, null, // 2 empty columns
      threadMetrics.jsHeapMin,
      null, null, // 2 empty columns
      threadMetrics.jsHeapMax,
      null, null, // 2 empty columns
      label === 'Main thread' ? metrics.inp : null,
      null, null, // 2 empty columns
      label === 'Main thread' ? metrics.cls : null,
      null, null, // 2 empty columns
      label === 'Main thread' ? metrics.devToolsIssues : null
    ];

    const row = worksheet.getRow(currentRow++);
    row.values = rowValues;
    
    // Formatting numbers
    row.getCell(10).numFmt = '0.00'; // Longest task
    row.getCell(13).numFmt = '0.00'; // Heap Min
    row.getCell(16).numFmt = '0.00'; // Heap Max
    row.getCell(19).numFmt = '0.00'; // INP
    row.getCell(22).numFmt = '0.0000'; // CLS
    
    row.commit();
  }

  // Add an empty row for spacing between runs
  currentRow++;
  
  return currentRow;
}

async function main() {
  logger.info(`Scanning ${TRACES_OUTPUT_DIR} for traces...`);
  
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
  
  // Group files by scenario
  const groups: Record<string, GroupedMetrics> = {};
  
  for (const file of files) {
    const fullPath = path.join(TRACES_OUTPUT_DIR, file);
    try {
      const scenarioName = getScenarioName(file);
      const metrics = parseTrace(fullPath);
      
      if (!groups[scenarioName]) {
        groups[scenarioName] = { scenarioName, runs: [] };
      }
      
      groups[scenarioName].runs.push({
        fileName: file,
        metrics
      });
    } catch (err) {
      logger.error(`Error parsing ${file}: ${getErrorMessage(err)}`);
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Profiling Tool';
  workbook.lastModifiedBy = 'Profiling Tool';
  workbook.created = new Date();

  // Create one tab per scenario
  for (const group of Object.values(groups)) {
    // Excel tab names are limited to 31 chars and cannot contain some characters
    let tabName = group.scenarioName.substring(0, 31).replace(/[\[\]\*\?\/\\]/g, '_');
    
    // Ensure unique tab names if truncated names collide
    let suffix = 1;
    const originalTabName = tabName;
    while (workbook.getWorksheet(tabName)) {
      const suffixStr = `(${suffix++})`;
      tabName = originalTabName.substring(0, 31 - suffixStr.length) + suffixStr;
    }

    const worksheet = workbook.addWorksheet(tabName);
    
    // Set headers with 2 empty columns between each
    const headerRow = worksheet.getRow(1);
    const headers = [
      'Thread',
      null, null,
      'Long tasks > 100 ms',
      null, null,
      'Long tasks > 500 ms',
      null, null,
      'Longest task (ms)',
      null, null,
      'JS heap min (MB)',
      null, null,
      'JS heap max (MB)',
      null, null,
      'INP',
      null, null,
      'CLS',
      null, null,
      'DevTools issues'
    ];
    headerRow.values = headers;
    headerRow.font = { bold: true };
    headerRow.commit();

    // Auto-size the Thread column
    worksheet.getColumn(1).width = 25;

    let nextRow = 3; // Start runs from row 3
    
    // Sort runs by their name/index
    group.runs.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
    
    for (const run of group.runs) {
      nextRow = addRunToWorksheet(worksheet, run.fileName, run.metrics, nextRow);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outputFileName = `Metrics_Report_${timestamp}.xlsx`;
  const outputPath = path.join(TRACES_OUTPUT_DIR, outputFileName);

  try {
    await workbook.xlsx.writeFile(outputPath);
    logger.success(`Aggregated report saved to: ${outputPath}`);
  } catch (err) {
    logger.error(`Failed to save Excel report: ${getErrorMessage(err)}`);
  }
}

if (require.main === module) {
  main().catch((err: unknown) => {
    const msg = getErrorMessage(err);
    logger.error(`Execution Blocked: ${msg}`);
    process.exit(1);
  });
}
