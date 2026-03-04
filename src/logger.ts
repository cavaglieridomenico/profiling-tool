import fs from 'fs';
import path from 'path';
import { LogLevel, LoggerOptions } from './types';
import { LOGS_OUTPUT_DIR } from './config/constants';

export class Logger {
  private context: string | null;
  private logFilePath: string | null = null;

  constructor(options: LoggerOptions = {}) {
    this.context = options.context || null;
  }

  /**
   * Initializes log saving to a file.
   * Finds a unique filename based on the input name.
   */
  public setLogFile(inputName: string): void {
    if (!fs.existsSync(LOGS_OUTPUT_DIR)) {
      fs.mkdirSync(LOGS_OUTPUT_DIR, { recursive: true });
    }

    const baseName = path.basename(inputName, path.extname(inputName));
    let counter = 1;
    let fileName = `${baseName}-${counter}.txt`;
    let fullPath = path.join(LOGS_OUTPUT_DIR, fileName);

    while (fs.existsSync(fullPath)) {
      counter++;
      fileName = `${baseName}-${counter}.txt`;
      fullPath = path.join(LOGS_OUTPUT_DIR, fileName);
    }

    this.logFilePath = fullPath;
    this.info(`Logs for this session will be saved to: ${fullPath}`);
  }

  private saveToFile(message: string): void {
    if (this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, message + '\n', 'utf8');
      } catch (err) {
        // Fallback to console if file write fails, but don't loop
        console.error(`[Logger] Failed to write to log file: ${err}`);
      }
    }
  }

  private hasEmojiPrefix(message: string): boolean {
    return /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}🚀✅🎻🔌🖥️⏳👉⚙️🌐🧪📋⏹️🛑ℹ️⚠️❌🔍]/u.test(
      message.trim()
    );
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const trimmedMsg = message.trim();
    const hasEmoji = this.hasEmojiPrefix(trimmedMsg);
    // Suppress info icon for decoration characters: - (list), [ (tags), > (npm/node), --- (steps)
    const hasDecoration = /^[\-\[\>\-]/.test(trimmedMsg);

    let levelIcon = '';
    switch (level) {
      case 'info':
        levelIcon = hasEmoji || hasDecoration ? '' : 'ℹ️ ';
        break;
      case 'success':
        levelIcon = hasEmoji ? '' : '✅ ';
        break;
      case 'warn':
        levelIcon = hasEmoji ? '' : '⚠️ ';
        break;
      case 'error':
        levelIcon = hasEmoji ? '' : '❌ ';
        break;
      case 'debug':
        levelIcon = hasEmoji ? '' : '🔍 ';
        break;
      case 'start':
        levelIcon = hasEmoji ? '' : '🛑 ';
        break;
      case 'stop':
        levelIcon = hasEmoji ? '' : '⏹️ ';
        break;
    }

    const contextPrefix = this.context ? `[${this.context}] ` : '';
    // Construct parts and filter out empty strings to avoid double spaces
    const parts = [
      `[${timestamp}]`,
      levelIcon.trim(),
      contextPrefix.trim(),
      message
    ].filter((p) => p !== '');

    // Re-add the space after timestamp if needed
    let result = parts[0]; // [timestamp]
    for (let i = 1; i < parts.length; i++) {
      result += ' ' + parts[i];
    }

    return result;
  }

  public info(message: string): void {
    const formatted = this.formatMessage('info', message);
    console.log(formatted);
    this.saveToFile(formatted);
  }

  public success(message: string): void {
    const formatted = this.formatMessage('success', message);
    console.log(formatted);
    this.saveToFile(formatted);
  }

  public warn(message: string): void {
    const formatted = this.formatMessage('warn', message);
    console.warn(formatted);
    this.saveToFile(formatted);
  }

  public error(message: string): void {
    const formatted = this.formatMessage('error', message);
    console.error(formatted);
    this.saveToFile(formatted);
  }

  public start(message: string): void {
    const formatted = this.formatMessage('start', message);
    console.log(formatted);
    this.saveToFile(formatted);
  }

  public stop(message: string): void {
    const formatted = this.formatMessage('stop', message);
    console.log(formatted);
    this.saveToFile(formatted);
  }

  public debug(message: string): void {
    if (process.env.DEBUG) {
      const formatted = this.formatMessage('debug', message);
      console.log(formatted);
      this.saveToFile(formatted);
    }
  }

  /**
   * Specifically for streaming child process output
   */
  public stream(source: string, data: any, isError: boolean = false): void {
    const lines = String(data).split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Check if the line already has a timestamp (meaning it was logged by our Logger internally)
        const hasTimestamp = /^\[\d{2}:\d{2}:\d{2}\]/.test(trimmedLine);

        let finalLogLine: string;
        if (hasTimestamp) {
          // It's already formatted, just add the source prefix
          finalLogLine = `[${source}] ${trimmedLine}`;
          if (
            isError ||
            trimmedLine.includes('❌') ||
            trimmedLine.toLowerCase().includes('error')
          ) {
            console.error(finalLogLine);
          } else {
            console.log(finalLogLine);
          }
        } else {
          // It's a raw line, format it properly
          let level: LogLevel = isError ? 'error' : 'info';
          if (
            trimmedLine.toLowerCase().includes('error') ||
            trimmedLine.toLowerCase().includes('failed')
          ) {
            level = 'error';
          } else if (
            trimmedLine.toLowerCase().includes('success') ||
            trimmedLine.startsWith('✅')
          ) {
            level = 'success';
          }

          const formatted = this.formatMessage(level, trimmedLine);
          finalLogLine = `[${source}] ${formatted}`;
          console.log(finalLogLine);
        }
        this.saveToFile(finalLogLine);
      }
    }
  }
}

export const logger = new Logger();
