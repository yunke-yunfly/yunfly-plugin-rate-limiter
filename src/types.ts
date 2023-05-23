import type { KoaApp } from '@yunflyjs/yunfly';
import type { NeedRateLimiterOption } from './core/types';

export type AnyObject = Record<string, any>;

export interface RateLimiterOption {
  koaApp: KoaApp;
  pluginConfig: RateLimiterConfig
}


export interface RateLimiterConfig {
  enable?: boolean;
  match?: string[];
  ignore?: string[];
  store?: 'lru';
  type?: 'counter' | 'slideWindow';
  rules?: NeedRateLimiterOption[];
  errorMsg?: string;
  errorCode?: number;
}

