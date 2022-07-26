export function  getConnection () {
    const nav = window.navigator;
    if (!nav) return null;
    return nav.connection || nav.mozConnection || nav.webkitConnection;
};
  
export function getNetworkState () {
    const connection = getConnection();
    console.log(connection)
    if (!connection) {
      return {
        since: new Date(),
        online: navigator.onLine,
      };
    }
    const state = {
      since: new Date(),
      online: navigator.onLine,
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      downlinkMax: connection.downlinkMax,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  
    console.table(state);
  
    return state;
};

export function formatSeconds(time:Number) {
  let millisecond = parseInt(time, 10) // 毫秒
  let secondTime = parseInt(time/1000, 10);// 秒
  let minuteTime = 0;// 分
  let hourTime = 0;// 小时
  if(millisecond > 1000){
    const millLne = String(minuteTime).length;
    console.log(millLne)
    let millisecondString =  String(minuteTime).substring(millLne-3,millLne)
    console.log(millisecond)
    console.log(millisecondString)
    millisecond = parseInt(millisecondString, 10)
  }
  if(secondTime > 60) {//如果秒数大于60，将秒数转换成整数
      //获取分钟，除以60取整数，得到整数分钟
      minuteTime = parseInt(secondTime / 60, 10);
      //获取秒数，秒数取余，得到整数秒数
      secondTime = parseInt(secondTime % 60, 10);
      //如果分钟大于60，将分钟转换成小时
      if(minuteTime > 60) {
          //获取小时，获取分钟除以60，得到整数小时
          hourTime = parseInt(minuteTime / 60, 10);
          //获取小时后取余的分，获取分钟除以60取余的分
          minuteTime = parseInt(minuteTime % 60, 10);
      }
  }
  let result = "" + parseInt(millisecond,10) + "ms";
  if(secondTime > 0){
    result = "" + parseInt(secondTime,10) + "s" + result;
  }
  if(minuteTime > 0) {
    result = "" + parseInt(minuteTime,10) + "m" + result;
  }
  if(hourTime > 0) {
    result = "" + parseInt(hourTime,10) + "h" + result;
  }
  return result;
}