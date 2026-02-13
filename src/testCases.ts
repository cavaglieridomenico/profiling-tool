export interface TestCaseStep {
  command: string;
  delay: number;
}

export const testCases: Record<string, TestCaseStep[]> = {
  perfetto_tc04: [
    { command: 'perfetto:start', delay: 10000 },
    { command: 'perfetto:stop', delay: 0 },
  ],
  devtools_tc04: [
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc01__tc04: [
    { command: 'devtools:start', delay: 2000 },
    { command: 'navigate:refresh', delay: 20000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc05__tc06: [
    { command: 'devtools:start', delay: 2000 },
    { command: 'input:tap-vmmv-multivm', delay: 13000 },
    { command: 'input:tap-vmmv-multivm', delay: 5000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc08__tc04: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton', delay: 20000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc08__tc04_sgh: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton-sgh', delay: 20000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc08__tc04_rb: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton-rb', delay: 20000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc09: [
    { command: 'devtools:start', delay: 2000 },
    { command: 'navigate:refresh', delay: 20000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc10: [
    { command: 'input:tap-vmmv-video', delay: 2000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 5000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-vmp-rec', delay: 50000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc11: [
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmmv_tc13: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-top-center', delay: 2000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 5000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 15000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmcore_vmp_tc19: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 12000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmcore_vmp_tc19_01: [
    // {
    //   command:
    //     'config:overrides?target=vmp-ui-496.js&replacement=./overrides/vmp-ui-496.js',
    //   delay: 500,
    // },
    // {
    //   command:
    //     'config:overrides?target=vmp-ui-496.js&replacement=./overrides/vmp-ui-496.js',
    //   delay: 500,
    // },
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 14000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-rec', delay: 50000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmcore_vmp_tc19_02: [
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  vmcore_vmp_tc19_03: [
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 4000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-image', delay: 15000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  pdwmv_tc01: [
    { command: 'input:tap-bottom-center', delay: 25000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-bottom-center', delay: 35000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  //Chrome address bar must to be visible:
  pdwmv_tc01_sgh: [
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 25000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 35000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  pdwmv_tc01_end: [
    { command: 'input:tap-bottom-center', delay: 25000 },
    { command: 'input:tap-bottom-center', delay: 20000 },
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  pdwmv_tc02: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-bottom-center', delay: 5000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  //Chrome address bar must to be visible:
  pdwmv_tc02_sgh: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 5000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  pdwmv_tc04: [
    { command: 'devtools:start', delay: 2000 },
    { command: 'navigate:refresh', delay: 15000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  pdwmv_tc05: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-bottom-center', delay: 25000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  //Chrome address bar must to be visible:
  pdwmv_tc05_sgh: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 25000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  pdwmv_tc05_end: [
    { command: 'input:tap-bottom-center', delay: 15000 },
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 },
  ],
  //MEASURE YOUR PD must to be visible:
  pdwmv_tc06: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmw-link', delay: 15000 },
    { command: 'devtools:stop', delay: 0 },
  ],
};
