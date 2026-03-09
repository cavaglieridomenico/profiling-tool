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

function getScenarioName(fileName: string): string {
  const base = path.basename(fileName, '.json');
  const parts = base.split('-');
  if (parts.length >= 3) {
    return parts.slice(0, 3).join('-');
  }
  return base;
}

/**
 * Populates a fixed 5-row block for a specific run.
 * Columns are now continuous (no empty gaps).
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

  const threadEntries = Object.entries(metrics.threads).sort((a, b) => {
    if (a[1].name === 'Main thread') return -1;
    if (b[1].name === 'Main thread') return 1;
    return a[1].name.localeCompare(b[1].name);
  });

  const mainThread = threadEntries.find(t => t[1].name === 'Main thread');
  const workers = threadEntries.filter(t => t[1].name !== 'Main thread');

  const writeThreadRow = (rowNum: number, label: string, tMetrics?: ThreadMetrics, isMain: boolean = false) => {
    const row = worksheet.getRow(rowNum);
    
    // Continuous mapping (No gaps)
    const rowValues = [
      label,                             // 1: Category
      null,                              // 2: Rendering time (s)
      null,                              // 3: Scripting (s)
      null,                              // 4: Scripting (%)
      tMetrics ? tMetrics.longTasks100 : null, // 5: Long tasks > 100 ms
      tMetrics ? tMetrics.longTasks500 : null, // 6: Long tasks > 500 ms
      tMetrics ? tMetrics.longestTask : null,  // 7: Longest task (ms)
      tMetrics ? tMetrics.jsHeapMin : null,    // 8: JS heap min (MB)
      tMetrics ? tMetrics.jsHeapMax : null,    // 9: JS heap max (MB)
      null,                              // 10: Network blocking resources
      null,                              // 11: Network Requests
      null,                              // 12: Network MB transferred
      null,                              // 13: Network MB resources
      isMain ? metrics.inp : null,       // 14: INP
      isMain ? metrics.cls : null,       // 15: CLS
      null,                              // 16: FPS (total)
      null,                              // 17: Longest frame (ms)
      null,                              // 18: Complete Frames
      null,                              // 19: Partially-presented Frames
      null,                              // 20: Idle Frames
      null,                              // 21: Dropped Frames
      isMain ? metrics.devToolsIssues : null // 22: DevTools issues
    ];
    
    row.values = rowValues;
    
    // Number Formatting
    if (tMetrics) {
        row.getCell(7).numFmt = '0.00'; // Longest task
        row.getCell(8).numFmt = '0.00'; // Heap Min
        row.getCell(9).numFmt = '0.00'; // Heap Max
    }
    if (isMain) {
        row.getCell(14).numFmt = '0.00'; // INP
        row.getCell(15).numFmt = '0.0000'; // CLS
    }
    row.commit();
  };

  writeThreadRow(startRow + 1, 'Main thread', mainThread?.[1], true);

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
  workbook.created = new Date();

  for (const group of Object.values(groups)) {
    const tabName = group.scenarioName.substring(0, 31).replace(/[\[\]\*\?\/\\]/g, '_');
    const worksheet = workbook.addWorksheet(tabName);

    // Continuous Header Structure
    const headers = [
      'Category',
      'Rendering time (s)',
      'Scripting (s)',
      'Scripting (%)',
      'Long tasks > 100 ms',
      'Long tasks > 500 ms',
      'Longest task (ms)',
      'JS heap min (MB)',
      'JS heap max (MB)',
      'Network blocking resources',
      'Network Requests',
      'Network MB transferred',
      'Network MB resources',
      'INP',
      'CLS',
      'FPS (total)',
      'Longest frame (ms)',
      'Complete Frames',
      'Partially-presented Frames',
      'Idle Frames',
      'Dropped Frames',
      'DevTools issues'
    ];
    
    const headerRow = worksheet.getRow(1);
    headerRow.values = headers;
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
    };
    headerRow.commit();

    group.runs.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
    const topRuns = group.runs.slice(0, 3);

    for (let i = 0; i < 3; i++) {
        const run = topRuns[i];
        const startRow = 2 + (i * 5);
        if (run) {
            populateRunBlock(worksheet, run.fileName, run.metrics, startRow);
        } else {
            const emptyRow = worksheet.getRow(startRow);
            emptyRow.getCell(1).value = `Run #${i + 1} (Missing)`;
            emptyRow.getCell(1).font = { italic: true };
            emptyRow.commit();
        }
    }

    // Auto-fit Column Widths based on content
    worksheet.columns.forEach((column, i) => {
        let maxColumnLength = headers[i].length;
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            const cellValue = row.getCell(i + 1).value;
            if (cellValue) {
                const cellLength = cellValue.toString().length;
                if (cellLength > maxColumnLength) {
                    maxColumnLength = cellLength;
                }
            }
        });
        column.width = maxColumnLength < 12 ? 12 : maxColumnLength + 2;
    });
  }

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  const outputFileName = `Metrics_Report_${timestamp}.xlsx`;
  const outputPath = path.join(TRACES_OUTPUT_DIR, outputFileName);

  await workbook.xlsx.writeFile(outputPath);
  logger.success(`Aggregated report saved to: ${outputPath}`);
}

if (require.main === module) {
  main().catch((err: unknown) => {
    logger.error(`Execution Blocked: ${getErrorMessage(err)}`);
    process.exit(1);
  });
}
