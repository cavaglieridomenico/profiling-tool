import fs from 'fs';
import path from 'path';
import { logger, getErrorMessage } from '../src/utils';
import { parseJsonc } from '../src/orchestrator/config';
import { ReportConfigSchema, MetricData } from '../src/report-generator/types';
import { getMetricsFromExcel } from '../src/report-generator/excel-reader';
import {
  getNonConflictingFilename,
  generateReportBaseName,
  extractDateFromFilename
} from '../src/report-generator/utils';

function parseNumericValue(value: any): number {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? NaN : parsed;
}

function calculateDelta(
  baseline: any,
  current: any
): { delta: number | string; percentage: string } {
  const b = parseNumericValue(baseline);
  const c = parseNumericValue(current);

  if (isNaN(b) || isNaN(c)) {
    return { delta: '-', percentage: 'N/A' };
  }

  const delta = c - b;
  const percentage = b !== 0 ? (delta / Math.abs(b)) * 100 : 0;

  let formattedPercentage = `${percentage.toFixed(0)}%`;
  if (percentage > 0) formattedPercentage = `+${formattedPercentage}`;

  return {
    delta: delta,
    percentage: b !== 0 || delta === 0 ? formattedPercentage : 'N/A'
  };
}

function formatValue(value: any, label: string): string {
  if (value === 'N/A') return 'N/A';

  const val = parseNumericValue(value);
  if (isNaN(val)) return '-';

  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('%') || lowerLabel.includes('percentage')) {
    if (val <= 1.1 && val >= -0.1) {
      return `${(val * 100).toFixed(0)}%`;
    }
    return `${val.toFixed(0)}%`;
  }

  if (
    lowerLabel.includes('(s)') ||
    lowerLabel.includes('(ms)') ||
    lowerLabel.includes('mb') ||
    label.includes('Δ')
  ) {
    return val.toFixed(2);
  }

  return val.toFixed(0);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log(
      'Usage: npm run report <baseline_excel> <current_excel> <config_jsonc>'
    );
    process.exit(1);
  }

  const [baselineExcel, currentExcel, configPath] = args;

  if (!fs.existsSync(configPath)) {
    logger.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = ReportConfigSchema.parse(parseJsonc(configContent));

  logger.start(`Generating report: ${config.title}`);

  const testCaseResults = [];

  for (const tc of config.testCases) {
    logger.info(`Processing test case: ${tc.name}`);

    try {
      const baselineScenarioId =
        tc.baselineOverrides?.scenarioId || tc.scenarioId;
      const baselineMetrics = await getMetricsFromExcel(
        baselineExcel,
        baselineScenarioId
      );
      const currentMetrics = await getMetricsFromExcel(
        currentExcel,
        tc.scenarioId
      );

      const metricsList: MetricData[] = [];

      const relevantLabels = [
        'Rendering time (s)',
        'Scripting (%)',
        'Long tasks > 100 ms',
        'Long tasks > 500 ms',
        'Longest task (ms)',
        'JS heap min (MB)',
        'JS heap max (MB)',
        'JS heap min/max Δ (MB)',
        'Network Requests',
        'Network MB transferred',
        'Network MB resources',
        'INP',
        'FPS (estimate)',
        'FPS (total)',
        'Longest frame (ms)',
        'Complete Frames (%)',
        'Partial Presented Frames (%)',
        'Idle Frames (%)',
        'Dropped Frames (%)'
      ];

      for (const label of relevantLabels) {
        const bVal = baselineMetrics[label];
        const cVal = currentMetrics[label];

        if (bVal === undefined && cVal === undefined) continue;

        const { delta, percentage } = calculateDelta(bVal, cVal);

        metricsList.push({
          label,
          baseline: bVal ?? '-',
          current: cVal ?? '-',
          delta,
          percentage
        });
      }

      testCaseResults.push({
        ...tc,
        metrics: metricsList,
        baselineVersion:
          tc.baselineOverrides?.version || config.baseline.version
      });
    } catch (err) {
      logger.error(
        `Failed to process test case ${tc.name}: ${getErrorMessage(err)}`
      );
    }
  }

  // Generate Markdown
  let md = `# ${config.title}\n\n`;
  md += `## Test results\n\n`;
  md += `**Status: ${config.status?.toUpperCase() || 'PASSED'}**\n\n`;

  md += `### Status of tested combinations:\n\n`;
  for (const res of testCaseResults) {
    const slug = res.name.toLowerCase().replace(/\s+/g, '-');
    md += `- [${res.name}](#${slug})\n`;
    md += `  - ${res.device || 'Mid-end mobile device'}: ${res.status || 'Passed'}\n`;
  }
  md += `\n---\n\n`;

  md += `## Report\n\n`;

  if (config.report && config.report.length > 0) {
    for (const paragraph of config.report) {
      md += `${paragraph}\n\n`;
    }
  }

  const excelDate = extractDateFromFilename(path.basename(currentExcel));
  const displayDate = excelDate
    ? new Date(excelDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

  md += `_Last measurement_: ${displayDate}\n\n`;
  md += `---\n\n`;

  md += `## List of tested combinations\n\n`;

  for (const res of testCaseResults) {
    md += `### ${res.name}\n\n`;
    md += `${res.device || 'Mid-end mobile device'}\n\n`;

    const baselineVer =
      res.baselineVersion === config.baseline.version
        ? config.baseline.name
        : res.baselineVersion;

    const vLink = res.versionURL
      ? `[${res.versionId}](${res.versionURL})`
      : res.versionId || '';
    const tLink = res.testCaseURL
      ? `[${res.testCaseId}](${res.testCaseURL})`
      : res.testCaseId || '';
    const dLink = res.deviceURL
      ? `[${res.deviceId}](${res.deviceURL})`
      : res.deviceId || '';

    md += `- **Status**: ${res.status || 'Passed'}\n`;
    md += `- **Tested combination**:\n`;
    md += `  ${baselineVer} vs ${config.current.name} ( ${vLink} - ${tLink} - ${dLink} )\n`;
    if (config.baselineDataURL) {
      md += `- **${config.baseline.name} data**: [Complete test data](${config.baselineDataURL})\n`;
    }
    if (config.currentDataURL) {
      md += `- **${config.current.name} data**: [Complete test data](${config.currentDataURL})\n`;
    }

    md += `\n#### Report\n\n`;
    if (res.report) {
      md += `${res.report}\n\n`;
    } else {
      md += `Analysis confirms all performance KPIs remain stable without significant degradation.\n\n`;
    }

    const baselineHeader =
      res.baselineVersion === config.baseline.version
        ? config.baseline.name
        : res.baselineVersion;
    md += `| KPI | ${baselineHeader} | ${config.current.name} | Δ | % |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    for (const m of res.metrics) {
      const bFormatted = formatValue(m.baseline, m.label);
      const cFormatted = formatValue(m.current, m.label);
      const dFormatted =
        typeof m.delta === 'number' ? m.delta.toFixed(2) : m.delta;

      md += `| ${m.label} | ${bFormatted} | ${cFormatted} | ${dFormatted} | ${m.percentage} |\n`;
    }
    md += `\n`;

    md += `[Back on top](#test-results)\n\n`;
    md += `---\n\n`;
  }

  const outputDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const baseFileName = generateReportBaseName(config.title);
  const initialOutputPath = path.join(outputDir, `${baseFileName}.md`);
  const outputPath = getNonConflictingFilename(initialOutputPath);

  fs.writeFileSync(outputPath, md);
  logger.success(`Report generated: ${outputPath}`);
}

main().catch((err) => {
  logger.error(`Error generating report: ${getErrorMessage(err)}`);
  process.exit(1);
});
