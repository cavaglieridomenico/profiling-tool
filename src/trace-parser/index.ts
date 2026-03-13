import fs from 'fs';
import { TraceEvent, TraceMetrics } from '../types';
import {
  LONG_TASK_THRESHOLD_MS,
  VERY_LONG_TASK_THRESHOLD_MS,
  MAIN_THREAD_NAME,
  DEDICATED_WORKER_THREAD_NAME,
  SERVICE_WORKER_THREAD_NAME,
  PROFILING_OFFSET_MS
} from '../config/constants';

/**
 * Robustly find max value in numeric array to avoid stack overflow.
 */
function getMax(arr: number[]): number {
  if (arr.length === 0) return 0;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

/**
 * Robustly find min value in numeric array to avoid stack overflow.
 */
function getMin(arr: number[]): number {
  if (arr.length === 0) return 0;
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return min;
}

/**
 * Parses a DevTools trace file and extracts performance metrics.
 * @param filePath Path to the JSON trace file.
 * @returns Object containing extracted metrics.
 */
export function parseTrace(filePath: string): TraceMetrics {
  const traceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const events: TraceEvent[] = traceData.traceEvents || traceData;

  const threadNames: Record<string, string> = {};
  const processNames: Record<number, string> = {};
  const threadTasks: Record<string, { dur: number; ts: number }[]> = {};
  const threadHeap: Record<string, number[]> = {};

  let totalCls = 0;
  const interactions: number[] = [];

  // 1. Identify Renderer processes first (needed for baseline)
  for (const event of events) {
    if (event.ph === 'M' && event.name === 'process_name') {
      processNames[event.pid] = event.args.name;
    }
  }
  const rendererPids = Object.entries(processNames)
    .filter(([, name]) => name.toLowerCase() === 'renderer')
    .map(([pid]) => parseInt(pid));

  // 2. Find the baseline timestamp (first RunTask in a Renderer process)
  let minTs = 0;
  let baselineTs = 0;
  let absoluteMaxTs = 0;

  for (const event of events) {
    if (event.ts > 0) {
      if (minTs === 0 || event.ts < minTs) minTs = event.ts;
      if (event.ts > absoluteMaxTs) absoluteMaxTs = event.ts;
      
      const isTask = event.name === 'RunTask' || 
                     event.name === 'ThreadPool_RunTask' || 
                     event.name === 'ThreadControllerImpl::RunTask';
      
      if (isTask && rendererPids.includes(event.pid)) {
        if (baselineTs === 0 || event.ts < baselineTs) {
          baselineTs = event.ts;
        }
      }
    }
  }

  // If no Renderer tasks found, fallback to first non-metadata event
  if (baselineTs === 0) {
    for (const event of events) {
      if (event.ts > 0 && event.ph !== 'M') {
        if (baselineTs === 0 || event.ts < baselineTs) baselineTs = event.ts;
      }
    }
  }

  // Determine the offset: use OFFSET=X from filename if present (in seconds), otherwise use default
  let currentOffsetMs = PROFILING_OFFSET_MS;
  const offsetMatch = filePath.match(/OFFSET=(\d+)/);
  if (offsetMatch) {
    currentOffsetMs = parseInt(offsetMatch[1]) * 1000;
  }

  const offsetUs = currentOffsetMs * 1000;
  const effectiveMinTs = baselineTs + offsetUs;

  console.log(`Analyzing ${filePath}`);
  console.log(`Baseline identified (First Renderer Task at +${((baselineTs - minTs) / 1000000).toFixed(2)}s)`);
  console.log(
    `Applying offset of ${(offsetUs / 1000000).toFixed(2)}s (relative range: 0.00s to ${(
      offsetUs / 1000000
    ).toFixed(2)}s)`
  );

  let skippedCount = 0;
  // 3. Process trace events
  for (const event of events) {
    const key = `${event.pid}-${event.tid}`;

    // Metadata events must be processed to identify threads/processes
    if (event.ph === 'M') {
      if (event.name === 'thread_name') {
        threadNames[key] = event.args.name;
      }
      // process_name already handled above
      continue;
    }

    // Skip all other events within the offset
    if (event.ts > 0 && event.ts < effectiveMinTs) {
      skippedCount++;
      continue;
    }

    // Task execution events
    if (
      event.name === 'RunTask' ||
      event.name === 'ThreadPool_RunTask' ||
      event.name === 'ThreadControllerImpl::RunTask'
    ) {
      if (event.dur) {
        if (!threadTasks[key]) threadTasks[key] = [];

        const durMs = event.dur / 1000;
        const ts = event.ts;

        // Simple deduplication: skip if a similar task already exists at this timestamp
        const isDuplicate = threadTasks[key].some(
          (t) => Math.abs(t.ts - ts) < 50 && Math.abs(t.dur - durMs) < 1
        );

        if (!isDuplicate) {
          threadTasks[key].push({ dur: durMs, ts: ts });
        }
      }
    }

    // Memory events
    if (event.name === 'UpdateCounters' && event.args?.data?.jsHeapSizeUsed) {
      if (!threadHeap[key]) threadHeap[key] = [];
      threadHeap[key].push(event.args.data.jsHeapSizeUsed / (1024 * 1024)); // Convert to MB
    }

    // Layout shift events for CLS
    if (event.name === 'LayoutShift' && event.args?.data?.score) {
      totalCls += event.args.data.score;
    }

    // Event timing for INP
    if (
      event.cat.includes('devtools.timeline') &&
      event.name === 'EventTiming' &&
      event.args?.data?.duration
    ) {
      interactions.push(event.args.data.duration);
    }
  }

  console.log(`Skipped ${skippedCount} events based on offset`);

  const durationS = Math.max(0, (absoluteMaxTs - effectiveMinTs) / 1000000);

  const metrics: TraceMetrics = {
    threads: {},
    cls: totalCls,
    inp: getMax(interactions),
    durationS
  };

  // Get all unique thread keys from both tasks and heap
  const allKeys = new Set([...Object.keys(threadTasks), ...Object.keys(threadHeap)]);

  // 4. Process individual thread metrics
  for (const key of allKeys) {
    const [pidStr, tidStr] = key.split('-');
    const pid = parseInt(pidStr);
    const tid = parseInt(tidStr);

    // Filter by Renderer process and relevant threads
    if (!rendererPids.includes(pid)) continue;

    const tName = threadNames[key] || `Thread ${tid}`;

    const isMainThread = tName === MAIN_THREAD_NAME;
    const isWorkerThread =
      tName === DEDICATED_WORKER_THREAD_NAME || tName === SERVICE_WORKER_THREAD_NAME;

    if (isMainThread || isWorkerThread) {
      const tasks = threadTasks[key] || [];
      const taskDurations = tasks.map((t) => t.dur);
      const longTasks100 = taskDurations.filter((d) => d > LONG_TASK_THRESHOLD_MS).length;
      const longTasks500 = taskDurations.filter((d) => d > VERY_LONG_TASK_THRESHOLD_MS).length;
      const longestTask = getMax(taskDurations);

      const heap = threadHeap[key] || [];
      const jsHeapMin = getMin(heap);
      const jsHeapMax = getMax(heap);

      metrics.threads[key] = {
        name: isMainThread ? 'Main thread' : 'Web Worker',
        longTasks100,
        longTasks500,
        longestTask,
        jsHeapMin,
        jsHeapMax
      };
    }
  }

  return metrics;
}
