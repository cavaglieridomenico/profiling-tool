# CHANGELOG

## Unreleased

### Added

*   Prettier code formatter added with configuration (`.prettierrc`) and `format` script in `package.json`.

## 1.0.1

### Fixed

*   `connect.js`: Adjusted desktop mode to render as a full desktop view and launch Chrome in a maximized window.
*   `README.md`: Updated usage instructions for desktop mode to reflect full desktop rendering.
*   `CHANGELOG.md`: Updated to reflect versioning.

## 1.0.0

### Added

*   `connect.js`: Initial script to connect Puppeteer to a remote Chrome instance on an Android device.
    *   Automatically discovers the WebSocket endpoint for connection.
    *   Includes an HTTP command server (on port 8080) to control tracing.
    *   Supports `trace:start` and `trace:stop` commands via HTTP endpoints.
    *   Saves trace files with progressive numbering (e.g., `trace-0.json`).
    *   Added support for "mobile" and "desktop" modes:
        *   "mobile" mode connects to a Chrome instance on an Android device.
        *   "desktop" mode launches a local Chrome instance (previously Incognito).
*   `package.json`: Added `trace:start` and `trace:stop` npm scripts for convenience.
    *   Updated `package.json` with `start:mobile` and `start:desktop` scripts.
*   `.gitignore`: Added to ignore `node_modules/` and `trace-*.json` files.
*   `README.md`: Comprehensive guide for project setup, usage, and troubleshooting.
    *   Updated `README.md` to reflect "mobile" and "desktop" mode usage.
