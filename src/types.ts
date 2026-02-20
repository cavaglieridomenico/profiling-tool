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
