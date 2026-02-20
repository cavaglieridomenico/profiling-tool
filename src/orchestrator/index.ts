import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ensureDeviceIsCool } from '../thermal';
import { sendCommand, getErrorMessage } from '../utils';
import { OrchestratorConfig } from './config';
import { standardConnection } from '../../bin/connect';
import { runTestCase } from '../../bin/profile';

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class Orchestrator {
  private serverProcess: ChildProcess | null = null;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  public async start(): Promise<void> {
    try {
      console.log('🎻 Orchestrator Starting...');

      // 1. Connection (Optional but default)
      if (this.config.setup.connect !== false) {
        try {
          standardConnection();
        } catch (e: unknown) {
          console.error(`Failed to establish ADB connection: ${getErrorMessage(e)}`);
          process.exit(1);
        }
      }

      // 2. Start Server
      await this.startServer();

      // 3. Loop Runs
      const totalRuns = this.config.runs || 1;
      console.log(`\n📋 Plan: ${totalRuns} run(s) of ${this.config.timeline.length} timeline item(s).`);

      for (let run = 1; run <= totalRuns; run++) {
        console.log(`\n--- 🏃 Run ${run}/${totalRuns} ---`);

        for (const item of this.config.timeline) {
          const { targetUrl, setupCommands, caseName } = item;
          console.log(`\n👉 Case: ${caseName} | URL: ${targetUrl}`);

          // A. Thermal Check
          if (this.config.setup.checkThermal !== false) {
            await ensureDeviceIsCool();
          }

          // B. Clean State
          console.log(`🧹 [1/4] Cleaning device state for ${targetUrl}...`);
          const cleanCmd = `device:clean-state?url=${encodeURIComponent(targetUrl)}&mode=mobile`;
          try {
            await sendCommand(cleanCmd);
          } catch (e: unknown) {
            console.error(`   Clean failed: ${getErrorMessage(e)}`);
          }

          // C. Navigate to target URL
          console.log(`🌐 [2/4] Navigating to ${targetUrl}...`);
          const navCmd = `navigate:url?url=${encodeURIComponent(targetUrl)}`;
          try {
            await sendCommand(navCmd);
          } catch (e: unknown) {
            console.error(`   Navigation failed: ${getErrorMessage(e)}`);
          }

          // D. Execute Setup Commands
          if (setupCommands && setupCommands.length > 0) {
            console.log(`⚙️  [3/4] Executing ${setupCommands.length} setup commands...`);
            for (let setupCmd of setupCommands) {
              const sanitizedCmd = setupCmd.startsWith('/') ? setupCmd.substring(1) : setupCmd;
              try {
                await sendCommand(sanitizedCmd);
              } catch (e: unknown) {
                console.error(`   Setup command ${setupCmd} failed: ${getErrorMessage(e)}`);
              }
            }
          }

          // E. Execute actual Profile Test Case
          console.log(`🧪 [4/4] Executing test case: ${caseName}...`);
          const traceName = `run${run}_${caseName}`;
          try {
            await runTestCase(caseName, traceName);
          } catch (e: unknown) {
             console.error(`❌ Case ${caseName} failed: ${getErrorMessage(e)}`);
          }

          await sleep(2000);
        }
      }

      console.log('\n✅ All runs completed.');

    } catch (e: unknown) {
      console.error(`\n💥 Orchestration Failed: ${getErrorMessage(e)}`);
    } finally {
      this.stopServer();
    }
  }

  private async startServer(): Promise<void> {
    console.log('🖥️  Starting Server (npm start)...');
    
    // We use 'npm start' which runs 'ts-node index.ts'
    // This allows us to rely on the project's standard start script.
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    this.serverProcess = spawn(npmCmd, ['start', 'mobile'], {
      cwd: process.cwd(),
      stdio: 'pipe', // We want to capture output to detect readiness
      env: { ...process.env }, // Inherit env
      detached: false
    });

    if (this.serverProcess.stdout) {
        this.serverProcess.stdout.on('data', (data) => {
            // Uncomment to see server logs
            // process.stdout.write(`[Server] ${data}`);
        });
    }
    
    if (this.serverProcess.stderr) {
       this.serverProcess.stderr.on('data', (data) => {
         process.stderr.write(`[Server Error] ${data}`);
       });
    }

    // Wait for the server to be responsive
    console.log('⏳ Waiting for server to be ready on port 8080...');
    const maxRetries = 30; // 30 seconds approx
    for (let i = 0; i < maxRetries; i++) {
       try {
         await sendCommand('device:get-temperature'); // A simple safe command
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
      // On Windows, tree-kill might be needed for spawned npm processes,
      // but 'taskkill' is a built-in alternative.
      if (process.platform === 'win32' && this.serverProcess.pid) {
          try {
             spawn('taskkill', ['/pid', this.serverProcess.pid.toString(), '/f', '/t']);
          } catch (e) { /* ignore */ }
      } else {
        this.serverProcess.kill();
      }
      this.serverProcess = null;
    }
  }
}
