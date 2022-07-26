import { getConnection } from './utils/utils'

import {network} from './network/network'
import {performance} from './performance/performance'


interface monitoringOption {
    host?: string,
    secret?: string,
}

class monitoringTool {
    public option: monitoringOption = {};
    public network = new network;
    public performance : performance;

    constructor(opt?: monitoringOption) {
        this.option = {
            host:'http://ops.ydctml.top/',
            secret: '',
            ...opt,
        }
        this.performance = new performance;
        this.init();
    }
    init() {
        console.log("this.performance==============")
        console.log(this.performance)
        this.performance.onReady();
        const connection = getConnection();
        console.log(connection)
        window.addEventListener('online', (e) => this.onStateChange(e));
        window.addEventListener('offline', (e) => this.onStateChange(e));
        connection.addEventListener('change', (event) => this.onStateChange(event));
        //当Promise 被 reject 且没有 reject 处理器的时候，会触发 unhandledrejection 事件
        window.addEventListener("unhandledrejection", (e) => { console.log("unhandledrejection====", e) })
    }
    onStateChange(event) {
        console.log("event===========", event)
    }
}

export default monitoringTool;