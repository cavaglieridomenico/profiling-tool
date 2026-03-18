import { TestCaseStep } from './types';

export const testCases: Record<string, TestCaseStep[]> = {
  perfetto_10seconds: [
    { command: 'perfetto:start', delay: 10000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  devtools_10seconds: [
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc01: [
    {
      command: 'device:clean-state-preserve-cookies?url=TARGET_URL',
      delay: 5000
    },
    { command: 'devtools:start', delay: 3000 },
    { command: 'navigate:url?url=TARGET_URL', delay: 20000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc05: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-multivm', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc05_01: [
    { command: 'input:tap-vmmv-multivm', delay: 8000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-multivm', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc06: [
    { command: 'input:tap-vmmv-multivm', delay: 8000 },
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc06_perfetto: [
    { command: 'input:tap-vmmv-multivm', delay: 8000 },
    { command: 'perfetto:start', delay: 10000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  vmmv_tc08: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc08_sgh: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton-sgh', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc08_rb: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton-rb', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc08_nu: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton-nu', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc08_oo: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-tryonbutton-oo', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc09: [
    {
      command: 'device:clean-state-preserve-cookies?url=TARGET_URL',
      delay: 5000
    },
    { command: 'devtools:start', delay: 3000 },
    { command: 'navigate:url?url=TARGET_URL', delay: 20000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc10: [
    { command: 'input:tap-vmmv-video', delay: 2000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 5000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-vmp-rec', delay: 50000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc10_v4: [
    { command: 'input:tap-top-lx', delay: 3000 },
    { command: 'input:tap-vmmv-video-v4', delay: 2000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 10000 },
    { command: 'devtools:start', delay: 50000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmmv_tc13: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-top-center', delay: 2000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 5000 },
    { command: 'input:tap-center-center', delay: 3000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 15000 },
    { command: 'devtools:stop', delay: 5000 },
    { command: 'input:tap-vmcore-vmp-restart', delay: 5000 }
  ],
  vmmv_tc13_v4: [
    { command: 'input:tap-top-lx', delay: 3000 },
    { command: 'input:tap-vmmv-picture-v4', delay: 2000 },
    { command: 'input:tap-vmmv-picture-upload-v4', delay: 5000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 5000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmmv-picture-ok-upload-v4', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmcore_vmp_tc19: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 12000 },
    { command: 'devtools:stop', delay: 0 }
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
    { command: 'devtools:stop', delay: 0 }
  ],
  vmcore_vmp_tc19_02: [
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  vmcore_vmp_tc19_03: [
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 4000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-image', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  pdwmv_tc01: [
    { command: 'input:tap-bottom-center', delay: 25000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-bottom-center', delay: 35000 },
    { command: 'devtools:stop', delay: 20000 }
  ],
  pdwmv_tc01_end: [
    { command: 'input:tap-bottom-center', delay: 25000 },
    { command: 'input:tap-bottom-center', delay: 18000 },
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 20000 }
  ],
  //Chrome address bar must to be visible:
  pdwmv_tc01_sgh: [
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 25000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 35000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  pdwmv_tc01_sgh_end: [
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 25000 },
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 20000 },
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  pdwmv_tc02: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-bottom-center', delay: 5000 },
    { command: 'devtools:stop', delay: 10000 }
  ],
  //Chrome address bar must to be visible:
  pdwmv_tc02_sgh: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  pdwmv_tc04: [
    {
      command: 'device:clean-state-preserve-cookies?url=TARGET_URL',
      delay: 5000
    },
    { command: 'devtools:start', delay: 3000 },
    { command: 'navigate:url?url=TARGET_URL', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  pdwmv_tc05: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-bottom-center', delay: 25000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  pdwmv_tc05_end: [
    { command: 'input:tap-bottom-center', delay: 15000 },
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  //Chrome address bar must to be visible:
  pdwmv_tc05_sgh: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 25000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  pdwmv_tc05_sgh_end: [
    { command: 'input:tap-pdwmv-buttons-sgh', delay: 15000 },
    { command: 'devtools:start', delay: 10000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  //pdwmv_tc06: MEASURE YOUR PD must to be visible:
  pdwmv_tc06: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-pdwmw-link', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc01: [
    {
      command: 'device:clean-state-preserve-cookies-and-session?url=TARGET_URL',
      delay: 5000
    },
    { command: 'devtools:start', delay: 3000 },
    { command: 'navigate:url?url=TARGET_URL', delay: 12000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  /** Deprecated test case:
  rtrmv_tc01_01: [
    {
      command: 'device:clean-state-preserve-cookies?url=TARGET_URL',
      delay: 5000
    },
    { command: 'devtools:start', delay: 3000 },
    { command: 'navigate:url?url=TARGET_URL', delay: 12000 },
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'devtools:stop', delay: 0 }
  ], **/
  /** Deprecated test case:
   rtrmv_tc02: [
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ], **/
  rtrmv_tc03: [
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc03_perfetto: [
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'perfetto:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  rtrmv_tc03_sgh: [
    { command: 'input:tap-rtrmv-start-sgh', delay: 12000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc03_perfetto_sgh: [
    { command: 'input:tap-rtrmv-start-sgh', delay: 12000 },
    { command: 'perfetto:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  rtrmv_tc03_rb: [
    { command: 'input:tap-rtrmv-start-rb', delay: 12000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc03_perfetto_rb: [
    { command: 'input:tap-rtrmv-start-rb', delay: 12000 },
    { command: 'perfetto:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  rtrmv_tc04_sgh: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-start-sgh', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc04_rb: [
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-start-rb', delay: 15000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05: [
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-explosion', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_sgh: [
    { command: 'input:tap-rtrmv-start-sgh', delay: 12000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-explosion', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_rb: [
    { command: 'input:tap-rtrmv-start-rb', delay: 12000 },
    { command: 'input:tap-rtrmv-zoom-rb', delay: 5000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-explosion-rb', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_01: [
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'input:tap-rtrmv-explosion', delay: 3000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_01_perfetto: [
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'input:tap-rtrmv-explosion', delay: 3000 },
    { command: 'perfetto:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  rtrmv_tc05_01_sgh: [
    { command: 'input:tap-rtrmv-start-sgh', delay: 12000 },
    { command: 'input:tap-rtrmv-explosion', delay: 3000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_01_perfetto_sgh: [
    { command: 'input:tap-rtrmv-start-sgh', delay: 12000 },
    { command: 'input:tap-rtrmv-explosion', delay: 3000 },
    { command: 'perfetto:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  rtrmv_tc05_01_rb: [
    { command: 'input:tap-rtrmv-start-rb', delay: 12000 },
    { command: 'input:tap-rtrmv-zoom-rb', delay: 5000 },
    { command: 'input:tap-rtrmv-explosion-rb', delay: 3000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_01_perfetto_rb: [
    { command: 'input:tap-rtrmv-start-rb', delay: 12000 },
    { command: 'input:tap-rtrmv-zoom-rb', delay: 5000 },
    { command: 'input:tap-rtrmv-explosion-rb', delay: 3000 },
    { command: 'perfetto:start', delay: 3000 },
    { command: 'input:swipe-rtrmv-cx-rx', delay: 800 },
    { command: 'input:swipe-rtrmv-rx-lx', delay: 800 },
    { command: 'input:swipe-rtrmv-lx-rx', delay: 1000 },
    { command: 'perfetto:stop', delay: 0 }
  ],
  rtrmv_tc05_02: [
    { command: 'input:tap-rtrmv-zoom', delay: 6000 },
    { command: 'input:tap-rtrmv-explosion', delay: 3000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-explosion', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_02_sgh: [
    { command: 'input:tap-rtrmv-start-sgh', delay: 12000 },
    { command: 'input:tap-rtrmv-explosion', delay: 3000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-explosion', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ],
  rtrmv_tc05_02_rb: [
    { command: 'input:tap-rtrmv-start-rb', delay: 12000 },
    { command: 'input:tap-rtrmv-zoom-rb', delay: 5000 },
    { command: 'input:tap-rtrmv-explosion-rb', delay: 3000 },
    { command: 'devtools:start', delay: 3000 },
    { command: 'input:tap-rtrmv-explosion-rb', delay: 5000 },
    { command: 'devtools:stop', delay: 0 }
  ]
};
