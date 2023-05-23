/*
* throw 说明：
* 429： 触发限流
*/
import type { AnyObject, NeedRateLimiterOption, RateLimiterOption } from './types';
import { getPackageJson, getUserIp, hitPath, toRepeat, userLevel } from './utils';
import Store from './store';
import Counter from './limiter/counter';
import SildeWindow from './limiter/slide_window';

export * from './utils';

const cookie = require('cookie');

/**
 * rate limiter class
 *
 * @class RateLimit
 */
export default class RateLimiter {
  packagejson: AnyObject;
  cache: Store;
  rateLimiterConfigs: null | NeedRateLimiterOption[];
  needRateLimiterConfigs: any[];
  globalRateLimiterConfig: NeedRateLimiterOption;
  count: number;
  type: string;

  constructor(opt: RateLimiterOption) {
    this.cache = new Store({ type: opt.store || 'lru' });
    this.packagejson = getPackageJson();
    this.count = opt.count || 0;
    this.type = opt.type || 'slideWindow'
  }

  /**
   * watch etcd key
   *
   * @param {*} res
   * @memberof RateLimiter
   */
  watchRateLimiterConfig(res: NeedRateLimiterOption[]) {
    this.rateLimiterConfigs = res;
    this.handleRateLimiterConfigs();
  }

  /**
   * 初始化etcd配置
   *
   * @memberof RateLimiter
   */
  handleRateLimiterConfigs() {
    if (!this.rateLimiterConfigs || !this.rateLimiterConfigs.length) {
      this.needRateLimiterConfigs = [];
      return;
    }
    const result = this.rateLimiterConfigs.reduce((prev: NeedRateLimiterOption[], next: AnyObject) => {
      if (!next.threshold) {
        return prev;
      }
      const threshold = parseInt(next.threshold) || 0;
      if (!threshold) {
        return prev;
      }
      const res: NeedRateLimiterOption = {
        threshold,
        pos: next.pos,
      };
      if (next.args) {
        res.args = next.args;
      }
      return [...prev, res];
    }, []);
    this.needRateLimiterConfigs = toRepeat(result);
  }

  /**
   * 限流
   *
   * @param {*} ctx
   * @returns
   * @memberof RateLimiter
   */
  add(ctx: any) {
    if (!this.needRateLimiterConfigs || !this.needRateLimiterConfigs.length) {
      return;
    }
    this.rateLimiterHitRule(ctx);
  }

  /**
   * 限流规则
   *
   * @param {AnyObject} [headers={}]
   * @param {AnyObject} [request={}]
   * @param {AnyObject} [cookies={}]
   * @param {string} userid
   * @memberof RateLimiter
   */
  rateLimiterHitRule(ctx: any) {
    const headers = ctx.req.headers;
    const request = ctx.req.method === 'POST' ? (ctx.request as any).body : (ctx.request as any).query;
    const cookies = cookie.parse(ctx.req.headers.cookie || '');
    const userid = getUserIp(ctx, request);
    const url = ctx.req.url;

    this.needRateLimiterConfigs.forEach((item: NeedRateLimiterOption) => {
      if (!item.pos || !item.threshold) {
        return;
      }
      const argsCheck = item.args && Object.keys(item.args).length;
      // 服务级别限流
      if (item.pos === this.packagejson.name) {
        if (argsCheck) {
          const { isLimiter, limiterKey = '' } = this.handleHitRule(item, headers, request, cookies, userid);
          if (isLimiter) {
            this.rateLimiter(limiterKey, item);
          }
        }
        else {
          this.rateLimiter(`${item.pos}.${item.threshold}`, item);
        }
      }
      // path级别限流
      else if (hitPath(item, url)) {
        if (argsCheck) {
          const { isLimiter, limiterKey = '' } = this.handleHitRule(item, headers, request, cookies, userid);
          if (isLimiter) {
            this.rateLimiter(limiterKey, item);
          }
        }
        else {
          this.rateLimiter(`${this.packagejson.name}.${item.pos}.${item.threshold}`, item);
        }
      }
    });
  }

  /**
   * 命中规则
   *
   * @param {AnyObject} [item={}]
   * @param {AnyObject} [headers={}]
   * @param {AnyObject} [request={}]
   * @param {AnyObject} [cookies={}]
   * @returns {{ isLimiter: boolean; limiterKey?: string }}
   * @memberof RateLimiter
   */
  handleHitRule(
    item: AnyObject = {},
    headers: AnyObject = {},
    request: AnyObject = {},
    cookies: AnyObject = {},
    userid: string,
  ): { isLimiter: boolean; rateLimiterConfig?: AnyObject; limiterKey?: string } {
    const { request: request_, header: header_, cookie: cookie_ } = item.args || {};

    if (!request_ && !header_ && !cookie_) {
      return { isLimiter: false };
    }

    let limiterKey: string = `${item.pos}.${item.threshold}`;
    let begin: boolean = false;
    const arr_: any = [];

    // 是否进行用户级别的限流
    const { isCheckUser, isOnlyUserCheck } = userLevel(item.args);

    if (isCheckUser && userid) {
      limiterKey = `${userid}.${limiterKey}`;
    }

    if (isOnlyUserCheck && userid) {
      return {
        isLimiter: true,
        limiterKey,
        rateLimiterConfig: item,
      };
    }

    const commonFn = (origin: AnyObject[] = [], target: AnyObject): AnyObject => {
      let limiterKey: string = '';
      const res = origin.every((item) => {
        let equal = target[item.key] === item.value;
        if (equal) { limiterKey = `${limiterKey}${limiterKey ? '.' : ''}${item.key}.${item.value}`; }
        if (isCheckUser && ['x-rate-limiter-user', 'rate-limiter-user'].includes(item.key)) {
          equal = true;
        }
        return equal;
      });
      return { isLimiter: res, limiterKey };
    };

    if (header_ && header_.length) {
      arr_.push({ origin: header_, target: headers });
    }
    if (request_ && request_.length) {
      arr_.push({ origin: request_, target: request });
    }
    if (cookie_ && cookie_.length) {
      arr_.push({ origin: cookie_, target: cookies });
    }
    arr_.forEach((item: any): any => {
      const { isLimiter, limiterKey: limiterKey_ } = commonFn(item.origin, item.target);
      if (!isLimiter) { begin = true; }
      limiterKey = limiterKey_ ? `${limiterKey}.${limiterKey_}` : limiterKey;
    });

    return {
      isLimiter: !begin,
      limiterKey,
      rateLimiterConfig: item,
    };
  }

  /**
   * 限流
   *
   * @param {string} key
   * @param {NeedRateLimiterOption} rateLimiterConfig
   * @memberof RateLimiter
   */
  rateLimiter(key: string, rateLimiterConfig: NeedRateLimiterOption) {
    const json = {
      threshold: rateLimiterConfig.threshold,
      rateLimiterKey: key,
      pos: rateLimiterConfig.pos,
    };

    if (this.type === 'slideWindow') {
      // 滑动窗口限流
      this.rateLimieterForSlideWindow(json);
    } else {
      // counter 限流
      this.rateLimieterForCounter(json);
    }
  }


  /**
   * 滑动窗口限流
   *
   * @param {AnyObject} option
   * @returns {boolean}
   * @memberof RateLimiter
   */
  rateLimieterForSlideWindow(option: AnyObject): boolean {
    const { threshold, rateLimiterKey, pos } = option || {};
    if (!threshold) {
      return true;
    }

    const count = this.count ? Math.ceil(threshold / this.count) : threshold;
    let limiter: any = this.cache.get(rateLimiterKey);
    if (!limiter || limiter.limit !== count) {
      limiter = new SildeWindow(count);
      this.cache.set(rateLimiterKey, limiter);
    }
    if (!limiter.limiter()) {
      throw Error(`${pos} have too many requests. retry in 1 minute`);
    }
    return true;
  }


  /**
   * 计数器方式限流
   *
   * @param {AnyObject} option
   * @returns {boolean}
   * @memberof RateLimiter
   */
  rateLimieterForCounter(option: AnyObject): boolean {
    const { threshold, rateLimiterKey, pos } = option || {};
    if (!threshold) {
      return true;
    }
    let limiter: any = this.cache.get(rateLimiterKey);
    if (!limiter) {
      limiter = new Counter(this.count ? Math.ceil(threshold / this.count) : threshold);
      this.cache.set(rateLimiterKey, limiter);
    }
    if (!limiter.limiter() || limiter.limitCount !== threshold) {
      throw Error(`${pos} have too many requests. retry in 1 minute`);
    }
    return true;
  }

}







