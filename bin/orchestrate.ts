import fs from 'fs';
import path from 'path';
import {
  parseJsonc,
  OrchestratorConfigSchema,
} from '../src/orchestrator/config';
import { Orchestrator } from '../src/orchestrator/index';
import { getErrorMessage } from '../src/utils';

const INPUTS_DIR = path.resolve(process.cwd(), 'orchestrator-inputs');
const configName = process.argv[2];

if (!configName) {
  console.error('❌ Please provide the name of the config file.');
  console.log('Usage: npm run orchestrate <config_filename>');

  // Show available configs
  if (fs.existsSync(INPUTS_DIR)) {
    const files = fs
      .readdirSync(INPUTS_DIR)
      .filter((f) => f.endsWith('.jsonc'));
    console.log('Available configs in orchestrator-inputs/:', files.join(', '));
  }
  process.exit(1);
}

// Resolve the path: if it's already an absolute or relative path that exists, use it.
// Otherwise, look in the orchestrator-inputs folder.
let absPath = path.isAbsolute(configName)
  ? configName
  : path.resolve(process.cwd(), configName);

if (!fs.existsSync(absPath)) {
  absPath = path.join(INPUTS_DIR, configName);
}

if (!fs.existsSync(absPath)) {
  console.error(
    `❌ Config file not found: ${configName} (checked both local path and orchestrator-inputs/)`
  );
  process.exit(1);
}

(async () => {
  try {
    const content = fs.readFileSync(absPath, 'utf8');
    const rawConfig = parseJsonc(content);

    // Validate and parse the config using Zod
    const configResult = OrchestratorConfigSchema.safeParse(rawConfig);

    if (!configResult.success) {
      console.error('❌ Configuration validation failed:');
      configResult.error.issues.forEach((err) => {
        console.error(`   - [${err.path.join('.')}] ${err.message}`);
      });
      process.exit(1);
    }

    const config = configResult.data;
    console.log('✅ Configuration validated successfully.');

    if (config.timeline.length === 0) {
      throw new Error(
        'Config must contain at least one timeline item in "timeline".'
      );
    }

    const orchestrator = new Orchestrator(config);
    await orchestrator.start();
  } catch (error: unknown) {
    console.error(
      `Error loading or executing config: ${getErrorMessage(error)}`
    );
    process.exit(1);
  }
})();
