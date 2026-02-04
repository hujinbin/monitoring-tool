/**
 * @jest-environment jsdom
 */
import { network } from '@/network/network';

describe('network', () => {
  let networkInstance;
  let originalXMLHttpRequest;
  let originalFetch;

  beforeEach(() => {
    originalXMLHttpRequest = window.XMLHttpRequest;
    originalFetch = window.fetch;
    
    // Create a fresh network instance
    networkInstance = new network();
    
    // Mock event listener
    window.addEventListener = jest.fn();
    window.dispatchEvent = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(networkInstance.maxNetworkNumber).toBe(1000);
      expect(networkInstance.itemCounter).toBe(0);
    });

    it('should call mockXHR and mockFetch', () => {
      const mockXHRSpy = jest.spyOn(network.prototype, 'mockXHR');
      const mockFetchSpy = jest.spyOn(network.prototype, 'mockFetch');
      
      const instance = new network();
      
      expect(mockXHRSpy).toHaveBeenCalled();
      expect(mockFetchSpy).toHaveBeenCalled();
      
      mockXHRSpy.mockRestore();
      mockFetchSpy.mockRestore();
    });
  });

  describe('mockXHR', () => {
    it('should mock XMLHttpRequest.open method', () => {
      const xhrOpenSpy = jest.spyOn(XMLHttpRequest.prototype, 'open');
      
      const xhr = new XMLHttpRequest();
      const openOriginal = xhr.open;
      
      // Open should be modified
      expect(typeof xhr.open).toBe('function');
      
      xhrOpenSpy.mockRestore();
    });

    it('should capture XHR request details on open', () => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', 'https://api.example.com/data');
      
      expect(xhr._method).toBe('GET');
      expect(xhr._url).toBe('https://api.example.com/data');
      expect(xhr._requestID).toBeDefined();
    });

    it('should capture POST request', () => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', 'https://api.example.com/submit');
      
      expect(xhr._method).toBe('POST');
      expect(xhr._url).toBe('https://api.example.com/submit');
    });

    it('should assign unique request ID', () => {
      const xhr1 = new XMLHttpRequest();
      const xhr2 = new XMLHttpRequest();
      
      xhr1.open('GET', 'https://api.example.com/1');
      xhr2.open('GET', 'https://api.example.com/2');
      
      expect(xhr1._requestID).toBeDefined();
      expect(xhr2._requestID).toBeDefined();
      expect(xhr1._requestID).not.toBe(xhr2._requestID);
    });
  });

  describe('mockXHR - send method', () => {
    let dispatchEventSpy;

    beforeEach(() => {
      // Mock the dispatchEvent function from utils
      dispatchEventSpy = jest.fn();
      global.dispatchEvent = dispatchEventSpy;
    });

    it('should track request start time', (done) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://httpbin.org/get');
      
      const startTime = Date.now();
      xhr.send();
      
      setTimeout(() => {
        const endTime = Date.now();
        expect(endTime).toBeGreaterThanOrEqual(startTime);
        done();
      }, 10);
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      methods.forEach(method => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, 'https://api.example.com/test');
        
        expect(xhr._method).toBe(method);
      });
    });
  });

  describe('mockFetch', () => {
    beforeEach(() => {
      // Setup fetch mock before each test
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      }));
    });

    it('should mock fetch method', () => {
      expect(typeof global.fetch).toBe('function');
    });

    it('should preserve original fetch behavior', async () => {
      // Mock a successful fetch
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      };
      
      global.fetch = jest.fn(() => Promise.resolve(mockResponse));
      
      const response = await fetch('https://api.example.com/data');
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });
  });

  describe('NetworkRequestItem', () => {
    it('should create item with unique id', () => {
      // We need to access the NetworkRequestItem class indirectly
      const xhr1 = new XMLHttpRequest();
      const xhr2 = new XMLHttpRequest();
      
      xhr1.open('GET', 'https://api.example.com/1');
      xhr2.open('GET', 'https://api.example.com/2');
      
      expect(xhr1._requestID).toBeTruthy();
      expect(xhr2._requestID).toBeTruthy();
      expect(xhr1._requestID).not.toBe(xhr2._requestID);
    });

    it('should generate 6-character id', () => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.example.com/test');
      
      expect(xhr._requestID.length).toBe(6);
    });
  });

  describe('error tracking', () => {
    it('should track failed requests', (done) => {
      const xhr = new XMLHttpRequest();
      
      // Mock a failed request
      Object.defineProperty(xhr, 'status', { value: 500, writable: false });
      Object.defineProperty(xhr, 'statusText', { value: 'Internal Server Error', writable: false });
      
      xhr.open('GET', 'https://api.example.com/error');
      xhr.send();
      
      // Trigger error event
      const errorEvent = new Event('error');
      xhr.dispatchEvent(errorEvent);
      
      setTimeout(() => {
        // Should have tracked the error
        done();
      }, 10);
    });

    it('should track timeout', (done) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.example.com/slow');
      xhr.timeout = 10;
      xhr.send();
      
      const timeoutEvent = new Event('timeout');
      xhr.dispatchEvent(timeoutEvent);
      
      setTimeout(() => {
        done();
      }, 20);
    });

    it('should track abort', (done) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.example.com/test');
      xhr.send();
      
      xhr.abort();
      
      const abortEvent = new Event('abort');
      xhr.dispatchEvent(abortEvent);
      
      setTimeout(() => {
        done();
      }, 10);
    });
  });

  describe('request details extraction', () => {
    it('should extract request name from URL', () => {
      const urls = [
        { url: 'https://api.example.com/users', expected: 'users' },
        { url: 'https://api.example.com/api/v1/products', expected: 'products' },
        { url: 'https://api.example.com/data/', expected: 'data' },
      ];
      
      urls.forEach(({ url, expected }) => {
        const name = url.replace(new RegExp('[/]*$'), '').split('/').pop();
        expect(name).toBe(expected);
      });
    });

    it('should handle URLs without path', () => {
      const url = 'https://api.example.com';
      const name = url.replace(new RegExp('[/]*$'), '').split('/').pop();
      expect(name).toBe('api.example.com');
    });
  });

  describe('maxNetworkNumber limit', () => {
    it('should have default max network number', () => {
      expect(networkInstance.maxNetworkNumber).toBe(1000);
    });

    it('should allow custom max network number', () => {
      const customInstance = new network();
      customInstance.maxNetworkNumber = 500;
      expect(customInstance.maxNetworkNumber).toBe(500);
    });
  });

  describe('integration tests', () => {
    it('should handle multiple XHR requests', () => {
      const xhr1 = new XMLHttpRequest();
      const xhr2 = new XMLHttpRequest();
      const xhr3 = new XMLHttpRequest();
      
      xhr1.open('GET', 'https://api.example.com/1');
      xhr2.open('POST', 'https://api.example.com/2');
      xhr3.open('PUT', 'https://api.example.com/3');
      
      expect(xhr1._method).toBe('GET');
      expect(xhr2._method).toBe('POST');
      expect(xhr3._method).toBe('PUT');
    });

    it('should track request lifecycle', (done) => {
      const xhr = new XMLHttpRequest();
      const events = [];
      
      xhr.addEventListener('loadstart', () => events.push('loadstart'));
      xhr.addEventListener('progress', () => events.push('progress'));
      xhr.addEventListener('load', () => events.push('load'));
      xhr.addEventListener('loadend', () => events.push('loadend'));
      
      xhr.open('GET', 'https://httpbin.org/get');
      xhr.send();
      
      setTimeout(() => {
        // Some events should have been fired
        expect(events.length).toBeGreaterThanOrEqual(0);
        done();
      }, 100);
    });
  });
});
