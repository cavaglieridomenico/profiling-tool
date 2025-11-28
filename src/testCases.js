const testCases = {
  vm_tc01_tc04: [
    { command: 'trace:start', delay: 2000 },
    { command: 'navigate:refresh', delay: 20000 },
    { command: 'trace:stop', delay: 0 },
  ],
  vm_tc10: [
    { command: 'input:tap-vm-video', delay: 2000 },
    { command: 'input:tap-vm-vmp-continue', delay: 5000 },
    { command: 'trace:start', delay: 3000 },
    { command: 'input:tap-vm-vmp-rec', delay: 50000 },
    { command: 'trace:stop', delay: 0 },
  ],
};

module.exports = { testCases };
