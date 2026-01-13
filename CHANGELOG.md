# CHANGELOG

# 1.5.0

### Added

- Perfetto tracing management and related commands
- Device temperature monitoring and thermal management
- Enhanced setup instructions for device connection and performance validation
- New test case profiles and improved test case documentation
- Support for config overrides with improved MIME type detection and cache handling

### Changed

- Refactored tracing commands and trace management logic
- Restructured server and utility functions, implemented route handlers for commands
- Migrated project to TypeScript and restructured codebase
- Updated .gitignore to include perfetto-output directory and removed obsolete trace files
- Improved code formatting and documentation

## 1.4.0

### Added

- New override command and logic for configuration overrides
- Additional commands for device and profile management
- Support for mobile/desktop mode checks
- Clean state command for device
- New and updated URLs for navigation and testing

### Changed

- Updated Puppeteer version
- Improved command naming consistency
- Enhanced logic for VM/PDW test environment handling

## 1.3.1

### Added

- Added new commands and tested cases

## 1.3.0

### Added

- Added logic and command list for semi-automated profiling

## 1.2.5

### Added

- Added a tap commands for Virtual Mirror

### Removed

- command to open a new Chrome window with `chrome://inspect`

## 1.2.4

### Added

- Added a command to open a new Chrome window with `chrome://inspect` to help with debugging mobile devices.

## 1.2.3

### Refactored

- Added modularization.

### Added

- Added page refresh command for both desktop and mobile

## 1.2.2

### Added

- Added source maps to profiled traces.

## 1.2.1

### Changed

- Disabled cache for desktop and mobile.

## 1.2.0

### Added

- Desktop mode now automatically grants camera permissions.

### Changed

- Prettier code formatter added with configuration (`.prettierrc`) and `format` script in `package.json`.

## 1.0.1

### Fixed

- `connect.js`: Adjusted desktop mode to render as a full desktop view and launch Chrome in a maximized window.
- `README.md`: Updated usage instructions for desktop mode to reflect full desktop rendering.

## 1.0.0

### Added

- `connect.js`: Initial script to connect Puppeteer to a remote Chrome instance on an Android device.
  - Automatically discovers the WebSocket endpoint for connection.
  - Includes an HTTP command server (on port 8080) to control tracing.
  - Supports `trace:start` and `trace:stop` commands via HTTP endpoints.
  - Saves trace files with progressive numbering (e.g., `trace-0.json`).
  - Added support for "mobile" and "desktop" modes:
    - "mobile" mode connects to a Chrome instance on an Android device.
    - "desktop" mode launches a local Chrome instance (previously Incognito).
- `package.json`: Added `trace:start` and `trace:stop` npm scripts for convenience.
  - Updated `package.json` with `start:mobile` and `start:desktop` scripts.
- `.gitignore`: Added to ignore `node_modules/` and `trace-*.json` files.
- `README.md`: Comprehensive guide for project setup, usage, and troubleshooting.
  - Updated `README.md` to reflect "mobile" and "desktop" mode usage.
