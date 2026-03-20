import ExcelJS from 'exceljs';

export async function getMetricsFromExcel(
  filePath: string,
  scenarioId: string
): Promise<Record<string, number | string>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // Find worksheet by name (exact or prefix)
  let worksheet: ExcelJS.Worksheet | undefined =
    workbook.getWorksheet(scenarioId);
  if (!worksheet) {
    // Try prefix match (since extract-metrics truncates to 31 chars)
    const truncatedId = scenarioId
      .substring(0, 31)
      .replace(/[\[\]\*\?\/\\]/g, '_');
    worksheet =
      workbook.worksheets.find((ws) => ws.name.startsWith(truncatedId)) ||
      undefined;
  }

  if (!worksheet) {
    throw new Error(
      `Worksheet for scenario "${scenarioId}" not found in ${filePath}`
    );
  }

  const metrics: Record<string, number | string> = {};

  // In extract-metrics.ts:
  // Column A: Labels (Row 2 to 22)
  // Column B: Aggregated Average
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 2) {
      const label = row.getCell(1).text;
      const value = row.getCell(2).value;

      if (label) {
        if (typeof value === 'object' && value !== null && 'result' in value) {
          metrics[label] = value.result as number;
        } else if (typeof value === 'number') {
          metrics[label] = value;
        } else {
          metrics[label] = row.getCell(2).text;
        }
      }
    }
  });

  return metrics;
}

export async function listScenarioIds(filePath: string): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook.worksheets.map((ws) => ws.name);
}
