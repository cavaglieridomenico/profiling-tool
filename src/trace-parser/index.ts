import fs from 'fs';
import { TraceEvent, ThreadMetrics, TraceMetrics } from '../types';
import {
  LONG_TASK_THRESHOLD_MS,
  VERY_LONG_TASK_THRESHOLD_MS,
  MAIN_THREAD_NAME,
  DEDICATED_WORKER_THREAD_NAME,
  SERVICE_WORKER_THREAD_NAME
} from '../config/constants';

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

  // Process trace events
  for (const event of events) {
    const key = `${event.pid}-${event.tid}`;

    // Metadata events
    if (event.ph === 'M') {
      if (event.name === 'thread_name') {
        threadNames[key] = event.args.name;
      } else if (event.name === 'process_name') {
        processNames[event.pid] = event.args.name;
      }
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

  const metrics: TraceMetrics = {
    threads: {},
    cls: totalCls,
    inp: interactions.length > 0 ? Math.max(...interactions) : 0
  };

  // Identify Renderer processes
  const rendererPids = Object.entries(processNames)
    .filter(([, name]) => name.toLowerCase() === 'renderer')
    .map(([pid]) => parseInt(pid));

  // Get all unique thread keys from both tasks and heap
  const allKeys = new Set([...Object.keys(threadTasks), ...Object.keys(threadHeap)]);

  // Process individual thread metrics
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
      const longestTask = taskDurations.length > 0 ? Math.max(...taskDurations) : 0;

      const heap = threadHeap[key] || [];
      const jsHeapMin = heap.length > 0 ? Math.min(...heap) : 0;
      const jsHeapMax = heap.length > 0 ? Math.max(...heap) : 0;

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
