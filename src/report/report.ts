import TaskQueue from './taskQueue'

// 上报机制
export class report extends TaskQueue{
    constructor(){
        super();
    }
   public send(){
    //  window.navigator.sendBeacon
   }
}