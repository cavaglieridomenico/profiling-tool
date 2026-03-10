import { IncomingMessage, ServerResponse } from 'http';
import { Page } from 'puppeteer';
import { URL } from 'url';
import { CommandValue } from './commands';

export interface TestCaseStep {
  command: string;
  delay: number;
}

export interface TapConfigItem {
  x: number;
  y: number;
  msg: string;
}

export interface SwipeConfigItem {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
  msg: string;
}

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  page: Page,
  url: URL,
  mode?: string
) => Promise<void>;

export type RouteHandlers = Partial<Record<CommandValue, RouteHandler>>;

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
}

export interface TraceEvent {
  cat: string;
  name: string;
  ph: string;
  pid: number;
  tid: number;
  ts: number;
  dur?: number;
  args?: any;
}

export interface ThreadMetrics {
  name: string;
  longTasks100: number;
  longTasks500: number;
  longestTask: number;
  jsHeapMin: number;
  jsHeapMax: number;
}

export interface TraceMetrics {
  threads: Record<string, ThreadMetrics>;
  cls: number;
  inp: number;
}
