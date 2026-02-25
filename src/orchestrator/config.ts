export interface TimelineItem {
  targetUrl?: string;
  setupCommands?: string[];
  caseName?: string;
  traceName?: string;
  /**
   * Optional: Number of times to repeat this timeline item.
   * Defaults to 1.
   */
  runs?: number;
  /**
   * Optional: Wait condition for navigation (load, domcontentloaded, networkidle0, networkidle2).
   * Defaults to 'load'.
   */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  /**
   * Optional: Delay in milliseconds to wait AFTER the navigation event completes 
   * but BEFORE setup commands or the test case starts.
   */
  postNavigationDelay?: number;
}

export interface OrchestratorConfig {
  timeline: TimelineItem[];
  setup: {
    connect?: boolean;
    checkThermal?: boolean;
    /**
     * Optional environment name (e.g. 'vmcore', 'pdwuat').
     * Corresponds to PUPPETEER_ENV variable.
     */
    puppeteerEnv?: string;
    /**
     * If true, the tool will exit if a newer Puppeteer version is available.
     */
    strictVersionCheck?: boolean;
  };
}

export function parseJsonc(content: string): any {
  // Regex to strip block comments and single line comments
  const json = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  return JSON.parse(json);
}
