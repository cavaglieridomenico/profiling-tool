# Profiling Tool Project

## Project Overview

This project is a TypeScript-based toolset for automating and profiling web applications using Puppeteer. It supports both local Desktop Chrome and remote Chrome on Android devices (via ADB).

The system follows a client-server architecture:

1.  **Command Server (`index.ts`):** Connects to the browser and exposes an HTTP API (port 8080) for automation commands.
2.  **CLI Runners:**
    - `bin/profile.ts`: Executes specific test cases defined in `src/testCases.ts`.
    - `bin/orchestrate.ts`: Executes complex, multi-step profiling scenarios defined in JSONC configuration files.
    - `bin/extract-metrics.ts`: (Trace Extractor) Processes JSON traces into aggregated Excel reports with multi-tab scenario grouping.

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
  - `extract-metrics.ts`: Extract metrics from a trace (`npm run extract <trace>`).
  - `connect.ts` / `restore.ts`: ADB port forwarding management.
  - `clean.ts`: Device state cleanup (cache, cookies, logs).
  - `navigate.ts`: CLI for direct navigation.
- `src/`: Core logic.
  - `trace-parser/`: Logic for parsing DevTools traces and calculating metrics.
    - `diagnostics/`: Focused scripts for investigating specific trace events (Memory, Tasks, etc.). Use these as templates for new metrics.
  - `orchestrator/`: Logic for multi-step execution plans (`index.ts`, `config.ts`).
  - `testCases.ts`: Definition of automation steps (taps, waits, traces).
  - `tapConfig.ts` / `swipeConfig.ts`: Coordinate-based input configurations.
  - `devtools-trace-manager.ts` / `perfetto-trace-manager.ts`: Profiling session management.
  - `server.ts` / `routes.ts`: HTTP API implementation.
  - `thermal.ts`: Device temperature monitoring and cooldown logic.
  - `logger.ts`: Custom logging utility with file and emoji support.
  - `browser.ts` / `page.ts` / `commands.ts`: Puppeteer abstractions and automation logic.
  - `initialization.ts` / `version-checker.ts`: Setup and sanity checks.
  - `urls.ts`: URL alias definitions.
  - `config/`: Global constants and configuration.
  - `perfetto-configs/`: Protobuf-based trace configurations.
- `orchestrator-inputs/`: JSONC files defining orchestration plans, organized in `utils/` and `test-performed/`.
- `traces-output/`: Default destination for generated trace files.
- `logs-output/`: Destination for session logs.
- `assets/`: Documentation images and static resources.

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

### 3. Trace Extractor (Metric Extraction)

Used to process DevTools JSON traces and generate structured Excel reports. It automatically groups multiple runs into dedicated tabs based on their scenario prefix.

1. Ensure the trace files are in `traces-output/`.
2. **Batch Mode:** Run `npm run extract` to process all traces into a single aggregated Excel file.
3. **Single Mode:** Run `npm run extract <trace_file_name>` to process a specific file.

**Grouping Logic:** Aggregates by the `Test Version-Test Case-Test Device` prefix (e.g., `TV25_03-TC01-TD31_03`).

**Dynamic Profiling Offset:** To avoid counting startup overhead, the Trace Extractor skips the first 1.5 seconds of each trace by default. You can override this globally in `src/config/constants.ts` or per-trace by including `OFFSET=X` (e.g., `my-trace-OFFSET=5.json`) in the filename to specify the offset in seconds.

### 4. Extending Trace Metrics

To add new metrics to the extraction process:

1.  **Investigate:** Use scripts in `src/trace-parser/diagnostics/` to identify the specific trace events and fields needed.
2.  **Define:** Add any necessary interfaces to `src/types.ts` and constants to `src/config/constants.ts`.
3.  **Implement:** Update the parsing logic in `src/trace-parser/index.ts` to capture the new data.
4.  **Report:** Update `bin/extract-metrics.ts` to include the new metric in the Excel output.

### 5. Adding New Interactions

- **New Tap:** Add coordinates to `src/tapConfig.ts`.
- **New Swipe:** Add coordinates/duration to `src/swipeConfig.ts`.
- **New Test Case:** Define the sequence of actions in `src/testCases.ts`.
- **New URL Alias:** Add to `src/urls.ts`.

### 6. Performance Reporting

The reporting tool generates Confluence-compatible Markdown reports by comparing two aggregated Excel metrics files (Baseline vs. Current).

**Workflow:**
1. **Draft Config:** Run `npm run generate-config "<baseline_excel>" "<current_excel>"`. This creates a `.jsonc` file in the `reports/` directory with identified scenarios and TODO placeholders.
2. **Review:** Open the `.jsonc` file, fill in the SharePoint data URLs, and add high-level analysis to the `summary`, `insights`, and test case `description` fields.
3. **Generate Report:** Run `npm run report "<baseline_excel>" "<current_excel>" "<config_jsonc>"`. This produces the final `.md` report in the `reports/` folder.

**Mapping Architecture:**
- **Product Map:** `src/report-generator/report-test-cases-map.ts` stores human-readable names and Jira links for each product (e.g., VMMV).
- **Version Map:** `src/report-generator/report-version-map.ts` stores descriptive names and metadata for each test version (e.g., TV28_01 -> VMMV 5.6).
- **Device Map:** `src/report-generator/report-device-map.ts` stores descriptive names for hardware IDs.

### 7. Logging

The project uses a custom `Logger` class (`src/logger.ts`) for consistent console output and file logging.

- **Log Files:** Session logs are automatically saved to `logs-output/` with unique filenames.
- **Levels:** Supports `info`, `success`, `warn`, `error`, `start`, `stop`, and `debug`.
- **Formatting:** Emojis are used to visually distinguish log levels, and timestamps are included.
- **Streaming:** Use `logger.stream(source, data)` to handle output from child processes (like ADB or Puppeteer).

## Development Conventions

- **CRITICAL MANDATE: IMMUTABILITY OF CORE LOGIC:** The existing profiling (`bin/profile.ts`, `bin/orchestrate.ts`) and extraction (`src/trace-parser/`, `bin/extract-metrics.ts`) logic is considered **STABLE and IMMUTABLE**. It must remain read-only for any new analysis features. Any new "Agentic" or "Advanced Analysis" flows must consume the existing output structures (e.g., `TraceMetrics`) without modifying the underlying extraction mechanisms. This ensures consistency with historical test results.
- **Formatting & Commitment Flow:** Before applying any logic changes, run `npm run format` on the target files. If formatting changes occur, they **must be committed alone** (e.g., `style: format [files] with Prettier`) before proceeding. **You must ask the user to perform this commit.** This ensures that logic diffs are not obscured by styling updates. **Subsequent logic changes must NOT be committed unless the user explicitly asks for it.**
- **Environment Variables:** Use `PUPPETEER_ENV` (e.g., `vmcore`, `pdwuat`) to switch target configurations.
- **Type Safety:** All configurations (especially for the orchestrator) are validated with **Zod**. See `src/orchestrator/config.ts`.
- **Formatting:** Prettier is enforced. Run `npm run format` before committing.
- **Error Handling:** Use the `getErrorMessage` utility from `src/utils.ts` for consistent logging.

## Troubleshooting

- **ADB Connection:** Run `adb devices`. If the device is "unauthorized", accept the prompt on the phone.
- **Port Conflict:** Ensure port 8080 and 9222 are not in use by other processes.
- **Thermal Throttling:** The tool will pause if the device exceeds safe temperatures. Use `npm run device:cooldown` to manually trigger a wait.
- **Zombie Processes:** If the server fails to stop, use `taskkill /F /IM node.exe` (Windows) or `pkill node` (Linux/macOS).
