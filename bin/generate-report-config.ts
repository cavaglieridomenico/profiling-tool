import fs from 'fs';
import path from 'path';
import { listScenarioIds } from '../src/report-generator/excel-reader';
import { ReportConfig } from '../src/report-generator/types';
import {
  getNonConflictingFilename,
  generateReportBaseName
} from '../src/report-generator/utils';
import {
  PRODUCT_TEST_CASE_MAP,
  extractTestCaseId
} from '../src/report-generator/report-test-cases-map';
import { PRODUCT_VERSION_MAP } from '../src/report-generator/report-version-map';
import {
  DEVICE_MAP,
  extractDeviceId
} from '../src/report-generator/report-device-map';
import { logger, getErrorMessage } from '../src/utils';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(
      'Usage: npm run generate-config <baseline_excel> <current_excel> [output_path]'
    );
    process.exit(1);
  }

  if (args.length > 3) {
    logger.warn(
      'Detected more than 3 arguments. If your filenames contain spaces, please ensure they are wrapped in double quotes.'
    );
  }

  const [baselineExcel, currentExcel, outputPathArg] = args;
  const initialOutputPath = outputPathArg || 'report-config.jsonc';
  const outputPath = getNonConflictingFilename(initialOutputPath);

  const currentBasename = path.basename(currentExcel, '.xlsx');
  // First item after splitting by _ (e.g. VMMV from VMMV_TV28_01-VMMV 5.6-Metrics...)
  const productName = currentBasename.split('_')[0];

  if (!PRODUCT_TEST_CASE_MAP[productName]) {
    logger.error(
      `Product "${productName}" not found in the test case list. Exiting.`
    );
    process.exit(1);
  }

  const productList = PRODUCT_TEST_CASE_MAP[productName];

  logger.start(
    `Generating report config for ${productName} from ${baselineExcel} and ${currentExcel}`
  );

  try {
    const baselineScenarios = await listScenarioIds(baselineExcel);
    const currentScenarios = await listScenarioIds(currentExcel);

    // Baseline scenarios are typically truncated to 31 chars in the Excel report.
    // We try to match them.
    const testCases = currentScenarios.map((scenarioId) => {
      // Human-readable name from product list
      const tcId = extractTestCaseId(scenarioId);
      const tcDefinition = tcId ? productList.find(t => t.testCase === tcId) : undefined;
      
      const humanName = tcDefinition ? tcDefinition.testCaseDescription : scenarioId.split('-').join(' ');
      const humanDescription = 'TODO: Add key performance insights.';

      // Device mapping
      const deviceId = extractDeviceId(scenarioId);
      const deviceDefinition = deviceId ? DEVICE_MAP.find(d => d.device === deviceId) : undefined;
      const deviceDescription = deviceDefinition ? deviceDefinition.deviceDescription : 'TODO: Provide device description';

      // New Version / TC / Device fields for links
      const currentVerId = path.basename(currentExcel).split('-')[0].split('_').slice(1).join('_');
      const verList = PRODUCT_VERSION_MAP[productName] || [];
      const currentVerDef = verList.find((v) => v.version === currentVerId);

      // Find a matching scenario in baseline if possible
      // Try exact match first, then try stripping the version prefix (e.g. TV28_01-)
      let baselineMatch = baselineScenarios.find((b) => b === scenarioId);

      if (!baselineMatch) {
        const currentSuffix = scenarioId.includes('-')
          ? scenarioId.split('-').slice(1).join('-')
          : scenarioId;
        baselineMatch = baselineScenarios.find((b) => {
          const bSuffix = b.includes('-') ? b.split('-').slice(1).join('-') : b;
          return bSuffix === currentSuffix;
        });
      }

      // Final fallback: Match strictly by TC ID if suffix matching fails
      if (!baselineMatch && tcId) {
        baselineMatch = baselineScenarios.find((b) => extractTestCaseId(b) === tcId);
      }

      return {
        name: humanName,
        scenarioId: scenarioId,
        device: deviceDescription,
        description: humanDescription,
        versionId: currentVerId,
        versionURL: currentVerDef?.versionURL || '',
        testCaseId: tcId || '',
        testCaseURL: tcDefinition?.testCaseURL || '',
        deviceId: deviceId || '',
        deviceURL: deviceDefinition?.deviceURL || '',
        baselineOverrides: baselineMatch
          ? {
              scenarioId: baselineMatch
            }
          : {
              scenarioId: 'TODO: Provide baseline scenario ID if different',
              version: 'TODO: Provide baseline version'
            }
      };
    });

    const baselineBasename = path.basename(baselineExcel, '.xlsx');
    const currentBasename = path.basename(currentExcel, '.xlsx');

    const baselineId = baselineBasename.split('-')[0].split('_').slice(1).join('_');
    const currentId = currentBasename.split('-')[0].split('_').slice(1).join('_');

    const baselineVersionName =
      baselineBasename.split('-').length > 1
        ? baselineBasename.split('-')[1]
        : baselineId;
    const currentVersionName =
      currentBasename.split('-').length > 1
        ? currentBasename.split('-')[1]
        : currentId;

    const versionList = PRODUCT_VERSION_MAP[productName] || [];
    const baselineDef = versionList.find((v) => v.version === baselineId);
    const currentDef = versionList.find((v) => v.version === currentId);

    const baselineName = baselineDef
      ? baselineDef.versionDescription
      : baselineVersionName;
    const currentName = currentDef
      ? currentDef.versionDescription
      : currentVersionName;

    const config: ReportConfig = {
      title: `Test on ${currentName}`,
      productName: productName,
      baselineDataURL: 'TODO: Add baseline profiling data URL',
      currentDataURL: 'TODO: Add current profiling data URL',
      baseline: {
        name: baselineName,
        version: baselineId
      },
      current: {
        name: currentName,
        version: currentId
      },
      summary: 'TODO: Provide a high-level summary of the test results.',
      insights: [
        'TODO: Add key performance insights.',
        'TODO: Add regression notes if any.'
      ],
      testCases: testCases
    };

    const jsonContent = JSON.stringify(config, null, 2);

    const outputDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const baseFileName = generateReportBaseName(config.title);
    const initialOutputPath =
      outputPathArg || path.join(outputDir, `${baseFileName}.jsonc`);
    const outputPath = getNonConflictingFilename(initialOutputPath);

    // Add some comments to make it JSONC-like and guide the user
    const jsoncContent = `/**
 * REPORT CONFIGURATION - Quick Setup:
 * 1. Fill "baselineDataURL" and "currentDataURL" (once for all cases).
 * 2. Update "title" if needed.
 * 3. Add "summary" and "insights" paragraphs.
 * 4. Replace "TODO" descriptions in "testCases" with specific KPI analysis.
 */
${jsonContent}`;

    fs.writeFileSync(outputPath, jsoncContent);
    logger.success(`Draft configuration generated: ${outputPath}`);
    logger.info(
      `Please review and edit ${outputPath} before running "npm run report".`
    );
  } catch (err) {
    logger.error(`Failed to generate config: ${getErrorMessage(err)}`);
    process.exit(1);
  }
}

main();
