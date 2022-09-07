import { dispatchEvent } from '@/utils/utils'

type RequestMethod = '' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';

class NetworkRequestItem {
  id: string = '';
  name?: string = '';
  method: RequestMethod = '';
  url: string = '';
  status: number | string = 0;
  statusText?: string = '';
  readyState?: XMLHttpRequest['readyState'] = 0;
  header: { [key: string]: string } = null; // response header
  responseType: XMLHttpRequest['responseType'] = '';
  requestType: 'xhr' | 'fetch' | 'ping' | 'custom';
  requestHeader: HeadersInit = null;
  response: any;
  startTime: number = 0;
  endTime: number = 0;
  costTime?: number = 0;
  getData: { [key: string]: string } = null;
  postData: { [key: string]: string } | string = null;
  actived: boolean = false;

  constructor() {
    this.id = Math.random().toString(36).substring(2, 8);
  }
}

// 接口网络请求类
export class network {
  public maxNetworkNumber: number = 1000;
  protected itemCounter: number = 0;

  private _xhrOpen: XMLHttpRequest['open'] = undefined; // the origin function
  private _xhrSend: XMLHttpRequest['send'] = undefined;
  private _xhrSetRequestHeader: XMLHttpRequest['setRequestHeader'] = undefined;
  private _fetch: WindowOrWorkerGlobalScope['fetch'] = undefined;

  constructor() {
    this.mockXHR();
    this.mockFetch();
  }

  // 监听 XHR请求
  public mockXHR() {
    const _XMLHttpRequest = window.XMLHttpRequest;
    if (!_XMLHttpRequest) { return; }

    const that = this;
    const _open = window.XMLHttpRequest.prototype.open,
      _send = window.XMLHttpRequest.prototype.send
    that._xhrOpen = _open;
    that._xhrSend = _send;

    // mock open()
    window.XMLHttpRequest.prototype.open = function () {
      const XMLReq: XMLHttpRequest = this;
      const args = [].slice.call(arguments),
        method = args[0],
        url = args[1];
      const item = new NetworkRequestItem();
      let timer: any = null;

      // may be used by other functions
      (<any>XMLReq)._requestID = item.id;
      (<any>XMLReq)._method = method;
      (<any>XMLReq)._url = url;

      return _open.apply(XMLReq, args);
    };
    let start: number;
    // mock send()
    window.XMLHttpRequest.prototype.send = function () {
      const XMLReq: XMLHttpRequest = this;
      const args = [].slice.call(arguments)
      const { _url, _method } = <any>XMLReq;
      start = Date.now();
      const item = new NetworkRequestItem();
      item.method = _method ? _method.toUpperCase() : 'GET';
      item.url = _url || '';
      item.name = item.url.replace(new RegExp('[/]*$'), '').split('/').pop() || '';
      let handler = (type: string) => (event: any) => {
        let duration = Date.now() - start;
        let status = this.status;
        let statusText = this.statusText;
        if (type === 'error') { // 接口报错和响应2秒以上
          dispatchEvent({
            reportType: 'networkError',
            type: "xhr", //xhr
            eventType: type, //load error abort
            pathname: _url, //接口的url地址
            status: status,
            statusText: statusText,
            duration: duration, //接口耗时
            response: this.response ? JSON.stringify(this.response) : "",
          })
        }else if(duration > 2000){
          dispatchEvent({
            reportType: 'networkStability',
            kind: "stability", //稳定性指标
            type: "xhr", //xhr
            eventType: type, //load error abort
            pathname: _url, //接口的url地址
            status: status + "-" + statusText,
            duration: duration, //接口耗时
            // response: this.response ? JSON.stringify(this.response) : "",
          })
        }
        console.log({
          kind: "stability", //稳定性指标
          type: "xhr", //xhr
          eventType: type, //load error abort
          pathname: _url, //接口的url地址
          status: status + "-" + statusText,
          duration: duration, //接口耗时
          response: this.response ? JSON.stringify(this.response) : "",
        });
      };
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler("error"), false);
      return _send.apply(XMLReq, args);
    };
  }
  // 监听 Fetch请求
  public mockFetch() {
    const _fetch = window.fetch;
    if (!_fetch) { return; }
    const that = this;
    this._fetch = _fetch;
    let start: number;

    (<any>window).fetch = (input: RequestInfo, init?: RequestInit) => {
      start = Date.now();
      const item = new NetworkRequestItem();
      let url: URL,
        method = 'GET',
        requestHeader: HeadersInit = null;
      let _fetchReponse: Response;

      // handle `input` content
      if (input === 'string') { // when `input` is a string
        method = init?.method || 'GET';
        url = that.getURL(<string>input);
        requestHeader = init?.headers || null;
      } else { // when `input` is a `Request` object
        method = (<Request>input).method || 'GET';
        url = that.getURL((<Request>input).url);
        requestHeader = (<Request>input).headers;
      }

      item.method = <RequestMethod>method;
      item.requestType = 'fetch';
      item.requestHeader = requestHeader;
      item.url = url.toString();
      item.name = (url.pathname.split('/').pop() || '') + url.search;
      item.status = 0;
      item.statusText = 'Pending';
      if (!item.startTime) { // UNSENT
        item.startTime = (+new Date());
      }

      if (Object.prototype.toString.call(requestHeader) === '[object Headers]') {
        item.requestHeader = {};
        for (const [key, value] of <Headers>requestHeader) {
          item.requestHeader[key] = value;
        }
      } else {
        item.requestHeader = requestHeader;
      }

      // save GET data
      if (url.search && url.searchParams) {
        item.getData = {};
        for (const [key, value] of url.searchParams) {
          item.getData[key] = value;
        }
      }

      const request = input === 'string' ? url.toString() : input;
      return _fetch(request, init).then((res) => {
        const response = res.clone();
        _fetchReponse = response.clone();
        item.endTime = +new Date();
        item.costTime = item.endTime - (item.startTime || item.endTime);
        item.status = response.status;
        item.statusText = String(response.status);

        item.header = {};
        for (const [key, value] of response.headers) {
          item.header[key] = value;
        }
        item.readyState = 4;

        // parse response body by Content-Type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          item.responseType = 'json';
          return response.clone().text();
        } else if (contentType && (contentType.includes('text/html') || contentType.includes('text/plain'))) {
          item.responseType = 'text';
          return response.clone().text();
        } else {
          item.responseType = '';
          return '[object Object]';
        }
      }).then((responseBody) => {
        let duration = Date.now() - start;
        if (duration > 2000) {
          dispatchEvent({
            reportType: 'networkStability',
            kind: "stability", //稳定性指标
            type: "fetch", //fetch
            duration: duration, //接口耗时
            pathname: request,
            status:item.status,
            statusText:item.statusText,
            url,
          })
        }
        console.log(responseBody)
        return _fetchReponse;
      }).catch((e) => {
        // mock finally
        let duration = Date.now() - start;
        dispatchEvent({
          reportType: 'networkError',
          kind: "stability", //稳定性指标
          type: "fetch", //fetch
          eventType: 'error', //load error abort
          pathname: request, //接口的url地址
          status:item.status,
          statusText:item.statusText,
          duration: duration, //接口耗时
        })
        console.log(e)
        console.log({
          kind: "stability", //稳定性指标
          type: "xhr", //xhr
          eventType: 'error', //load error abort
          pathname: request, //接口的url地址
          status:item.status,
          statusText:item.statusText,
          duration: duration, //接口耗时
        });
        throw e;
      });
    };
  }

  private getURL(urlString: string = '') {
    if (urlString.startsWith('//')) {
      const baseUrl = new URL(window.location.href);
      urlString = `${baseUrl.protocol}${urlString}`;
    }
    if (urlString.startsWith('http')) {
      return new URL(urlString);
    } else {
      return new URL(urlString, window.location.href);
    }
  }
}
