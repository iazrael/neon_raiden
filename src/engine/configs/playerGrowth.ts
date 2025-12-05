//
// 玩家成长数据配置文件
// 定义玩家随着等级提升而获得的属性增长
//

/**
 * 玩家成长配置
 * 定义了玩家升级时的各项属性增长数据
 */
export const PLAYER_GROWTH = {
  /** 玩家最大等级 */
  maxLevel: 20,
  
  /** 基础分数要求 */
  baseScore: 20000,
  
  /** 分数增长系数 */
  scoreFactor: 2,
  
  /** 各项属性增长值 */
  bonuses: {
    /** 每级增加的最大生命值 */
    maxHpFlat: 50,
    
    /** 每级增加的最大护盾值 */
    maxShieldFlat: 10,
    
    /** 每级增加的防御百分比 */
    defensePct: 2,
    
    /** 每级增加的射速百分比 */
    fireRatePct: 0.1,
    
    /** 每级增加的伤害百分比 */
    damagePct: 0.1,
    
    /** 防御百分比上限 */
    defensePctMax: 15,
    
    /** 射速百分比上限 */
    fireRatePctMax: 15,
    
    /** 伤害百分比上限 */
    damagePctMax: 15,
  },
};
