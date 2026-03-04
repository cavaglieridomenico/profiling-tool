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

  private hasEmoji(message: string): boolean {
    return /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}🚀✅🎻🔌🖥️⏳👉⚙️🌐🧪📋⏹️🛑ℹ️⚠️❌🔍\-\[]/u.test(
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

    let levelIcon = '';
    const emojiPresent = this.hasEmoji(message);

    switch (level) {
      case 'info':
        levelIcon = emojiPresent ? '' : 'ℹ️ ';
        break;
      case 'success':
        levelIcon = emojiPresent ? '' : '✅ ';
        break;
      case 'warn':
        levelIcon = emojiPresent ? '' : '⚠️ ';
        break;
      case 'error':
        levelIcon = emojiPresent ? '' : '❌ ';
        break;
      case 'debug':
        levelIcon = emojiPresent ? '' : '🔍 ';
        break;
      case 'start':
        levelIcon = emojiPresent ? '' : '🛑 ';
        break;
      case 'stop':
        levelIcon = emojiPresent ? '' : '⏹️ ';
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
        // Child processes already have their own loggers (and thus timestamps/icons)
        // We just wrap them in the source prefix
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
