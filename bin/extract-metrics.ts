import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseTrace } from '../src/trace-parser';
import { TRACES_OUTPUT_DIR } from '../src/config/constants';
import { logger, getErrorMessage } from '../src/utils';
import { TraceMetrics, ThreadMetrics } from '../src/types';

interface GroupedMetrics {
  scenarioName: string;
  runs: {
    fileName: string;
    metrics: TraceMetrics;
  }[];
}

/**
 * Extracts a scenario name from a trace filename for tab aggregation.
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
 * Populates a fixed 5-row block for a specific run.
 * Rows: Run Title, Main Thread, Worker 1, Worker 2, Worker 3
 */
function populateRunBlock(
  worksheet: ExcelJS.Worksheet,
  runName: string,
  metrics: TraceMetrics,
  startRow: number
): void {
  // 1. Run Title Row
  const titleRow = worksheet.getRow(startRow);
  titleRow.getCell(1).value = runName;
  titleRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' } // Dark Blue
  };
  titleRow.commit();

  // Sort threads: Main thread first
  const threadEntries = Object.entries(metrics.threads).sort((a, b) => {
    if (a[1].name === 'Main thread') return -1;
    if (b[1].name === 'Main thread') return 1;
    return a[1].name.localeCompare(b[1].name);
  });

  const mainThread = threadEntries.find(t => t[1].name === 'Main thread');
  const workers = threadEntries.filter(t => t[1].name !== 'Main thread');

  // Helper to write a thread row
  const writeThreadRow = (rowNum: number, label: string, tMetrics?: ThreadMetrics, isMain: boolean = false) => {
    const row = worksheet.getRow(rowNum);
    const values = [
      label,
      null, null,
      tMetrics ? tMetrics.longTasks100 : null,
      null, null,
      tMetrics ? tMetrics.longTasks500 : null,
      null, null,
      tMetrics ? tMetrics.longestTask : null,
      null, null,
      tMetrics ? tMetrics.jsHeapMin : null,
      null, null,
      tMetrics ? tMetrics.jsHeapMax : null,
      null, null,
      isMain ? metrics.inp : null,
      null, null,
      isMain ? metrics.cls : null,
      null, null,
      isMain ? metrics.devToolsIssues : null
    ];
    row.values = values;
    
    // Formatting
    if (tMetrics || isMain) {
        row.getCell(10).numFmt = '0.00'; // Longest task
        row.getCell(13).numFmt = '0.00'; // Heap Min
        row.getCell(16).numFmt = '0.00'; // Heap Max
        row.getCell(19).numFmt = '0.00'; // INP
        row.getCell(22).numFmt = '0.0000'; // CLS
    }
    row.commit();
  };

  // 2. Main Thread (Row 2 of block)
  writeThreadRow(startRow + 1, 'Main thread', mainThread?.[1], true);

  // 3-5. Workers (Rows 3-5 of block)
  for (let i = 0; i < 3; i++) {
    const worker = workers[i];
    const label = worker ? `Web Worker #${i + 1}` : `Web Worker #${i + 1} (N/A)`;
    writeThreadRow(startRow + 2 + i, label, worker?.[1], false);
  }
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

  logger.start(`Processing ${files.length} trace files into fixed 16-row blocks...`);
  
  const groups: Record<string, GroupedMetrics> = {};
  for (const file of files) {
    const fullPath = path.join(TRACES_OUTPUT_DIR, file);
    try {
      const scenarioName = getScenarioName(file);
      const metrics = parseTrace(fullPath);
      if (!groups[scenarioName]) groups[scenarioName] = { scenarioName, runs: [] };
      groups[scenarioName].runs.push({ fileName: file, metrics });
    } catch (err) {
      logger.error(`Error parsing ${file}: ${getErrorMessage(err)}`);
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Profiling Tool';
  workbook.lastModifiedBy = 'Profiling Tool';
  workbook.created = new Date();

  for (const group of Object.values(groups)) {
    const tabName = group.scenarioName.substring(0, 31).replace(/[\[\]\*\?\/\\]/g, '_');
    const worksheet = workbook.addWorksheet(tabName);

    // Row 1: Headers
    const headerRow = worksheet.getRow(1);
    headerRow.values = [
      'Category', null, null,
      'Long tasks > 100 ms', null, null,
      'Long tasks > 500 ms', null, null,
      'Longest task (ms)', null, null,
      'JS heap min (MB)', null, null,
      'JS heap max (MB)', null, null,
      'INP', null, null,
      'CLS', null, null,
      'DevTools issues'
    ];
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
    };
    headerRow.commit();
    worksheet.getColumn(1).width = 30;

    // Sort runs and take only the first 3
    group.runs.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
    const topRuns = group.runs.slice(0, 3);

    // Row 2-6: Run #1
    // Row 7-11: Run #2
    // Row 12-16: Run #3
    for (let i = 0; i < 3; i++) {
        const run = topRuns[i];
        const startRow = 2 + (i * 5);
        if (run) {
            populateRunBlock(worksheet, run.fileName, run.metrics, startRow);
        } else {
            // Placeholder for missing runs
            const emptyRow = worksheet.getRow(startRow);
            emptyRow.getCell(1).value = `Run #${i + 1} (Missing)`;
            emptyRow.getCell(1).font = { italic: true };
            emptyRow.commit();
        }
    }
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  const outputFileName = `Metrics_Report_${timestamp}.xlsx`;
  const outputPath = path.join(TRACES_OUTPUT_DIR, outputFileName);

  await workbook.xlsx.writeFile(outputPath);
  logger.success(`Fixed 16-row report saved to: ${outputPath}`);
}

if (require.main === module) {
  main().catch((err: unknown) => {
    logger.error(`Execution Blocked: ${getErrorMessage(err)}`);
    process.exit(1);
  });
}
