export interface VersionDefinition {
  version: string; // The Version ID, e.g., "TV28_01"
  versionDescription: string; // The human-readable name/description
  versionURL: string; // Optional reference URL
}

export const PRODUCT_VERSION_MAP: Record<string, VersionDefinition[]> = {
  VMMV: [
    {
      version: 'TV28_01',
      versionDescription: 'VMMV 5.6',
      versionURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4558684161/TV28_01?atlOrigin=eyJpIjoiNzNlN2Q1N2RjNzEzNGQ1YjkxNjliYjI3ZWVkNDUwYzgiLCJwIjoiYyJ9'
    },
    {
      version: 'TV25_01',
      versionDescription: 'VMMV 5.5.6',
      versionURL:
        'https://luxotticaretail.atlassian.net/wiki/spaces/VM/pages/4382621911/TV25_01?atlOrigin=eyJpIjoiZWZiYTE0ZGEzYTk0NDNjYzk5OWE2ZWE3NWI4YWNmNjUiLCJwIjoiYyJ9'
    }
  ]
  // Add other products here as they are defined (e.g., RTR, PDW)
};
