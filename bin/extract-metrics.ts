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
  'Scripting (%)', // Row 2 in label list, Row 3 in Excel
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
  'FPS (estimate)',
  'FPS (total)', // Row 15 in label list, Row 16 in Excel
  'Longest frame (ms)',
  'Complete Frames (%)',
  'Partial Presented Frames (%)',
  'Idle Frames (%)',
  'Dropped Frames (%)'
];

/**
 * Populates a 5-column block for a specific run.
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

  const mainThread = threadEntries.find((t) => t[1].name === 'Main thread');
  const workers = threadEntries.filter((t) => t[1].name !== 'Main thread');

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

  const setThreadValues = (
    colIndex: number,
    tMetrics?: ThreadMetrics,
    isMain: boolean = false
  ) => {
    if (!tMetrics && !isMain) return;

    // Row 3: Scripting (%) for this specific thread/column
    worksheet.getRow(3).getCell(colIndex).value = {
      formula: `IFERROR(AVERAGE(C3:Q3) / B2, "N/A")`
    };
    worksheet.getRow(3).getCell(colIndex).numFmt = '0.00%';

    if (tMetrics) {
      // Long Tasks (Rows 4, 5, 6)
      worksheet.getRow(4).getCell(colIndex).value = tMetrics.longTasks100;
      worksheet.getRow(5).getCell(colIndex).value = tMetrics.longTasks500;
      worksheet.getRow(6).getCell(colIndex).value = tMetrics.longestTask;
      worksheet.getRow(6).getCell(colIndex).numFmt = '0.00';

      // Heap (Rows 7, 8)
      worksheet.getRow(7).getCell(colIndex).value = tMetrics.jsHeapMin;
      worksheet.getRow(7).getCell(colIndex).numFmt = '0.00';
      worksheet.getRow(8).getCell(colIndex).value = tMetrics.jsHeapMax;
      worksheet.getRow(8).getCell(colIndex).numFmt = '0.00';
    }

    if (isMain) {
      // INP (Row 13), CLS (Row 14)
      worksheet.getRow(13).getCell(colIndex).value = metrics.inp;
      worksheet.getRow(13).getCell(colIndex).numFmt = '0.00';
      worksheet.getRow(14).getCell(colIndex).value = metrics.cls;
      worksheet.getRow(14).getCell(colIndex).numFmt = '0.0000';
    }
  };

  setThreadValues(startCol + 1, mainThread?.[1], true);
  for (let i = 0; i < 3; i++) {
    setThreadValues(startCol + 2 + i, workers[i]?.[1], false);
  }
}

async function main() {
  if (!fs.existsSync(TRACES_OUTPUT_DIR)) {
    logger.error(`Traces directory not found: ${TRACES_OUTPUT_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(TRACES_OUTPUT_DIR)
    .filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    logger.warn('No .json trace files found.');
    process.exit(0);
  }

  logger.start(
    `Processing ${files.length} trace files into transposed grid...`
  );

  const groups: Record<string, GroupedMetrics> = {};
  for (const file of files) {
    const fullPath = path.join(TRACES_OUTPUT_DIR, file);
    try {
      const scenarioName = getScenarioName(file);
      const metrics = parseTrace(fullPath);
      if (!groups[scenarioName])
        groups[scenarioName] = { scenarioName, runs: [] };
      groups[scenarioName].runs.push({ fileName: file, metrics });
    } catch (err) {
      logger.error(`Error parsing ${file}: ${getErrorMessage(err)}`);
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Profiling Tool';
  workbook.created = new Date();

  for (const group of Object.values(groups)) {
    const tabName = group.scenarioName
      .substring(0, 31)
      .replace(/[\[\]\*\?\/\\]/g, '_');
    const worksheet = workbook.addWorksheet(tabName);
    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    // Column A: Metric Labels
    worksheet.getRow(1).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
    METRIC_ROWS.forEach((metricName, index) => {
      const row = worksheet.getRow(index + 2);
      const cell = row.getCell(1);
      cell.value = metricName;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    });

    // Column B: Aggregated Column
    const avgHeader = worksheet.getRow(1).getCell(2);
    avgHeader.value = group.scenarioName;
    avgHeader.font = { bold: true };
    avgHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBFBFBF' }
    };

    for (let r = 2; r <= 21; r++) {
      const cell = worksheet.getRow(r).getCell(2);

      if (r === 3) {
        // Scripting (%)
        cell.value = { formula: `IFERROR(AVERAGE(C3:Q3) / B2, "N/A")` };
        cell.numFmt = '0.00%';
      } else if (r >= 18 && r <= 21) {
        // Frame % metrics: Ratio of average count divided by average FPS Total in B16
        cell.value = { formula: `IFERROR(AVERAGE(C${r}:Q${r}) / B16, "N/A")` };
        cell.numFmt = '0.00%';
      } else {
        let range = `C${r}:Q${r}`;
        if (r >= 4 && r <= 6) {
          // Long Tasks (Rows 4, 5, 6)
          range = `D${r},I${r},N${r}`;
        }
        cell.value = { formula: `IFERROR(AVERAGE(${range}), "N/A")` };
        cell.numFmt = '0.00';
      }
      cell.font = { bold: true };
    }

    // Columns C-Q: The 3 Run Blocks
    group.runs.sort((a, b) =>
      a.fileName.localeCompare(b.fileName, undefined, { numeric: true })
    );
    const topRuns = group.runs.slice(0, 3);

    for (let i = 0; i < 3; i++) {
      const run = topRuns[i];
      const startCol = 3 + i * 5;
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
      let maxLen = 10;
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        const val = row.getCell(i + 1).value;
        if (val) {
          const text = typeof val === 'object' ? 'Formula' : val.toString();
          if (text.length > maxLen) maxLen = text.length;
        }
      });
      column.width = maxLen < 15 ? 15 : maxLen + 2;
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
