import type { RateLimiterOption } from './types';
import type { Context } from '@yunflyjs/yunfly';
import { getErrorCodeAndSetHttpCode, isIncludes } from './utils';
import RateLimiter from './core';
import type { NeedRateLimiterOption } from './core/types';

const TooManyRequestsHttpCode = 429;
let limiter: any = null;

/**
 * yunfly security plugin
 *
 * @export
 * @param {*} { app }
 */
export default function yunflyRateLimiterPlugin({ koaApp: app, pluginConfig }: RateLimiterOption): void {
  if (!pluginConfig?.enable) {
    return;
  }

  const config = app.context.config || app.config || {};

  // 限流
  const count = config.cluster ? config.cluster.count : 0;
  const type = pluginConfig?.type;
  const rules = pluginConfig?.rules;
  // 初始化限流
  limiter = new RateLimiter({ store: 'lru', count, type });
  if(rules) limiter.watchRateLimiterConfig(rules);

  app.use(async (ctx: Context, next: () => any) => {
    const path = ctx.path || ctx.request.url;

    if(!path) {
      return await next();
    }

    if (
      (pluginConfig.ignore?.length && isIncludes(pluginConfig.ignore, path)) ||
      (pluginConfig.match?.length && !isIncludes(pluginConfig.match, path))
    ) {
      return await next();
    }

    try {
      limiter.add(ctx);
    } catch (err: any) {
      ctx.body = {
        code: getErrorCodeAndSetHttpCode(ctx, TooManyRequestsHttpCode, true),
        msg: 'too many requests, please try again later.',
      };
      return;
    }

    return await next();
  });
}


/**
 * update limiter config
 * 
 * @export
 * @param {*} config 
 */
export function updateRateLimiterRules (config: NeedRateLimiterOption[]) {
  if(limiter) {
    limiter.watchRateLimiterConfig(config);
  }
}
