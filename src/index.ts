import { getConnection } from './utils/utils'

class monitoringTool {
    constructor(config = {}) {
        console.log(config)
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
            })

    }
}

export default monitoringTool;