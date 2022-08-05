import { formatSeconds,getSelector } from '@/utils/utils'
import getLastEvent from "@/utils/getLastEvent";

// 页面性能
export class performance{
    constructor(){
        this.longTask();
    }
    public onReady() {
        this.pageLoad();
        this.webMemory();
        this.resourceLoad();
    }
    // 页面加载性能
    public pageLoad(){
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
            // console.log("load==============");
            // console.log(
            //     fetchStart,
            //     connectStart,
            //     connectEnd,
            //     requestStart,
            //     responseStart,
            //     responseEnd,
            //     domLoading,
            //     domInteractive,
            //     domContentLoadedEventStart,
            //     domContentLoadedEventEnd,
            //     loadEventStart
            // )
            if(domContentLoadedEventEnd === 0){
                this.pageLoad();
            }
            const connectTime= connectEnd - connectStart, //TCP连接耗时
            ttfbTime= responseStart - requestStart, //ttfb
            responseTime= responseEnd - responseStart, //Response响应耗时
            parseDOMTime= loadEventStart - domLoading, //DOM解析渲染耗时
            domContentLoadedTime=
              domContentLoadedEventEnd - domContentLoadedEventStart, //DOMContentLoaded事件回调耗时
            timeToInteractive= domInteractive - fetchStart, //首次可交互时间
            loadTime=loadEventStart - fetchStart //完整的加载时间
            const experienceTime = {
                connectTime, //TCP连接耗时
                ttfbTime, //ttfb
                responseTime, //Response响应耗时
                parseDOMTime, //DOM解析渲染耗时
                domContentLoadedTime, //DOMContentLoaded事件回调耗时
                timeToInteractive, //首次可交互时间
                loadTime, //完整的加载时间
            }
            // console.log(experienceTime)
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
            // console.log(experienceTimeSting)
        },3000)  
    }
    // 交互长任务
    public longTask(){
        // console.log("longTask===")
        new PerformanceObserver((list) => {
            // console.log("PerformanceObserver-list==========",list)
            list.getEntries().forEach((entry) => {
                // console.log("entry=================",entry)
              if (entry.duration > 100) {
                let lastEvent = getLastEvent() || {};
                // console.log("lastEvent============",lastEvent)
                const longTaskData = {
                    eventType: lastEvent?.type,
                    startTime: entry.startTime, // 开始时间
                    duration: entry.duration, // 持续时间
                    selector: lastEvent
                      ? getSelector(lastEvent?.path || lastEvent?.target)
                      : "",
                }
                // console.log("longTaskData",longTaskData)
              }
            });
        }).observe({ entryTypes: ["longtask"] });
    }
    // 资源加载
    public resourceLoad(){
        console.log("resourceLoad==================")
        const perEntries = window.performance.getEntries();
        console.log(perEntries)
        for (let i = 0; i < perEntries.length; i++) {
            const perEntrie = perEntries[i]
            if(perEntrie.entryType === 'resource'){ //资源加载，3秒
                const { transferSize,duration } = perEntrie
                console.log(transferSize)
                const speed = transferSize / duration // 资源的下载速度 kb/s
                console.log("speed==================")
                console.log(speed)
                if(speed < 1000 && duration > 500){  // 小于1M每秒 或者 时长大于500ms的
                }
            }else{
                if(perEntrie.duration > 100){ // 其他渲染 100ms

                }
            }
            console.log(`
                Name:       ${perEntries[i].name}
                Entry Type: ${perEntries[i].entryType}
                Start Time: ${perEntries[i].startTime}
                Duration:   ${perEntries[i].duration}
            `);
        }
    }
    // 检测网站内存的情况
    public webMemory(){
       setTimeout(()=>{
            const {
                jsHeapSizeLimit, // 内存大小限制
                totalJSHeapSize, // 可使用的内存
                usedJSHeapSize, // JS 对象（包括V8引擎内部对象）占用的内存，一定小于 totalJSHeapSize
            } = window.performance.memory;
            if(usedJSHeapSize > totalJSHeapSize){ //内存泄漏
              
            }
            // console.log(`
            // jsHeapSizeLimit:       ${jsHeapSizeLimit}
            // totalJSHeapSize: ${totalJSHeapSize}
            // usedJSHeapSize: ${usedJSHeapSize}
            // `)
            this.webMemory();
       },5000)
    }
}