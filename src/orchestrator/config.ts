export interface TimelineItem {
  targetUrl: string;
  setupCommands?: string[];
  caseName: string;
}

export interface OrchestratorConfig {
  runs: number;
  timeline: TimelineItem[];
  setup: {
    connect?: boolean;
    checkThermal?: boolean;
    /**
     * Optional environment name (e.g. 'vmcore', 'pdwuat').
     * Corresponds to PUPPETEER_ENV variable.
     */
    puppeteerEnv?: string;
  };
}

export function parseJsonc(content: string): any {
  // Regex to strip block comments and single line comments
  const json = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  return JSON.parse(json);
}
