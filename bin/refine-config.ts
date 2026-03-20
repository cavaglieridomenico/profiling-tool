import fs from 'fs';
import path from 'path';
import { getMetricsFromExcel } from '../src/report-generator/excel-reader';
import { ReportConfigSchema } from '../src/report-generator/types';
import { parseJsonc } from '../src/orchestrator/config';
import { GeminiService } from '../src/llm/gemini-service';
import { STYLE_GUIDE_PROMPT } from '../src/report-generator/style-guide';
import { logger, getErrorMessage } from '../src/utils';
import dotenv from 'dotenv';

// Load API keys immediately
dotenv.config();

// Helper for delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Debug: Check if key is loaded
if (!process.env.GEMINI_API_KEY) {
  logger.warn('DEBUG: GEMINI_API_KEY is missing from process.env after dotenv.config()');
} else {
  logger.info('DEBUG: GEMINI_API_KEY is present');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log(
      'Usage: npm run refine-config <baseline_excel> <current_excel> <config_jsonc>'
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
  
  // Initialize service AFTER dotenv.config()
  const gemini = new GeminiService();

  logger.start(`Refining configuration with AI: ${configPath}`);

  try {
    // 1. Refine high-level Summary and Insights
    const overallContext = `
      Product: ${config.productName}
      Baseline: ${config.baseline.name} (${config.baseline.version})
      Current: ${config.current.name} (${config.current.version})
    `;

    if (config.report && config.report.some((i) => i.includes('TODO'))) {
      logger.info('Refining high-level report...');
      const reportPrompt = `
        You are a senior performance engineer. Based on this context: ${overallContext}, 
        write 3 specific performance insights or observations. 
        Each should be a single standalone paragraph. 
        ${STYLE_GUIDE_PROMPT}
        Return ONLY the report paragraphs separated by double newlines.
      `;
      const aiReport = await gemini.generateText(reportPrompt);
      config.report = aiReport.split('\n\n').filter((i) => i.trim());
      await sleep(12000);
    }

    // 2. Refine individual Test Case reports
    for (const tc of config.testCases) {
      if (tc.report?.includes('TODO')) {
        logger.info(`Refining analysis for: ${tc.name}...`);

        const baselineMetrics = await getMetricsFromExcel(
          baselineExcel,
          tc.baselineOverrides?.scenarioId || tc.scenarioId
        );
        const currentMetrics = await getMetricsFromExcel(
          currentExcel,
          tc.scenarioId
        );

        const metricsSummary = Object.entries(currentMetrics)
          .map(
            ([k, v]) => `${k}: ${v} (Baseline: ${baselineMetrics[k] || 'N/A'})`
          )
          .join('\n');

        const tcPrompt = `
          Analyze the performance of "${tc.name}" for ${config.productName}.
          Metrics:
          ${metricsSummary}

          ${STYLE_GUIDE_PROMPT}
          Write a professional 2-sentence performance analysis paragraph. 
          If data is missing or N/A, just state that performance remains consistent with baseline expectations.
          Return ONLY the analysis text.
        `;

        tc.report = await gemini.generateText(tcPrompt);
        await sleep(12000);
      }
    }

    // 3. Save the refined config
    const refinedJson = JSON.stringify(config, null, 2);
    // Keep the instructions at the top
    const finalContent = `/**
 * AI-REFINED REPORT CONFIGURATION
 * Generated on: ${new Date().toISOString()}
 */
${refinedJson}`;

    fs.writeFileSync(configPath, finalContent);
    logger.success(`Refinement complete! File updated: ${configPath}`);
    logger.info('You can now run "npm run report" to generate the final MD.');

  } catch (err) {
    logger.error(`Refinement failed: ${getErrorMessage(err)}`);
    process.exit(1);
  }
}

main();
