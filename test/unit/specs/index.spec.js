/**
 * @jest-environment jsdom
 */
import monitoringTool from '@/index';
import { getConnection } from '@/utils/utils';
import { webError } from '@/webError/webError';
import { network } from '@/network/network';
import { performance } from '@/performance/performance';
import { report } from '@/report/report';

// Mock all dependencies
jest.mock('@/utils/utils', () => ({
  getConnection: jest.fn()
}));

jest.mock('@/webError/webError');
jest.mock('@/network/network');
jest.mock('@/performance/performance');
jest.mock('@/report/report');

describe('monitoringTool', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock connection object
    mockConnection = {
      effectiveType: '4g',
      addEventListener: jest.fn()
    };
    
    getConnection.mockReturnValue(mockConnection);
    
    // Mock class constructors
    webError.mockImplementation(() => ({
      getJsError: jest.fn(),
      getPromiseError: jest.fn()
    }));
    
    network.mockImplementation(() => ({
      mockXHR: jest.fn(),
      mockFetch: jest.fn()
    }));
    
    performance.mockImplementation(() => ({
      onReady: jest.fn(),
      pageLoad: jest.fn(),
      longTask: jest.fn()
    }));
    
    report.mockImplementation(() => ({
      send: jest.fn()
    }));
    
    // Mock window.location
    delete window.location;
    window.location = {
      hostname: 'example.com',
      href: 'https://example.com/test'
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options when no options provided', () => {
      const monitor = new monitoringTool();
      
      expect(monitor.option.host).toBe('https://monitor.leheavengame.com');
      expect(monitor.option.secret).toBe('');
    });

    it('should merge provided options with defaults', () => {
      const monitor = new monitoringTool({
        host: 'https://custom.host.com',
        secret: 'my-secret-key'
      });
      
      expect(monitor.option.host).toBe('https://custom.host.com');
      expect(monitor.option.secret).toBe('my-secret-key');
    });

    it('should not initialize modules without secret', () => {
      const monitor = new monitoringTool();
      
      expect(monitor.network).toBeNull();
      expect(monitor.performance).toBeNull();
      expect(monitor.webError).toBeNull();
      expect(monitor.report).toBeNull();
      
      expect(network).not.toHaveBeenCalled();
      expect(performance).not.toHaveBeenCalled();
      expect(webError).not.toHaveBeenCalled();
      expect(report).not.toHaveBeenCalled();
    });

    it('should initialize all modules when secret is provided', () => {
      const monitor = new monitoringTool({
        secret: 'test-secret'
      });
      
      expect(network).toHaveBeenCalled();
      expect(performance).toHaveBeenCalled();
      expect(webError).toHaveBeenCalled();
      expect(report).toHaveBeenCalledWith('https://monitor.leheavengame.com');
      
      expect(monitor.network).toBeDefined();
      expect(monitor.performance).toBeDefined();
      expect(monitor.webError).toBeDefined();
      expect(monitor.report).toBeDefined();
    });

    it('should use custom host when initializing report', () => {
      const customHost = 'https://my-monitor.com';
      const monitor = new monitoringTool({
        host: customHost,
        secret: 'test-secret'
      });
      
      expect(report).toHaveBeenCalledWith(customHost);
    });
  });

  describe('init', () => {
    it('should call performance.onReady', () => {
      const mockPerformanceInstance = {
        onReady: jest.fn(),
        pageLoad: jest.fn(),
        longTask: jest.fn()
      };
      
      performance.mockImplementation(() => mockPerformanceInstance);
      
      const monitor = new monitoringTool({ secret: 'test' });
      
      expect(mockPerformanceInstance.onReady).toHaveBeenCalled();
    });

    it('should get connection and store effectiveType', () => {
      const monitor = new monitoringTool({ secret: 'test' });
      
      expect(getConnection).toHaveBeenCalled();
      expect(monitor.effectiveType).toBe('4g');
    });

    it('should add change listener to connection', () => {
      const monitor = new monitoringTool({ secret: 'test' });
      
      expect(mockConnection.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should add monitoring-report event listener to window', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      const monitor = new monitoringTool({ secret: 'test' });
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'monitoring-report',
        expect.any(Function)
      );
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('onStateChange', () => {
    it('should update effectiveType when connection changes', () => {
      const monitor = new monitoringTool({ secret: 'test' });
      
      expect(monitor.effectiveType).toBe('4g');
      
      // Get the change handler
      const changeHandler = mockConnection.addEventListener.mock.calls[0][1];
      
      // Simulate connection change
      changeHandler({
        target: { effectiveType: '3g' }
      });
      
      expect(monitor.effectiveType).toBe('3g');
    });

    it('should handle multiple connection changes', () => {
      const monitor = new monitoringTool({ secret: 'test' });
      const changeHandler = mockConnection.addEventListener.mock.calls[0][1];
      
      changeHandler({ target: { effectiveType: '3g' } });
      expect(monitor.effectiveType).toBe('3g');
      
      changeHandler({ target: { effectiveType: 'slow-2g' } });
      expect(monitor.effectiveType).toBe('slow-2g');
      
      changeHandler({ target: { effectiveType: '4g' } });
      expect(monitor.effectiveType).toBe('4g');
    });
  });

  describe('onReport', () => {
    let monitor;
    let mockReportInstance;

    beforeEach(() => {
      mockReportInstance = {
        send: jest.fn()
      };
      
      report.mockImplementation(() => mockReportInstance);
      
      monitor = new monitoringTool({
        secret: 'test-secret',
        host: 'https://test-host.com'
      });
    });

    it('should send report when effectiveType is 4g', () => {
      monitor.effectiveType = '4g';
      
      const reportData = {
        reportType: 'webError',
        message: 'Test error'
      };
      
      const event = new CustomEvent('monitoring-report', {
        detail: reportData
      });
      
      window.dispatchEvent(event);
      
      expect(mockReportInstance.send).toHaveBeenCalledWith(
        expect.objectContaining({
          reportType: 'webError',
          message: 'Test error',
          apiKey: 'test-secret',
          domain: 'example.com',
          path: 'https://example.com/test'
        })
      );
    });

    it('should not send report when effectiveType is not 4g', () => {
      monitor.effectiveType = '3g';
      
      const reportData = {
        reportType: 'webError',
        message: 'Test error'
      };
      
      const event = new CustomEvent('monitoring-report', {
        detail: reportData
      });
      
      window.dispatchEvent(event);
      
      expect(mockReportInstance.send).not.toHaveBeenCalled();
    });

    it('should include all required fields in report', () => {
      monitor.effectiveType = '4g';
      
      const reportData = {
        reportType: 'networkError',
        status: 500,
        url: 'https://api.example.com',
        method: 'GET'
      };
      
      const event = new CustomEvent('monitoring-report', {
        detail: reportData
      });
      
      window.dispatchEvent(event);
      
      expect(mockReportInstance.send).toHaveBeenCalledWith({
        reportType: 'networkError',
        status: 500,
        url: 'https://api.example.com',
        method: 'GET',
        apiKey: 'test-secret',
        domain: 'example.com',
        path: 'https://example.com/test'
      });
    });

    it('should handle multiple reports', () => {
      monitor.effectiveType = '4g';
      
      const reports = [
        { reportType: 'webError', message: 'Error 1' },
        { reportType: 'networkError', status: 404 },
        { reportType: 'webStability', kind: 'pageload' }
      ];
      
      reports.forEach(reportData => {
        const event = new CustomEvent('monitoring-report', {
          detail: reportData
        });
        window.dispatchEvent(event);
      });
      
      expect(mockReportInstance.send).toHaveBeenCalledTimes(3);
    });

    it('should use current window location for each report', () => {
      monitor.effectiveType = '4g';
      
      const event = new CustomEvent('monitoring-report', {
        detail: { type: 'test' }
      });
      
      window.dispatchEvent(event);
      
      const callArgs = mockReportInstance.send.mock.calls[0][0];
      expect(callArgs.domain).toBe('example.com');
      expect(callArgs.path).toBe('https://example.com/test');
    });
  });

  describe('global window binding', () => {
    it('should attach monitoringTool to window object', () => {
      expect(window.monitoringTool).toBeDefined();
      expect(window.monitoringTool).toBe(monitoringTool);
    });

    it('should allow creating instance from window', () => {
      const monitor = new window.monitoringTool({
        secret: 'test'
      });
      
      expect(monitor).toBeInstanceOf(monitoringTool);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete monitoring lifecycle', () => {
      const mockReportInstance = {
        send: jest.fn()
      };
      
      report.mockImplementation(() => mockReportInstance);
      
      // Create monitoring tool
      const monitor = new monitoringTool({
        host: 'https://monitor.example.com',
        secret: 'my-secret'
      });
      
      // Verify initialization
      expect(monitor.network).toBeDefined();
      expect(monitor.performance).toBeDefined();
      expect(monitor.webError).toBeDefined();
      expect(monitor.report).toBeDefined();
      
      // Simulate network change
      const changeHandler = mockConnection.addEventListener.mock.calls[0][1];
      changeHandler({ target: { effectiveType: '4g' } });
      
      // Dispatch monitoring event
      const event = new CustomEvent('monitoring-report', {
        detail: {
          reportType: 'webError',
          message: 'Test error'
        }
      });
      
      window.dispatchEvent(event);
      
      // Verify report was sent
      expect(mockReportInstance.send).toHaveBeenCalled();
    });

    it('should not report when network is slow', () => {
      const mockReportInstance = {
        send: jest.fn()
      };
      
      report.mockImplementation(() => mockReportInstance);
      
      const monitor = new monitoringTool({
        secret: 'test-secret'
      });
      
      // Set slow network
      const changeHandler = mockConnection.addEventListener.mock.calls[0][1];
      changeHandler({ target: { effectiveType: 'slow-2g' } });
      
      // Try to report
      const event = new CustomEvent('monitoring-report', {
        detail: { reportType: 'webError' }
      });
      
      window.dispatchEvent(event);
      
      // Should not send on slow connection
      expect(mockReportInstance.send).not.toHaveBeenCalled();
    });

    it('should handle connection being null', () => {
      getConnection.mockReturnValue(null);
      
      expect(() => {
        const monitor = new monitoringTool({ secret: 'test' });
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined event detail', () => {
      const mockReportInstance = {
        send: jest.fn()
      };
      
      report.mockImplementation(() => mockReportInstance);
      
      const monitor = new monitoringTool({ secret: 'test' });
      monitor.effectiveType = '4g';
      
      const event = new CustomEvent('monitoring-report');
      
      window.dispatchEvent(event);
      
      // Should handle gracefully
      expect(mockReportInstance.send).toHaveBeenCalled();
    });

    it('should override default host with custom host', () => {
      const customHost = 'https://my-custom-monitoring.com';
      const monitor = new monitoringTool({
        host: customHost,
        secret: 'test'
      });
      
      expect(monitor.option.host).toBe(customHost);
      expect(report).toHaveBeenCalledWith(customHost);
    });

    it('should handle empty secret string', () => {
      const monitor = new monitoringTool({ secret: '' });
      
      // Empty string is falsy, should not initialize
      expect(monitor.network).toBeNull();
      expect(monitor.performance).toBeNull();
    });
  });
});
