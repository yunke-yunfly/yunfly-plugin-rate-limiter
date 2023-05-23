import Lru from './localStore';


interface CurdOptions {
  type: 'lru' | 'redis';
}

/**
 * curd redis or local store
 *
 * @export
 * @class CURD
 */
export default class Store {
  store: any
  type: string

  constructor(opt: CurdOptions) {
    const { type } = opt || {};

    this.type = type;
    this.store = Lru();
  }

  set(key: string, val: any) {
    return this.store.set(key, val);
  }

  get(key: string) {
    return this.store.get(key);
  }
}
