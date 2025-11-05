# Puppeteer Profiling

This project provides a setup to connect Puppeteer to a Chrome instance running on an Android device, allowing for remote debugging and performance tracing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js and npm:** [Download and install Node.js](https://nodejs.org/en/download/)
- **Android Debug Bridge (ADB):** Part of the Android SDK Platform-Tools. Ensure `adb` is accessible in your system's PATH.
- **A physical Android device:** With USB debugging enabled and connected to your computer.

## Setup

1.  **Clone the repository (if applicable) or navigate to your project directory:**

    ```bash
    cd /path/to/puppeteer-profiling
    ```

2.  **Install Node.js dependencies:**

    ```bash
    npm install
    ```

3.  **Connect your Android device:**

    Ensure your Android device is connected via USB and USB debugging is enabled. Verify it's recognized by ADB:

    ```bash
    adb devices
    ```

    You should see your device listed.

4.  **Forward the Chrome DevTools port (for mobile mode):**

    This command forwards the Chrome DevTools port from your Android device to your local machine (port 9222). This is only required if you intend to use the `mobile` mode.

    ```bash
    adb forward tcp:9222 localabstract:chrome_devtools_remote
    ```

    Keep this command running in a dedicated terminal or ensure it's executed before starting the `connect.js` script in `mobile` mode.

## Usage

Once the setup is complete, you can use the `connect.js` script to interact with Chrome on your Android device or a local desktop Chrome instance.

### 1. Start the Puppeteer connection and command server

You can start the script in either **mobile** or **desktop** mode. The command server for tracing will always run on port `8080`.

- **Mobile Mode (default):** Connects to Chrome on your Android device.

  ```bash
  npm start
  # or explicitly
  npm run start:mobile
  ```

  If no URL is provided, it will list the currently open tabs on your device.

- **Desktop Mode:** Launches a new local Chrome instance in maximized size, rendering as a full desktop view, with camera permissions automatically granted.
  ```bash
  npm run start:desktop
  ```
  If no URL is provided, it will open a blank page.

The script will keep the connection alive. To stop it, press `Ctrl+C`.

### 2. Navigate to a specific URL (Optional)

You can instruct the script to open a new tab and navigate to a specific URL.

- **Mobile Mode with URL:**

  ```bash
  npm run start:mobile -- http://example.com
  ```

- **Desktop Mode with URL:**
  ```bash
  npm run start:desktop -- http://example.com
  ```

### 3. Control Tracing (from a **second terminal**)

While the main script (`npm start`, `npm run start:mobile`, or `npm run start:desktop`) is running in your first terminal, you can use a second terminal to send commands to start and stop performance tracing.

- **To start a trace:**

  ```bash
  npm run trace:start
  ```

- **To stop a trace:**
  ```bash
  npm run trace:stop
  ```

Trace files will be saved in your project directory with progressive numbering (e.g., `trace-0.json`, `trace-1.json`).

## Troubleshooting

- **"Cannot connect to the device" error (Mobile Mode):**
  - Ensure your Android device is connected and USB debugging is enabled.
  - Verify `adb devices` lists your device.
  - Confirm that `adb forward tcp:9222 localabstract:chrome_devtools_remote` was executed successfully and Chrome is running on your device.
- **"Cannot connect to the device" error (Desktop Mode):**
  - Ensure Puppeteer can launch Chrome on your desktop.
- **`curl` command not found:** If you are on Windows, you might need to use `Invoke-WebRequest` in PowerShell or install `curl` for Windows.
