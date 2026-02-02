/**
 * @jest-environment jsdom
 */
import { performance as PerformanceMonitor } from '@/performance/performance';
import * as utils from '@/utils/utils';
import getLastEvent from '@/utils/getLastEvent';

// Mock modules
jest.mock('@/utils/utils', () => ({
  getSelector: jest.fn((element) => 'mocked-selector'),
  dispatchEvent: jest.fn()
}));

jest.mock('@/utils/getLastEvent', () => jest.fn());

describe('performance', () => {
  let performanceInstance;
  let dispatchEventSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    dispatchEventSpy = jest.spyOn(utils, 'dispatchEvent');
    getLastEvent.mockReturnValue(null);
    
    // Mock PerformanceObserver
    global.PerformanceObserver = jest.fn((callback) => {
      global.PerformanceObserver._callback = callback;
      return {
        observe: jest.fn(),
        disconnect: jest.fn()
      };
    });
    
    // Mock performance.timing
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        timing: {
          fetchStart: 1000,
          connectStart: 1100,
          connectEnd: 1200,
          requestStart: 1300,
          responseStart: 1400,
          responseEnd: 1500,
          domLoading: 1600,
          domInteractive: 2000,
          domContentLoadedEventStart: 2100,
          domContentLoadedEventEnd: 2200,
          loadEventStart: 6500
        }
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize and call longTask', () => {
      const longTaskSpy = jest.spyOn(PerformanceMonitor.prototype, 'longTask');
      
      performanceInstance = new PerformanceMonitor();
      
      expect(longTaskSpy).toHaveBeenCalled();
      longTaskSpy.mockRestore();
    });
  });

  describe('onReady', () => {
    it('should call pageLoad, webMemory and resourceLoad', () => {
      performanceInstance = new PerformanceMonitor();
      
      const pageLoadSpy = jest.spyOn(performanceInstance, 'pageLoad');
      const webMemorySpy = jest.spyOn(performanceInstance, 'webMemory');
      const resourceLoadSpy = jest.spyOn(performanceInstance, 'resourceLoad');
      
      performanceInstance.onReady();
      
      expect(pageLoadSpy).toHaveBeenCalled();
      expect(webMemorySpy).toHaveBeenCalled();
      expect(resourceLoadSpy).toHaveBeenCalled();
    });
  });

  describe('pageLoad', () => {
    beforeEach(() => {
      performanceInstance = new PerformanceMonitor();
    });

    it('should calculate page load metrics correctly', () => {
      performanceInstance.pageLoad();
      
      // Fast forward 3000ms
      jest.advanceTimersByTime(3000);
      
      // Should not report if loadTime < 5000
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it('should report when load time exceeds 5 seconds', () => {
      // Set loadEventStart to exceed 5 seconds
      window.performance.timing.loadEventStart = 6001;
      
      performanceInstance.pageLoad();
      jest.advanceTimersByTime(3000);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'webStability',
          kind: 'pageload'
        })
      );
    });

    it('should calculate connectTime correctly', () => {
      window.performance.timing.loadEventStart = 7000;
      
      performanceInstance.pageLoad();
      jest.advanceTimersByTime(3000);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          connectTime: 100 // connectEnd - connectStart = 1200 - 1100
        })
      );
    });

    it('should calculate ttfbTime correctly', () => {
      window.performance.timing.loadEventStart = 7000;
      
      performanceInstance.pageLoad();
      jest.advanceTimersByTime(3000);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ttfbTime: 100 // responseStart - requestStart = 1400 - 1300
        })
      );
    });

    it('should retry if domContentLoadedEventEnd is 0', () => {
      window.performance.timing.domContentLoadedEventEnd = 0;
      
      const pageLoadSpy = jest.spyOn(performanceInstance, 'pageLoad');
      
      performanceInstance.pageLoad();
      jest.advanceTimersByTime(3000);
      
      // Should have called itself again
      expect(pageLoadSpy).toHaveBeenCalledTimes(2);
    });

    it('should include all performance metrics', () => {
      window.performance.timing.loadEventStart = 8000;
      
      performanceInstance.pageLoad();
      jest.advanceTimersByTime(3000);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'webStability',
          kind: 'pageload',
          connectTime: expect.any(Number),
          ttfbTime: expect.any(Number),
          responseTime: expect.any(Number),
          parseDOMTime: expect.any(Number),
          domContentLoadedTime: expect.any(Number),
          timeToInteractive: expect.any(Number),
          loadTime: expect.any(Number)
        })
      );
    });
  });

  describe('longTask', () => {
    beforeEach(() => {
      performanceInstance = new PerformanceMonitor();
    });

    it('should setup PerformanceObserver for longtask', () => {
      expect(global.PerformanceObserver).toHaveBeenCalled();
    });

    it('should report long tasks exceeding 100ms', () => {
      const mockEntry = {
        duration: 150,
        startTime: 1000,
        entryType: 'longtask'
      };
      
      const mockEvent = {
        type: 'click',
        target: document.createElement('button'),
        path: [document.createElement('button')]
      };
      
      getLastEvent.mockReturnValue(mockEvent);
      
      // Simulate PerformanceObserver callback
      const callback = global.PerformanceObserver._callback;
      callback({
        getEntries: () => [mockEntry]
      });
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'webStability',
          kind: 'longtask',
          duration: 150,
          startTime: 1000
        })
      );
    });

    it('should not report tasks under 100ms', () => {
      const mockEntry = {
        duration: 50,
        startTime: 1000,
        entryType: 'longtask'
      };
      
      const callback = global.PerformanceObserver._callback;
      callback({
        getEntries: () => [mockEntry]
      });
      
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    it('should include event type and selector for long tasks', () => {
      const mockEntry = {
        duration: 200,
        startTime: 2000,
        entryType: 'longtask'
      };
      
      const mockButton = document.createElement('button');
      mockButton.id = 'test-button';
      
      const mockEvent = {
        type: 'click',
        target: mockButton,
        path: [mockButton]
      };
      
      getLastEvent.mockReturnValue(mockEvent);
      utils.getSelector.mockReturnValue('button#test-button');
      
      const callback = global.PerformanceObserver._callback;
      callback({
        getEntries: () => [mockEntry]
      });
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'click',
          selector: 'button#test-button',
          duration: 200
        })
      );
    });

    it('should handle missing lastEvent', () => {
      const mockEntry = {
        duration: 150,
        startTime: 1000
      };
      
      getLastEvent.mockReturnValue(null);
      
      const callback = global.PerformanceObserver._callback;
      callback({
        getEntries: () => [mockEntry]
      });
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          selector: '',
          eventType: undefined
        })
      );
    });

    it('should handle multiple long task entries', () => {
      const mockEntries = [
        { duration: 150, startTime: 1000 },
        { duration: 200, startTime: 2000 },
        { duration: 120, startTime: 3000 }
      ];
      
      getLastEvent.mockReturnValue({
        type: 'click',
        target: document.createElement('button')
      });
      
      const callback = global.PerformanceObserver._callback;
      callback({
        getEntries: () => mockEntries
      });
      
      expect(dispatchEventSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('webMemory', () => {
    it('should exist as a method', () => {
      performanceInstance = new PerformanceMonitor();
      expect(typeof performanceInstance.webMemory).toBe('function');
    });
  });

  describe('resourceLoad', () => {
    it('should exist as a method', () => {
      performanceInstance = new PerformanceMonitor();
      expect(typeof performanceInstance.resourceLoad).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle missing performance API', () => {
      const originalPerformance = window.performance;
      delete window.performance;
      
      expect(() => {
        performanceInstance = new PerformanceMonitor();
      }).not.toThrow();
      
      window.performance = originalPerformance;
    });

    it('should handle missing PerformanceObserver', () => {
      const OriginalPO = global.PerformanceObserver;
      delete global.PerformanceObserver;
      
      expect(() => {
        performanceInstance = new PerformanceMonitor();
      }).toThrow();
      
      global.PerformanceObserver = OriginalPO;
    });
  });
});
