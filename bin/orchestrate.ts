import fs from 'fs';
import path from 'path';
import { parseJsonc, OrchestratorConfig } from '../src/orchestrator/config';
import { Orchestrator } from '../src/orchestrator/index';
import { getErrorMessage } from '../src/utils';

const configPath = process.argv[2] || 'orchestrator.jsonc';
const absPath = path.resolve(process.cwd(), configPath);

if (!fs.existsSync(absPath)) {
  console.error(`❌ Config file not found: ${absPath}`);
  console.log('Usage: npx ts-node bin/orchestrate.ts [config_path]');
  process.exit(1);
}

(async () => {
    try {
      const content = fs.readFileSync(absPath, 'utf8');
      const config = parseJsonc(content) as OrchestratorConfig;
    
      if (!config.timeline || config.timeline.length === 0) {
        throw new Error('Config must contain at least one timeline item in "timeline".');
      }
    
      const orchestrator = new Orchestrator(config);
      await orchestrator.start();
    
    } catch (error: unknown) {
      console.error(`Error loading or executing config: ${getErrorMessage(error)}`);
      process.exit(1);
    }
})();
