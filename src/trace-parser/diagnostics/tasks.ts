import fs from 'fs';

const filePath = 'traces-output/TV02-TC01_01-TD31_03-1.json';
const traceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const events: any[] = traceData.traceEvents || traceData;

const pid = 2217;
const tid = 2227;

console.log(
  `Analyzing CrRendererMain (PID: ${pid}, TID: ${tid}) in ${filePath}`
);

const tasks = events.filter(
  (e: any) =>
    e.pid === pid &&
    e.tid === tid &&
    (e.name === 'RunTask' ||
      e.name === 'ThreadPool_RunTask' ||
      e.name === 'ThreadControllerImpl::RunTask') &&
    e.dur
);

console.log(`Total tasks found: ${tasks.length}`);

const longTasks = tasks
  .map((e: any) => ({ name: e.name, durMs: e.dur / 1000, ts: e.ts }))
  .filter((t: any) => t.durMs > 100);

console.log('Long tasks (> 100ms):');
longTasks.forEach((t: any, i: number) => {
  console.log(
    `${i + 1}. ${t.name} - Duration: ${t.durMs.toFixed(2)}ms - TS: ${t.ts}`
  );
});
