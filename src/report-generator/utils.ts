import fs from 'fs';
import path from 'path';
/**
 * Generates a consistent base filename for reports and configs.
 * Format: [Title]_[YYYY-MM-DD]
 */
export function generateReportBaseName(title: string): string {
  const sanitizedTitle = title.replace(/[:\\/?"<>|]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().split('T')[0];
  return `${sanitizedTitle}_${date}`;
}

/**
 * Finds a non-conflicting filename by appending a progressive number.
...
 * Example: report-config.jsonc -> report-config-1.jsonc -> report-config-2.jsonc
 */
export function getNonConflictingFilename(basePath: string): string {
  if (!fs.existsSync(basePath)) {
    return basePath;
  }

  const ext = path.extname(basePath);
  const dir = path.dirname(basePath);
  const base = path.basename(basePath, ext);

  let counter = 1;
  while (true) {
    const newPath = path.join(dir, `${base}-${counter}${ext}`);
    if (!fs.existsSync(newPath)) {
      return newPath;
    }
    counter++;
  }
}
