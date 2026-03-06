import fs from 'fs';

export interface TraceEvent {
  cat: string;
  name: string;
  ph: string;
  pid: number;
  tid: number;
  ts: number;
  dur?: number;
  args?: any;
}

export interface ThreadMetrics {
  name: string;
  longTasks100: number;
  longTasks500: number;
  longestTask: number;
  jsHeapMin: number;
  jsHeapMax: number;
}

export interface TraceMetrics {
  threads: Record<string, ThreadMetrics>;
  cls: number;
  inp: number;
  devToolsIssues: number;
}

export function parseTrace(filePath: string): TraceMetrics {
  const traceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const events: TraceEvent[] = traceData.traceEvents || traceData;

  const threadNames: Record<string, string> = {};
  const processNames: Record<number, string> = {};
  const threadTasks: Record<string, number[]> = {};
  const threadHeap: Record<string, number[]> = {};
  
  let totalCls = 0;
  const interactions: number[] = [];
  let devToolsIssues = 0;

  // First pass: Metadata and identifying threads/processes
  for (const event of events) {
    const key = `${event.pid}-${event.tid}`;
    
    if (event.ph === 'M') {
      if (event.name === 'thread_name') {
        threadNames[key] = event.args.name;
      } else if (event.name === 'process_name') {
        processNames[event.pid] = event.args.name;
      }
    }

    if (event.name === 'RunTask' || event.name === 'ThreadPool_RunTask' || event.name === 'ThreadControllerImpl::RunTask') {
        if (event.dur) {
            if (!threadTasks[key]) threadTasks[key] = [];
            
            const durMs = event.dur / 1000;
            const ts = event.ts;

            // Simple deduplication: if there's an existing task on the same thread 
            // that starts almost at the same time and has almost the same duration, skip it.
            const isDuplicate = threadTasks[key].some(t => {
                const existingTask = (t as any);
                return Math.abs(existingTask.ts - ts) < 50 && Math.abs(existingTask.dur - durMs) < 1;
            });

            if (!isDuplicate) {
                // Store as object for deduplication check, but we'll convert to numbers later
                (threadTasks[key] as any).push({ dur: durMs, ts: ts });
            }
        }
    }

    if (event.name === 'UpdateCounters' && event.args?.data?.jsHeapSizeUsed) {
        if (!threadHeap[key]) threadHeap[key] = [];
        threadHeap[key].push(event.args.data.jsHeapSizeUsed / (1024 * 1024)); // convert to MB
    }

    if (event.name === 'LayoutShift' && event.args?.data?.score) {
        totalCls += event.args.data.score;
    }

    if (event.cat.includes('devtools.timeline') && event.name === 'EventTiming' && event.args?.data?.duration) {
        interactions.push(event.args.data.duration);
    }
    
    if (event.cat === 'v8.console' || (event.args?.data?.level === 'error')) {
        devToolsIssues++;
    }
  }

  const metrics: TraceMetrics = {
    threads: {},
    cls: totalCls,
    inp: interactions.length > 0 ? Math.max(...interactions) : 0,
    devToolsIssues
  };

  // Identify Renderer process
  const rendererPids = Object.entries(processNames)
    .filter(([pid, name]) => name === 'Renderer')
    .map(([pid]) => parseInt(pid));

  for (const [key, rawTasks] of Object.entries(threadTasks)) {
    const [pidStr, tidStr] = key.split('-');
    const pid = parseInt(pidStr);
    const tid = parseInt(tidStr);

    if (!rendererPids.includes(pid)) continue;

    const tName = threadNames[key] || `Thread ${tid}`;
    
    // Convert task objects back to simple duration numbers
    const tasks = (rawTasks as any).map((t: any) => t.dur);
    
    // We care about Main thread and actual Web/Service Workers in Renderer processes
    if (tName === 'CrRendererMain' || tName === 'DedicatedWorker thread' || tName === 'ServiceWorker thread') {
        const longTasks100 = tasks.filter((t: number) => t > 100).length;
        const longTasks500 = tasks.filter((t: number) => t > 500).length;
        const longestTask = tasks.length > 0 ? Math.max(...tasks) : 0;
        const heap = threadHeap[key] || [];
        const jsHeapMin = heap.length > 0 ? Math.min(...heap) : 0;
        const jsHeapMax = heap.length > 0 ? Math.max(...heap) : 0;

        metrics.threads[key] = {
            name: tName === 'CrRendererMain' ? 'Main thread' : 'Web Worker',
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
