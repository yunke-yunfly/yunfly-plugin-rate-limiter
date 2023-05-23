
export type AnyObject = Record<string, any>;

export interface RateLimiterOption {
  count?: number;
  store?: 'lru' | 'redis';
  type?: 'counter' | 'slideWindow'
}

interface ArgsOption {
  key: string;
  value: string;
}

export interface NeedRateLimiterOption {
  threshold: number;
  pos: string;
  rule_name?: string;
  args?: {
    request?: ArgsOption[];
    header?: ArgsOption[];
    cookie?: ArgsOption[];
  };
}

