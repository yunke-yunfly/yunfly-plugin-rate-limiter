import type { Config } from '@yunflyjs/yunfly';

/**
 * 包内置默认配置项
 *
 * @export
 * @param {KoaApp} app
 * @returns
 */
export default function config(): Config {
  const config: Config = {};

  config.rateLimiter = {
    enable: false,
    match: [],
    ignore: [],
    store: 'lru'
  }

  return config;
}
