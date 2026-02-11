# Profiling Tool Project

## Project Overview

This project provides a comprehensive toolset for connecting Puppeteer to a Chrome instance running on an Android device or a local desktop environment. Its primary purpose is to facilitate remote debugging, automated interaction, and performance tracing (profiling) of web applications.

The system operates on a client-server model:

1.  **Main Server (`index.ts`):** Establishes the Puppeteer connection to the browser (mobile or desktop) and spins up a local HTTP command server (port 8080).
2.  **Command Execution:** Users or scripts (like `profile.ts`) send HTTP requests to the command server to trigger actions such as starting/stopping traces, navigating, or simulating user input.

## Key Technologies

- **Runtime:** Node.js (v18.17.0+ recommended)
- **Browser Automation:** Puppeteer
- **Mobile Bridge:** Android Debug Bridge (ADB)
- **Language:** TypeScript
- **Utilities:** `cross-env` for environment variables, `ts-node` for execution.

## Directory Structure

- `index.ts`: Main entry point. Initializes the browser connection and starts the command server.
- `bin/`: CLI tools for interacting with the server.
  - `profile.ts`: A CLI runner for executing predefined test cases found in `src/testCases.ts`.
  - `navigate.ts`: A utility script for simple URL navigation.
  - `clean.ts`: A utility script for cleaning device state.
- `src/`: Core logic modules.
  - `browser.ts`: Handles Puppeteer connection logic (WebSocket discovery for Android, launching for Desktop).
  - `testCases.ts`: Defines automation scenarios (steps with commands and delays).
  - `server.ts`: Main server entry point; orchestrates routing and configuration.
  - `routes.ts`: Defines the HTTP route handlers for the command server.
  - `tapConfig.ts`: Configuration object for input tap commands.
  - `devtools-trace-manager.ts`: Encapsulates logic for starting, stopping, and naming standard Chrome DevTools traces.
  - `perfetto-trace-manager.ts`: Manages Android Perfetto tracing sessions (start, stop, pulling files).
  - `commands.ts`: Defines constant strings for command endpoints.
  - `page.ts`: Manages the target Puppeteer page instance.
  - `urls.ts`: Defines URL aliases for navigation.
  - `thermal.ts`: Manages device temperature monitoring and cooldown logic.
  - `utils.ts`: Helper functions for navigation, state cleaning, and responses.
  - `perfetto-configs/`: Contains configuration files for Perfetto traces (e.g., `trace_config.pbtxt`).

## Setup and Installation

1.  **Dependencies:**

    ```bash
    npm install
    ```

2.  **ADB Configuration (Mobile only):**
    - Ensure `adb` is in your PATH, or set the `ADB_PATH` environment variable.
    - Connect your Android device with USB debugging enabled.
    - Forward the DevTools port:
      ```bash
      adb forward tcp:9222 localabstract:chrome_devtools_remote
      ```

## Usage

### 1. Start the Controller Server

**Mobile Mode (Default):**
Connects to an existing Chrome instance on the connected Android device.

```bash
npm start
# OR specific environments
npm run start:mobile
npm run start:mobile:vmcore
npm run start:mobile:pdwuat
```

**Desktop Mode:**
Launches a new local Chrome window.

```bash
npm run start:desktop
```

### 2. Run Test Cases

In a separate terminal, use the `profile.ts` script to execute scenarios defined in `src/testCases.ts`.

**Syntax:**

```bash
npm run profile:<test_case_name>
# OR directly via ts-node
npx ts-node bin/profile.ts <test_case_name> [custom_trace_name]
```

**Examples:**

```bash
npm run profile:vmmv-tc01__tc04
npm run profile:vmcore_vmp-tc19
npx ts-node bin/profile.ts vmcore_vmp_tc19 my_custom_trace
```

### 3. Manual Control

You can manually trigger actions by sending HTTP requests to `localhost:8080`.

- **Start Tracing (DevTools):** `curl http://localhost:8080/devtools:start`
- **Stop Tracing (DevTools):** `curl http://localhost:8080/devtools:stop`
- **Start Tracing (Perfetto):** `curl http://localhost:8080/perfetto:start`
- **Stop Tracing (Perfetto):** `curl http://localhost:8080/perfetto:stop`
- **Simulate Input:** `curl http://localhost:8080/input:tap-vmmv-video`
- **Get Temperature:** `curl http://localhost:8080/device:get-temperature`

## Development Conventions

- **Language:** The project is written in TypeScript.
- **Build:** Run `npm run build` to compile TypeScript to JavaScript (output in `dist/`).
- **Code Style:** The project uses Prettier. Run `npm run format` to ensure consistency.
- **Test Cases:** New automation scenarios should be added to `src/testCases.ts`.
- **Trace Files:**
  - **DevTools Traces:** Saved in `devtools-output/` (e.g., `trace-1.json`).
  - **Perfetto Traces:** Saved in `perfetto-output/` (e.g., `trace-1.pftrace`).
