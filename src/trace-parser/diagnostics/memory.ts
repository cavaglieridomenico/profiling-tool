import fs from 'fs';

const filePath =
  'traces-output/TV25_03-TC01-TD31_03-1 Range 2.06 s – 9.44 s.json';
const traceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const events: any[] = traceData.traceEvents || traceData;

const rendererPid = 23365;
const mainTid = 23378;
const workerTid = 23706;

console.log(`Analyzing Memory Events in Renderer Process ${rendererPid}`);

const updateCounters = events.filter(
  (e: any) => e.pid === rendererPid && e.name === 'UpdateCounters'
);

console.log(
  `Total UpdateCounters events in Renderer process: ${updateCounters.length}`
);

const mainThreadCounters = updateCounters.filter((e) => e.tid === mainTid);
const workerThreadCounters = updateCounters.filter((e) => e.tid === workerTid);

console.log(
  `UpdateCounters on Main Thread (${mainTid}): ${mainThreadCounters.length}`
);
console.log(
  `UpdateCounters on Worker Thread (${workerTid}): ${workerThreadCounters.length}`
);

if (updateCounters.length > 0) {
  const samples = updateCounters.slice(0, 5).map((e) => ({
    tid: e.tid,
    heap: e.args?.data?.jsHeapSizeUsed
      ? (e.args.data.jsHeapSizeUsed / (1024 * 1024)).toFixed(2) + ' MB'
      : 'N/A'
  }));
  console.log('Sample UpdateCounters:', samples);

  const allHeaps = updateCounters
    .filter((e) => e.args?.data?.jsHeapSizeUsed)
    .map((e) => e.args.data.jsHeapSizeUsed / (1024 * 1024));

  console.log(
    `Process Overall - Min: ${Math.min(...allHeaps).toFixed(2)} MB, Max: ${Math.max(...allHeaps).toFixed(2)} MB`
  );
}

// Check for other memory events
const v8Memory = events.filter(
  (e) => e.name?.includes('V8.Memory') || e.cat?.includes('v8.memory')
);
console.log(`V8 Memory events: ${v8Memory.length}`);
