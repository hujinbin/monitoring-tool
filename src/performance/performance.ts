import { formatSeconds } from '@/utils/utils'

// 页面性能
export class performance{
    constructor(){
        console.log("performance 11111111")
    }
    public onReady() {
        console.log(33333)
        this.pageLoad();
    }
    // 页面加载性能
    pageLoad(){
        setTimeout(()=>{
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
            if(domContentLoadedEventEnd === 0){
                this.pageLoad();
            }
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
            const experienceTimeSting= {
                connectTime: formatSeconds(experienceTime.connectTime), //TCP连接耗时
                ttfbTime: formatSeconds(experienceTime.ttfbTime), //ttfb
                responseTime: formatSeconds(experienceTime.responseTime), //Response响应耗时
                parseDOMTime:formatSeconds(experienceTime.parseDOMTime), //DOM解析渲染耗时
                domContentLoadedTime:
                formatSeconds(experienceTime.domContentLoadedTime), //DOMContentLoaded事件回调耗时
                timeToInteractive: formatSeconds(experienceTime.timeToInteractive), //首次可交互时间
                loadTime: formatSeconds(experienceTime.loadTime), //完整的加载时间
            }
            // 加载时间大于5秒的进行上报
            if(experienceTime.loadTime > 1000){
                 
            }
            console.log(experienceTimeSting)
            const webMMemory = window.performance.memory
            console.log(webMMemory)
        },3000)  
    }
}