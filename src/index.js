import {getConnection} from './utils/utils'

class monitoringTool {
    constructor(config = {}) {
        console.log(config)
        this.init();
    }
    init(){
        const connection = getConnection();
        console.log(connection)
        window.addEventListener('online', ()=>this.onStateChange);
        window.addEventListener('offline', ()=>this.onStateChange);
        connection.addEventListener('change', ()=>this.onStateChange);
    }
    onStateChange(){
        
    }
}

export default monitoringTool;