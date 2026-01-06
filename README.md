# Puppeteer Profiling

This project provides a setup to connect Puppeteer to a Chrome instance running on an Android device, allowing for remote debugging and performance tracing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js and npm:** [Download and install Node.js](https://nodejs.org/en/download/) (Version 18.17.0 or higher is required for Puppeteer).
- **Android Debug Bridge (ADB):** You do **not** need the full Android SDK.
  - **Download:** Get the standalone **SDK Platform-Tools** package for your OS from the [official Google developer site](https://developer.android.com/tools/releases/platform-tools).
  - **Install:** Extract the folder to a known location (e.g., `C:\platform-tools`).
  - **Configuration:** The project looks for `adb` in the following order:
    1.  **`ADB_PATH` (Recommended):** Set this environment variable to your specific executable path (e.g., `set ADB_PATH=C:\platform-tools\adb.exe`).
    2.  **System PATH:** If you added the folder to your global PATH.
    3.  **Android SDK:** Checks `ANDROID_HOME` or `ANDROID_SDK_ROOT` if a full SDK is present.
  - **PowerShell Users:** If running commands manually from the platform-tools folder, you may need to prefix them with `.\` (e.g., `.\adb devices`).
- **A physical Android device:** With **USB debugging enabled** and connected to your computer.
  - _Note:_ Ensure Chrome is installed and running on the device before starting the script.

## Setup

1.  **Install Node.js dependencies:**

    ```bash
    npm install
    ```

2.  **Connect your Android device:**

    Ensure your Android device is connected via USB and USB debugging is enabled. Verify it's recognized by ADB:

    ```bash
    adb devices
    ```

    You should see your device listed.

3.  **Forward the Chrome DevTools port (for mobile mode):**

    This command forwards the Chrome DevTools port from your Android device to your local machine (port 9222). This is only required if you intend to use the `mobile` mode.

    ```bash
    adb forward tcp:9222 localabstract:chrome_devtools_remote
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

### 2. Control Tracing and Input (from a **second terminal**)

While the main script (`npm start`, `npm run start:mobile`, or `npm run start:desktop`) is running in your first terminal, you can use a second terminal to send commands to start and stop performance tracing, and to send input events.

> **Tip:** Refer to the `scripts` section in `package.json` for a complete list of all available manual and semi-automated commands (e.g., `npm run input:tap-vmmv-video`).

Trace files will be saved in your project directory with progressive numbering (e.g., `trace-0.json`, `trace-1.json`).

### 3. Running Test Cases

This project includes a test runner script (`profile.js`) that allows you to execute predefined sequences of commands (test cases) from the `src/testCases.js` file.

#### Running a Test Case

To run a test case, use the following command:

```bash
node profile.js <test_case_name>
```

Replace `<test_case_name>` with the name of the test case you want to run (e.g., `vmmv_tc01__tc04`).

#### Running a Test Case with a Custom Trace Name

You can also provide a custom name for the trace file by adding it as a second argument:

```bash
node profile.js <test_case_name> <custom_trace_name>
```

For example, to run `vmmv_tc01__tc04` and save the trace as `my-custom-trace.json`, use:

```bash
node profile.js vmmv_tc01__tc04 my-custom-trace
```

> **Tip:** Refer to the `scripts` section in `package.json` for a complete list of all available test case commands (e.g., `npm run profile:vmmv-tc01__tc04 my-custom-trace`).

## Enabling Memory Profiling on Android device

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

### DevTools Profiling Procedure: Android

**Mobile Setup and Calibration (Before Starting)**

1.  **Disable Virtual Memory:** Ensure "RAM Plus" (Samsung) or "Memory Extension" is **OFF** in device settings.
2.  **Set "Do Not Disturb":** Enable this mode to prevent notification interference.
3.  **Network Setup:** Connect to the specific network (WiFi/5G) required by the Performance Test Book.
4.  **Check Chrome Version:** Ensure the major version aligns with the Test Book requirements.
5.  **Clean Environment:**
    - Close **all** other applications.
    - Close **all** Chrome tabs.
    - **Clean RAM:** Use OS functionality (e.g., _Device Care > Memory > Clean now_).
6.  **Network Validation:** Run a **Google Speed Test**. Verify latency/bandwidth match Test Book ranges.
7.  **Device Performance Baseline:**
    - Go to `browserbench.org/Speedometer3.0/` and run the test.
    - **Verify Score:** Must be near the average defined in the Test Book.
    - _Note:_ If the score is low, use the **"Optimize now"** feature (in _Settings > Device Care_) and re-run the test.
8.  **Navigation:** Navigate to the target page to be analyzed.
9.  **Desktop Health Check:** On the recording machine, check Task Manager:
    - **CPU:** < 15%
    - **Memory:** < 70%
    - **Network:** < 5%
10. **Connection:** Connect the device to the desktop via USB.
