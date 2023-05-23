import type { KoaApp } from '@yunflyjs/yunfly';

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
  errorMsg?: string;
  errorCode?: number;
}

