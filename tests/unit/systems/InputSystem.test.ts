import { InputSystem } from '@/game/systems/InputSystem';

// Mock HTMLCanvasElement
const mockCanvas = {
  addEventListener: jest.fn(),
  getBoundingClientRect: () => ({ left: 0, top: 0 }),
} as unknown as HTMLCanvasElement;

describe('InputSystem', () => {
  let inputSystem: InputSystem;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    inputSystem = new InputSystem(mockCanvas);
  });

  describe('constructor', () => {
    it('should initialize with empty keys object', () => {
      expect(inputSystem.keys).toEqual({});
    });

    it('should initialize touch state', () => {
      expect(inputSystem.touch).toEqual({ x: 0, y: 0, active: false });
    });

    it('should bind event listeners', () => {
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });

  describe('keyboard input', () => {
    it('should track keydown events', () => {
      // Simulate keydown event
      const event = new KeyboardEvent('keydown', { code: 'ArrowUp' });
      window.dispatchEvent(event);
      
      expect(inputSystem.keys['ArrowUp']).toBe(true);
    });

    it('should track keyup events', () => {
      // First press the key
      const keydownEvent = new KeyboardEvent('keydown', { code: 'ArrowUp' });
      window.dispatchEvent(keydownEvent);
      expect(inputSystem.keys['ArrowUp']).toBe(true);
      
      // Then release the key
      const keyupEvent = new KeyboardEvent('keyup', { code: 'ArrowUp' });
      window.dispatchEvent(keyupEvent);
      
      expect(inputSystem.keys['ArrowUp']).toBe(false);
    });

    it('should trigger bomb_or_fire action for B key', () => {
      const actionCallback = jest.fn();
      inputSystem.onAction = actionCallback;
      
      const event = new KeyboardEvent('keydown', { code: 'KeyB' });
      window.dispatchEvent(event);
      
      expect(actionCallback).toHaveBeenCalledWith('bomb_or_fire');
    });

    it('should trigger bomb_or_fire action for Space key', () => {
      const actionCallback = jest.fn();
      inputSystem.onAction = actionCallback;
      
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      window.dispatchEvent(event);
      
      expect(actionCallback).toHaveBeenCalledWith('bomb_or_fire');
    });

    it('should get keyboard vector for arrow keys', () => {
      // Press right arrow key
      const keydownEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
      window.dispatchEvent(keydownEvent);
      
      const vector = inputSystem.getKeyboardVector();
      expect(vector).toEqual({ x: 1, y: 0 });
    });

    it('should get combined keyboard vector for diagonal movement', () => {
      // Press right and down arrow keys
      const rightEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
      const downEvent = new KeyboardEvent('keydown', { code: 'ArrowDown' });
      window.dispatchEvent(rightEvent);
      window.dispatchEvent(downEvent);
      
      const vector = inputSystem.getKeyboardVector();
      expect(vector).toEqual({ x: 1, y: 1 });
    });
  });

  describe('mouse input', () => {
    it('should update touch position on mousemove', () => {
      const mouseMoveCallback = jest.fn();
      inputSystem.onMouseMove = mouseMoveCallback;
      
      // Simulate mousemove event
      const mouseEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 50 });
      // We need to call the registered listener directly since we can't easily simulate the event on the mock canvas
      const mouseMoveListener = (mockCanvas.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'mousemove')[1];
      mouseMoveListener(mouseEvent);
      
      expect(inputSystem.touch.x).toBe(100);
      expect(inputSystem.touch.y).toBe(50);
      expect(mouseMoveCallback).toHaveBeenCalledWith(100, 50);
    });

    it('should trigger touch_start action on mousedown', () => {
      const actionCallback = jest.fn();
      inputSystem.onAction = actionCallback;
      
      // Simulate mousedown event
      const mouseEvent = new MouseEvent('mousedown');
      const mouseDownListener = (mockCanvas.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'mousedown')[1];
      mouseDownListener(mouseEvent);
      
      expect(actionCallback).toHaveBeenCalledWith('touch_start');
    });
  });

  describe('touch input', () => {
    it('should handle touchstart event', () => {
      const actionCallback = jest.fn();
      inputSystem.onAction = actionCallback;
      
      // Create a mock touch event
      const touchEvent = {
        preventDefault: jest.fn(),
        touches: [{
          clientX: 150,
          clientY: 75
        }]
      } as unknown as TouchEvent;
      
      // Get the touchstart listener
      const touchStartListener = (mockCanvas.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'touchstart')[1];
      touchStartListener(touchEvent);
      
      expect(inputSystem.touch.active).toBe(true);
      expect(inputSystem.lastTouch.x).toBe(150);
      expect(inputSystem.lastTouch.y).toBe(75);
      expect(actionCallback).toHaveBeenCalledWith('touch_start');
    });

    it('should calculate touch delta on touchmove', () => {
      // First simulate touchstart
      const touchStartEvent = {
        preventDefault: jest.fn(),
        touches: [{
          clientX: 100,
          clientY: 50
        }]
      } as unknown as TouchEvent;
      
      const touchStartListener = (mockCanvas.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'touchstart')[1];
      touchStartListener(touchStartEvent);
      
      // Then simulate touchmove
      const touchMoveEvent = {
        preventDefault: jest.fn(),
        touches: [{
          clientX: 120,
          clientY: 80
        }]
      } as unknown as TouchEvent;
      
      const touchMoveListener = (mockCanvas.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'touchmove')[1];
      touchMoveListener(touchMoveEvent);
      
      // Get the delta
      const delta = inputSystem.getTouchDelta();
      expect(delta).toEqual({ x: 20, y: 30 });
    });

    it('should handle touchend event', () => {
      const actionCallback = jest.fn();
      inputSystem.onAction = actionCallback;
      
      // First simulate touchstart
      const touchStartEvent = {
        preventDefault: jest.fn(),
        touches: [{
          clientX: 100,
          clientY: 50
        }]
      } as unknown as TouchEvent;
      
      const touchStartListener = (mockCanvas.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'touchstart')[1];
      touchStartListener(touchStartEvent);
      
      // Then simulate touchend
      const touchEndEvent = new Event('touchend');
      const touchEndListener = (mockCanvas.addEventListener as jest.Mock).mock.calls
        .find(call => call[0] === 'touchend')[1];
      touchEndListener(touchEndEvent);
      
      expect(inputSystem.touch.active).toBe(false);
      expect(actionCallback).toHaveBeenCalledWith('touch_end');
    });
  });
});