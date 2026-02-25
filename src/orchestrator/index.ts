import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ensureDeviceIsCool } from '../thermal';
import { sendCommand, getErrorMessage } from '../utils';
import { OrchestratorConfig } from './config';
import { runTestCase } from '../../bin/profile';
import { urls } from '../urls';
import { COMMANDS } from '../commands';
import { testCases } from '../testCases';
import { performApplicationSetup } from '../initialization';

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class Orchestrator {
  private serverProcess: ChildProcess | null = null;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  private resolveValue(value: string, targetUrl?: string): string {
    if (!value) return value;

    if (value.startsWith('urls.')) {
      const key = value.substring(5);
      return urls[key] || value;
    }

    if (value.startsWith('COMMANDS.')) {
      const parts = value.substring(9).split('?');
      const key = parts[0];
      const baseCommand = (COMMANDS as any)[key];

      if (!baseCommand) return value;

      let query = parts[1] || '';

      // Auto-populate targetUrl if it's a clean command and no URL is provided
      if (key === 'DEVICE_CLEAN_STATE' && !query.includes('url=') && targetUrl) {
        query = `url=${encodeURIComponent(targetUrl)}&mode=mobile`;
      }

      if (query) {
        // Resolve nested urls. references in query
        const resolvedQuery = query
          .split('&')
          .map((param) => {
            const [k, v] = param.split('=');
            if (v && v.startsWith('urls.')) {
              const urlKey = v.substring(5);
              return `${k}=${encodeURIComponent(urls[urlKey] || v)}`;
            }
            return param;
          })
          .join('&');
        return `${baseCommand}?${resolvedQuery}`;
      }

      return baseCommand;
    }

    if (value.startsWith('testCases.')) {
      const key = value.substring(10);
      return testCases[key] ? key : value;
    }

    return value;
  }

  public async start(): Promise<void> {
    try {
      console.log('🎻 Orchestrator Starting...');

      // 1. Connection Pre-Check (Unified Setup)
      // We perform a light-weight setup check before spawning the server.
      // This ensures we have adb, devices, and browser ready.
      if (this.config.setup.connect !== false) {
        try {
          const browserPreCheck = await performApplicationSetup({
            mode: 'mobile',
            checkUpdates: true,
            checkThermal: this.config.setup.checkThermal !== false,
            skipAdb: false, // Ensure ADB forwarding is ready
            strictVersionCheck: this.config.setup.strictVersionCheck === true,
          });
          // Close the pre-check browser connection as we'll spawn the server process next
          await browserPreCheck.disconnect();
          console.log('✅ Pre-check completed. Spawning Command Server...');
        } catch (e: unknown) {
          console.error(`💥 Pre-check Failed: ${getErrorMessage(e)}`);
          process.exit(1);
        }
      }

      // 2. Start Command Server Process
      await this.startServer();

      // 3. Execution Plan
      console.log(`\n📋 Plan: ${this.config.timeline.length} timeline item(s) to execute.`);

      let itemIndex = 1;
      for (const item of this.config.timeline) {
        const runs = item.runs || 1;

        for (let run = 1; run <= runs; run++) {
          const rawTargetUrl = item.targetUrl;
          const targetUrl = rawTargetUrl ? this.resolveValue(rawTargetUrl) : undefined;
          const preNavigationCommands = (item.preNavigationCommands || []).map((cmd) =>
            this.resolveValue(cmd, targetUrl)
          );
          const setupCommands = (item.setupCommands || []).map((cmd) =>
            this.resolveValue(cmd, targetUrl)
          );
          const caseName = item.caseName ? this.resolveValue(item.caseName) : undefined;
          const traceName = item.traceName ? this.resolveValue(item.traceName, targetUrl) : undefined;
          const waitUntil = item.waitUntil || 'load';
          const postNavigationDelay = item.postNavigationDelay || 0;
          const postCommandDelay = item.postCommandDelay || 0;

          console.log(
            `\n--- 🏃 Step ${itemIndex}/${this.config.timeline.length}${
              runs > 1 ? ` (Run ${run}/${runs})` : ''
            } ---`
          );

          if (targetUrl) {
            console.log(`👉 Target: ${targetUrl}${caseName ? ` | Case: ${caseName}` : ''}`);
          } else {
            console.log(`👉 Action on current page${caseName ? ` | Case: ${caseName}` : ''}`);
          }

          // A. Thermal Check
          if (this.config.setup.checkThermal !== false) {
            await ensureDeviceIsCool();
          }

          // B. Pre-Navigation Commands
          if (preNavigationCommands && preNavigationCommands.length > 0) {
            console.log(`⚙️  [1/5] Executing ${preNavigationCommands.length} pre-navigation commands...`);
            for (let preCmd of preNavigationCommands) {
              const sanitizedCmd = preCmd.startsWith('/') ? preCmd.substring(1) : preCmd;
              try {
                const response = await sendCommand(sanitizedCmd);
                console.log(`   [Command] ${preCmd}: ${response}`);
                // If it was a clean command, add a small stabilization pause
                if (sanitizedCmd.includes('clean-state')) {
                  console.log('⏳ Waiting 5s for device to stabilize after clean...');
                  await sleep(5000);
                }
              } catch (e: unknown) {
                console.error(`   Pre-navigation command ${preCmd} failed: ${getErrorMessage(e)}`);
              }
            }
          } else {
            console.log(`⏩ [1/5] No pre-navigation commands.`);
          }

          // C. Navigate to target URL (Only if targetUrl is provided)
          if (targetUrl) {
            console.log(`🌐 [2/5] Navigating to ${targetUrl} (waitUntil: ${waitUntil})...`);
            const navCmd = `navigate:url?url=${encodeURIComponent(targetUrl)}&waitUntil=${waitUntil}`;
            try {
              const response = await sendCommand(navCmd);
              console.log(`   [Navigation]: ${response}`);
            } catch (e: unknown) {
              console.error(`   Navigation failed: ${getErrorMessage(e)}`);
            }
          } else {
            console.log(`⏩ [2/5] No target URL. Skipping navigation.`);
          }

          // D. Post-Navigation Delay
          if (postNavigationDelay > 0) {
            console.log(
              `⏳ [3/5] Waiting ${postNavigationDelay}ms for ${
                targetUrl ? 'page stabilization' : 'stabilization'
              }...`
            );
            await sleep(postNavigationDelay);
          } else {
            console.log(`⏩ [3/5] No stabilization delay.`);
          }

          // E. Execute Setup Commands
          if (setupCommands && setupCommands.length > 0) {
            console.log(`⚙️  [4/5] Executing ${setupCommands.length} setup commands...`);
            for (let setupCmd of setupCommands) {
              const sanitizedCmd = setupCmd.startsWith('/') ? setupCmd.substring(1) : setupCmd;
              try {
                const response = await sendCommand(sanitizedCmd);
                console.log(`   [Command] ${setupCmd}: ${response}`);
              } catch (e: unknown) {
                console.error(`   Setup command ${setupCmd} failed: ${getErrorMessage(e)}`);
              }
            }
          }

          // F. Execute actual Profile Test Case
          if (caseName) {
            console.log(`🧪 [5/5] Executing test case: ${caseName}...`);
            // Use provided traceName or fallback to step index + case name
            const finalTraceName = traceName || `step${itemIndex}_${caseName}`;
            try {
              await runTestCase(caseName, finalTraceName);
            } catch (e: unknown) {
              console.error(`❌ Case ${caseName} failed: ${getErrorMessage(e)}`);
            }
          } else {
            console.log(`⏩ [5/5] No test case provided. Skipping profiling step.`);
          }

          if (postCommandDelay > 0) {
            console.log(`⏳ Waiting ${postCommandDelay}ms after command execution...`);
            await sleep(postCommandDelay);
          }

          await sleep(2000);
        }
        itemIndex++;
      }

      console.log('\n✅ All runs completed.');

    } catch (e: unknown) {
      console.error(`\n💥 Orchestration Failed: ${getErrorMessage(e)}`);
    } finally {
      this.stopServer();
    }
  }

  private async startServer(): Promise<void> {
    const puppeteerEnv = this.config.setup.puppeteerEnv;
    console.log(
      `🖥️  Starting Server (npm start) with PUPPETEER_ENV=${puppeteerEnv || 'default'}...`
    );

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ...(puppeteerEnv ? { PUPPETEER_ENV: puppeteerEnv } : {}),
    };

    this.serverProcess = spawn(npmCmd, ['start', 'mobile'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env,
      detached: false,
      shell: true,
    });

    if (this.serverProcess.stdout) {
      this.serverProcess.stdout.on('data', (data) => {
        // Log server output to orchestrator console
        process.stdout.write(`[Server] ${data}`);
      });
    }

    if (this.serverProcess.stderr) {
      this.serverProcess.stderr.on('data', (data) => {
        process.stderr.write(`[Server Err] ${data}`);
      });
    }

    // Wait for the server to be responsive
    console.log('⏳ Waiting for server to be ready on port 8080...');
    const maxRetries = 30;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await sendCommand('device:get-temperature');
        console.log('✅ Server is ready.');
        return;
      } catch (e) {
        await sleep(1000);
      }
    }

    this.stopServer();
    throw new Error('Server failed to start within timeout.');
  }

  private stopServer(): void {
    if (this.serverProcess) {
      console.log('🛑 Stopping Server...');
      if (process.platform === 'win32' && this.serverProcess.pid) {
        try {
          spawn('taskkill', ['/pid', this.serverProcess.pid.toString(), '/f', '/t']);
        } catch (e) {
          /* ignore */
        }
      } else {
        this.serverProcess.kill();
      }
      this.serverProcess = null;
    }
  }
}
