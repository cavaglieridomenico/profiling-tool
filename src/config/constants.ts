import path from 'path';

// Centralized output directory for ALL traces
export const TRACES_OUTPUT_DIR = path.resolve(process.cwd(), 'traces-output');

// Centralized output directory for orchestrator logs
export const LOGS_OUTPUT_DIR = path.resolve(process.cwd(), 'logs-output');

// Trace Analysis Constants
export const LONG_TASK_THRESHOLD_MS = 100;
export const VERY_LONG_TASK_THRESHOLD_MS = 500;
export const MAIN_THREAD_NAME = 'CrRendererMain';
export const DEDICATED_WORKER_THREAD_NAME = 'DedicatedWorker thread';
export const SERVICE_WORKER_THREAD_NAME = 'ServiceWorker thread';
