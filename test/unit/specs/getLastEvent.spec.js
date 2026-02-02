/**
 * @jest-environment jsdom
 */
import getLastEvent from '@/utils/getLastEvent';

describe('getLastEvent', () => {
  beforeEach(() => {
    // Reset the last event before each test
    jest.clearAllMocks();
  });

  it('should return empty string when no event occurred', () => {
    const lastEvent = getLastEvent();
    expect(lastEvent).toBe('');
  });

  it('should capture click event', (done) => {
    const element = document.createElement('button');
    document.body.appendChild(element);
    
    element.click();
    
    // Wait for event to be captured
    setTimeout(() => {
      const lastEvent = getLastEvent();
      expect(lastEvent).toBeTruthy();
      if (lastEvent) {
        expect(lastEvent.type).toBe('click');
      }
      document.body.removeChild(element);
      done();
    }, 50);
  });

  it('should capture mousedown event', (done) => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    element.dispatchEvent(mouseEvent);
    
    setTimeout(() => {
      const lastEvent = getLastEvent();
      expect(lastEvent).toBeTruthy();
      if (lastEvent) {
        expect(lastEvent.type).toBe('mousedown');
      }
      document.body.removeChild(element);
      done();
    }, 50);
  });

  it('should capture keydown event', (done) => {
    const element = document.createElement('input');
    document.body.appendChild(element);
    
    const keyEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter'
    });
    
    element.dispatchEvent(keyEvent);
    
    setTimeout(() => {
      const lastEvent = getLastEvent();
      expect(lastEvent).toBeTruthy();
      if (lastEvent) {
        expect(lastEvent.type).toBe('keydown');
      }
      document.body.removeChild(element);
      done();
    }, 50);
  });

  it('should capture touchstart event', (done) => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: []
    });
    
    element.dispatchEvent(touchEvent);
    
    setTimeout(() => {
      const lastEvent = getLastEvent();
      expect(lastEvent).toBeTruthy();
      if (lastEvent) {
        expect(lastEvent.type).toBe('touchstart');
      }
      document.body.removeChild(element);
      done();
    }, 50);
  });

  it('should update to the most recent event', (done) => {
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    document.body.appendChild(button1);
    document.body.appendChild(button2);
    
    button1.click();
    
    setTimeout(() => {
      button2.click();
      
      setTimeout(() => {
        const lastEvent = getLastEvent();
        expect(lastEvent).toBeTruthy();
        if (lastEvent) {
          expect(lastEvent.type).toBe('click');
          expect(lastEvent.target).toBe(button2);
        }
        document.body.removeChild(button1);
        document.body.removeChild(button2);
        done();
      }, 50);
    }, 50);
  });
});
