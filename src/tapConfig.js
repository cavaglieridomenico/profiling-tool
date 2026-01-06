const { COMMANDS } = require('./commands');

const TAP_CONFIG = {
  [COMMANDS.INPUT_TAP_VMMV_UPLOAD]: {
    x: 550,
    y: 370,
    msg: 'Tapped vmmv-upload.',
  },
  [COMMANDS.INPUT_TAP_VMMV_VIDEO]: {
    x: 760,
    y: 370,
    msg: 'Tapped vmmv-video.',
  },
  [COMMANDS.INPUT_TAP_VMMV_CONTINUE]: {
    x: 530,
    y: 2050,
    msg: 'Tapped on vmmv-vmp-continue.',
  },
  [COMMANDS.INPUT_TAP_VMMV_REC]: {
    x: 555,
    y: 2030,
    msg: 'Tapped on vmmv-vmp-rec.',
  },
  [COMMANDS.INPUT_TAP_VMMV_VMP_RESTART]: {
    x: 970,
    y: 1540,
    msg: 'Tapped on vmmv-vmp-restart.',
  },
  [COMMANDS.INPUT_TAP_VMMV_MULTIVM_OPEN]: {
    x: 100,
    y: 1680,
    msg: 'Tapped on vmmv-multivm-open.',
  },
  [COMMANDS.INPUT_TAP_VMMV_MULTIVM_CLOSE]: {
    x: 100,
    y: 1680,
    msg: 'Tapped on vmmv-close.',
  },
  [COMMANDS.INPUT_TAP_VMMV_CLOSE]: {
    x: 980,
    y: 360,
    msg: 'Tapped on vmmv-close.',
  },
  [COMMANDS.INPUT_TAP_VMMV_WIDGET]: {
    x: 550,
    y: 850,
    msg: 'Tapped on vmmv-widget.',
  },
  [COMMANDS.INPUT_TAP_VMCORE_VMP_PDPLIGHT]: {
    x: 540,
    y: 1240,
    msg: 'Tapped on vmcore-vmp-pdplight.',
  },
  [COMMANDS.INPUT_TAP_VMCORE_VMP_REC]: {
    x: 100,
    y: 2040,
    msg: 'Tapped on vmcore-vmp-rec.',
  },
  [COMMANDS.INPUT_TAP_VMCORE_VMP_IMAGE]: {
    x: 100,
    y: 1680,
    msg: 'Tapped on vmcore-vmp-image.',
  },
  [COMMANDS.INPUT_TAP_VMCORE_VMP_RESTART]: {
    x: 330,
    y: 1430,
    msg: 'Tapped on vmcore-vmp-restart.',
  },
};

module.exports = { TAP_CONFIG };
