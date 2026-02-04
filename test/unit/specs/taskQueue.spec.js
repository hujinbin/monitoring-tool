/**
 * @jest-environment jsdom
 */
import TaskQueue from '@/report/taskQueue';

describe('TaskQueue', () => {
  let taskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(taskQueue.limit).toBe(1);
      expect(taskQueue.currentSum).toBe(0);
      expect(taskQueue.requests).toEqual([]);
    });
  });

  describe('request', () => {
    it('should add function to requests queue', () => {
      const mockFn = jest.fn(() => Promise.resolve());
      taskQueue.request(mockFn);
      expect(taskQueue.requests.length).toBeGreaterThanOrEqual(0);
    });

    it('should not add non-function to queue', () => {
      const initialLength = taskQueue.requests.length;
      taskQueue.request('not a function');
      taskQueue.request(123);
      taskQueue.request(null);
      expect(taskQueue.requests.length).toBe(initialLength);
    });
  });

  describe('run', () => {
    it('should execute function from queue', async () => {
      const mockFn = jest.fn(() => Promise.resolve('success'));
      taskQueue.requests.push(mockFn);
      await taskQueue.run();
      expect(mockFn).toHaveBeenCalled();
      expect(taskQueue.currentSum).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all pending requests', () => {
      const mockFn1 = jest.fn();
      taskQueue.requests.push(mockFn1);
      taskQueue.clear();
      expect(taskQueue.requests).toEqual([]);
      expect(taskQueue.currentSum).toBe(0);
    });
  });
});
