

/**
 * 限流 计数器
 *
 * @export
 * @class Counter
 */
export default class Counter {
  timeStamp: number;
  reqCount: number;
  limitCount: number;
  interval: number;

  constructor(limitCount: number, interval?: number) {
    this.timeStamp = this.getNowTime();
    this.reqCount = 0;
    this.limitCount = limitCount; // 时间窗口内最大请求数
    this.interval = interval || 1000; // 时间窗口ms
  }

  limiter(): boolean {
    const now: number = this.getNowTime();
    if (now < this.timeStamp + this.interval) {
      // 在时间窗口内
      this.reqCount++;
      // 判断当前时间窗口内是否超过最大请求控制数
      return this.reqCount <= this.limitCount;
    }
    else {
      this.timeStamp = now;
      this.reqCount = 1;
      return true;
    }
  }

  getNowTime(): number {
    return Date.now();
  }
}

