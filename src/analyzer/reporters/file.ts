import fs from 'fs';
import path from 'path';
import { AuditResult } from '../engine';
import { logger, getTimestampCET } from '../../utils';
import { formatReport } from './console';

function getOutputDir() {
  const outputDir = path.resolve(process.cwd(), 'analysis-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    logger.info(`Created directory: ${outputDir}`);
  }
  return outputDir;
}

function getFileName(url: string, mode: string, extension: string) {
  // Safe filename timestamp based on CET: "19/03/2026, 10:15:43" -> "19-03-2026--10-15-43"
  const cet = getTimestampCET().replace(/[\/, :]/g, '-');
  const domain = new URL(url).hostname.replace(/\./g, '-');
  return `analysis-${domain}-${mode}-${cet}.${extension}`;
}

export function reportToFile(results: AuditResult[], url: string, mode: string) {
  const outputDir = getOutputDir();
  const fileName = getFileName(url, mode, 'json');
  const filePath = path.join(outputDir, fileName);

  const reportData = {
    url,
    mode,
    timestamp: getTimestampCET(),
    results
  };

  fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
  logger.success(`Analysis report (JSON) saved to: ${filePath}`);
}

export function reportToTxt(results: AuditResult[], url: string, mode: string) {
  const outputDir = getOutputDir();
  const fileName = getFileName(url, mode, 'txt');
  const filePath = path.join(outputDir, fileName);

  const reportContent = `ANALYSIS REPORT FOR: ${url}\nMODE: ${mode.toUpperCase()}\nDATE: ${getTimestampCET()}\n${formatReport(results, mode)}`;

  fs.writeFileSync(filePath, reportContent);
  logger.success(`Analysis report (TXT) saved to: ${filePath}`);
}
