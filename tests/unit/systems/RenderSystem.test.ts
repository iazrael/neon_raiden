import { RenderSystem } from '@/game/systems/RenderSystem';
import { SpriteGenerator } from '@/game/SpriteGenerator';
import { Entity, EntityType, BulletType, PowerupType, GameState } from '@/types';
import { EnemyConfig } from '@/game/config';
import { BossConfig } from '@/game/config';
import { EnvironmentElement, EnvironmentType } from '@/game/systems/EnvironmentSystem';

// Mock Canvas APIs
const mockCanvasContext = {
  canvas: {
    width: 800,
    height: 600,
    style: {}
  },
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  fillText: jest.fn(),
  font: '',
  textAlign: '',
  textBaseline: '',
  shadowColor: '',
  shadowBlur: 0,
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  strokeStyle: '',
  lineWidth: 1,
  drawImage: jest.fn(),
  strokeRect: jest.fn(),
  fill: jest.fn(),
  rect: jest.fn()
};

const mockCanvas = {
  getContext: jest.fn().mockReturnValue(mockCanvasContext),
  width: 800,
  height: 600,
  style: {}
};

// Mock SpriteGenerator
jest.mock('@/game/SpriteGenerator', () => {
  return {
    SpriteGenerator: jest.fn().mockImplementation(() => {
      return {
        generatePlayer: jest.fn().mockReturnValue(document.createElement('canvas')),
        generateOption: jest.fn().mockReturnValue(document.createElement('canvas')),
        generateEnemy: jest.fn().mockReturnValue(document.createElement('canvas')),
        generateBullet: jest.fn().mockReturnValue(document.createElement('canvas')),
        generatePowerup: jest.fn().mockReturnValue(document.createElement('canvas')),
        generateBoss: jest.fn().mockReturnValue(document.createElement('canvas'))
      };
    })
  };
});

describe('RenderSystem', () => {
  let renderSystem: RenderSystem;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of RenderSystem before each test
    renderSystem = new RenderSystem(mockCanvas as unknown as HTMLCanvasElement);
  });

  describe('constructor', () => {
    it('should initialize with canvas context and load assets', () => {
      expect(renderSystem.ctx).toBe(mockCanvasContext);
      // Check that assets are loaded
      expect(Object.keys(renderSystem.sprites)).toHaveLength(
        1 + // player
        1 + // option
        Object.keys(EnemyConfig).length + // enemies
        Object.keys(BulletType).length + // bullets
        Object.keys(PowerupType).length + // powerups
        Object.keys(BossConfig).length // bosses
      );
    });
  });

  describe('resize', () => {
    it('should resize the canvas according to device pixel ratio', () => {
      const originalDevicePixelRatio = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2
      });

      renderSystem.resize(400, 300);

      expect(renderSystem.width).toBe(400);
      expect(renderSystem.height).toBe(300);
      expect(mockCanvasContext.canvas.width).toBe(800); // 400 * 2
      expect(mockCanvasContext.canvas.height).toBe(600); // 300 * 2
      expect(mockCanvasContext.canvas.style.width).toBe('400px');
      expect(mockCanvasContext.canvas.style.height).toBe('300px');
      expect(mockCanvasContext.scale).toHaveBeenCalledWith(2, 2);

      // Restore original devicePixelRatio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: originalDevicePixelRatio
      });
    });
  });

  describe('drawEntity', () => {
    it('should draw a player entity with engine flame and weapon level', () => {
      const player: Entity = {
        type: EntityType.PLAYER,
        x: 100,
        y: 100,
        width: 20,
        height: 30,
        vx: 0
      };

      renderSystem.drawEntity(player, 3);

      // Check that the context was translated to the player's position
      expect(mockCanvasContext.save).toHaveBeenCalled();
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(100, 100);
      
      // Check that the engine flame was drawn
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.moveTo).toHaveBeenCalledWith(-5, 25);
      expect(mockCanvasContext.lineTo).toHaveBeenCalledWith(5, 25);
      
      // Check that the weapon level text was drawn
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('LV.3', 0, -50);
      
      expect(mockCanvasContext.restore).toHaveBeenCalled();
    });

    it('should draw a generic entity with its sprite', () => {
      const entity: Entity = {
        type: EntityType.ENEMY,
        x: 150,
        y: 150,
        width: 25,
        height: 25,
        spriteKey: 'enemy_basic'
      };

      // Add a mock sprite to the sprites map
      renderSystem.sprites['enemy_basic'] = document.createElement('canvas');

      renderSystem.drawEntity(entity);

      // Check that the context was translated to the entity's position
      expect(mockCanvasContext.save).toHaveBeenCalled();
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(150, 150);
      
      // Check that the sprite was drawn
      expect(mockCanvasContext.drawImage).toHaveBeenCalled();
      
      expect(mockCanvasContext.restore).toHaveBeenCalled();
    });

    it('should draw a boss entity with health bar', () => {
      const boss: Entity = {
        type: EntityType.BOSS,
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        hp: 80,
        maxHp: 100,
        spriteKey: 'boss_1'
      };

      // Add a mock sprite to the sprites map
      renderSystem.sprites['boss_1'] = document.createElement('canvas');

      renderSystem.drawEntity(boss);

      // Check that the context was translated to the boss's position
      expect(mockCanvasContext.save).toHaveBeenCalled();
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(200, 200);
      
      // Check that the sprite was drawn
      expect(mockCanvasContext.drawImage).toHaveBeenCalled();
      
      // Check that the health bar was drawn
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(-50, 0, 100, 6);
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(-50, 0, 80, 6); // 80% health
      
      expect(mockCanvasContext.restore).toHaveBeenCalled();
    });
  });

  describe('drawEnvironmentElement', () => {
    it('should draw an obstacle environment element', () => {
      const obstacle: EnvironmentElement = {
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        environmentType: EnvironmentType.OBSTACLE,
        color: '#888888',
        hp: 100,
        maxHp: 100
      };

      renderSystem.drawEnvironmentElement(obstacle);

      // Check that the context was translated to the obstacle's position
      expect(mockCanvasContext.save).toHaveBeenCalled();
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(100, 100);
      
      // Check that the obstacle was drawn
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(-25, -25, 50, 50);
      
      expect(mockCanvasContext.restore).toHaveBeenCalled();
    });

    it('should draw an energy storm environment element', () => {
      const storm: EnvironmentElement = {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        environmentType: EnvironmentType.ENERGY_STORM
      };

      renderSystem.drawEnvironmentElement(storm);

      // Check that the context was translated to the storm's position
      expect(mockCanvasContext.save).toHaveBeenCalled();
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(200, 200);
      
      // Check that the storm was drawn
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(-50, -50, 100, 100);
      
      expect(mockCanvasContext.restore).toHaveBeenCalled();
    });

    it('should draw a gravity field environment element', () => {
      const gravityField: EnvironmentElement = {
        x: 300,
        y: 300,
        width: 150,
        height: 150,
        environmentType: EnvironmentType.GRAVITY_FIELD,
        data: { side: 'left' }
      };

      renderSystem.drawEnvironmentElement(gravityField);

      // Check that the context was translated to the gravity field's position
      expect(mockCanvasContext.save).toHaveBeenCalled();
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(300, 300);
      
      // Check that the gravity field was drawn
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(-75, -75, 150, 150);
      
      expect(mockCanvasContext.restore).toHaveBeenCalled();
    });
  });

  describe('draw', () => {
    it('should draw all game elements in menu state', () => {
      const gameState = GameState.MENU;
      const player = {} as Entity;
      const options: Entity[] = [];
      const enemies: Entity[] = [];
      const boss = null;
      const bossWingmen: Entity[] = [];
      const bullets: Entity[] = [];
      const enemyBullets: Entity[] = [];
      const particles: any[] = [];
      const shockwaves: any[] = [];
      const powerups: Entity[] = [];
      const meteors: any[] = [];
      const shield = 0;
      const screenShake = 0;
      const weaponLevel = 1;
      const environmentElements: EnvironmentElement[] = [];
      const showBossDefeatAnimation = false;
      const bossDefeatTimer = 0;

      renderSystem.draw(
        gameState,
        player,
        options,
        enemies,
        boss,
        bossWingmen,
        bullets,
        enemyBullets,
        particles,
        shockwaves,
        powerups,
        meteors,
        shield,
        screenShake,
        weaponLevel,
        environmentElements,
        showBossDefeatAnimation,
        bossDefeatTimer
      );

      // Check that the background was drawn
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(0, 0, renderSystem.width, renderSystem.height);
      
      // In MENU state, no game elements should be drawn except stars
      // We can check that star drawing functions were called
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    });

    it('should draw all game elements in game state', () => {
      const gameState = GameState.RUNNING;
      const player: Entity = { type: EntityType.PLAYER, x: 100, y: 100, width: 20, height: 30, vx: 0 };
      const options: Entity[] = [];
      const enemies: Entity[] = [{ type: EntityType.ENEMY, x: 150, y: 150, width: 25, height: 25 }];
      const boss: Entity = { type: EntityType.BOSS, x: 200, y: 200, width: 100, height: 100, hp: 100, maxHp: 100 };
      const bossWingmen: Entity[] = [];
      const bullets: Entity[] = [{ type: EntityType.BULLET, x: 120, y: 120, width: 5, height: 5 }];
      const enemyBullets: Entity[] = [];
      const particles: any[] = [{ x: 50, y: 50, size: 2, color: '#ffffff', life: 10, maxLife: 20 }];
      const shockwaves: any[] = [{ x: 75, y: 75, radius: 30, width: 5, color: '#ff0000', life: 0.5 }];
      const powerups: Entity[] = [{ type: EntityType.POWERUP, x: 180, y: 180, width: 15, height: 15 }];
      const meteors: any[] = [{ x: 300, y: 300, vx: -2, vy: 1 }];
      const shield = 50;
      const screenShake = 0;
      const weaponLevel = 2;
      const environmentElements: EnvironmentElement[] = [{ 
        x: 250, y: 250, width: 50, height: 50, environmentType: EnvironmentType.OBSTACLE, color: '#888888', hp: 100, maxHp: 100 
      }];
      const showBossDefeatAnimation = false;
      const bossDefeatTimer = 0;

      renderSystem.draw(
        gameState,
        player,
        options,
        enemies,
        boss,
        bossWingmen,
        bullets,
        enemyBullets,
        particles,
        shockwaves,
        powerups,
        meteors,
        shield,
        screenShake,
        weaponLevel,
        environmentElements,
        showBossDefeatAnimation,
        bossDefeatTimer
      );

      // Check that various drawing functions were called
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(0, 0, renderSystem.width, renderSystem.height); // Background
      expect(mockCanvasContext.translate).toHaveBeenCalledWith(100, 100); // Player position
      expect(mockCanvasContext.beginPath).toHaveBeenCalled(); // Particles
      expect(mockCanvasContext.arc).toHaveBeenCalled(); // Particles and shockwaves
      expect(mockCanvasContext.stroke).toHaveBeenCalled(); // Meteor trails and shockwaves
    });
  });
});