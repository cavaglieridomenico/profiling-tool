import fs from 'fs';

const filePath =
  'traces-output/TV25_03-TC01-TD31_03-1 Range 2.06 s – 9.44 s.json';
const traceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const events: any[] = traceData.traceEvents || traceData;

const rendererPid = 23365;
const mainTid = 23378;
const workerTid = 23706;

const updateCounters = events.filter(
  (e: any) =>
    e.pid === rendererPid &&
    e.name === 'UpdateCounters' &&
    e.args?.data?.jsHeapSizeUsed
);

const getStats = (tTid: number) => {
  const heaps = updateCounters
    .filter((e) => e.tid === tTid)
    .map((e) => e.args.data.jsHeapSizeUsed / (1024 * 1024));

  if (heaps.length === 0) return 'No Data';
  return {
    min: Math.min(...heaps).toFixed(2),
    max: Math.max(...heaps).toFixed(2),
    count: heaps.length
  };
};

console.log('Main Thread Stats:', getStats(mainTid));
console.log('Worker Thread Stats:', getStats(workerTid));
