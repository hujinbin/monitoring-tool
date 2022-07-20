class TaskQueue {
    limit:number // 默认单进程请求
    currentSum:number // 当前请求数
    requests: any[] // 请求队列
    constructor() {
        this.limit = 1; // 默认6个进程
        this.currentSum = 0; // 当前请求数
        this.requests = []; // 请求队列
    }
    // 调用请求
    // reqFn 请求方法
    public request(reqFn:Function) {
        if (!reqFn || !(reqFn instanceof Function)) {
            return;
        }
        this.requests.push(reqFn);
        if (this.currentSum < this.limit) {
            this.run();
        }
    }

    public async run() {
        try {
            ++this.currentSum;
            const fn = this.requests.shift();
            await fn();
        } catch (err) {
            console.log('Error', err);
        } finally {
            if (this.currentSum >= 0) {
                --this.currentSum;
                if (this.requests.length > 0) {
                    this.run();
                }
            }
        }
    }

    // 清除未进行的作业队列
    public clear() {
        this.requests = [];
        this.currentSum = 0;
    }
}

export default TaskQueue;
