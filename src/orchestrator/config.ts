import { z } from 'zod';

/**
 * Zod schema for a single timeline item.
 */
export const TimelineItemSchema = z
  .object({
    targetUrl: z.string().optional(),
    /**
     * Optional: A list of command endpoints or COMMANDS.<KEY> to call BEFORE navigating.
     */
    preNavigationCommands: z.array(z.string()).default([]),
    /**
     * Optional: A list of command endpoints to configure network/config overrides.
     */
    configOverrides: z.array(z.string()).default([]),
    setupCommands: z.array(z.string()).default([]),
    caseName: z.string().optional(),
    traceName: z.string().optional(),
    /**
     * If true, skip the internal orchestrator navigation step.
     * Useful for test cases that handle their own navigation or for pure setup actions.
     */
    skipNavigation: z.boolean().default(false),
    /**
     * Optional: Number of times to repeat this timeline item.
     * Defaults to 1.
     */
    runs: z.number().int().positive().default(1),
    /**
     * Optional: Wait condition for navigation (load, domcontentloaded, networkidle0, networkidle2).
     * Defaults to 'load'.
     */
    waitUntil: z
      .enum(['load', 'domcontentloaded', 'networkidle0', 'networkidle2'])
      .default('load'),
    /**
     * Optional: Delay in milliseconds to wait AFTER the navigation event completes
     * but BEFORE setup commands or the test case starts.
     */
    postNavigationDelay: z.number().nonnegative().default(0),
    /**
     * Optional: Delay in milliseconds to wait AFTER the setup commands or the test case completes.
     */
    postCommandDelay: z.number().nonnegative().default(0),
  })
  .refine(
    (item) =>
      item.targetUrl ||
      item.caseName ||
      item.setupCommands.length > 0 ||
      item.preNavigationCommands.length > 0 ||
      item.configOverrides.length > 0,
    {
      message:
        'Timeline item must have at least one of: targetUrl, caseName, setupCommands, preNavigationCommands, or configOverrides',
    }
  );

/**
 * Zod schema for the root orchestrator configuration.
 */
export const OrchestratorConfigSchema = z.object({
  timeline: z.array(TimelineItemSchema),
  setup: z.object({
    connect: z.boolean().default(true),
    checkThermal: z.boolean().default(true),
    /**
     * Optional environment name (e.g. 'vmcore', 'pdwuat').
     * Corresponds to PUPPETEER_ENV variable.
     */
    puppeteerEnv: z.string().optional(),
    /**
     * If true, the tool will exit if a newer Puppeteer version is available.
     */
    strictVersionCheck: z.boolean().default(false),
  }),
});

export type TimelineItem = z.infer<typeof TimelineItemSchema>;
export type OrchestratorConfig = z.infer<typeof OrchestratorConfigSchema>;

export function parseJsonc(content: string): any {
  // Regex to strip block comments and single line comments
  const json = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  return JSON.parse(json);
}
