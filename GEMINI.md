# Profiling Tool Project

## Project Overview

This project is a TypeScript-based toolset for automating and profiling web applications using Puppeteer. It supports both local Desktop Chrome and remote Chrome on Android devices (via ADB).

The system follows a client-server architecture:

1.  **Command Server (`index.ts`):** Connects to the browser and exposes an HTTP API (port 8080) for automation commands.
2.  **CLI Runners:**
    - `bin/profile.ts`: Executes specific test cases defined in `src/testCases.ts`.
    - `bin/orchestrate.ts`: Executes complex, multi-step profiling scenarios defined in JSONC configuration files.

## Key Technologies

- **Runtime:** Node.js (v18.17.0+)
- **Automation:** Puppeteer
- **Mobile Bridge:** Android Debug Bridge (ADB)
- **Validation:** Zod (for configuration parsing)
- **Format:** JSONC (JSON with comments) for orchestration inputs.

> **Note on Prettier:** The project configuration disables trailing commas globally (`trailingComma: 'none'`). This ensures compatibility with the JSONC files used by the Orchestrator without needing extra processing.

## Directory Structure

- `index.ts`: Main entry point for the Command Server.
- `bin/`: CLI entry points.
  - `profile.ts`: Run a single test case (`npm run profile:<name>`).
  - `orchestrate.ts`: Run an orchestration plan (`npm run orchestrate <config>`).
  - `connect.ts`/`restore.ts`: ADB port forwarding management.
  - `clean.ts`: Device state cleanup (cache, cookies).
- `src/`: Core logic.
  - `orchestrator/`: Logic for multi-step execution plans.
  - `testCases.ts`: Definition of automation steps (taps, waits, traces).
  - `tapConfig.ts` / `swipeConfig.ts`: Coordinate-based input configurations.
  - `devtools-trace-manager.ts` / `perfetto-trace-manager.ts`: Profiling session management.
  - `server.ts` / `routes.ts`: HTTP API implementation.
  - `thermal.ts`: Device temperature monitoring and cooldown logic.
- `orchestrator-inputs/`: JSONC files defining orchestration plans.
- `traces-output/`: Default destination for generated trace files.

## Core Workflows

### 1. Single Test Case Profiling

Used for quick, repetitive testing of a specific interaction.

1. Start the server: `npm start` (or `npm run start:mobile:<env>`)
2. Run the profile: `npm run profile:<case_name> [custom_trace_name]`

### 2. Orchestrated Profiling (Recommended)

Used for automated, multi-step scenarios including cleanup, navigation, and multiple runs.

1. Ensure ADB is connected.
2. Run: `npm run orchestrate <config_name_in_orchestrator-inputs>`
   _Example:_ `npm run orchestrate vm-test-on-TV04_01.jsonc`

### 3. Adding New Interactions

- **New Tap:** Add coordinates to `src/tapConfig.ts`.
- **New Swipe:** Add coordinates/duration to `src/swipeConfig.ts`.
- **New Test Case:** Define the sequence of actions in `src/testCases.ts`.
- **New URL Alias:** Add to `src/urls.ts`.

## Development Conventions

- **Formatting & Commitment Flow:** Before applying any logic changes, run `npm run format` on the target files. If formatting changes occur, they **must be committed alone** (e.g., `style: format [files] with Prettier`) before proceeding. This ensures that logic diffs are not obscured by styling updates. **Subsequent logic changes must NOT be committed unless the user explicitly asks for it.**
- **Environment Variables:** Use `PUPPETEER_ENV` (e.g., `vmcore`, `pdwuat`) to switch target configurations.
- **Type Safety:** All configurations (especially for the orchestrator) are validated with **Zod**. See `src/orchestrator/config.ts`.
- **Formatting:** Prettier is enforced. Run `npm run format` before committing.
- **Error Handling:** Use the `getErrorMessage` utility from `src/utils.ts` for consistent logging.

## Troubleshooting

- **ADB Connection:** Run `adb devices`. If the device is "unauthorized", accept the prompt on the phone.
- **Port Conflict:** Ensure port 8080 and 9222 are not in use by other processes.
- **Thermal Throttling:** The tool will pause if the device exceeds safe temperatures. Use `npm run device:cooldown` to manually trigger a wait.
- **Zombie Processes:** If the server fails to stop, use `taskkill /F /IM node.exe` (Windows) or `pkill node` (Linux/macOS).
