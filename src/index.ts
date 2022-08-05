import { getConnection } from './utils/utils'

import {webError} from './webError/webError'
import {network} from './network/network'
import {performance} from './performance/performance'


interface monitoringOption {
    host?: string,
    secret?: string,
}

class monitoringTool {
    public option: monitoringOption = {};
    public network = new network;
    public performance= new performance;
    public webError= new webError;

    constructor(opt?: monitoringOption) {
        this.option = {
            host:'https://ops.ydctml.top/',
            secret: '',
            ...opt,
        }
        this.init();
    }
    init() {
        console.log("this.performance==============")
        console.log(this.performance)
        const connection = getConnection();
        this.performance.onReady();
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