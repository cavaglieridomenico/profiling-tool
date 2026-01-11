import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getAdbPath } from './browser';
import { getNextTraceNumber } from './utils';

const DEVICE_CONFIG_PATH = '/data/local/tmp/trace_config.pbtxt';
const DEVICE_TRACE_PATH = '/data/misc/perfetto-traces/trace.pftrace';

// Use process.cwd() to ensure we find the file regardless of where we run from
const LOCAL_CONFIG = path.resolve(
  process.cwd(),
  'src/perfetto-configs/trace_config.pbtxt'
);
const PERFETTO_OUTPUT_DIR = path.resolve(process.cwd(), 'perfetto-output');

class PerfettoTraceManager {
  private traceCounter: number;
  private traceName: string;

  constructor() {
    this.traceCounter = 0;
    this.traceName = '';
  }

  /**
   * Starts the Perfetto session.
   * Mirrors traceManager: accepts the name HERE, calculates the counter HERE.
   */
  public startPerfetto(name: string | null): void {
    const adbPath = getAdbPath();

    // 1. Setup State (Exactly like TraceManager)
    this.traceName = name || 'trace';

    // Ensure output directory exists before we start
    if (!fs.existsSync(PERFETTO_OUTPUT_DIR)) {
      fs.mkdirSync(PERFETTO_OUTPUT_DIR, { recursive: true });
    }

    // 2. Calculate the counter immediately
    // Note: The file won't exist on disk until stop() is called, but that's fine for sequential tests.
    this.traceCounter = getNextTraceNumber(
      this.traceName,
      PERFETTO_OUTPUT_DIR,
      'pftrace'
    );

    try {
      console.log(
        `[Perfetto] Initializing trace: ${this.traceName}-${this.traceCounter}`
      );
      console.log('[Perfetto] Pushing configuration...');
      execSync(`${adbPath} push "${LOCAL_CONFIG}" "${DEVICE_CONFIG_PATH}"`);

      console.log('[Perfetto] Starting detached session...');
      // We pipe the config file into perfetto and detach immediately
      execSync(
        `${adbPath} shell "cat ${DEVICE_CONFIG_PATH} | perfetto --txt -c - --detach=cv_session -o ${DEVICE_TRACE_PATH}"`
      );
      console.log('✅ Perfetto started (Background).');
    } catch (e: any) {
      console.error(`[Perfetto] Start failed: ${e.message}`);
      throw e;
    }
  }

  /**
   * Stops the session and pulls the file.
   * Mirrors traceManager: takes NO name argument, uses the stored state.
   */
  public stopPerfetto(): string {
    const adbPath = getAdbPath();
    try {
      console.log('[Perfetto] Stopping session...');
      execSync(`${adbPath} shell perfetto --attach=cv_session --stop`);

      // 3. Use the State defined at start to name the file
      const filename = `${this.traceName}-${this.traceCounter}.pftrace`;
      const localPath = path.join(PERFETTO_OUTPUT_DIR, filename);

      console.log(`[Perfetto] Pulling trace to ${localPath}...`);
      execSync(`${adbPath} pull "${DEVICE_TRACE_PATH}" "${localPath}"`);

      return localPath;
    } catch (e: any) {
      console.error(`[Perfetto] Stop failed: ${e.message}`);
      throw e;
    }
  }
}

export default new PerfettoTraceManager();
