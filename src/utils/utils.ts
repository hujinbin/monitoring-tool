export function getConnection() {
  const nav = window.navigator;
  if (!nav) return null;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
};

export function getNetworkState() {
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

function getSelectors(path:[]) {
  // 反转 + 过滤 + 映射 + 拼接
  return path
    .reverse()
    .filter((element:any) => {
      return element !== document && element !== window;
    })
    .map((element:any) => {
      let selector = "";
      if (element.id) {
        return `${element.nodeName.toLowerCase()}#${element.id}`;
      } else if (element.className && typeof element.className === "string") {
        return `${element.nodeName.toLowerCase()}.${element.className}`;
      } else {
        selector = element.nodeName.toLowerCase();
      }
      return selector;
    })
    .join("->");
}

// 判断当前选择是什么节点
export  function getSelector (pathsOrTarget:void) {
  if (Array.isArray(pathsOrTarget)) {
    return getSelectors(pathsOrTarget);
  } else {
    let path = [];
    while (pathsOrTarget) {
      path.push(pathsOrTarget);
      pathsOrTarget = pathsOrTarget.parentNode;
    }
    return getSelectors(path);
  }
}

// 传递参数  
export function dispatchEvent(data: object){
  const moEvent = new CustomEvent('monitoring-report', {
     detail:data,
  });
  window.dispatchEvent(moEvent)
}