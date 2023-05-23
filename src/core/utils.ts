import * as path from 'path';
import type { AnyObject, NeedRateLimiterOption } from './types';
const _ = require('lodash');
// package.json 配置
export const PACKAGE_JSON_CONFIG = path.join(
  process.cwd(),
  './package.json',
).replace(/\\/g, '//');

/**
 * 获得运行目录的package.json配置
 *
 * @return {*}  {AnyObject}
 */
export const getPackageJson = (): AnyObject => require(PACKAGE_JSON_CONFIG);

/**
 * get request ip
 *
 * @param {*} req
 * @return {*}
 */
export const getUserIp = (ctx: any, request: any): string => {
  const res = ctx.req.headers['x-rate-limiter-key'] ||
    ctx.req.headers['x-rate-limiter'] ||
    ctx.cookies.get('x-rate-limiter-key') ||
    ctx.cookies.get('x-rate-limiter') ||
    _.get(request, 'x-rate-limiter-key') ||
    _.get(request, 'x-rate-limiter') ||
    ctx.req.headers['x-forwarded-for'] ||
    ctx.req.headers['x-real-ip'] ||
    ctx.req.headers['remote_addr'] ||
    ctx.req.headers['client_ip'] ||
    ctx.req.connection.remoteAddress ||
    ctx.req.socket.remoteAddress ||
    ctx.req.connection.socket.remoteAddress;
  return res.match(/[.\d\w]+/g).join('');
};

export const hitPath = (pathItem: NeedRateLimiterOption, url: string): boolean => {
  if (!url) {
    return false;
  }
  let result: boolean = false;
  if (pathItem.pos === url.split('?')[0]) {
    result = true;
  }
  return result;
};

/**
 * 去重处理
 *
 * @param {NeedRateLimiterOption[]} arr
 * @returns {NeedRateLimiterOption}
 */
export const toRepeat = (arr: NeedRateLimiterOption[]): NeedRateLimiterOption[] => {
  if (!arr.length) {
    return [];
  }

  const res = arr.filter((item: NeedRateLimiterOption, index: number) => {
    let res = true;
    for (let i = index + 1; i < arr.length; i++) {
      if (_.isEqual(item, arr[i])) {
        res = false;
      }
    }
    return res;
  });
  return res;
};

/**
 * 用户级别限流
 *
 * @param {AnyObject} args
 * @returns {boolean}
 */
export const userLevel = (args: AnyObject): { isCheckUser: boolean; isOnlyUserCheck: boolean } => {
  const { request = [], cookie = [], header = [] } = args || {};
  const all = [...request, ...cookie, ...header];
  const limitArr = ['x-rate-limiter-user', 'rate-limiter-user'];

  if (all.length === 1 && limitArr.includes(all[0]['key'])) {
    if (all[0]['value'] === '*') {
      return { isCheckUser: true, isOnlyUserCheck: true };
    } else {
      return { isCheckUser: false, isOnlyUserCheck: false };
    }
  }

  let res = false;
  all.forEach((item: AnyObject) => {
    if ((limitArr.includes(item.key)) && item.value === '*') {
      res = true;
    }
  });
  return { isCheckUser: res, isOnlyUserCheck: false };
};
