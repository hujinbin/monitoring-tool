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