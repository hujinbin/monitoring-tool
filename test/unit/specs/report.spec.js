/**
 * @jest-environment jsdom
 */
import { report } from '@/report/report';

describe('report', () => {
  let reportInstance;
  let sendBeaconSpy;

  beforeEach(() => {
    // Mock sendBeacon
    sendBeaconSpy = jest.fn(() => true);
    Object.defineProperty(window.navigator, 'sendBeacon', {
      writable: true,
      value: sendBeaconSpy
    });
    
    reportInstance = new report('https://test.example.com');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided host', () => {
      const instance = new report('https://custom.host.com');
      expect(instance.host).toBe('https://custom.host.com');
    });

    it('should initialize with empty host if not provided', () => {
      const instance = new report();
      expect(instance.host).toBe('');
    });

    it('should extend TaskQueue', () => {
      expect(reportInstance.request).toBeDefined();
      expect(reportInstance.run).toBeDefined();
      expect(reportInstance.clear).toBeDefined();
    });
  });

  describe('send', () => {
    it('should call sendData through request queue', async () => {
      const testData = {
        reportType: 'webError',
        message: 'test error',
        timestamp: Date.now()
      };
      
      reportInstance.send(testData);
      
      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(sendBeaconSpy).toHaveBeenCalled();
    });

    it('should handle multiple send calls', async () => {
      const data1 = { type: 'error1' };
      const data2 = { type: 'error2' };
      const data3 = { type: 'error3' };
      
      reportInstance.send(data1);
      reportInstance.send(data2);
      reportInstance.send(data3);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(sendBeaconSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendData', () => {
    it('should send data using sendBeacon', async () => {
      const testData = {
        reportType: 'networkError',
        status: 500,
        url: 'https://api.example.com/data'
      };
      
      reportInstance.send(testData);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        'https://test.example.com/api/report',
        expect.any(Blob)
      );
    });

    it('should convert data to JSON Blob', async () => {
      const testData = {
        reportType: 'webStability',
        kind: 'pageload',
        loadTime: 3000
      };
      
      reportInstance.send(testData);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const callArgs = sendBeaconSpy.mock.calls[0];
      expect(callArgs[0]).toBe('https://test.example.com/api/report');
      
      // Check if the second argument is a Blob
      expect(callArgs[1]).toBeInstanceOf(Blob);
      
      // Read blob content to verify
      const blobText = await callArgs[1].text();
      expect(JSON.parse(blobText)).toEqual(testData);
    });

    it('should handle complex nested data structures', async () => {
      const complexData = {
        reportType: 'webError',
        error: {
          message: 'Something went wrong',
          stack: 'Error: Something went wrong\n    at ...',
          details: {
            line: 42,
            column: 10
          }
        },
        tags: ['critical', 'frontend']
      };
      
      reportInstance.send(complexData);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const callArgs = sendBeaconSpy.mock.calls[0];
      const blobText = await callArgs[1].text();
      expect(JSON.parse(blobText)).toEqual(complexData);
    });

    it('should send to correct endpoint', async () => {
      const customHost = 'https://monitor.custom.com';
      const customInstance = new report(customHost);
      
      customInstance.send({ type: 'test' });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        `${customHost}/api/report`,
        expect.any(Blob)
      );
    });
  });

  describe('integration with TaskQueue', () => {
    it('should queue multiple reports', async () => {
      const reports = [
        { type: 'error', id: 1 },
        { type: 'error', id: 2 },
        { type: 'error', id: 3 }
      ];
      
      reports.forEach(data => reportInstance.send(data));
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(sendBeaconSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle sendBeacon failure gracefully', async () => {
      sendBeaconSpy.mockReturnValue(false);
      
      const testData = { type: 'test' };
      
      // Should not throw
      expect(() => {
        reportInstance.send(testData);
      }).not.toThrow();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(sendBeaconSpy).toHaveBeenCalled();
    });

    it('should clear pending reports', () => {
      reportInstance.send({ type: 'error1' });
      reportInstance.send({ type: 'error2' });
      reportInstance.send({ type: 'error3' });
      
      reportInstance.clear();
      
      expect(reportInstance.requests.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty data object', async () => {
      reportInstance.send({});
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(sendBeaconSpy).toHaveBeenCalledWith(
        'https://test.example.com/api/report',
        expect.any(Blob)
      );
    });

    it('should handle null values in data', async () => {
      const dataWithNull = {
        reportType: 'webError',
        error: null,
        timestamp: Date.now()
      };
      
      reportInstance.send(dataWithNull);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const callArgs = sendBeaconSpy.mock.calls[0];
      const blobText = await callArgs[1].text();
      const parsed = JSON.parse(blobText);
      expect(parsed.error).toBeNull();
    });

    it('should handle very large data', async () => {
      const largeData = {
        reportType: 'webError',
        stack: 'a'.repeat(10000),
        details: new Array(100).fill({ item: 'data' })
      };
      
      reportInstance.send(largeData);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(sendBeaconSpy).toHaveBeenCalled();
    });
  });
});
