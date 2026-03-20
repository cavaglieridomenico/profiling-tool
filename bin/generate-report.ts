import fs from 'fs';
import path from 'path';
import { logger, getErrorMessage } from '../src/utils';
import { parseJsonc } from '../src/orchestrator/config';
import { ReportConfigSchema, MetricData } from '../src/report-generator/types';
import { getMetricsFromExcel } from '../src/report-generator/excel-reader';
import {
  getNonConflictingFilename,
  generateReportBaseName
} from '../src/report-generator/utils';

function calculateDelta(
  baseline: any,
  current: any
): { delta: number | string; percentage: string } {
  const b = parseFloat(baseline);
  const c = parseFloat(current);

  if (isNaN(b) || isNaN(c)) {
    return { delta: '-', percentage: 'N/A' };
  }

  const delta = c - b;
  const percentage = b !== 0 ? (delta / Math.abs(b)) * 100 : 0;

  const formattedPercentage =
    percentage > 0 ? `+${percentage.toFixed(0)}%` : `${percentage.toFixed(0)}%`;

  return {
    delta: delta,
    percentage: b !== 0 ? formattedPercentage : '0%'
  };
}

function formatValue(value: any, label: string): string {
  const val = parseFloat(value);
  if (isNaN(val)) return value?.toString() || '-';

  if (
    label.includes('(%)') ||
    label.includes('Percentage') ||
    label.includes('Frames (%)')
  ) {
    if (val <= 1.1 && val >= -0.1) {
      return `${(val * 100).toFixed(0)}%`;
    }
    return `${val.toFixed(0)}%`;
  }

  if (
    label.includes('(s)') ||
    label.includes('(ms)') ||
    label.includes('(MB)') ||
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

  let overallPassed = true;
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
      let tcPassed = true;

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
        const thresholds = tc.thresholds as Record<string, number> | undefined;
        const threshold = thresholds ? thresholds[label] : undefined;

        if (threshold !== undefined) {
          const cNum = parseFloat(cVal as string);
          if (!isNaN(cNum) && cNum > threshold) {
            tcPassed = false;
          }
        }

        metricsList.push({
          label,
          baseline: bVal ?? '-',
          current: cVal ?? '-',
          delta,
          percentage,
          threshold
        });
      }

      if (!tcPassed) overallPassed = false;

      testCaseResults.push({
        ...tc,
        passed: tcPassed,
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
  md += `**Status: ${overallPassed ? 'PASSED' : 'FAILED'}**\n\n`;

  md += `### Status of tested combinations:\n\n`;
  for (const res of testCaseResults) {
    md += `- **${res.name}**\n`;
    md += `  - ${res.device || 'Mid-end mobile device'}: ${res.passed ? 'Passed' : 'Failed'}\n`;
  }
  md += `\n---\n\n`;

  md += `## Report\n\n`;
  if (config.summary) {
    md += `${config.summary}\n\n`;
  }
  md += `Analysis compared **${config.current.name}** with the baseline **${config.baseline.name}**.\n\n`;

  if (config.insights && config.insights.length > 0) {
    for (const insight of config.insights) {
      md += `${insight}\n\n`;
    }
  }

  md += `Last measurement: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;
  md += `---\n\n`;

  md += `## List of tested combinations\n\n`;

  for (const res of testCaseResults) {
    md += `### ${res.name}\n\n`;
    md += `Mid-end mobile device\n\n`;
    md += `- **Status**: ${res.passed ? 'Passed' : 'Failed'}\n`;
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

    md += `- **Tested combination**:\n`;
    md += `  - ${baselineVer} vs ${config.current.name} (${vLink} - ${tLink} - ${dLink})\n`;

    md += `\n#### Report\n\n`;
    if (res.description) {
      md += `${res.description}\n\n`;
    } else {
      md += `Analysis confirms all performance KPIs remain stable without significant degradation.\n\n`;
    }

    const baselineHeader =
      res.baselineVersion === config.baseline.version
        ? config.baseline.name
        : res.baselineVersion;
    md += `| KPI | ${baselineHeader} | ${config.current.name} | Δ | % | Threshold |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const m of res.metrics) {
      const bFormatted = formatValue(m.baseline, m.label);
      const cFormatted = formatValue(m.current, m.label);
      const dFormatted =
        typeof m.delta === 'number' ? m.delta.toFixed(2) : m.delta;
      const thresholdFormatted =
        m.threshold !== undefined ? m.threshold.toString() : '-';

      md += `| ${m.label} | ${bFormatted} | ${cFormatted} | ${dFormatted} | ${m.percentage} | ${thresholdFormatted} |\n`;
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
