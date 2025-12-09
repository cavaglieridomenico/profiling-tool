const testCases = {
  vmmv_tc01__tc04: [
    { command: 'trace:start', delay: 2000 },
    { command: 'navigate:refresh', delay: 20000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vmmv_tc05__tc06: [
    { command: 'trace:start', delay: 2000 },
    { command: 'input:tap-vmmv-multivm-open', delay: 13000 },
    { command: 'input:tap-vmmv-multivm-close', delay: 5000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vmmv_tc10: [
    { command: 'input:tap-vmmv-video', delay: 2000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 5000 },
    { command: 'trace:start', delay: 3000 },
    { command: 'input:tap-vmmv-vmp-rec', delay: 50000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vmmv_tc13: [
    { command: 'trace:start', delay: 3000 },
    { command: 'input:tap-vmmv-upload', delay: 2000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 5000 },
    { command: 'input:tap-vmmv-vmp-continue', delay: 15000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vmcore_tc19: [
    { command: 'trace:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 10000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vmcore_tc19_01: [
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 4000 },
    { command: 'trace:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-rec', delay: 50000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vmcore_tc19_02: [
    { command: 'trace:start', delay: 10000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vmcore_tc19_03: [
    { command: 'input:tap-vmcore-vmp-pdplight', delay: 4000 },
    { command: 'trace:start', delay: 3000 },
    { command: 'input:tap-vmcore-vmp-image', delay: 15000 },
    { command: 'trace:stop', delay: 0 },
  ],
};

module.exports = { testCases };
