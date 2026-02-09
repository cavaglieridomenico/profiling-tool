import { COMMANDS } from './commands';

interface TapConfigItem {
  x: number;
  y: number;
  msg: string;
}

export const TAP_CONFIG: Record<string, TapConfigItem> = {
  [COMMANDS.INPUT_TAP_TOP_LX]: {
    x: 60,
    y: 340,
    msg: 'Tapped on top-lx.',
  },
  [COMMANDS.INPUT_TAP_TOP_CENTER]: {
    x: 550,
    y: 370,
    msg: 'Tapped on top-center.',
  },
  [COMMANDS.INPUT_TAP_TOP_RX]: {
    x: 990,
    y: 340,
    msg: 'Tapped on top-rx.',
  },
  [COMMANDS.INPUT_TAP_CENTER_CENTER]: {
    x: 550,
    y: 1280,
    msg: 'Tapped on center-center.',
  },
  [COMMANDS.INPUT_TAP_BOTTOM_CENTER]: {
    x: 550,
    y: 2100,
    msg: 'Tapped bottom-center.',
  },
  [COMMANDS.INPUT_TAP_BOTTOM_RX]: {
    x: 820,
    y: 2020,
    msg: 'Tapped bottom-rx.',
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
  [COMMANDS.INPUT_TAP_VMMV_MULTIVM]: {
    x: 100,
    y: 1680,
    msg: 'Tapped on vmmv-multivm.',
  },
  [COMMANDS.INPUT_TAP_VMMV_WIDGET]: {
    x: 550,
    y: 850,
    msg: 'Tapped on vmmv-tryonbutton.',
  },
  [COMMANDS.INPUT_TAP_VMMV_WIDGET_SGH]: {
    x: 900,
    y: 1522,
    msg: 'Tapped on vmmv-tryonbutton-sgh.',
  },
  [COMMANDS.INPUT_TAP_VMMV_WIDGET_RB]: {
    x: 880,
    y: 690,
    msg: 'Tapped on vmmv-tryonbutton-sgh.',
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
