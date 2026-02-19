export const COMMANDS = {
  // Perfetto Tracing Control
  PERFETTO_START: '/perfetto:start',
  PERFETTO_STOP: '/perfetto:stop',

  // DevTools Tracing Control
  DEVTOOLS_START: '/devtools:start',
  DEVTOOLS_STOP: '/devtools:stop',

  // Maintenance
  DEVICE_GET_TEMPERATURE: '/device:get-temperature',
  DEVICE_CLEAN_STATE: '/device:clean-state',
  CONFIG_OVERRIDES: '/config:overrides',

  // Navigation
  NAVIGATE_REFRESH: '/navigate:refresh',
  NAVIGATE_URL: '/navigate:url',

  // Input Actions
  INPUT_TAP_TOP_LX: '/input:tap-top-lx',
  INPUT_TAP_TOP_CENTER: '/input:tap-top-center',
  INPUT_TAP_TOP_RX: '/input:tap-top-rx',
  INPUT_TAP_CENTER_CENTER: '/input:tap-center-center',
  INPUT_TAP_BOTTOM_CENTER: '/input:tap-bottom-center',
  INPUT_TAP_BOTTOM_RX: '/input:tap-bottom-rx',
  INPUT_TAP_VMMV_VIDEO: '/input:tap-vmmv-video',
  INPUT_TAP_VMMV_CONTINUE: '/input:tap-vmmv-vmp-continue',
  INPUT_TAP_VMMV_REC: '/input:tap-vmmv-vmp-rec',
  INPUT_TAP_VMMV_VMP_RESTART: '/input:tap-vmmv-vmp-restart',
  INPUT_TAP_VMMV_MULTIVM: '/input:tap-vmmv-multivm',
  INPUT_TAP_VMMV_WIDGET: '/input:tap-vmmv-tryonbutton',
  INPUT_TAP_VMMV_WIDGET_SGH: '/input:tap-vmmv-tryonbutton-sgh',
  INPUT_TAP_VMMV_WIDGET_RB: '/input:tap-vmmv-tryonbutton-rb',
  INPUT_TAP_VMCORE_VMP_PDPLIGHT: '/input:tap-vmcore-vmp-pdplight',
  INPUT_TAP_VMCORE_VMP_REC: '/input:tap-vmcore-vmp-rec',
  INPUT_TAP_VMCORE_VMP_IMAGE: '/input:tap-vmcore-vmp-image',
  INPUT_TAP_VMCORE_VMP_RESTART: '/input:tap-vmcore-vmp-restart',
  INPUT_TAP_PDW_LINK: '/input:tap-pdwmw-link',
  INPUT_TAP_PDWMV_BUTTONS_SGH: '/input:tap-pdwmv-buttons-sgh',
  INPUT_TAP_RTRMV_ZOOM: '/input:tap-rtrmv-zoom',
  INPUT_TAP_RTRMV_START_SGH: '/input:tap-rtrmv-start-sgh',

  // Swipe Action
  INPUT_SWIPE_RTRMV_CX_RX: '/input:swipe-rtrmv-cx-rx',
  INPUT_SWIPE_RTRMV_RX_LX: '/input:swipe-rtrmv-rx-lx',
  INPUT_SWIPE_RTRMV_LX_RX: '/input:swipe-rtrmv-lx-rx',
};
