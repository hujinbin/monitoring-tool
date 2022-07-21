import { getConnection } from './utils/utils'

import {network} from './network/network'
import {performance} from './performance/performance'


// interface monitoringOption {
//     host?: string,
//     secret?: string,
// }

class monitoringTool {
    // public option: monitoringOption = {};
    public static network = network;
    public static performance = performance;

    constructor(
        // opt?: monitoringOption
        ) {
        // this.option = {
        //     host:'http://ops.ydctml.top/',
        //     secret: '',
        //     ...opt,
        // }
        this.init();
        this.load();
    }
    init() {
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
    load() {
            setTimeout(() => {
                const {
                    fetchStart,
                    connectStart,
                    connectEnd,
                    requestStart,
                    responseStart,
                    responseEnd,
                    domLoading,
                    domInteractive,
                    domContentLoadedEventStart,
                    domContentLoadedEventEnd,
                    loadEventStart,
                  } = window.performance.timing;
                console.log("load==============");
                console.log(
                    fetchStart,
                    connectStart,
                    connectEnd,
                    requestStart,
                    responseStart,
                    responseEnd,
                    domLoading,
                    domInteractive,
                    domContentLoadedEventStart,
                    domContentLoadedEventEnd,
                    loadEventStart
                )
                const experienceTime = {
                    connectTime: connectEnd - connectStart, //TCP连接耗时
                    ttfbTime: responseStart - requestStart, //ttfb
                    responseTime: responseEnd - responseStart, //Response响应耗时
                    parseDOMTime: loadEventStart - domLoading, //DOM解析渲染耗时
                    domContentLoadedTime:
                      domContentLoadedEventEnd - domContentLoadedEventStart, //DOMContentLoaded事件回调耗时
                    timeToInteractive: domInteractive - fetchStart, //首次可交互时间
                    loadTime: loadEventStart - fetchStart, //完整的加载时间
                }
                console.log(experienceTime)
            }, 5000)

    }
}

export default monitoringTool;