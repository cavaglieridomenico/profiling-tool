import path from 'path';
import { LogLevel, LoggerOptions } from './types';

export class Logger {
  private context: string | null;

  constructor(options: LoggerOptions = {}) {
    this.context = options.context || null;
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
    const hasDecoration = /^[\-\[]/.test(trimmedMsg);

    let levelIcon = '';
    switch (level) {
      case 'info':
        // Info icon is suppressed if message starts with emoji OR decoration ([ or -)
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
    return `[${timestamp}] ${levelIcon}${contextPrefix}${message}`;
  }

  public info(message: string): void {
    console.log(this.formatMessage('info', message));
  }

  public success(message: string): void {
    console.log(this.formatMessage('success', message));
  }

  public warn(message: string): void {
    console.warn(this.formatMessage('warn', message));
  }

  public error(message: string): void {
    console.error(this.formatMessage('error', message));
  }

  public start(message: string): void {
    console.log(this.formatMessage('start', message));
  }

  public stop(message: string): void {
    console.log(this.formatMessage('stop', message));
  }

  public debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(this.formatMessage('debug', message));
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

        if (hasTimestamp) {
          // It's already formatted, just add the source prefix
          const message = `[${source}] ${trimmedLine}`;
          if (isError) {
            console.error(message);
          } else {
            console.log(message);
          }
        } else {
          // It's a raw line (e.g. from a library or a crash), format it properly
          const level: LogLevel = isError ? 'error' : 'info';
          const formatted = this.formatMessage(level, trimmedLine);
          console.log(`[${source}] ${formatted}`);
        }
      }
    }
  }
}

export const logger = new Logger();
