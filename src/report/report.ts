import TaskQueue from './taskQueue'

// 上报机制
export class report extends TaskQueue{
    private host: string = ''
    constructor(host: string){
        super();
        this.host = host;
    }
   public send(data: any){
      this.request(() => this.sendData(data))
   }
//    单个请求方法
   private sendData(data: any){
      const blob = new Blob([JSON.stringify(data)]);
      console.log(blob)
      window.navigator.sendBeacon(`${this.host}/api/report`, blob);
   }
}