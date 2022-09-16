import TaskQueue from './taskQueue'

// 上报机制
export class report extends TaskQueue {
   host: string = ''
   constructor(host?: string) {
      super();
      if (host) {
          this.host = host;
      }
   }
   public send(data: any) {
      this.request(() => this.sendData(data))
   }
   //    单个请求方法
   private sendData(data: any) {
      const blob = new Blob([JSON.stringify(data)]);
      window.navigator.sendBeacon(`${this.host}/api/report`, blob);
      // const formData = new FormData();
      // Object.keys(data).forEach((key) => {
      //    let value = data[key];
      //    if (typeof value !== "string") {
      //       // formData只能append string 或 Blob
      //       value = JSON.stringify(value);
      //    }
      //    formData.append(key, value);
      // });
      // window.navigator.sendBeacon(`${this.host}/api/report`, formData);
   }
}
