import axios from "axios";
import TaskQueue from './taskQueue'

// 上报机制
export class report{
    TaskQueue:any
    constructor(){
        this.TaskQueue = new TaskQueue();
    }
   public send(){
     
   }
}