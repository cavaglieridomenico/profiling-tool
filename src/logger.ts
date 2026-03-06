import fs from 'fs';
import path from 'path';
import { LogLevel, LoggerOptions } from './types';
import { LOGS_OUTPUT_DIR } from './config/constants';

/**
 * Persistence-enabled logger with semantic icon mapping and child-process stream multiplexing (via .stream()).
 * Logs are formatted as `[HH:mm:ss] [LevelIcon] [Context] message` and persisted to unique files via .setLogFile().
 * Usage: Use semantic methods (info, success, etc.); reserve .start() (🔴) and .stop() (⏹️) for tracing and server lifecycles.
 */
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
    return /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}🚀✅🎻🔌🖥️⏳👉⚙️🌐🧪🔴⏹️🛑ℹ️⚠️❌🔍]/u.test(
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

    let levelIcon = '⌨️  ';
    switch (level) {
      case 'info':
        if (
          /^(Initializing|Starting|Stopping|Pulling|Pushing|Connecting|Navigating|Waiting|Checking|Forcing)/i.test(
            trimmedMsg
          )
        ) {
          levelIcon = '⚙️ ';
        } else {
          levelIcon = hasEmoji || hasDecoration ? '' : 'ℹ️  ';
        }
        break;
      case 'success':
        levelIcon = hasEmoji ? '' : '✅ ';
        break;
      case 'warn':
        levelIcon = hasEmoji ? '' : '⚠️  ';
        break;
      case 'error':
        levelIcon = hasEmoji ? '' : '❌  ';
        break;
      case 'debug':
        levelIcon = hasEmoji ? '' : '🔍  ';
        break;
      case 'start':
        levelIcon = hasEmoji ? '' : '🔴  ';
        break;
      case 'stop':
        levelIcon = hasEmoji ? '' : '⏹️  ';
        break;
    }

    const contextPrefix = this.context ? `[${this.context}] ` : '';

    // If the message starts with an emoji and we suppressed the level icon,
    // ensure the message itself has a double space after its leading emoji.
    let finalMessage = message;
    if (hasEmoji && levelIcon === '') {
      const emojiMatch = message.match(
        /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}🚀✅🎻🔌🖥️⏳👉⚙️🌐🧪🔴⏹️🛑ℹ️⚠️❌🔍])\s*(.*)/u
      );
      if (emojiMatch) {
        finalMessage = `${emojiMatch[1]}  ${emojiMatch[2]}`;
      }
    }

    const timestampPart = `[${timestamp}]`;
    const iconPart = levelIcon !== '' ? levelIcon : '';
    const ctxPart = contextPrefix.trim() !== '' ? `[${this.context}]  ` : '';

    // Filter out empty parts and join them
    // We avoid .trim() on levelIcon because it contains our desired spacing
    let result = timestampPart;
    if (iconPart) result += ` ${iconPart}`;
    if (ctxPart) result += ` ${ctxPart}`;
    if (result.endsWith(' ')) {
      result += finalMessage;
    } else {
      result += ` ${finalMessage}`;
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
  public stream(
    source: string,
    data: string | Buffer,
    isError: boolean = false
  ): void {
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
          const lowerLine = trimmedLine.toLowerCase();
          const isSuccessMessage =
            lowerLine.includes('success') ||
            lowerLine.includes('written into the output file') ||
            lowerLine.includes('saved to') ||
            lowerLine.includes('file pushed') ||
            lowerLine.includes('file pulled') ||
            lowerLine.includes('connected to the perfetto traced service') ||
            lowerLine.includes('starting tracing') ||
            lowerLine.includes('no pty') ||
            trimmedLine.startsWith('✅');

          let level: LogLevel = 'info';

          if (lowerLine.includes('error') || lowerLine.includes('failed')) {
            level = 'error';
          } else if (lowerLine.includes('warning')) {
            level = 'warn';
          } else if (isError && !isSuccessMessage) {
            level = 'error';
          } else if (isSuccessMessage) {
            level = 'success';
          }

          const formatted = this.formatMessage(level, trimmedLine);
          finalLogLine = `[${source}] ${formatted}`;
          if (level === 'error') {
            console.error(finalLogLine);
          } else {
            console.log(finalLogLine);
          }
        }
        this.saveToFile(finalLogLine);
      }
    }
  }
}

export const logger = new Logger();
