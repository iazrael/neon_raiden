import { ComboSystem, COMBO_CONFIG } from '../../../game/systems/ComboSystem';

describe('ComboSystem', () => {
  let comboSystem: ComboSystem;
  let mockOnComboChange: jest.Mock;

  beforeEach(() => {
    mockOnComboChange = jest.fn();
    comboSystem = new ComboSystem(COMBO_CONFIG, mockOnComboChange);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const state = comboSystem.getState();
      expect(state).toEqual({
        count: 0,
        timer: 0,
        level: 0,
        maxCombo: 0,
        hasBerserk: false
      });
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // 先添加一些连击
      comboSystem.addKill();
      comboSystem.addKill();
      
      // 重置
      comboSystem.reset();
      
      const state = comboSystem.getState();
      expect(state).toEqual({
        count: 0,
        timer: 0,
        level: 0,
        maxCombo: 0,
        hasBerserk: false
      });
      
      // 检查回调是否被调用
      expect(mockOnComboChange).toHaveBeenCalledWith(state);
    });
  });

  describe('addKill', () => {
    it('should increase combo count and reset timer', () => {
      comboSystem.addKill();
      
      const state = comboSystem.getState();
      expect(state.count).toBe(1);
      expect(state.timer).toBe(0);
      expect(mockOnComboChange).toHaveBeenCalled();
    });

    it('should update maxCombo when new record is set', () => {
      comboSystem.addKill();
      comboSystem.addKill();
      
      const state = comboSystem.getState();
      expect(state.maxCombo).toBe(2);
    });

    it('should not update maxCombo when current combo is less than max', () => {
      // 创建一个更高的连击记录
      for (let i = 0; i < 5; i++) {
        comboSystem.addKill();
      }
      
      // 清除连击
      comboSystem.clearCombo();
      
      // 再添加较少的连击
      comboSystem.addKill();
      
      const state = comboSystem.getState();
      expect(state.maxCombo).toBe(5);
    });

    it('should level up when reaching tier thresholds', () => {
      // 添加10次击杀达到第一阶梯
      for (let i = 0; i < 10; i++) {
        comboSystem.addKill();
      }
      
      const state = comboSystem.getState();
      expect(state.level).toBe(1); // 连击等级应该为1
      expect(state.count).toBe(10);
    });

    it('should trigger berserk mode when reaching 100 kills', () => {
      // 添加100次击杀
      for (let i = 0; i < 100; i++) {
        comboSystem.addKill();
      }
      
      const state = comboSystem.getState();
      expect(state.count).toBe(100);
      expect(state.hasBerserk).toBe(true);
    });

    it('should return true when leveling up', () => {
      // 添加9次击杀
      for (let i = 0; i < 9; i++) {
        comboSystem.addKill();
      }
      
      // 第10次击杀应该升级
      const leveledUp = comboSystem.addKill();
      expect(leveledUp).toBe(true);
    });

    it('should return false when not leveling up', () => {
      // 添加10次击杀达到第一阶梯
      for (let i = 0; i < 10; i++) {
        comboSystem.addKill();
      }
      
      // 再添加一次击杀，不应该升级
      const leveledUp = comboSystem.addKill();
      expect(leveledUp).toBe(false);
    });
  });

  describe('clearCombo', () => {
    it('should clear current combo', () => {
      // 添加一些连击
      comboSystem.addKill();
      comboSystem.addKill();
      
      // 清除连击
      comboSystem.clearCombo();
      
      const state = comboSystem.getState();
      expect(state.count).toBe(0);
      expect(state.timer).toBe(0);
      expect(state.level).toBe(0);
    });
  });

  describe('update', () => {
    it('should not update timer when no combo', () => {
      comboSystem.update(1000);
      
      const state = comboSystem.getState();
      expect(state.timer).toBe(0);
    });

    it('should update timer when combo exists', () => {
      comboSystem.addKill();
      comboSystem.update(500);
      
      const state = comboSystem.getState();
      expect(state.timer).toBe(500);
    });

    it('should clear combo when timer exceeds reset time', () => {
      comboSystem.addKill();
      comboSystem.update(6000); // 超过5000ms的重置时间
      
      const state = comboSystem.getState();
      expect(state.count).toBe(0);
      expect(state.timer).toBe(0);
      expect(state.level).toBe(0);
    });
  });

  describe('getCurrentTier', () => {
    it('should return correct tier for different combo levels', () => {
      // 初始状态应该是无连击
      let tier = comboSystem.getCurrentTier();
      expect(tier.threshold).toBe(0);
      expect(tier.name).toBe('无连击');
      
      // 添加10次击杀达到第一阶梯
      for (let i = 0; i < 10; i++) {
        comboSystem.addKill();
      }
      
      tier = comboSystem.getCurrentTier();
      expect(tier.threshold).toBe(10);
      expect(tier.name).toBe('连击');
    });
  });

  describe('getDamageMultiplier', () => {
    it('should return correct damage multiplier for different tiers', () => {
      // 初始状态
      expect(comboSystem.getDamageMultiplier()).toBe(1.0);
      
      // 添加10次击杀达到第一阶梯
      for (let i = 0; i < 10; i++) {
        comboSystem.addKill();
      }
      
      expect(comboSystem.getDamageMultiplier()).toBe(1.2);
    });
  });

  describe('getScoreMultiplier', () => {
    it('should return correct score multiplier for different tiers', () => {
      // 初始状态
      expect(comboSystem.getScoreMultiplier()).toBe(1.0);
      
      // 添加10次击杀达到第一阶梯
      for (let i = 0; i < 10; i++) {
        comboSystem.addKill();
      }
      
      expect(comboSystem.getScoreMultiplier()).toBe(1.5);
    });
  });

  describe('getProgressToNextTier', () => {
    it('should return null when at max tier', () => {
      // 添加100次击杀达到最高阶梯
      for (let i = 0; i < 100; i++) {
        comboSystem.addKill();
      }
      
      const progress = comboSystem.getProgressToNextTier();
      expect(progress).toBeNull();
    });

    it('should return correct progress when not at max tier', () => {
      // 添加5次击杀，距离10次的第一阶梯还有5次
      for (let i = 0; i < 5; i++) {
        comboSystem.addKill();
      }
      
      const progress = comboSystem.getProgressToNextTier();
      expect(progress).toBe(0.5); // 5/10 = 0.5
    });
  });

  describe('getNextTier', () => {
    it('should return null when at max tier', () => {
      // 添加100次击杀达到最高阶梯
      for (let i = 0; i < 100; i++) {
        comboSystem.addKill();
      }
      
      const nextTier = comboSystem.getNextTier();
      expect(nextTier).toBeNull();
    });

    it('should return correct next tier when not at max tier', () => {
      // 初始状态，下一个阶梯应该是10连击
      const nextTier = comboSystem.getNextTier();
      expect(nextTier).not.toBeNull();
      expect(nextTier?.threshold).toBe(10);
      expect(nextTier?.name).toBe('连击');
    });
  });
});