import { GameEngine } from '@/game/GameEngine';
import { GameConfig } from '@/game/config/game';
import { EnemyType, EntityType, BossType } from '@/types';
import { createPlayer, createEnemy } from '../mocks/entityFactory';
import { PowerupEffects } from '@/game/config';

// Mock dependencies
jest.mock('@/game/systems/AudioSystem');
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

// Mock canvas
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
} as unknown as CanvasRenderingContext2D;

const mockCanvas = {
    width: 800,
    height: 600,
    getContext: () => mockCanvasContext,
} as unknown as HTMLCanvasElement;

describe('Bomb Logic', () => {
    let gameEngine: GameEngine;

    beforeEach(() => {
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
        // Mock DifficultySystem
        (gameEngine.difficultySys.getConfig as jest.Mock).mockReturnValue({
            spawnIntervalMultiplier: 1,
            enemyHpMultiplier: 1,
            enemySpeedMultiplier: 1,
            scoreMultiplier: 1,
            powerupDropMultiplier: 1,
        });

        // Give player bombs
        gameEngine.bombs = 1;
    });

    it('should trigger killEnemy when bomb kills an enemy', () => {
        // Arrange
        const enemy = createEnemy(EnemyType.NORMAL);
        enemy.hp = 10; // Low HP, should die to bomb
        enemy.x = 100;
        enemy.y = 100;
        gameEngine.enemies.push(enemy);

        // Spy on killEnemy
        const killEnemySpy = jest.spyOn(gameEngine, 'killEnemy');

        // Act
        gameEngine.triggerBomb();

        // Assert
        expect(enemy.hp).toBeLessThanOrEqual(0);
        expect(killEnemySpy).toHaveBeenCalledWith(enemy);
    });

    it('should not trigger killEnemy if bomb damage is insufficient', () => {
        // Arrange
        const enemy = createEnemy(EnemyType.TANK);
        enemy.hp = PowerupEffects.bombDamage + 100; // HP higher than bomb damage
        enemy.x = 100;
        enemy.y = 100;
        gameEngine.enemies.push(enemy);

        // Spy on killEnemy
        const killEnemySpy = jest.spyOn(gameEngine, 'killEnemy');

        // Act
        gameEngine.triggerBomb();

        // Assert
        expect(enemy.hp).toBeGreaterThan(0);
        expect(killEnemySpy).not.toHaveBeenCalled();
    });

    it('should deal percentage based damage to boss', () => {
        // Arrange
        const boss = {
            x: 400,
            y: 100,
            width: 100,
            height: 100,
            vx: 0,
            vy: 0,
            hp: 10000,
            maxHp: 10000,
            type: EntityType.BOSS,
            subType: PowerupEffects.bombDamage,
            color: '#fff',
            markedForDeletion: false,
            spriteKey: 'boss_doomsday',
            invulnerable: false
        };
        gameEngine.boss = boss as any;
        gameEngine.bossWingmen = []; // No wingmen so boss is vulnerable

        const expectedDamage = boss.maxHp * PowerupEffects.bombDamageToBossPct;
        const expectedHp = boss.hp - expectedDamage;

        // Act
        gameEngine.triggerBomb();

        // Assert
        expect(gameEngine.boss?.hp).toBe(expectedHp);
    });
});
