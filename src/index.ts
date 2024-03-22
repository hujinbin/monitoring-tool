import { getConnection } from './utils/utils'

import {webError} from './webError/webError'
import {network} from './network/network'
import {performance} from './performance/performance'
import {report} from './report/report'


interface monitoringOption {
    host?: string,
    secret?: string,
}

class monitoringTool {
    public option: monitoringOption = {};
    public network:any = null;
    public performance:any= null;
    public webError:any = null;
    public report: any = null;
    private effectiveType:string = ''

    constructor(opt?: monitoringOption) {
        this.option = {
            host:'https://monitor.leheavengame.com',
            secret: '',
            ...opt,
        }
        if(opt?.secret){
            this.network = new network();
            this.performance = new performance();
            this.webError = new webError();
            this.init();
            this.report = new report(this.option.host)
        }
    }
    private init() {
        console.log("this.performance==============")
        console.log(this.performance)
        const connection: any = getConnection();
        this.performance.onReady();
        console.log(connection)
        this.effectiveType = connection.effectiveType;
        connection.addEventListener('change', (event:any) => this.onStateChange(event));
        window.addEventListener('monitoring-report', (event) => { this.onReport(event) });
    }
    private onStateChange(event:any) {
        this.effectiveType = event.target.effectiveType
    }
    // 信息上报
    private onReport(event:any){
        console.log("onReport.event====================")
        if(this.effectiveType === '4g'){  // 限流模式下不上报
            const {hostname,href} = window.location
            let data = {
                ...event.detail,
                apiKey: this.option.secret,
                domain: hostname,
                path: href,
            }
            this.report.send(data)
        }
    }

}


/* 支持使用标签的方式引入 */
if (typeof window !== 'undefined') {
    (window as any).monitoringTool = monitoringTool;
}

export default monitoringTool;
