import { PowerupType } from '@/types';
import { GameEngine } from '@/game/GameEngine';
import { createPlayer } from '../mocks/entityFactory';
import { AudioMock } from '../mocks/audioMock';

// Mock DOM and Canvas APIs
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  fillText: jest.fn(),
};

// Define the mock class separately
class MockHTMLCanvasElement extends HTMLElement {
  width = 0;
  height = 0;
  
  getContext() {
    return mockCanvasContext;
  }
  
  captureStream() {
    return new MediaStream();
  }
  
  toBlob() {
    return Promise.resolve(new Blob());
  }
  
  toDataURL() {
    return '';
  }
}

// Cast to any to avoid type errors
global.HTMLCanvasElement = MockHTMLCanvasElement as any;

// Mock AudioSystem
jest.mock('@/game/systems/AudioSystem');

// Mock other systems
jest.mock('@/game/systems/InputSystem');
jest.mock('@/game/systems/RenderSystem');
jest.mock('@/game/systems/WeaponSystem');
jest.mock('@/game/systems/EnemySystem');
jest.mock('@/game/systems/BossSystem');
jest.mock('@/game/systems/ComboSystem');
jest.mock('@/game/systems/DifficultySystem');
jest.mock('@/game/systems/EliteAISystem');
jest.mock('@/game/systems/EnvironmentSystem');
jest.mock('@/game/systems/BossPhaseSystem');
jest.mock('@/game/systems/WeaponSynergySystem');

describe('Health to Shield Conversion', () => {
  let gameEngine: GameEngine;
  
  beforeEach(() => {
    // Create a mock canvas element
    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: () => mockCanvasContext,
    } as unknown as HTMLCanvasElement;
    
    // Create a new GameEngine instance for each test
    gameEngine = new GameEngine(
      mockCanvas,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    );
    gameEngine.startGame();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should restore health when player health is not full', () => {
    // Arrange
    const initialHp = gameEngine.player.hp;
    const restoreAmount = 30; // From PowerupEffects.hpRestoreAmount
    
    // Make sure player health is not full
    gameEngine.player.hp = gameEngine.player.maxHp - 10;
    
    // Act
    gameEngine.applyPowerup(PowerupType.HP);
    
    // Assert
    expect(gameEngine.player.hp).toBe(Math.min(gameEngine.player.maxHp, gameEngine.player.hp + restoreAmount));
    // Shield should not be affected when health is not full
    expect(gameEngine.shield).toBe(0);
  });

  it('should convert overflow health to shield when player health is full', () => {
    // Arrange
    const restoreAmount = 30; // From PowerupEffects.hpRestoreAmount
    gameEngine.player.hp = gameEngine.player.maxHp; // Full health
    
    // Act
    gameEngine.applyPowerup(PowerupType.HP);
    
    // Assert
    // Health should remain at max
    expect(gameEngine.player.hp).toBe(gameEngine.player.maxHp);
    // Shield should be increased by the restore amount
    expect(gameEngine.shield).toBe(restoreAmount);
  });

  it('should not exceed shield cap when converting overflow health', () => {
    // Arrange
    const restoreAmount = 30; // From PowerupEffects.hpRestoreAmount
    gameEngine.player.hp = gameEngine.player.maxHp; // Full health
    gameEngine.shield = gameEngine.getShieldCap() - 10; // Almost full shield
    
    // Act
    gameEngine.applyPowerup(PowerupType.HP);
    
    // Assert
    // Health should remain at max
    expect(gameEngine.player.hp).toBe(gameEngine.player.maxHp);
    // Shield should be at cap, not exceeding it
    expect(gameEngine.shield).toBe(gameEngine.getShieldCap());
  });

  it('should handle edge case when health is exactly at max', () => {
    // Arrange
    gameEngine.player.hp = gameEngine.player.maxHp; // Exactly full health
    
    // Act
    gameEngine.applyPowerup(PowerupType.HP);
    
    // Assert
    expect(gameEngine.player.hp).toBe(gameEngine.player.maxHp);
    expect(gameEngine.shield).toBe(30); // Should convert to shield
  });
});