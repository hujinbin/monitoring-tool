/**
 * @jest-environment jsdom
 */
import { getConnection, getNetworkState, getSelector, dispatchEvent } from '@/utils/utils';

describe('utils.ts', () => {
  describe('getConnection', () => {
    it('should return null if navigator is not available', () => {
      const originalNav = global.navigator;
      delete global.navigator;
      expect(getConnection()).toBeNull();
      global.navigator = originalNav;
    });

    it('should return connection object if available', () => {
      const mockConnection = { effectiveType: '4g', downlink: 10 };
      global.navigator.connection = mockConnection;
      expect(getConnection()).toBe(mockConnection);
    });

    it('should return mozConnection if available', () => {
      const mockConnection = { effectiveType: '4g', downlink: 10 };
      global.navigator.mozConnection = mockConnection;
      delete global.navigator.connection;
      expect(getConnection()).toBe(mockConnection);
    });

    it('should return webkitConnection if available', () => {
      const mockConnection = { effectiveType: '4g', downlink: 10 };
      global.navigator.webkitConnection = mockConnection;
      delete global.navigator.connection;
      delete global.navigator.mozConnection;
      expect(getConnection()).toBe(mockConnection);
    });
  });

  describe('getNetworkState', () => {
    beforeEach(() => {
      global.navigator.onLine = true;
    });

    it('should return basic state if connection is null', () => {
      global.navigator.connection = null;
      global.navigator.mozConnection = null;
      global.navigator.webkitConnection = null;
      
      const state = getNetworkState();
      expect(state).toHaveProperty('since');
      expect(state).toHaveProperty('online', true);
      expect(state).not.toHaveProperty('type');
    });

    it('should return full state if connection is available', () => {
      const mockConnection = {
        type: 'wifi',
        effectiveType: '4g',
        downlink: 10,
        downlinkMax: 50,
        rtt: 50,
        saveData: false
      };
      global.navigator.connection = mockConnection;
      
      const state = getNetworkState();
      expect(state).toHaveProperty('since');
      expect(state).toHaveProperty('online');
      expect(state).toHaveProperty('type', 'wifi');
      expect(state).toHaveProperty('effectiveType', '4g');
      expect(state).toHaveProperty('downlink', 10);
      expect(state).toHaveProperty('downlinkMax', 50);
      expect(state).toHaveProperty('rtt', 50);
      expect(state).toHaveProperty('saveData', false);
    });
  });

  describe('getSelector', () => {
    it('should handle element with id', () => {
      const mockElement = {
        id: 'test-id',
        nodeName: 'DIV',
        parentNode: null
      };
      
      const selector = getSelector(mockElement);
      expect(selector).toBe('div#test-id');
    });

    it('should handle element with className', () => {
      const mockElement = {
        id: '',
        className: 'test-class',
        nodeName: 'BUTTON',
        parentNode: null
      };
      
      const selector = getSelector(mockElement);
      expect(selector).toBe('button.test-class');
    });

    it('should handle element without id or class', () => {
      const mockElement = {
        id: '',
        className: '',
        nodeName: 'SPAN',
        parentNode: null
      };
      
      const selector = getSelector(mockElement);
      expect(selector).toBe('span');
    });

    it('should handle nested elements', () => {
      const mockChild = {
        id: 'child',
        nodeName: 'SPAN',
        parentNode: null
      };
      
      const mockParent = {
        id: '',
        className: 'parent',
        nodeName: 'DIV',
        parentNode: null
      };
      
      mockChild.parentNode = mockParent;
      
      const selector = getSelector(mockChild);
      expect(selector).toContain('div.parent');
      expect(selector).toContain('span#child');
    });

    it('should handle array of elements (path)', () => {
      const mockElements = [
        { id: 'child', nodeName: 'SPAN', parentNode: null },
        { id: '', className: 'parent', nodeName: 'DIV', parentNode: null }
      ];
      
      const selector = getSelector(mockElements);
      expect(selector).toContain('div.parent');
      expect(selector).toContain('span#child');
    });
  });

  describe('dispatchEvent', () => {
    it('should dispatch custom monitoring-report event', () => {
      const mockData = {
        reportType: 'webError',
        message: 'test error'
      };
      
      const eventListener = jest.fn();
      window.addEventListener('monitoring-report', eventListener);
      
      dispatchEvent(mockData);
      
      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0];
      expect(event.detail).toEqual(mockData);
      
      window.removeEventListener('monitoring-report', eventListener);
    });

    it('should dispatch event with correct detail data', () => {
      const mockData = {
        reportType: 'networkError',
        status: 500,
        url: 'https://api.example.com'
      };
      
      const eventListener = jest.fn();
      window.addEventListener('monitoring-report', eventListener);
      
      dispatchEvent(mockData);
      
      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener.mock.calls[0][0].detail).toMatchObject(mockData);
      
      window.removeEventListener('monitoring-report', eventListener);
    });
  });
});
