import { WeaponSynergySystem, SynergyType, SYNERGY_CONFIGS } from '@/game/systems/WeaponSynergySystem';
import { WeaponType, Entity } from '@/types';

describe('WeaponSynergySystem', () => {
  let weaponSynergySystem: WeaponSynergySystem;

  beforeEach(() => {
    weaponSynergySystem = new WeaponSynergySystem();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and reset', () => {
    it('should initialize with empty sets', () => {
      // 构造函数已经被调用，系统应该正常工作
      expect(weaponSynergySystem).toBeDefined();
    });

    it('should reset to initial state', () => {
      // 添加一些武器和组合技
      (weaponSynergySystem as any).equippedWeapons.add(WeaponType.LASER);
      (weaponSynergySystem as any).equippedWeapons.add(WeaponType.TESLA);
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.LASER_TESLA);
      
      // 重置
      weaponSynergySystem.reset();
      
      // 所有元素应该被清除
      expect((weaponSynergySystem as any).equippedWeapons.size).toBe(0);
      expect((weaponSynergySystem as any).activeSynergies.size).toBe(0);
    });
  });

  describe('updateEquippedWeapons', () => {
    it('should update equipped weapons and activate synergies', () => {
      const weapons = [WeaponType.LASER, WeaponType.TESLA];
      weaponSynergySystem.updateEquippedWeapons(weapons);
      
      // 应该激活LASER+TESLA组合技
      const isActive = weaponSynergySystem.isSynergyActive(SynergyType.LASER_TESLA);
      expect(isActive).toBe(true);
    });

    it('should not activate synergy when required weapons are missing', () => {
      const weapons = [WeaponType.LASER]; // 缺少TESLA
      weaponSynergySystem.updateEquippedWeapons(weapons);
      
      // 不应该激活LASER+TESLA组合技
      const isActive = weaponSynergySystem.isSynergyActive(SynergyType.LASER_TESLA);
      expect(isActive).toBe(false);
    });
  });

  describe('canCombine', () => {
    it('should return true for combinable weapons', () => {
      const canCombine = weaponSynergySystem.canCombine(WeaponType.LASER, WeaponType.TESLA);
      expect(canCombine).toBe(true);
    });

    it('should return false for non-combinable weapons', () => {
      const canCombine = weaponSynergySystem.canCombine(WeaponType.LASER, WeaponType.MISSILE);
      expect(canCombine).toBe(false);
    });

    it('should return false for invalid weapons', () => {
      const canCombine1 = weaponSynergySystem.canCombine(undefined as any, WeaponType.LASER);
      const canCombine2 = weaponSynergySystem.canCombine(WeaponType.LASER, undefined as any);
      expect(canCombine1).toBe(false);
      expect(canCombine2).toBe(false);
    });
  });

  describe('isSynergyActive', () => {
    it('should return true for active synergy', () => {
      // 手动激活一个组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.LASER_TESLA);
      
      const isActive = weaponSynergySystem.isSynergyActive(SynergyType.LASER_TESLA);
      expect(isActive).toBe(true);
    });

    it('should return false for inactive synergy', () => {
      const isActive = weaponSynergySystem.isSynergyActive(SynergyType.LASER_TESLA);
      expect(isActive).toBe(false);
    });
  });

  describe('getActiveSynergies', () => {
    it('should return active synergies', () => {
      // 手动激活几个组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.LASER_TESLA);
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.WAVE_PLASMA);
      
      const activeSynergies = weaponSynergySystem.getActiveSynergies();
      expect(activeSynergies).toHaveLength(2);
      expect(activeSynergies[0].type).toBe(SynergyType.LASER_TESLA);
      expect(activeSynergies[1].type).toBe(SynergyType.WAVE_PLASMA);
    });

    it('should return empty array when no synergies are active', () => {
      const activeSynergies = weaponSynergySystem.getActiveSynergies();
      expect(activeSynergies).toEqual([]);
    });
  });

  describe('tryTriggerSynergies', () => {
    it('should return empty array for invalid context', () => {
      const context = {
        weaponType: undefined,
        bulletX: 0,
        bulletY: 0,
        targetEnemy: {} as Entity,
        enemies: [],
        player: {} as Entity
      };
      
      const results = weaponSynergySystem.tryTriggerSynergies(context);
      expect(results).toEqual([]);
    });

    it('should trigger LASER_TESLA synergy', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.LASER_TESLA);
      
      // Mock Math.random to always trigger the synergy
      jest.spyOn(global.Math, 'random').mockReturnValue(0.1); // 小于触发概率0.15
      
      const context = {
        weaponType: WeaponType.LASER,
        bulletX: 100,
        bulletY: 100,
        targetEnemy: {} as Entity,
        enemies: [],
        player: {} as Entity
      };
      
      const results = weaponSynergySystem.tryTriggerSynergies(context);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(SynergyType.LASER_TESLA);
      expect(results[0].effect).toBe('chain_lightning');
      
      // 恢复Math.random
      jest.spyOn(global.Math, 'random').mockRestore();
    });

    it('should not trigger LASER_TESLA synergy when probability fails', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.LASER_TESLA);
      
      // Mock Math.random to never trigger the synergy
      jest.spyOn(global.Math, 'random').mockReturnValue(0.2); // 大于触发概率0.15
      
      const context = {
        weaponType: WeaponType.LASER,
        bulletX: 100,
        bulletY: 100,
        targetEnemy: {} as Entity,
        enemies: [],
        player: {} as Entity
      };
      
      const results = weaponSynergySystem.tryTriggerSynergies(context);
      expect(results).toHaveLength(0);
      
      // 恢复Math.random
      jest.spyOn(global.Math, 'random').mockRestore();
    });

    it('should trigger WAVE_PLASMA synergy when bullet is inside explosion zone', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.WAVE_PLASMA);
      
      const context = {
        weaponType: WeaponType.WAVE,
        bulletX: 100,
        bulletY: 100,
        targetEnemy: {} as Entity,
        enemies: [],
        player: {} as Entity,
        plasmaExplosions: [{ x: 100, y: 100, range: 200 }]
      };
      
      const results = weaponSynergySystem.tryTriggerSynergies(context);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(SynergyType.WAVE_PLASMA);
      expect(results[0].effect).toBe('damage_boost');
      expect(results[0].multiplier).toBe(1.5);
    });

    it('should trigger MISSILE_VULCAN synergy', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.MISSILE_VULCAN);
      
      const targetEnemy = { state: 1 } as Entity; // 标记为被Vulcan击中
      
      const context = {
        weaponType: WeaponType.MISSILE,
        bulletX: 100,
        bulletY: 100,
        targetEnemy,
        enemies: [],
        player: {} as Entity
      };
      
      const results = weaponSynergySystem.tryTriggerSynergies(context);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(SynergyType.MISSILE_VULCAN);
      expect(results[0].effect).toBe('damage_boost');
      expect(results[0].multiplier).toBe(1.3);
    });

    it('should trigger MAGMA_SHURIKEN synergy', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.MAGMA_SHURIKEN);
      
      const targetEnemy = { state: 1 } as Entity; // 标记为反弹
      
      const context = {
        weaponType: WeaponType.SHURIKEN,
        bulletX: 100,
        bulletY: 100,
        targetEnemy,
        enemies: [],
        player: {} as Entity
      };
      
      const results = weaponSynergySystem.tryTriggerSynergies(context);
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(SynergyType.MAGMA_SHURIKEN);
      expect(results[0].effect).toBe('burn');
      expect(results[0].value).toBe(5);
    });
  });

  describe('triggerPlasmaStorm', () => {
    it('should not trigger plasma storm when synergy is not active', () => {
      const targets = weaponSynergySystem.triggerPlasmaStorm(400, 300, 100, []);
      expect(targets).toEqual([]);
    });

    it('should trigger plasma storm and return up to 3 enemies in range', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.TESLA_PLASMA);
      
      const enemies: Entity[] = [
        { x: 450, y: 350, markedForDeletion: false } as Entity,
        { x: 350, y: 250, markedForDeletion: false } as Entity,
        { x: 500, y: 300, markedForDeletion: false } as Entity
      ];
      
      const targets = weaponSynergySystem.triggerPlasmaStorm(400, 300, 150, enemies);
      
      // 应该返回最多3个目标敌人
      expect(targets.length).toBeGreaterThanOrEqual(1);
      expect(targets.length).toBeLessThanOrEqual(3);
      
      // 返回的目标应为输入敌人子集且在范围内
      targets.forEach(t => {
        expect(enemies.includes(t)).toBe(true);
        const dist = Math.hypot(t.x - 400, t.y - 300);
        expect(dist).toBeLessThan(150);
      });
    });

    it('should not include enemies outside explosion range', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.TESLA_PLASMA);
      
      const enemies: Entity[] = [
        { x: 600, y: 500, markedForDeletion: false } as Entity // 在爆炸范围外
      ];
      
      const targets = weaponSynergySystem.triggerPlasmaStorm(400, 300, 100, enemies);
      
      // 应该不返回目标
      expect(targets).toEqual([]);
    });

    it('should not include marked for deletion enemies', () => {
      // 激活组合技
      (weaponSynergySystem as any).activeSynergies.add(SynergyType.TESLA_PLASMA);
      
      const enemies: Entity[] = [
        { x: 450, y: 350, markedForDeletion: true } as Entity // 标记为删除
      ];
      
      const targets = weaponSynergySystem.triggerPlasmaStorm(400, 300, 150, enemies);
      
      // 应该不返回目标
      expect(targets).toEqual([]);
    });
  });
});
