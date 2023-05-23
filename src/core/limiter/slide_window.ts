/**
 * 限流 滑动时间窗口
 *
 * @export
 * @class SildeWindow
 */
export default class SildeWindow {
  slot: number; // 单位时间分割多少块
  limit: number; // 单位时间限制次数
  timeUnit: number; // 滑动窗口时间
  lastNode: any; // 当前滑动到的Node
  slotTime: number; // 每个小格子时间

  constructor(limit: number, slot?: number, timeUnit?: number) {
    this.slot = slot || 10;
    this.limit = limit;
    this.timeUnit = timeUnit || 1000;
    this.lastNode;
    this.slotTime;
    // 初始化
    this.init();
  }

  getTime() {
    return Date.now();
  }

  init() {
    let currentNode = null;
    const currentTime = this.getTime();
    for (let i = 0; i < this.slot; i++) {
      if (!this.lastNode) {
        this.lastNode = new Node(currentTime, 0, i + 1);
        currentNode = this.lastNode;
      }
      else {
        this.lastNode.next = new Node(currentTime, 0, i + 1);
        this.lastNode = this.lastNode.next;
      }
    }
    this.lastNode.next = currentNode;
    this.slotTime = this.timeUnit / this.slot;
  }

  limiter() {
    this.reset();
    const sum = this.getSum();
    if (sum >= this.limit) {
      return false;
    }
    this.lastNode.addCounter();
    return true;
  }

  reset_(num: number, currentTimeMillis: number) {
    if (num <= 0) {
      return;
    }
    let currentNode = this.lastNode;
    for (let i = 0; i < num; i++) {
      currentNode = currentNode.next;
    }
    currentNode.setTime(currentTimeMillis);
    currentNode.setCounter(0);
    this.lastNode = currentNode;
  }

  reset() {
    const currentTimeMillis = this.getTime();
    const time = this.lastNode.getTime();
    let count = (currentTimeMillis - time) / this.slotTime;
    if (count > this.slot) {
      count = this.slot;
      this.reset_(count, currentTimeMillis);
    }
  }

  getSum() {
    let sum = 0;
    let currentNode = this.lastNode;
    for (let i = 0; i < this.slot; i++) {
      sum += currentNode.counter;
      currentNode = currentNode.next;
    }
    return sum;
  }

}


/**
 * 链表
 *
 * @class Node
 */
class Node {
  time: number;
  counter: number;
  next: any;
  id: number;

  constructor(time: number, counter: number, id: number) {
    this.next;
    this.time = time;
    this.id = id;
    this.counter = counter;
  }

  getTime() {
    return this.time;
  }

  setTime(time: number) {
    this.time = time;
  }

  getCounter() {
    return this.counter;
  }

  addCounter() {
    this.counter = this.counter + 1;
  }

  setCounter(counter: number) {
    this.counter = counter;
  }

  getNext() {
    return this.next;
  }

  setNext(next: any) {
    this.next = next;
  }

}
