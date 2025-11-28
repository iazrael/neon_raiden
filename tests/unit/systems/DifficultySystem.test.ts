import { DifficultySystem, DifficultyMode, DIFFICULTY_CONFIGS, STANDARD_LEVEL_DURATION } from '../../../game/systems/DifficultySystem';

describe('DifficultySystem', () => {
  let difficultySystem: DifficultySystem;
  
  beforeEach(() => {
    difficultySystem = new DifficultySystem();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const mode = difficultySystem.getMode();
      const config = difficultySystem.getConfig();
      
      expect(mode).toBe(DifficultyMode.NORMAL);
      expect(config).toEqual(DIFFICULTY_CONFIGS[DifficultyMode.NORMAL]);
    });
  });
  
  describe('reset', () => {
    it('should reset to normal difficulty mode', () => {
      // 先切换到其他模式
      // 模拟系统内部状态变化
      (difficultySystem as any).currentMode = DifficultyMode.EASY;
      (difficultySystem as any).currentConfig = DIFFICULTY_CONFIGS[DifficultyMode.EASY];
      
      // 重置
      difficultySystem.reset();
      
      const mode = difficultySystem.getMode();
      const config = difficultySystem.getConfig();
      
      expect(mode).toBe(DifficultyMode.NORMAL);
      expect(config).toEqual(DIFFICULTY_CONFIGS[DifficultyMode.NORMAL]);
    });
  });
  
  describe('evaluatePlayerPerformance', () => {
    it('should correctly evaluate player performance', () => {
      // 创建玩家实体
      const player = {
        hp: 80,
        maxHp: 100
      } as any;
      
      // 创建武器数组
      const weapons = [
        { level: 5 },
        { level: 3 }
      ];
      
      // 设置系统开始时间
      (difficultySystem as any).levelStartTime = Date.now() - 30000; // 30秒前开始
      
      // 调用私有方法进行评估
      const evaluateMethod = (difficultySystem as any).evaluatePlayerPerformance;
      const performance = evaluateMethod.call(difficultySystem, player, weapons, 20, 1);
      
      // 验证评估结果
      expect(performance.hpPercent).toBe(0.8); // 80/100
      expect(performance.avgWeaponLevel).toBeCloseTo(4/9); // (5+3)/2/9
      expect(performance.comboLevel).toBe(0.4); // min(20/50, 1.0)
      expect(performance.timeRatio).toBeCloseTo(30 / STANDARD_LEVEL_DURATION[1]); // 30秒/标准时间
      expect(performance.score).toBeGreaterThan(0);
      expect(performance.score).toBeLessThanOrEqual(1);
    });
    
    it('should handle edge cases in performance evaluation', () => {
      // 创建满生命值玩家
      const player = {
        hp: 100,
        maxHp: 100
      } as any;
      
      // 创建空武器数组
      const weapons: any[] = [];
      
      // 设置系统开始时间
      (difficultySystem as any).levelStartTime = Date.now() - 1000; // 1秒前开始
      
      // 调用私有方法进行评估
      const evaluateMethod = (difficultySystem as any).evaluatePlayerPerformance;
      const performance = evaluateMethod.call(difficultySystem, player, weapons, 0, 1);
      
      // 验证评估结果
      expect(performance.hpPercent).toBe(1.0); // 满生命值
      expect(performance.avgWeaponLevel).toBe(0); // 无武器
      expect(performance.comboLevel).toBe(0); // 无连击
    });
  });
  
  describe('adjustDifficulty', () => {
    it('should adjust to easy mode for high performance score', () => {
      const performance = { score: 0.8 }; // 高分
      
      // 调用私有方法进行难度调整
      const adjustMethod = (difficultySystem as any).adjustDifficulty;
      adjustMethod.call(difficultySystem, performance);
      
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.EASY);
    });
    
    it('should adjust to normal mode for medium performance score', () => {
      const performance = { score: 0.5 }; // 中等分数
      
      // 调用私有方法进行难度调整
      const adjustMethod = (difficultySystem as any).adjustDifficulty;
      adjustMethod.call(difficultySystem, performance);
      
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.NORMAL);
    });
    
    it('should adjust to hard mode for low performance score', () => {
      const performance = { score: 0.2 }; // 低分
      
      // 调用私有方法进行难度调整
      const adjustMethod = (difficultySystem as any).adjustDifficulty;
      adjustMethod.call(difficultySystem, performance);
      
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.HARD);
    });
  });
  
  describe('update', () => {
    it('should not update when disabled', () => {
      difficultySystem.setEnabled(false);
      
      // 创建玩家实体
      const player = { hp: 100, maxHp: 100 } as any;
      const weapons: any[] = [];
      
      // 更新系统
      difficultySystem.update(20000, player, weapons, 10, 1);
      
      // 模式应该保持为NORMAL
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.NORMAL);
    });
    
    it('should not evaluate before interval', () => {
      // 创建玩家实体
      const player = { hp: 100, maxHp: 100 } as any;
      const weapons: any[] = [];
      
      // 更新系统但时间间隔不够
      difficultySystem.update(10000, player, weapons, 10, 1);
      
      // 模式应该保持为NORMAL
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.NORMAL);
    });
    
    it('should evaluate after interval', () => {
      // Mock console.log to avoid output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // 创建玩家实体（表现较差）
      const player = { hp: 30, maxHp: 100 } as any;
      const weapons: any[] = [{ level: 1 }];
      
      // 设置系统开始时间
      (difficultySystem as any).levelStartTime = Date.now() - 20000; // 20秒前开始
      
      // 更新系统，超过评估间隔
      difficultySystem.update(16000, player, weapons, 5, 1);
      
      // 应该切换到HARD模式
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.HARD);
      
      // 恢复console.log
      consoleSpy.mockRestore();
    });
  });
  
  describe('getters', () => {
    it('should return correct difficulty configuration', () => {
      const config = difficultySystem.getConfig();
      expect(config).toEqual(DIFFICULTY_CONFIGS[DifficultyMode.NORMAL]);
    });
    
    it('should return correct mode', () => {
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.NORMAL);
    });
    
    it('should return correct spawn interval multiplier', () => {
      const multiplier = difficultySystem.getSpawnIntervalMultiplier();
      expect(multiplier).toBe(DIFFICULTY_CONFIGS[DifficultyMode.NORMAL].spawnIntervalMultiplier);
    });
    
    it('should return correct elite chance modifier', () => {
      const modifier = difficultySystem.getEliteChanceModifier();
      expect(modifier).toBe(DIFFICULTY_CONFIGS[DifficultyMode.NORMAL].eliteChanceModifier);
    });
    
    it('should return correct powerup drop multiplier', () => {
      const multiplier = difficultySystem.getPowerupDropMultiplier();
      expect(multiplier).toBe(DIFFICULTY_CONFIGS[DifficultyMode.NORMAL].powerupDropMultiplier);
    });
    
    it('should return correct score multiplier', () => {
      const multiplier = difficultySystem.getScoreMultiplier();
      expect(multiplier).toBe(DIFFICULTY_CONFIGS[DifficultyMode.NORMAL].scoreMultiplier);
    });
  });
  
  describe('setEnabled', () => {
    it('should enable dynamic difficulty', () => {
      difficultySystem.setEnabled(true);
      // 没有直接的方法验证是否启用，但我们可以通过其他方法间接验证
      expect((difficultySystem as any).isEnabled).toBe(true);
    });
    
    it('should disable dynamic difficulty and reset to normal mode', () => {
      // 先切换到其他模式
      (difficultySystem as any).currentMode = DifficultyMode.EASY;
      (difficultySystem as any).currentConfig = DIFFICULTY_CONFIGS[DifficultyMode.EASY];
      
      // 禁用动态难度
      difficultySystem.setEnabled(false);
      
      // 应该重置为NORMAL模式
      const mode = difficultySystem.getMode();
      expect(mode).toBe(DifficultyMode.NORMAL);
      expect((difficultySystem as any).isEnabled).toBe(false);
    });
  });
  
  describe('getDebugInfo', () => {
    it('should return mode info when no performance data', () => {
      const debugInfo = difficultySystem.getDebugInfo();
      expect(debugInfo).toContain('Mode: normal');
    });
    
    it('should return detailed debug info with performance data', () => {
      const performance = {
        score: 0.75,
        hpPercent: 0.8,
        avgWeaponLevel: 0.5,
        comboLevel: 0.6,
        timeRatio: 1.2
      };
      
      const debugInfo = difficultySystem.getDebugInfo(performance as any);
      expect(debugInfo).toContain('Mode: normal');
      expect(debugInfo).toContain('Score: 0.75');
      expect(debugInfo).toContain('HP: 80%');
    });
  });
});