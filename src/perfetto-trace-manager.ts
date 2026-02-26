import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getAdbPath } from './browser';
import { getErrorMessage } from './utils';
import { TRACES_OUTPUT_DIR } from './config/constants';

const DEVICE_CONFIG_PATH = '/data/local/tmp/trace_config.pbtxt';
const DEVICE_TRACE_PATH = '/data/misc/perfetto-traces/trace.pftrace';

const LOCAL_CONFIG = path.resolve(
  process.cwd(),
  'src/perfetto-configs/trace_config.pbtxt'
);

class PerfettoTraceManager {
  private traceFileName: string;

  constructor() {
    this.traceFileName = '';
  }

  public startPerfetto(name: string | null): void {
    const adbPath = getAdbPath();

    if (!fs.existsSync(TRACES_OUTPUT_DIR)) {
      fs.mkdirSync(TRACES_OUTPUT_DIR, { recursive: true });
    }

    const baseName = name || `trace-${Date.now()}`;
    const ext = '.pftrace';

    // Always start at -1
    let counter = 1;
    let finalFileName = `${baseName}-${counter}${ext}`;
    let localPath = path.join(TRACES_OUTPUT_DIR, finalFileName);

    // Collision Detection: Increment to -2, -3 if the file exists
    while (fs.existsSync(localPath)) {
      counter++;
      finalFileName = `${baseName}-${counter}${ext}`;
      localPath = path.join(TRACES_OUTPUT_DIR, finalFileName);
    }

    this.traceFileName = finalFileName;

    try {
      console.log(`[Perfetto] Initializing trace: ${this.traceFileName}`);
      console.log('[Perfetto] Pushing configuration...');
      execSync(`${adbPath} push "${LOCAL_CONFIG}" "${DEVICE_CONFIG_PATH}"`);

      console.log('[Perfetto] Starting detached session...');
      execSync(
        `${adbPath} shell "cat ${DEVICE_CONFIG_PATH} | perfetto --txt -c - --detach=cv_session -o ${DEVICE_TRACE_PATH}"`
      );
      console.log('✅ Perfetto started (Background).');
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      console.error(`[Perfetto] Start failed: ${message}`);
      throw e;
    }
  }

  public stopPerfetto(): string {
    const adbPath = getAdbPath();
    try {
      console.log('[Perfetto] Stopping session...');
      execSync(`${adbPath} shell perfetto --attach=cv_session --stop`);

      const localPath = path.join(TRACES_OUTPUT_DIR, this.traceFileName);

      console.log(`[Perfetto] Pulling trace to ${localPath}...`);
      execSync(`${adbPath} pull "${DEVICE_TRACE_PATH}" "${localPath}"`);

      return localPath;
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      console.error(`[Perfetto] Stop failed: ${message}`);
      throw e;
    }
  }
}

export default new PerfettoTraceManager();
