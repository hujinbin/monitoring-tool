/**
 * @jest-environment jsdom
 */
import { webError } from '@/webError/webError';
import * as utils from '@/utils/utils';
import getLastEvent from '@/utils/getLastEvent';

// Mock modules
jest.mock('@/utils/utils', () => ({
  getSelector: jest.fn((element) => 'mocked-selector'),
  dispatchEvent: jest.fn()
}));

jest.mock('@/utils/getLastEvent', () => jest.fn());

describe('webError', () => {
  let webErrorInstance;
  let dispatchEventSpy;
  let getSelectorSpy;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    dispatchEventSpy = jest.spyOn(utils, 'dispatchEvent');
    getSelectorSpy = jest.spyOn(utils, 'getSelector');
    
    // Mock getLastEvent
    getLastEvent.mockReturnValue(null);
    
    // Clear error handlers
    window.onerror = null;
    window.onunhandledrejection = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize error listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      webErrorInstance = new webError();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should set window.onerror handler', () => {
      webErrorInstance = new webError();
      
      expect(window.onerror).toBeDefined();
      expect(typeof window.onerror).toBe('function');
    });
  });

  describe('getJsError - JavaScript Errors', () => {
    beforeEach(() => {
      webErrorInstance = new webError();
    });

    it('should handle JavaScript error event', () => {
      const errorEvent = {
        message: 'Uncaught ReferenceError: x is not defined',
        filename: 'https://example.com/app.js',
        lineno: 10,
        colno: 5,
        error: {
          stack: 'ReferenceError: x is not defined\n    at app.js:10:5'
        },
        target: null,
        type: 'error'
      };
      
      const mockLastEvent = {
        type: 'click',
        target: document.createElement('button'),
        path: [document.createElement('button')]
      };
      
      getLastEvent.mockReturnValue(mockLastEvent);
      getSelectorSpy.mockReturnValue('button.test');
      
      webErrorInstance.getJsError(errorEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'webError',
          kind: 'stability',
          type: 'error',
          errorType: 'jsError',
          message: 'Uncaught ReferenceError: x is not defined',
          filename: 'https://example.com/app.js',
          position: '10:5',
          stack: 'ReferenceError: x is not defined\n    at app.js:10:5',
          selector: 'button.test'
        })
      );
    });

    it('should handle error without lastEvent', () => {
      const errorEvent = {
        message: 'Error occurred',
        filename: 'https://example.com/app.js',
        lineno: 20,
        colno: 10,
        error: {
          stack: 'Error: Error occurred'
        },
        target: null
      };
      
      getLastEvent.mockReturnValue(null);
      
      webErrorInstance.getJsError(errorEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          selector: ''
        })
      );
    });

    it('should handle error event with zero line and column', () => {
      const errorEvent = {
        message: 'Error',
        filename: 'https://example.com/app.js',
        lineno: 0,
        colno: 0,
        error: null,
        target: null
      };
      
      webErrorInstance.getJsError(errorEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          position: '0:0'
        })
      );
    });

    it('should handle error event without error object', () => {
      const errorEvent = {
        message: 'Simple error message',
        filename: 'https://example.com/app.js',
        lineno: 15,
        colno: 20,
        error: null,
        target: null
      };
      
      webErrorInstance.getJsError(errorEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Simple error message',
          stack: undefined
        })
      );
    });
  });

  describe('getJsError - Resource Errors', () => {
    beforeEach(() => {
      webErrorInstance = new webError();
    });

    it('should handle resource loading error with src', () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/image.png';
      
      const errorEvent = {
        target: img,
        timeStamp: 123456789,
        path: [img],
        type: 'error'
      };
      
      getSelectorSpy.mockReturnValue('img.photo');
      
      webErrorInstance.getJsError(errorEvent);
      
      // Resource errors are logged but not dispatched in the current implementation
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it('should handle script loading error', () => {
      const script = document.createElement('script');
      script.src = 'https://example.com/script.js';
      
      const errorEvent = {
        target: script,
        timeStamp: 123456789,
        path: [script],
        type: 'error'
      };
      
      getSelectorSpy.mockReturnValue('script');
      
      webErrorInstance.getJsError(errorEvent);
      
      // Should not dispatch for resource errors
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it('should handle link (CSS) loading error', () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://example.com/style.css';
      
      const errorEvent = {
        target: link,
        timeStamp: 123456789,
        path: [link],
        type: 'error'
      };
      
      getSelectorSpy.mockReturnValue('link');
      
      webErrorInstance.getJsError(errorEvent);
      
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
  });

  describe('getPromiseError', () => {
    beforeEach(() => {
      webErrorInstance = new webError();
    });

    it('should handle rejected promise with string reason', () => {
      const promiseEvent = {
        reason: 'Promise rejected',
        promise: Promise.reject('Promise rejected')
      };
      
      const mockLastEvent = {
        type: 'click',
        target: document.createElement('button')
      };
      
      getLastEvent.mockReturnValue(mockLastEvent);
      getSelectorSpy.mockReturnValue('button.action');
      
      webErrorInstance.getPromiseError(promiseEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'webError',
          kind: 'stability',
          type: 'error',
          errorType: 'promiseError',
          message: 'Promise rejected',
          selector: 'button.action'
        })
      );
    });

    it('should handle rejected promise with Error object', () => {
      const error = new Error('Promise error message');
      error.stack = 'Error: Promise error message\n    at test.js:10:20';
      
      const promiseEvent = {
        reason: error,
        promise: Promise.reject(error)
      };
      
      getLastEvent.mockReturnValue(null);
      
      webErrorInstance.getPromiseError(promiseEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'webError',
          kind: 'stability',
          type: 'error',
          errorType: 'promiseError',
          message: 'Promise error message',
          stack: expect.stringContaining('Error: Promise error message'),
          selector: ''
        })
      );
    });

    it('should extract file, line and column from stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at functionName (https://example.com/app.js:42:15)';
      
      const promiseEvent = {
        reason: error,
        promise: Promise.reject(error)
      };
      
      webErrorInstance.getPromiseError(promiseEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: 'https://example.com/app.js',
          line: '42',
          column: '15'
        })
      );
    });

    it('should handle promise error without stack trace', () => {
      const error = new Error('Simple error');
      delete error.stack;
      
      const promiseEvent = {
        reason: error,
        promise: Promise.reject(error)
      };
      
      webErrorInstance.getPromiseError(promiseEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Simple error',
          filename: '',
          line: 0,
          column: 0,
          stack: ''
        })
      );
    });

    it('should handle promise error with lastEvent', () => {
      const mockButton = document.createElement('button');
      mockButton.id = 'submit-btn';
      
      const mockLastEvent = {
        type: 'click',
        target: mockButton,
        path: [mockButton]
      };
      
      const promiseEvent = {
        reason: 'Async operation failed',
        promise: Promise.reject('Async operation failed')
      };
      
      getLastEvent.mockReturnValue(mockLastEvent);
      getSelectorSpy.mockReturnValue('button#submit-btn');
      
      webErrorInstance.getPromiseError(promiseEvent);
      
      expect(getSelectorSpy).toHaveBeenCalled();
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          selector: 'button#submit-btn'
        })
      );
    });

    it('should handle non-standard promise rejection', () => {
      const promiseEvent = {
        reason: { custom: 'object', code: 500 },
        promise: Promise.reject({ custom: 'object' })
      };
      
      webErrorInstance.getPromiseError(promiseEvent);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'promiseError'
        })
      );
    });
  });

  describe('integration tests', () => {
    it('should handle both error types from same instance', () => {
      webErrorInstance = new webError();
      
      // JavaScript error
      const jsError = {
        message: 'JS Error',
        filename: 'app.js',
        lineno: 10,
        colno: 5,
        error: { stack: 'Error stack' },
        target: null
      };
      
      webErrorInstance.getJsError(jsError);
      
      // Promise error
      const promiseError = {
        reason: 'Promise error',
        promise: Promise.reject('Promise error')
      };
      
      webErrorInstance.getPromiseError(promiseError);
      
      expect(dispatchEventSpy).toHaveBeenCalledTimes(2);
    });

    it('should properly identify error types', () => {
      webErrorInstance = new webError();
      
      const jsError = {
        message: 'JS Error',
        filename: 'app.js',
        lineno: 10,
        colno: 5,
        error: null,
        target: null
      };
      
      webErrorInstance.getJsError(jsError);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'jsError'
        })
      );
      
      dispatchEventSpy.mockClear();
      
      const promiseError = {
        reason: 'Promise error',
        promise: Promise.reject()
      };
      
      webErrorInstance.getPromiseError(promiseError);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'promiseError'
        })
      );
    });
  });
});
