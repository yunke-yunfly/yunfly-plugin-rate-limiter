
const LRU = require('lru-cache');

interface LruConfig {
  max?: number;
  maxAge?: number;
}

/**
 * lur cache
 *
 * @export
 * @param {LruConfig} opt
 * @return {*}
 */
export default function Lru(opt?: LruConfig): any {
  const options = opt || { max: 1000, maxAge: 1000 * 60 };
  return new LRU(options);
}
