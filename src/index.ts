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
    public report:any = null;

    constructor(opt?: monitoringOption) {
        this.option = {
            host:'https://ops.ydctml.top',
            secret: '',
            ...opt,
        }
        if(opt?.secret){
            this.network = new network;
            this.performance = new performance;
            this.webError = new webError;
            this.init();
            this.report = new report(this.option.host)
        }
    }
    private init() {
        console.log("this.performance==============")
        console.log(this.performance)
        const connection = getConnection();
        this.performance.onReady();
        console.log(connection)
        window.addEventListener('online', (e) => this.onStateChange(e));
        window.addEventListener('offline', (e) => this.onStateChange(e));
        connection.addEventListener('change', (event:any) => this.onStateChange(event));
        window.addEventListener('monitoring-report', (event) => { this.onReport(event) });
    }
    private onStateChange(event:any) {
        console.log("event===========", event)
    }
    private onReport(event:any){
        console.log("onReport.event====================")
        console.log(event)
        let data = {
            ...event.detail,
            secret: this.option.secret
        }
        this.report.send(data)
    }

}

export default monitoringTool;