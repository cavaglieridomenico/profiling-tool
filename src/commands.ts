export const COMMANDS = {
  // Perfetto Tracing Control
  PERFETTO_START: '/perfetto:start',
  PERFETTO_STOP: '/perfetto:stop',

  // Tracing Control
  DEVTOOLS_START: '/devtools:start',
  DEVTOOLS_STOP: '/devtools:stop',

  // Maintenance
  DEVICE_GET_TEMPERATURE: '/device:get-temperature', // Returns device temp (e.g. from dumpsys battery)
  DEVICE_CLEAN_STATE: '/device:clean-state',
  CONFIG_OVERRIDES: '/config:overrides',

  // Navigation
  NAVIGATE_REFRESH: '/navigate:refresh',
  NAVIGATE_URL: '/navigate:url',

  // Input Actions (Virtual Mirror / VMP)
  INPUT_TAP_RX_BOTTOM_CORNER: '/input:tap-rx-bottom-corner',
  INPUT_TAP_VMMV_UPLOAD: '/input:tap-vmmv-upload',
  INPUT_TAP_VMMV_VIDEO: '/input:tap-vmmv-video',
  INPUT_TAP_VMMV_CONTINUE: '/input:tap-vmmv-vmp-continue',
  INPUT_TAP_VMMV_REC: '/input:tap-vmmv-vmp-rec',
  INPUT_TAP_VMMV_VMP_RESTART: '/input:tap-vmmv-vmp-restart',
  INPUT_TAP_VMMV_MULTIVM_OPEN: '/input:tap-vmmv-multivm-open',
  INPUT_TAP_VMMV_MULTIVM_CLOSE: '/input:tap-vmmv-multivm-close',
  INPUT_TAP_VMMV_CLOSE: '/input:tap-vmmv-close',
  INPUT_TAP_VMMV_WIDGET: '/input:tap-vmmv-widget',
  INPUT_TAP_VMCORE_VMP_PDPLIGHT: '/input:tap-vmcore-vmp-pdplight',
  INPUT_TAP_VMCORE_VMP_REC: '/input:tap-vmcore-vmp-rec',
  INPUT_TAP_VMCORE_VMP_IMAGE: '/input:tap-vmcore-vmp-image',
  INPUT_TAP_VMCORE_VMP_RESTART: '/input:tap-vmcore-vmp-restart',
};
