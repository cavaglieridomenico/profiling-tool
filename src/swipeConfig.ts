import { COMMANDS } from './commands';

interface SwipeConfigItem {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
  msg: string;
}

const limitLxPoint = 140;
const limitRxPoint = 950;
const startPoint = 420;
const centerVerticalPoint = 1000;

export const SWIPE_CONFIG: Record<string, SwipeConfigItem> = {
  [COMMANDS.INPUT_SWIPE_RTRMV_CX_RX]: {
    startX: startPoint,
    startY: centerVerticalPoint,
    endX: limitRxPoint,
    endY: centerVerticalPoint,
    durationMs: 1000,
    msg: 'Swiped cx-rx.',
  },
  [COMMANDS.INPUT_SWIPE_RTRMV_RX_LX]: {
    startX: limitRxPoint,
    startY: centerVerticalPoint,
    endX: limitLxPoint,
    endY: centerVerticalPoint,
    durationMs: 1800,
    msg: 'Swiped rx-lx.',
  },
  [COMMANDS.INPUT_SWIPE_RTRMV_LX_RX]: {
    startX: limitLxPoint,
    startY: centerVerticalPoint,
    endX: limitRxPoint,
    endY: centerVerticalPoint,
    durationMs: 1800,
    msg: 'Swiped lx-rx.',
  },
};
