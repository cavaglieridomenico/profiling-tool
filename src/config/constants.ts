import path from 'path';

// Centralized output directory for ALL traces
export const TRACES_OUTPUT_DIR = path.resolve(process.cwd(), 'traces-output');

// Centralized output directory for orchestrator logs
export const LOGS_OUTPUT_DIR = path.resolve(process.cwd(), 'logs-output');
