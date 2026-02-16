import { execSync } from 'child_process';

// Configuration
const ADB_PORT = 9222;
const DEVTOOLS_SOCKET = 'localabstract:chrome_devtools_remote';

function standardConnection() {
  console.log('🔌 STARTING STANDARD ADB CONNECTION...');

  try {
    // STEP 1: Check ADB Availability and Device Status
    console.log('[1/3] Checking connected devices...');
    const devicesOutput = execSync('adb devices').toString().trim();

    // Check if the output contains a device state (ignoring the header)
    const deviceLines = devicesOutput
      .split('\n')
      .slice(1)
      .filter((line) => line.trim() !== '');

    if (deviceLines.length === 0) {
      throw new Error(
        '❌ No Android device found. Please connect via USB and enable USB Debugging.'
      );
    }

    if (deviceLines.some((line) => line.includes('unauthorized'))) {
      throw new Error(
        '❌ Device found but UNAUTHORIZED. Check the phone screen to allow debugging.'
      );
    }

    if (deviceLines.some((line) => line.includes('offline'))) {
      throw new Error(
        '❌ Device is OFFLINE. Try unplugging and replugging the USB cable.'
      );
    }

    console.log(`✅ Device detected: ${deviceLines[0].split('\t')[0]}`);

    // STEP 2: Clean and Set Port Forwarding
    console.log('[2/3] Configuring Port Forwarding (9222)...');

    // Optional: Remove old rules to prevent conflicts (Clean Slate)
    try {
      execSync(`adb forward --remove tcp:${ADB_PORT}`);
    } catch (e) {
      // Ignore error if rule didn't exist
    }

    // Set the new rule
    execSync(`adb forward tcp:${ADB_PORT} ${DEVTOOLS_SOCKET}`);
    console.log(
      `✅ Port forwarded: localhost:${ADB_PORT} -> ${DEVTOOLS_SOCKET}`
    );

    // STEP 3: Verification
    console.log('[3/3] Verifying connection integrity...');
    const forwardList = execSync('adb forward --list').toString();

    if (
      forwardList.includes(`tcp:${ADB_PORT}`) &&
      forwardList.includes(DEVTOOLS_SOCKET)
    ) {
      console.log('\n🚀 CONNECTION SUCCESSFUL! You are ready to profile.');
    } else {
      throw new Error(
        '❌ Verification Failed: The port forwarding rule does not appear in the active list.'
      );
    }
  } catch (error: any) {
    console.error('\n💥 CONNECTION FAILED 💥');
    console.error(`Reason: ${error.message}`);

    // If it's a specific ADB execution error, show stderr if available
    if (error.stderr) {
      console.error(`ADB Output: ${error.stderr.toString()}`);
    }

    process.exit(1);
  }
}

// Execute
standardConnection();
