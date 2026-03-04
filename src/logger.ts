import path from 'path';

export type LogLevel =
  | 'info'
  | 'warn'
  | 'error'
  | 'debug'
  | 'success'
  | 'start'
  | 'stop';

export interface LoggerOptions {
  context?: string;
  isErrorStream?: boolean;
}

export class Logger {
  private context: string | null;

  constructor(options: LoggerOptions = {}) {
    this.context = options.context || null;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let levelIcon = '';
    switch (level) {
      case 'info':
        // Don't add icon if message already starts with a common emoji/special char used in the project
        const hasEmojiPrefix =
          /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}🚀✅🎻🔌🖥️⏳👉⚙️🌐🧪📋🌐]/u.test(
            message.trim()
          );
        levelIcon = hasEmojiPrefix ? '' : 'ℹ️ ';
        break;
      case 'success':
        levelIcon = '✅ ';
        break;
      case 'warn':
        levelIcon = '⚠️ ';
        break;
      case 'error':
        levelIcon = '❌ ';
        break;
      case 'debug':
        levelIcon = '🔍 ';
        break;
      case 'start':
        levelIcon = '🛑 ';
        break;
      case 'stop':
        levelIcon = '⏹️ ';
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
        const message = `[${source}] ${trimmedLine}`;
        if (isError) {
          console.error(message);
        } else {
          console.log(message);
        }
      }
    }
  }
}

export const logger = new Logger();
