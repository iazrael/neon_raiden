import { Starfighter } from '@/game/entities/Starfighter';
import { EventBus } from '@/game/engine/EventBus';
import { EventPayloads, CombatEventTypeBus } from '@/game/engine/events';
import { FighterEntity, WeaponType } from '@/types';

// Mock EventBus
const mockPublish = jest.fn();
const mockEventBus = {
    publish: mockPublish,
    subscribe: jest.fn()
} as unknown as EventBus<EventPayloads>;

const mockConfig: FighterEntity = {
    id: 'test_fighter',
    name: 'Test Fighter',
    speed: 300,
    initialHp: 100,
    maxHp: 100,
    color: '#fff',
    sprite: 'test_sprite',
    initialLevel: 1,
    size: { width: 32, height: 32 },
    maxShield: 50,
    leveling: {
        baseScoreForLevel1: 1000,
        scoreGrowthFactor: 1.5,
        maxLevel: 5,
        bonusesPerLevel: {
            maxHpFlat: 10,
            maxShieldFlat: 5,
            defensePct: 5,
            fireRatePct: 5,
            damagePct: 5,
            defensePctMax: 50,
            fireRatePctMax: 50,
            damagePctMax: 50
        }
    }
};

describe('Starfighter', () => {
    let fighter: Starfighter;

    beforeEach(() => {
        jest.clearAllMocks();
        fighter = new Starfighter(mockConfig, 100, 100, mockEventBus);
    });

    it('should initialize correctly', () => {
        expect(fighter.x).toBe(100);
        expect(fighter.y).toBe(100);
        expect(fighter.hp).toBe(100);
        expect(fighter.maxHp).toBe(100);
        expect(fighter.level).toBe(1);
    });

    it('should update movement', () => {
        const input = { kb: { x: 1, y: 0 }, touch: { active: false } };
        const dt = 16;
        const bounds = { width: 800, height: 600 };

        fighter.update(input, dt, bounds, 1.0);

        expect(fighter.x).toBeGreaterThan(100);
        expect(fighter.vx).toBeGreaterThan(0);
    });

    it('should handle damage and shield', () => {
        fighter.shield = 10;
        fighter.takeDamage(5);

        expect(fighter.shield).toBe(5);
        expect(fighter.hp).toBe(100);
        expect(mockPublish).toHaveBeenCalledWith(CombatEventTypeBus.PlayerDamaged, { amount: 5 });
        expect(mockPublish).toHaveBeenCalledWith(CombatEventTypeBus.ShieldChanged, expect.any(Object));
    });

    it('should handle damage overflowing shield', () => {
        fighter.shield = 5;
        fighter.takeDamage(10);

        expect(fighter.shield).toBe(0);
        expect(fighter.hp).toBe(95);
    });

    it('should trigger bomb', () => {
        fighter.bombs = 1;
        const result = fighter.triggerBomb();

        expect(result).toBe(true);
        expect(fighter.bombs).toBe(0);
    });

    it('should not trigger bomb if empty', () => {
        fighter.bombs = 0;
        const result = fighter.triggerBomb();

        expect(result).toBe(false);
    });

    it('should apply level up', () => {
        fighter.applyLevelUp(1000);

        expect(fighter.level).toBe(2);
        expect(fighter.maxHp).toBe(110); // 100 + 10
        expect(fighter.hp).toBe(110);
        expect(fighter.defenseBonusPct).toBe(0.05);
    });
});
