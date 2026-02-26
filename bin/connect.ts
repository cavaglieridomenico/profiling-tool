import { standardConnection } from '../src/browser';

// Execute
if (require.main === module) {
  try {
    standardConnection();
  } catch {
    process.exit(1);
  }
}
