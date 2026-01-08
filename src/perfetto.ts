import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getAdbPath } from './browser';

const DEVICE_CONFIG_PATH = '/data/local/tmp/trace_config.pbtxt';
const DEVICE_TRACE_PATH = '/data/misc/perfetto-traces/trace.pftrace';
// Use process.cwd() to ensure we find the file regardless of where we run from
const LOCAL_CONFIG = path.resolve(
  process.cwd(),
  'src/perfetto-configs/trace_config.pbtxt'
);
const OUTPUT_DIR = path.resolve(process.cwd(), 'perfetto-output');

export function startPerfetto(): void {
  const adbPath = getAdbPath();
  try {
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

export function stopPerfetto(customName?: string): string {
  const adbPath = getAdbPath();
  try {
    console.log('[Perfetto] Stopping session...');
    execSync(`${adbPath} shell perfetto --attach=cv_session --stop`);

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = customName
      ? `trace_${customName}.pftrace`
      : `trace_${timestamp}.pftrace`;

    const localPath = path.join(OUTPUT_DIR, filename);

    console.log(`[Perfetto] Pulling trace to ${localPath}...`);
    execSync(`${adbPath} pull "${DEVICE_TRACE_PATH}" "${localPath}"`);

    return localPath;
  } catch (e: any) {
    console.error(`[Perfetto] Stop failed: ${e.message}`);
    throw e;
  }
}
