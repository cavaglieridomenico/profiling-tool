# Puppeteer Profiling

This project provides a setup to connect Puppeteer to a Chrome instance running on an Android device, allowing for remote debugging and performance tracing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js and npm:** [Download and install Node.js](https://nodejs.org/en/download/)
- **Android Debug Bridge (ADB):** Part of the Android SDK Platform-Tools. Ensure `adb` is accessible in your system's PATH.
  - If `adb` is not in your PATH, you will need to navigate to the `platform-tools` directory within the Android SDK to run `adb` commands. For example:
    ```bash
    C:\> cd path\to\android-sdk\platform-tools
    ```
  - **PowerShell users:** If you are using PowerShell, you may need to run `adb` commands by prefixing them with `.\` (e.g., `.\adb devices`).
- **A physical Android device:** With USB debugging enabled and connected to your computer.

## Setup

1.  **Install Node.js dependencies:**

    ```bash
    npm install
    ```

2.  **Connect your Android device:**

    Ensure your Android device is connected via USB and USB debugging is enabled. Verify it's recognized by ADB:

    ```bash
    .\adb devices
    ```

    You should see your device listed.

3.  **Forward the Chrome DevTools port (for mobile mode):**

    This command forwards the Chrome DevTools port from your Android device to your local machine (port 9222). This is only required if you intend to use the `mobile` mode.

    ```bash
    .\adb forward tcp:9222 localabstract:chrome_devtools_remote
    ```

    Keep this command running in a dedicated terminal or ensure it's executed before starting the `index.js` script in `mobile` mode.

## Usage

Once the setup is complete, you can use the `index.js` script to interact with Chrome on your Android device or a local desktop Chrome instance.

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

## Enabling Memory Profiling on Mobile

For mobile devices, you need to manually enable memory profiling in Chrome before you can capture a trace with heap data. Here are the steps:

1.  **Connect your device:** Make sure your Android device is connected to your computer and that USB debugging is enabled.

2.  **Stop any running instance of Chrome:**

    ```bash
    .\adb shell am force-stop com.android.chrome
    ```

3.  **Set the command-line flags for Chrome:** This command tells Chrome to launch with the `--enable-memory-infra` flag.

    ```bash
    .\adb shell 'echo "chrome --enable-memory-infra" > /data/local/tmp/chrome-command-line'
    ```

4.  **Start Chrome and open a URL (Optional):** You can start Chrome with a specific URL.

    ```bash
    .\adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main -d "https://your-url.com"
    ```

    If you don't want to open a specific URL, you can just start Chrome manually on your device or use this command:

    ```bash
    .\adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main
    ```

5.  **Forward the DevTools port:** Keep this terminal window open.

    ```bash
    .\adb forward tcp:9222 localabstract:chrome_devtools_remote
    ```

6.  **In a new terminal**, run the `start:mobile` script:
    ```bash
    npm run start:mobile
    ```

Now you can start and stop tracing, and the trace files will include memory profiling data.

## Troubleshooting

- **"Cannot connect to the device" error (Mobile Mode):**
  - Ensure your Android device is connected and USB debugging is enabled.
  - Verify `adb devices` lists your device.
  - Confirm that `adb forward tcp:9222 localabstract:chrome_devtools_remote` was executed successfully and Chrome is running on your device.
- **"Cannot connect to the device" error (Desktop Mode):**
  - Ensure Puppeteer can launch Chrome on your desktop.
- **`curl` command not found:** If you are on Windows, you might need to use `Invoke-WebRequest` in PowerShell or install `curl` for Windows.
- **Port 9222 Already in Use:** If you get an error that port 9222 is already in use, you can find the process that is using the port and kill it.
  - **Find the process ID (PID):**
    ```bash
    netstat -ano | findstr "9222"
    ```
    This will show you the PID of the process using port 9222.
  - **Kill the process:**
    ```bash
    taskkill /PID 3596 /F
    ```
    Replace `3596` with the actual PID you found in the previous step.
