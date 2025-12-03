import { GameEngine } from '../../game/GameEngine';
import { GameState } from '../../types';

// Mock canvas with required methods
const mockCanvas = {
  width: 800,
  height: 600,
  addEventListener: jest.fn(),
  getBoundingClientRect: () => ({ left: 0, top: 0 }),
  getContext: () => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    drawImage: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({
      addColorStop: jest.fn()
    })
  })
} as unknown as HTMLCanvasElement;

describe('GameEngine Draw Fix', () => {
  let gameEngine: GameEngine;

  beforeEach(() => {
    // Create game engine instance with mock callbacks
    gameEngine = new GameEngine(
      mockCanvas,
      jest.fn(), // onScoreChange
      jest.fn(), // onLevelChange
      jest.fn(), // onStateChange
      jest.fn(), // onHpChange
      jest.fn(), // onBombChange
      jest.fn(), // onMaxLevelChange
      jest.fn(), // onBossWarning
      jest.fn()  // onComboChange
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not throw error when drawing in MENU state (player not initialized)', () => {
    // Ensure we're in MENU state and player is not initialized
    expect(gameEngine.state).toBe(GameState.MENU);
    expect(gameEngine.player).toBeUndefined();
    
    // This should not throw an error after our fix
    expect(() => {
      gameEngine.draw();
    }).not.toThrow();
  });

  it('should not throw error when drawing in PLAYING state (player initialized)', () => {
    // Start the game to initialize player
    gameEngine.startGame();
    
    expect(gameEngine.state).toBe(GameState.PLAYING);
    expect(gameEngine.player).toBeDefined();
    
    // This should work normally
    expect(() => {
      gameEngine.draw();
    }).not.toThrow();
  });

  it('should not throw error when drawing in GAME_OVER state', () => {
    // Set state to GAME_OVER without initializing player
    gameEngine.state = GameState.GAME_OVER;
    
    expect(gameEngine.player).toBeUndefined();
    
    // This should not throw an error after our fix
    expect(() => {
      gameEngine.draw();
    }).not.toThrow();
  });
});