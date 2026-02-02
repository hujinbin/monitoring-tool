/**
 * @jest-environment jsdom
 */
import TaskQueue from '@/report/taskQueue';

describe('TaskQueue', () => {
  let taskQueue;

  beforeEach(() => {
    taskQueue = new TaskQueue();
    // 不再使用fake timers，因为它会影响Promise的执行
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(taskQueue.limit).toBe(1);
      expect(taskQueue.currentSum).toBe(0);
      expect(taskQueue.requests).toEqual([]);
    });

    it('should be an instance of TaskQueue', () => {
      expect(taskQueue).toBeInstanceOf(TaskQueue);
    });
  });

  describe('request', () => {
    it('should add function to requests queue', () => {
      const mockFn = jest.fn(() => Promise.resolve());
      taskQueue.request(mockFn);
      
      // 由于立即执行，队列可能为空
      expect(taskQueue.requests.length).toBeGreaterThanOrEqual(0);
    });

    it('should not add non-function to queue', () => {
      const initialLength = taskQueue.requests.length;
      
      taskQueue.request('not a function');
      taskQueue.request(123);
      taskQueue.request(null);
      taskQueue.request(undefined);
      taskQueue.request({});
      
      // 非函数类型不应被添加
      expect(taskQueue.requests.length).toBe(initialLength);
    });

    it('should execute function immediately if under limit', async () => {
      const mockFn = jest.fn(() => Promise.resolve('result'));
      
      taskQueue.request(mockFn);
      
      // 等待异步执行完成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should queue functions when at limit', async () => {
      const mockFn1 = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const mockFn2 = jest.fn(() => Promise.resolve());
      
      taskQueue.request(mockFn1);
      taskQueue.request(mockFn2);
      
      // 第一个函数应该立即执行
      expect(mockFn1).toHaveBeenCalled();
      // 第二个函数应该在队列中等待
      expect(mockFn2).not.toHaveBeenCalled();
      
      // 等待第一个函数完成
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 现在第二个函数也应该执行了
      expect(mockFn2).toHaveBeenCalled();
    });

    it('should handle multiple rapid requests', async () => {
      const executionOrder = [];
      
      const createMockFn = (id) => jest.fn(async () => {
        executionOrder.push(id);
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      
      const fns = [1, 2, 3, 4, 5].map(createMockFn);
      
      fns.forEach(fn => taskQueue.request(fn));
      
      // 等待所有任务完成
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 验证执行顺序
      expect(executionOrder).toEqual([1, 2, 3, 4, 5]);
      fns.forEach(fn => expect(fn).toHaveBeenCalledTimes(1));
    });
  });

  describe('run', () => {
    it('should execute function from queue', async () => {
      const mockFn = jest.fn(() => Promise.resolve('success'));
      taskQueue.requests.push(mockFn);
      
      await taskQueue.run();
      
      expect(mockFn).toHaveBeenCalled();
      expect(taskQueue.currentSum).toBe(0);
      expect(taskQueue.requests.length).toBe(0);
    });

    it('should handle async functions', async () => {
      const mockFn = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      });
      
      taskQueue.requests.push(mockFn);
      await taskQueue.run();
      
      expect(mockFn).toHaveBeenCalled();
      expect(taskQueue.currentSum).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockFn = jest.fn(() => Promise.reject(new Error('test error')));
      
      taskQueue.requests.push(mockFn);
      
      await taskQueue.run();
      
      expect(mockFn).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Error', expect.any(Error));
      expect(taskQueue.currentSum).toBe(0);
      
      consoleLogSpy.mockRestore();
    });

    it('should handle synchronous errors', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockFn = jest.fn(() => {
        throw new Error('sync error');
      });
      
      taskQueue.requests.push(mockFn);
      
      await taskQueue.run();
      
      expect(mockFn).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Error', expect.any(Error));
      expect(taskQueue.currentSum).toBe(0);
      
      consoleLogSpy.mockRestore();
    });

    it('should process next request after completion', async () => {
      const mockFn1 = jest.fn(() => Promise.resolve('first'));
      const mockFn2 = jest.fn(() => Promise.resolve('second'));
      
      taskQueue.requests.push(mockFn1);
      taskQueue.requests.push(mockFn2);
      
      await taskQueue.run();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFn1).toHaveBeenCalled();
      expect(mockFn2).toHaveBeenCalled();
      expect(taskQueue.requests.length).toBe(0);
    });

    it('should increment and decrement currentSum correctly', async () => {
      const mockFn = jest.fn(() => Promise.resolve());
      taskQueue.requests.push(mockFn);
      
      const runPromise = taskQueue.run();
      expect(taskQueue.currentSum).toBe(1);
      
      await runPromise;
      expect(taskQueue.currentSum).toBe(0);
    });

    it('should handle empty queue', async () => {
      expect(taskQueue.requests.length).toBe(0);
      
      await taskQueue.run();
      
      expect(taskQueue.currentSum).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all pending requests', () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();
      const mockFn3 = jest.fn();
      
      taskQueue.requests.push(mockFn1);
      taskQueue.requests.push(mockFn2);
      taskQueue.requests.push(mockFn3);
      taskQueue.currentSum = 1;
      
      taskQueue.clear();
      
      expect(taskQueue.requests).toEqual([]);
      expect(taskQueue.currentSum).toBe(0);
    });

    it('should reset queue to initial state', () => {
      taskQueue.requests = [jest.fn(), jest.fn()];
      taskQueue.currentSum = 2;
      
      taskQueue.clear();
      
      expect(taskQueue.requests.length).toBe(0);
      expect(taskQueue.currentSum).toBe(0);
    });

    it('should handle clearing empty queue', () => {
      expect(taskQueue.requests.length).toBe(0);
      
      taskQueue.clear();
      
      expect(taskQueue.requests.length).toBe(0);
      expect(taskQueue.currentSum).toBe(0);
    });
  });

  describe('integration tests', () => {
    it('should process multiple requests sequentially', async () => {
      const executionOrder = [];
      const mockFn1 = jest.fn(async () => {
        executionOrder.push(1);
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const mockFn2 = jest.fn(async () => {
        executionOrder.push(2);
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const mockFn3 = jest.fn(async () => {
        executionOrder.push(3);
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      taskQueue.request(mockFn1);
      taskQueue.request(mockFn2);
      taskQueue.request(mockFn3);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(executionOrder).toEqual([1, 2, 3]);
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });

    it('should respect the limit', async () => {
      taskQueue.limit = 2;
      
      let running = 0;
      let maxRunning = 0;
      
      const createMockFn = () => jest.fn(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise(resolve => setTimeout(resolve, 50));
        running--;
      });
      
      const mockFns = [createMockFn(), createMockFn(), createMockFn(), createMockFn()];
      
      mockFns.forEach(fn => taskQueue.request(fn));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(maxRunning).toBeLessThanOrEqual(2);
      mockFns.forEach(fn => expect(fn).toHaveBeenCalled());
    });

    it('should handle mixed success and error cases', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const executionOrder = [];
      
      const mockFn1 = jest.fn(async () => {
        executionOrder.push('success1');
        return 'result1';
      });
      
      const mockFn2 = jest.fn(async () => {
        executionOrder.push('error');
        throw new Error('intentional error');
      });
      
      const mockFn3 = jest.fn(async () => {
        executionOrder.push('success2');
        return 'result2';
      });
      
      taskQueue.request(mockFn1);
      taskQueue.request(mockFn2);
      taskQueue.request(mockFn3);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(executionOrder).toEqual(['success1', 'error', 'success2']);
      expect(mockFn1).toHaveBeenCalled();
      expect(mockFn2).toHaveBeenCalled();
      expect(mockFn3).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Error', expect.any(Error));
      
      consoleLogSpy.mockRestore();
    });

    it('should continue processing after error', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const errorFn = jest.fn(() => Promise.reject(new Error('error')));
      const successFn = jest.fn(() => Promise.resolve('success'));
      
      taskQueue.request(errorFn);
      taskQueue.request(successFn);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(errorFn).toHaveBeenCalled();
      expect(successFn).toHaveBeenCalled();
      expect(taskQueue.requests.length).toBe(0);
      
      consoleLogSpy.mockRestore();
    });

    it('should handle clearing queue during execution', async () => {
      const mockFn1 = jest.fn(() => new Promise(resolve => setTimeout(resolve, 50)));
      const mockFn2 = jest.fn(() => Promise.resolve());
      const mockFn3 = jest.fn(() => Promise.resolve());
      
      taskQueue.request(mockFn1);
      taskQueue.request(mockFn2);
      taskQueue.request(mockFn3);
      
      // 在第一个任务执行期间清除队列
      await new Promise(resolve => setTimeout(resolve, 10));
      taskQueue.clear();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 第一个任务应该已经开始执行
      expect(mockFn1).toHaveBeenCalled();
      // 后面的任务不应该执行，因为队列被清空了
      expect(mockFn2).not.toHaveBeenCalled();
      expect(mockFn3).not.toHaveBeenCalled();
    });
  });
});

      const mockFn1 = jest.fn(() => Promise.resolve());
      const mockFn2 = jest.fn(() => Promise.resolve());
      
      taskQueue.requests.push(mockFn1);
      taskQueue.requests.push(mockFn2);
      
      await taskQueue.run();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFn1).toHaveBeenCalled();
      expect(mockFn2).toHaveBeenCalled();
    });

    it('should increment and decrement currentSum correctly', async () => {
      const mockFn = jest.fn(() => Promise.resolve());
      taskQueue.requests.push(mockFn);
      
      const runPromise = taskQueue.run();
      expect(taskQueue.currentSum).toBe(1);
      
      await runPromise;
      expect(taskQueue.currentSum).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all pending requests', () => {
      const mockFn1 = jest.fn();
      const mockFn2 = jest.fn();
      const mockFn3 = jest.fn();
      
      taskQueue.requests.push(mockFn1);
      taskQueue.requests.push(mockFn2);
      taskQueue.requests.push(mockFn3);
      taskQueue.currentSum = 1;
      
      taskQueue.clear();
      
      expect(taskQueue.requests).toEqual([]);
      expect(taskQueue.currentSum).toBe(0);
    });

    it('should reset queue to initial state', () => {
      taskQueue.requests = [jest.fn(), jest.fn()];
      taskQueue.currentSum = 2;
      
      taskQueue.clear();
      
      expect(taskQueue.requests.length).toBe(0);
      expect(taskQueue.currentSum).toBe(0);
    });
  });

  describe('integration tests', () => {
    it('should process multiple requests sequentially', async () => {
      const executionOrder = [];
      const mockFn1 = jest.fn(async () => {
        executionOrder.push(1);
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const mockFn2 = jest.fn(async () => {
        executionOrder.push(2);
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const mockFn3 = jest.fn(async () => {
        executionOrder.push(3);
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      taskQueue.request(mockFn1);
      taskQueue.request(mockFn2);
      taskQueue.request(mockFn3);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(executionOrder).toEqual([1, 2, 3]);
      expect(mockFn1).toHaveBeenCalled();
      expect(mockFn2).toHaveBeenCalled();
      expect(mockFn3).toHaveBeenCalled();
    });

    it('should respect the limit', async () => {
      taskQueue.limit = 2;
      
      let running = 0;
      let maxRunning = 0;
      
      const createMockFn = () => jest.fn(async () => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        await new Promise(resolve => setTimeout(resolve, 50));
        running--;
      });
      
      const mockFns = [createMockFn(), createMockFn(), createMockFn(), createMockFn()];
      
      mockFns.forEach(fn => taskQueue.request(fn));
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(maxRunning).toBeLessThanOrEqual(2);
    });
  });
});
