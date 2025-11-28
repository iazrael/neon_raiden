import { BossPhaseSystem, BossPhase, DESTROYER_PHASES, TITAN_PHASES, APOCALYPSE_PHASES } from '@/game/systems/BossPhaseSystem';
import { Entity, BossType } from '@/types';
import { AudioSystem } from '@/game/systems/AudioSystem';

// 创建一个简单的AudioSystem mock
class MockAudioSystem {
  playExplosion(size: string) {
    // 空实现
  }
}

describe('BossPhaseSystem', () => {
  let bossPhaseSystem: BossPhaseSystem;
  let mockAudio: MockAudioSystem;

  beforeEach(() => {
    mockAudio = new MockAudioSystem();
    bossPhaseSystem = new BossPhaseSystem(mockAudio as unknown as AudioSystem);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeBoss', () => {
    it('should initialize boss with default state for non-phase bosses', () => {
      const boss = {
        subType: 'NORMAL_BOSS'
      } as Entity;
      
      const state = bossPhaseSystem.initializeBoss(boss, 'NORMAL_BOSS' as BossType);
      
      expect(state.currentPhase).toBe(BossPhase.PHASE_1);
      expect(state.previousPhase).toBe(BossPhase.PHASE_1);
      expect(state.isTransitioning).toBe(false);
    });

    it('should initialize destroyer boss with phase 1 state', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      const state = bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      expect(state.currentPhase).toBe(BossPhase.PHASE_1);
      expect(state.phaseConfig).toEqual(DESTROYER_PHASES[0]);
      expect(state.isTransitioning).toBe(false);
    });

    it('should initialize titan boss with phase 1 state', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.TITAN
      } as Entity;
      
      const state = bossPhaseSystem.initializeBoss(boss, BossType.TITAN);
      
      expect(state.currentPhase).toBe(BossPhase.PHASE_1);
      expect(state.phaseConfig).toEqual(TITAN_PHASES[0]);
      expect(state.isTransitioning).toBe(false);
    });

    it('should initialize apocalypse boss with phase 1 state', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.APOCALYPSE
      } as Entity;
      
      const state = bossPhaseSystem.initializeBoss(boss, BossType.APOCALYPSE);
      
      expect(state.currentPhase).toBe(BossPhase.PHASE_1);
      expect(state.phaseConfig).toEqual(APOCALYPSE_PHASES[0]);
      expect(state.isTransitioning).toBe(false);
    });
  });

  describe('update', () => {
    it('should not update non-initialized boss', () => {
      const boss = {
        subType: BossType.DESTROYER
      } as Entity;
      
      // 更新未初始化的Boss应该不会出错
      bossPhaseSystem.update(boss, 16);
      expect(true).toBe(true);
    });

    it('should not update non-phase boss', () => {
      const boss = {
        subType: 'NORMAL_BOSS'
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, 'NORMAL_BOSS' as BossType);
      
      // 更新非阶段Boss应该不会出错
      bossPhaseSystem.update(boss, 16);
      expect(true).toBe(true);
    });

    it('should start phase transition when hp drops below threshold', () => {
      const boss = {
        x: 400,
        y: 100,
        hp: 39, // 低于40%阈值
        maxHp: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      // 更新Boss，血量降到40%以下应该触发阶段转换
      bossPhaseSystem.update(boss, 16);
      
      const state = bossPhaseSystem.getPhaseState(boss);
      expect(state?.isTransitioning).toBe(true);
      expect(state?.currentPhase).toBe(BossPhase.PHASE_2);
    });

    it('should complete phase transition after 2 seconds', () => {
      const boss = {
        x: 400,
        y: 100,
        hp: 39, // 低于40%阈值
        maxHp: 100,
        subType: BossType.DESTROYER,
        invulnerable: true
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      // 触发阶段转换
      bossPhaseSystem.update(boss, 16);
      
      // 更新2秒以完成转换
      bossPhaseSystem.update(boss, 2000);
      
      const state = bossPhaseSystem.getPhaseState(boss);
      expect(state?.isTransitioning).toBe(false);
      expect(boss.invulnerable).toBe(false);
    });
  });

  describe('getPhaseState', () => {
    it('should return undefined for non-initialized boss', () => {
      const boss = {
        subType: BossType.DESTROYER
      } as Entity;
      
      const state = bossPhaseSystem.getPhaseState(boss);
      expect(state).toBeUndefined();
    });

    it('should return phase state for initialized boss', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      const state = bossPhaseSystem.getPhaseState(boss);
      
      expect(state).toBeDefined();
      expect(state?.currentPhase).toBe(BossPhase.PHASE_1);
    });
  });

  describe('cleanupBoss', () => {
    it('should clean up boss phase state', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      expect(bossPhaseSystem.getPhaseState(boss)).toBeDefined();
      
      bossPhaseSystem.cleanupBoss(boss);
      expect(bossPhaseSystem.getPhaseState(boss)).toBeUndefined();
    });
  });

  describe('shouldTriggerAbility', () => {
    it('should return false for non-initialized boss', () => {
      const boss = {
        subType: BossType.DESTROYER
      } as Entity;
      
      const shouldTrigger = bossPhaseSystem.shouldTriggerAbility(boss, 'wingman_support');
      expect(shouldTrigger).toBe(false);
    });

    it('should return false when transitioning', () => {
      const boss = {
        x: 400,
        y: 100,
        hp: 39, // 低于40%阈值
        maxHp: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      // 触发阶段转换
      bossPhaseSystem.update(boss, 16);
      
      const shouldTrigger = bossPhaseSystem.shouldTriggerAbility(boss, 'wingman_support');
      expect(shouldTrigger).toBe(false);
    });

    it('should return true for available ability', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      const shouldTrigger = bossPhaseSystem.shouldTriggerAbility(boss, 'wingman_support');
      expect(shouldTrigger).toBe(true);
    });

    it('should return false for unavailable ability', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      const shouldTrigger = bossPhaseSystem.shouldTriggerAbility(boss, 'unknown_ability');
      expect(shouldTrigger).toBe(false);
    });
  });

  describe('getPhaseMultipliers', () => {
    it('should return default multipliers for non-initialized boss', () => {
      const boss = {
        subType: BossType.DESTROYER
      } as Entity;
      
      const multipliers = bossPhaseSystem.getPhaseMultipliers(boss);
      expect(multipliers).toEqual({
        moveSpeed: 1.0,
        fireRate: 1.0,
        bulletCount: 1.0,
        damageMultiplier: 1.0
      });
    });

    it('should return correct multipliers for phase 1', () => {
      const boss = {
        x: 400,
        y: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      const multipliers = bossPhaseSystem.getPhaseMultipliers(boss);
      expect(multipliers.moveSpeed).toBe(1.0);
      expect(multipliers.fireRate).toBe(1.0);
      expect(multipliers.bulletCount).toBe(1.0);
      expect(multipliers.damageMultiplier).toBe(1.0);
    });

    it('should return correct multipliers for phase 2', () => {
      const boss = {
        x: 400,
        y: 100,
        hp: 39, // 低于40%阈值
        maxHp: 100,
        subType: BossType.DESTROYER
      } as Entity;
      
      bossPhaseSystem.initializeBoss(boss, BossType.DESTROYER);
      
      // 触发阶段转换到阶段2
      bossPhaseSystem.update(boss, 16);
      bossPhaseSystem.update(boss, 2000); // 完成转换
      
      const multipliers = bossPhaseSystem.getPhaseMultipliers(boss);
      expect(multipliers.moveSpeed).toBe(1.5);
      expect(multipliers.fireRate).toBe(1.2);
      expect(multipliers.bulletCount).toBe(1.3);
      expect(multipliers.damageMultiplier).toBe(1.2);
    });
  });

  describe('determinePhase', () => {
    it('should determine correct phase based on hp percentage', () => {
      // 测试Destroyer的阶段判定
      const phases = DESTROYER_PHASES;
      
      // 调用私有方法
      const determineMethod = (bossPhaseSystem as any).determinePhase;
      
      // 100% HP应该在阶段1
      let phase = determineMethod.call(bossPhaseSystem, 1.0, phases);
      expect(phase).toBe(BossPhase.PHASE_1);
      
      // 80% HP应该在阶段1 (高于70%阈值)
      phase = determineMethod.call(bossPhaseSystem, 0.8, phases);
      expect(phase).toBe(BossPhase.PHASE_1);
      
      // 39% HP应该在阶段2 (低于40%阈值)
      phase = determineMethod.call(bossPhaseSystem, 0.39, phases);
      expect(phase).toBe(BossPhase.PHASE_2);
      
      // 0% HP应该在阶段3 (等于0%阈值)
      phase = determineMethod.call(bossPhaseSystem, 0.0, phases);
      expect(phase).toBe(BossPhase.PHASE_3);
    });
  });

  describe('phase configurations', () => {
    it('should have correct phase configurations for DESTROYER', () => {
      expect(DESTROYER_PHASES).toHaveLength(3);
      expect(DESTROYER_PHASES[0].phase).toBe(BossPhase.PHASE_1);
      expect(DESTROYER_PHASES[1].phase).toBe(BossPhase.PHASE_2);
      expect(DESTROYER_PHASES[2].phase).toBe(BossPhase.PHASE_3);
      
      // 检查血量阈值递减
      expect(DESTROYER_PHASES[0].hpThreshold).toBeGreaterThan(DESTROYER_PHASES[1].hpThreshold);
      expect(DESTROYER_PHASES[1].hpThreshold).toBeGreaterThan(DESTROYER_PHASES[2].hpThreshold);
    });

    it('should have correct phase configurations for TITAN', () => {
      expect(TITAN_PHASES).toHaveLength(3);
      expect(TITAN_PHASES[0].phase).toBe(BossPhase.PHASE_1);
      expect(TITAN_PHASES[1].phase).toBe(BossPhase.PHASE_2);
      expect(TITAN_PHASES[2].phase).toBe(BossPhase.PHASE_3);
      
      // 检查血量阈值递减
      expect(TITAN_PHASES[0].hpThreshold).toBeGreaterThan(TITAN_PHASES[1].hpThreshold);
      expect(TITAN_PHASES[1].hpThreshold).toBeGreaterThan(TITAN_PHASES[2].hpThreshold);
    });

    it('should have correct phase configurations for APOCALYPSE', () => {
      expect(APOCALYPSE_PHASES).toHaveLength(4);
      expect(APOCALYPSE_PHASES[0].phase).toBe(BossPhase.PHASE_1);
      expect(APOCALYPSE_PHASES[1].phase).toBe(BossPhase.PHASE_2);
      expect(APOCALYPSE_PHASES[2].phase).toBe(BossPhase.PHASE_3);
      expect(APOCALYPSE_PHASES[3].phase).toBe(BossPhase.PHASE_4);
      
      // 检查血量阈值递减
      expect(APOCALYPSE_PHASES[0].hpThreshold).toBeGreaterThan(APOCALYPSE_PHASES[1].hpThreshold);
      expect(APOCALYPSE_PHASES[1].hpThreshold).toBeGreaterThan(APOCALYPSE_PHASES[2].hpThreshold);
      expect(APOCALYPSE_PHASES[2].hpThreshold).toBeGreaterThan(APOCALYPSE_PHASES[3].hpThreshold);
    });
  });
});