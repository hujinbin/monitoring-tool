import { getSelector } from '@/utils/utils'
import getLastEvent from "@/utils/getLastEvent";

// 页面错误信息
export class webError{
    constructor(){
        window.addEventListener("error",(event)=>this.getJsError(event));
        window.addEventListener("unhandledrejection",(event)=>this.getPromiseError(event));
    }
    // js报错
    public getJsError(event:any){
        let lastEvent = getLastEvent();
        // 有 e.target.src(href) 的认定为资源加载错误
        if (event.target && (event.target.src || event.target.href)) {
            console.log({
                //资源加载错误
                kind: "stability", //稳定性指标
                type: "error", //resource
                errorType: "resourceError",
                filename: event.target.src || event.target.href, //加载失败的资源
                tagName: event.target.tagName, //标签名
                timeStamp: event.timeStamp, //时间
                selector: getSelector(event.path || event.target), //选择器
              })
        } else {
            console.log({
                kind: "stability", //稳定性指标
                type: "error", //error
                errorType: "jsError", //jsError
                message: event.message, //报错信息
                filename: event.filename, //报错链接
                position: (event.lineNo || 0) + ":" + (event.columnNo || 0), //行列号
                stack: event.error.stack, //错误堆栈
                selector: lastEvent
                  ? getSelector(lastEvent.path || lastEvent.target)
                  : "", //CSS选择器
              })
        }
    }
    // promise异常
    public getPromiseError(event:any){
        let lastEvent = getLastEvent();
        let message = "";
        let line = 0;
        let column = 0;
        let file = "";
        let stack = "";
        if (typeof event.reason === "string") {
          message = event.reason;
        } else if (typeof event.reason === "object") {
          message = event.reason.message;
        }
        let reason = event.reason;
        if (typeof reason === "object") {
          if (reason.stack) {
            var matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
            if (matchResult) {
              file = matchResult[1];
              line = matchResult[2];
              column = matchResult[3];
            }
            stack = reason.stack;
          }
        }
        console.log({
            //未捕获的promise错误
            kind: "stability", //稳定性指标
            type: "error", //jsError
            errorType: "promiseError", //unhandledrejection
            message: message, //标签名
            filename: file,
            position: line + ":" + column, //行列
            stack,
            selector: lastEvent
              ? getSelector(lastEvent.path || lastEvent.target)
              : "",
        })
    }
}