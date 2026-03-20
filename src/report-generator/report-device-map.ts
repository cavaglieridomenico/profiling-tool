export interface DeviceDefinition {
  device: string; // The Device ID, e.g., "TD31_04"
  deviceDescription: string; // The human-readable name
  deviceURL: string; // Optional reference URL
}

export const DEVICE_MAP: DeviceDefinition[] = [
  {
    device: 'TD31_04',
    deviceDescription: 'Mid-end mobile device',
    deviceURL:
      'https://luxotticaretail.atlassian.net/wiki/spaces/INNOVATION/pages/4558062518/TD31_04?atlOrigin=eyJpIjoiZTljOTE1ZTM2ZTAxNDFmNmJmNjdiZGIxZDYzM2U1NGIiLCJwIjoiYyJ9'
  },
  {
    device: 'TD28_04',
    deviceDescription: 'Mid-end mobile device',
    deviceURL:
      'https://luxotticaretail.atlassian.net/wiki/spaces/INNOVATION/pages/4558062518/TD31_04?atlOrigin=eyJpIjoiZTljOTE1ZTM2ZTAxNDFmNmJmNjdiZGIxZDYzM2U1NGIiLCJwIjoiYyJ9'
  }
];

/**
 * Extracts the TD ID (e.g., TD31_04) from a scenario ID (e.g., TV28_01-TC01-TD31_04).
 */
export function extractDeviceId(scenarioId: string): string | undefined {
  const parts = scenarioId.split('-');
  return parts.find((p) => /^TD\d+(_\d+)?$/.test(p));
}
