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

const METRIC_ROWS = [
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

/**
 * Populates a 5-column block for a specific run.
 * Populates only currently defined data.
 */
function populateRunColumns(
  worksheet: ExcelJS.Worksheet,
  runName: string,
  metrics: TraceMetrics,
  startCol: number
): void {
  const threadEntries = Object.entries(metrics.threads).sort((a, b) => {
    if (a[1].name === 'Main thread') return -1;
    if (b[1].name === 'Main thread') return 1;
    return a[1].name.localeCompare(b[1].name);
  });

  const mainThread = threadEntries.find(t => t[1].name === 'Main thread');
  const workers = threadEntries.filter(t => t[1].name !== 'Main thread');

  const headers = [
    runName,
    'Main thread',
    'Web Worker #1',
    'Web Worker #2',
    'Web Worker #3'
  ];

  headers.forEach((label, i) => {
    const cell = worksheet.getRow(1).getCell(startCol + i);
    cell.value = label;
    cell.font = { bold: true };
    if (i === 0) {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  });

  const setThreadValues = (colIndex: number, tMetrics?: ThreadMetrics, isMain: boolean = false) => {
    if (!tMetrics && !isMain) return;

    if (tMetrics) {
        // Long Tasks (Rows 5, 6, 7)
        worksheet.getRow(5).getCell(colIndex).value = tMetrics.longTasks100;
        worksheet.getRow(6).getCell(colIndex).value = tMetrics.longTasks500;
        worksheet.getRow(7).getCell(colIndex).value = tMetrics.longestTask;
        worksheet.getRow(7).getCell(colIndex).numFmt = '0.00';
        
        // Heap (Rows 8, 9)
        worksheet.getRow(8).getCell(colIndex).value = tMetrics.jsHeapMin;
        worksheet.getRow(8).getCell(colIndex).numFmt = '0.00';
        worksheet.getRow(9).getCell(colIndex).value = tMetrics.jsHeapMax;
        worksheet.getRow(9).getCell(colIndex).numFmt = '0.00';
    }

    if (isMain) {
        // INP (Row 14), CLS (Row 15)
        worksheet.getRow(14).getCell(colIndex).value = metrics.inp;
        worksheet.getRow(14).getCell(colIndex).numFmt = '0.00';
        
        worksheet.getRow(15).getCell(colIndex).value = metrics.cls;
        worksheet.getRow(15).getCell(colIndex).numFmt = '0.0000';
        
        // DevTools Issues (Row 22)
        worksheet.getRow(22).getCell(colIndex).value = metrics.devToolsIssues;
    }
  };

  setThreadValues(startCol + 1, mainThread?.[1], true);
  for (let i = 0; i < 3; i++) {
    setThreadValues(startCol + 2 + i, workers[i]?.[1], false);
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

  logger.start(`Processing ${files.length} trace files into transposed grid...`);
  
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

    // Column A (1): Metric Labels
    const firstColHeader = worksheet.getRow(1).getCell(1);
    firstColHeader.value = 'Metric';
    firstColHeader.font = { bold: true };
    firstColHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };

    METRIC_ROWS.forEach((metricName, index) => {
        const row = worksheet.getRow(index + 2);
        const cell = row.getCell(1);
        cell.value = metricName;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    });

    // Column B (2): Average Column
    const avgHeader = worksheet.getRow(1).getCell(2);
    avgHeader.value = 'AVERAGE';
    avgHeader.font = { bold: true };
    avgHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFBFBF' } };

    for (let r = 2; r <= 22; r++) {
        const cell = worksheet.getRow(r).getCell(2);
        
        if (r === 4) { // Scripting (%)
            // Ratio formula based on B3 (Scripting) and B2 (Rendering)
            cell.value = { formula: `IFERROR(B3 / B2, "N/A")` };
            cell.numFmt = '0.00%';
        } else {
            let range = `C${r}:Q${r}`;
            if (r === 5 || r === 6 || r === 7) {
                range = `D${r},I${r},N${r}`;
            }
            cell.value = { formula: `IFERROR(AVERAGE(${range}), "N/A")` };
            cell.numFmt = '0.00';
        }
        cell.font = { bold: true };
    }

    // Columns C-Q (3-17): The 3 Run Blocks
    group.runs.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
    const topRuns = group.runs.slice(0, 3);

    for (let i = 0; i < 3; i++) {
        const run = topRuns[i];
        const startCol = 3 + (i * 5);
        if (run) {
            populateRunColumns(worksheet, run.fileName, run.metrics, startCol);
        } else {
            const cell = worksheet.getRow(1).getCell(startCol);
            cell.value = `Run #${i + 1} (Missing)`;
            cell.font = { italic: true };
        }
    }

    // Auto-fit Column Widths
    worksheet.columns.forEach((column, i) => {
        let maxColumnLength = 10;
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            const cellValue = row.getCell(i + 1).value;
            if (cellValue) {
                const text = typeof cellValue === 'object' ? 'Average Formula' : cellValue.toString();
                if (text.length > maxColumnLength) maxColumnLength = text.length;
            }
        });
        column.width = maxColumnLength < 15 ? 15 : maxColumnLength + 2;
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
