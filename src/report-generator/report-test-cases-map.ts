export interface TestCaseDefinition {
  testCase: string; // The TC ID, e.g., "TC01"
  testCaseDescription: string; // The human-readable name
  testCaseURL: string; // Optional reference URL
}

export const PRODUCT_TEST_CASE_MAP: Record<string, TestCaseDefinition[]> = {
  VMMV: [
    {
      testCase: 'TC01',
      testCaseDescription: 'VM from page load to Rendered glasses',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4155802261/TC01?atlOrigin=eyJpIjoiYjE3ZDZkMWQwNWY3NDIzNzg3MDMwNDNlNDY2YzNiZWQiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC04',
      testCaseDescription: 'VM slow horizontal head movement',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4156129618/TC04?atlOrigin=eyJpIjoiNTYwZTY1MDQzOTZkNDJhZmFjODI5YmNmZjcyZjI5MzAiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC05',
      testCaseDescription: 'Multi-VM all glasses rendered',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4155605277/TC05?atlOrigin=eyJpIjoiMzFiOWUwYmFmODNkNGZhODhjZDhlNWNiZWZmYWYwZmEiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC08',
      testCaseDescription: 'VM on PDP (Manual Selection)',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4239393334/TC08?atlOrigin=eyJpIjoiNmZiYWNiMGVjNWFiNGVjM2I3ZDVkZTljNGY1MjA4YzYiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC09',
      testCaseDescription: 'VM on PLP (Manual Selection)',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4238672412/TC09?atlOrigin=eyJpIjoiNDMyMWMwZmU1Y2MxNGI3NTlhODQxNGY5NWM3MjhmYmUiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC10',
      testCaseDescription: 'VMP video processing phase',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4155834682/TC10?atlOrigin=eyJpIjoiNDM2ZWFkMGFkM2YyNGNlOWI3MDc1OTdlZDE2YzQ5MTYiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC11',
      testCaseDescription: 'VMP slow horizontal head movement',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4156129649/TC11?atlOrigin=eyJpIjoiMDI4MjAzZTk0NzRmNGNjOTlhMzc5NmI1M2UzYjY0MmUiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC12',
      testCaseDescription:
        'VM from e-commerce page load to rendered "Try" button',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4156358885/TC12?atlOrigin=eyJpIjoiYTIxNmYxYjY4NDM0NDdiMWI2MmMwMmU2ZmJiZjczZjAiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC13',
      testCaseDescription: 'VMP picture processing phase',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4155900233/TC13?atlOrigin=eyJpIjoiMzQwYjBjZjZiZGViNDQ5MjhlMGMwYTU4YWY5ZDE4ZmYiLCJwIjoiYyJ9'
    },
    {
      testCase: 'TC19',
      testCaseDescription: 'VMP picture processing phase (Refined)',
      testCaseURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4230119458/TC19?atlOrigin=eyJpIjoiYWM2ZWZkNTA2YTBmNDI3ZThiZmFmY2ZmNDczM2JmM2EiLCJwIjoiYyJ9'
    }
  ]
};

/**
 * Extracts the TC ID (e.g., TC01) from a scenario ID (e.g., TV28_01-TC01-TD31_04).
 */
export function extractTestCaseId(scenarioId: string): string | undefined {
  const parts = scenarioId.split('-');
  return parts.find((p) => /^TC\d+$/.test(p));
}
