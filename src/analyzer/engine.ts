import { Browser, Page } from 'puppeteer';
import { logger } from '../utils';

export interface AuditResult {
  name: string;
  score?: number;
  data: any;
  passed: boolean;
  observations: string[];
}

export interface IAudit {
  name: string;
  run(page: Page, browser: Browser, mode: string): Promise<AuditResult>;
}

export class AnalyzerEngine {
  private audits: IAudit[] = [];

  constructor(
    private browser: Browser,
    private page: Page
  ) {}

  addAudit(audit: IAudit) {
    this.audits.push(audit);
    return this;
  }

  async runAll(mode: string): Promise<AuditResult[]> {
    const results: AuditResult[] = [];

    for (const audit of this.audits) {
      logger.info(`🚀 Running audit: ${audit.name}...`);
      try {
        const result = await audit.run(this.page, this.browser, mode);
        results.push(result);
        if (result.passed) {
          logger.success(`✅ ${audit.name} completed successfully.`);
        } else {
          logger.warn(`⚠️ ${audit.name} completed with issues.`);
        }
      } catch (error: any) {
        logger.error(`❌ ${audit.name} failed: ${error.message}`);
        results.push({
          name: audit.name,
          passed: false,
          data: null,
          observations: [`Audit failed: ${error.message}`]
        });
      }
    }

    return results;
  }
}
