import { z } from 'zod';

export const ReportTestCaseSchema = z.object({
  name: z.string(),
  scenarioId: z.string(), // The tab name in Excel (or prefix)
  device: z.string().optional(), // Descriptive device name
  description: z.string().optional(),
  versionId: z.string().optional(),
  versionURL: z.string().optional(),
  testCaseId: z.string().optional(),
  testCaseURL: z.string().optional(),
  deviceId: z.string().optional(),
  deviceURL: z.string().optional(),
  thresholds: z.record(z.string(), z.number()).optional(),
  baselineOverrides: z
    .object({
      scenarioId: z.string().optional(),
      version: z.string().optional()
    })
    .optional()
});

export const ReportConfigSchema = z.object({
  title: z.string(),
  productName: z.string().optional(),
  baselineDataURL: z.string().optional(),
  currentDataURL: z.string().optional(),
  baseline: z.object({
    name: z.string(),
    version: z.string()
  }),
  current: z.object({
    name: z.string(),
    version: z.string()
  }),
  summary: z.string().optional(),
  insights: z.array(z.string()).optional(),
  testCases: z.array(ReportTestCaseSchema)
});

export type ReportConfig = z.infer<typeof ReportConfigSchema>;
export type ReportTestCase = z.infer<typeof ReportTestCaseSchema>;

export interface MetricData {
  label: string;
  baseline: number | string;
  current: number | string;
  delta: number | string;
  percentage: string;
  threshold?: number;
}
