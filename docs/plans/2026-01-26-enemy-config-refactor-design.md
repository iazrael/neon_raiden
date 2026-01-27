# 敌人配置重构设计方案

**日期**: 2026-01-26
**目标**: 将敌人行为配置和成长配置从 System 中分离，统一管理到配置文件，并实现关卡成长机制

---

## 问题背景

### 当前问题
1. **配置硬编码在 System 中**：`ENEMY_BEHAVIORS` 硬编码在 `EnemySystem.ts` (43-79行)，修改不便
2. **成长配置未使用**：`enemyGrowth.ts` 被注释掉，字段可能过时
3. **没有关卡成长机制**：敌人属性不随关卡提升
4. **数据分散**：蓝图、行为、成长数据分散在多处，难以维护

### 设计目标
- ✅ 配置集中管理到 `configs/enemyGrowth.ts`
- ✅ 支持关卡成长系统（HP、伤害、射速随关卡提升）
- ✅ 移除 `aggressiveness` 参数（与 `fireRate` 概念冲突）
- ✅ 职责分离：配置 → 蓝图 → 工厂 → 刷怪系统 → AI系统

---

## 架构设计

### 数据流

```
configs/enemyGrowth.ts     → 数据层（配置 + 成长计算）
blueprints/enemies.ts       → 模板层（静态组件定义）
factory.ts                  → 创建层（实体实例化）
systems/SpawnSystem.ts      → 刷怪层（创建 + 成长应用 + 点数管理）
systems/EnemySystem.ts      → 决策层（AI 行为生成）
```

### 完整流程

```
1. SpawnSystem 选择敌人类型 (enemyType)
   ↓
2. 获取蓝图 blueprint = ENEMIES_TABLE[enemyType]
   ↓
3. 创建实体 spawnEnemy(world, blueprint, x, y, rot)
   ↓
4. 应用成长 applyEnemyGrowth(world, enemyId, enemyType, world.level)
   - 计算 HP = baseHp + hpPerLevel × (level-1)
   - 计算伤害倍率 = baseDamage + damagePerLevel × (level-1)
   - 计算射速倍率 = baseFireRate + fireRatePerLevel × (level-1)
   ↓
5. 修改组件 Health.hp, Weapon.cooldown 等
   ↓
6. EnemySystem 每帧读取行为配置
   - getEnemyBehavior(enemyType)
   - 生成 MoveIntent, FireIntent
```

---

## 核心数据结构

### 1. EnemyConfig 接口

```typescript
export interface EnemyConfig {
    // ========== 行为配置 ==========
    /** 移动速度（像素/秒） */
    moveSpeed: number;

    /** 开火间隔（毫秒），会加入随机波动 */
    fireInterval: number;

    /** 行为模式 */
    behavior: EnemyBehavior;

    // ========== 成长配置 ==========
    /** 基础血量 */
    baseHp: number;

    /** 每级增加血量 */
    hpPerLevel: number;

    /** 基础伤害倍率 */
    baseDamage: number;

    /** 每级增加伤害倍率 */
    damagePerLevel: number;

    /** 基础射速倍率 */
    baseFireRate: number;

    /** 每级增加射速倍率 */
    fireRatePerLevel: number;

    /** 击杀得分 */
    score: number;
}
```

### 2. EnemyBehavior 枚举

```typescript
export enum EnemyBehavior {
    IDLE = 'idle',
    MOVE_DOWN = 'move_down',
    SINE_WAVE = 'sine_wave',
    CHASE = 'chase',
    RAM = 'ram',
    STRAFE = 'strafe',
    CIRCLE = 'circle'
}
```

---

## 配置示例

```typescript
export const ENEMY_CONFIGS: Record<EnemyId, EnemyConfig> = {
    // NORMAL - 普通敌人：正弦波移动，平衡属性
    [EnemyId.NORMAL]: {
        moveSpeed: 100,
        fireInterval: 2000,
        behavior: EnemyBehavior.SINE_WAVE,
        baseHp: 30,
        hpPerLevel: 10,
        baseDamage: 1.0,
        damagePerLevel: 0.1,
        baseFireRate: 1.0,
        fireRatePerLevel: 0.05,
        score: 100,
    },

    // FAST - 快速敌人：直线向下，低血高攻
    [EnemyId.FAST]: {
        moveSpeed: 250,
        fireInterval: 1500,
        behavior: EnemyBehavior.MOVE_DOWN,
        baseHp: 10,
        hpPerLevel: 2,
        baseDamage: 0.8,
        damagePerLevel: 0.05,
        baseFireRate: 1.2,
        fireRatePerLevel: 0.08,
        score: 200,
    },

    // KAMIKAZE - 神风特攻：追踪冲撞，不开火
    [EnemyId.KAMIKAZE]: {
        moveSpeed: 200,
        fireInterval: Infinity,  // 不开火
        behavior: EnemyBehavior.CHASE,
        baseHp: 5,
        hpPerLevel: 1,
        baseDamage: 1.0,
        damagePerLevel: 0.0,
        baseFireRate: 1.0,
        fireRatePerLevel: 0.0,
        score: 400,
    },

    // ... 其他敌人配置
};
```

---

## 成长计算函数

### getEnemyStats

```typescript
/**
 * 计算敌人当前等级的各项属性
 * @param enemyId 敌人类型
 * @param level 关卡等级（从 1 开始）
 * @returns 计算后的属性对象
 */
export function getEnemyStats(enemyId: EnemyId, level: number) {
    const config = ENEMY_CONFIGS[enemyId];
    if (!config) {
        // 默认值，防止崩溃
        return {
            hp: 30,
            damageMultiplier: 1.0,
            fireRateMultiplier: 1.0,
            score: 100
        };
    }

    // 计算等级加成（level 从 1 开始，level=1 时为无加成）
    const levelBonus = level - 1;

    return {
        hp: config.baseHp + config.hpPerLevel * levelBonus,
        damageMultiplier: config.baseDamage + config.damagePerLevel * levelBonus,
        fireRateMultiplier: config.baseFireRate + config.fireRatePerLevel * levelBonus,
        score: config.score
    };
}
```

### getEnemyBehavior

```typescript
/**
 * 获取敌人行为配置（行为不随关卡变化）
 */
export function getEnemyBehavior(enemyId: EnemyId) {
    const config = ENEMY_CONFIGS[enemyId];
    if (!config) {
        return {
            moveSpeed: 100,
            fireInterval: 2000,
            behavior: EnemyBehavior.MOVE_DOWN
        };
    }

    return {
        moveSpeed: config.moveSpeed,
        fireInterval: config.fireInterval,
        behavior: config.behavior
    };
}
```

---

## SpawnSystem 封装

### doSpawnEnemy 函数

```typescript
/**
 * 刷敌人（封装创建、成长应用、点数扣除）
 */
function doSpawnEnemy(
    world: World,
    enemyType: EnemyId,
    cost: number,
    pos: { x: number; y: number }
): void {
    // 1. 获取蓝图
    const blueprint = ENEMIES_TABLE[enemyType];
    if (!blueprint) {
        console.warn(`doSpawnEnemy: No blueprint found for '${enemyType}'`);
        return;
    }

    // 2. 创建敌人
    const enemyId = spawnEnemy(world, blueprint, pos.x, pos.y, 0);

    // 3. 应用关卡成长
    applyEnemyGrowth(world, enemyId, enemyType);

    // 4. 扣除点数
    world.spawnCredits -= cost;

    // 5. 日志
    console.log(`Spawned enemy '${enemyType}' costing ${cost} credits`);
}

/**
 * 应用敌人关卡成长属性（内部辅助函数）
 */
function applyEnemyGrowth(world: World, enemyId: EntityId, enemyType: EnemyId): void {
    const stats = getEnemyStats(enemyType, world.level);
    const comps = world.entities.get(enemyId);
    if (!comps) return;

    // 更新血量
    const health = comps.find(Health.check);
    if (health) {
        health.hp = stats.hp;
        health.max = stats.hp;
    }

    // 更新武器射速
    const weapon = comps.find(Weapon.check);
    if (weapon && stats.fireRateMultiplier !== 1.0) {
        weapon.cooldown = weapon.cooldown / stats.fireRateMultiplier;
    }
}
```

---

## EnemySystem 重构

### 主要改动

1. **移除硬编码配置**：删除 `ENEMY_BEHAVIORS` (43-79行)
2. **导入新配置函数**：`import { getEnemyBehavior } from '../configs/enemyGrowth'`
3. **移除 aggressiveness**：直接使用 `fireInterval` 控制攻击节奏
4. **简化参数**：函数只接收需要的字段

### 修改后的 EnemySystem 主函数

```typescript
export function EnemySystem(world: World, dt: number): void {
    // 获取玩家位置
    let playerPos: { x: number; y: number } | null = null;
    const player = world.entities.get(world.playerId);
    const transform = player.find(Transform.check);
    if (transform) {
        playerPos = { x: transform.x, y: transform.y };
    }

    if (!playerPos) return;

    // 处理每个敌人
    for (const [enemyId, [enemyTag, transform]] of view(world, [EnemyTag, Transform])) {
        // ✅ 从配置文件获取行为配置
        const behavior = getEnemyBehavior(enemyTag.id);

        enemyTag.timer += dt;

        // 生成意图
        generateMoveIntent(world, enemyId, transform, playerPos, behavior, enemyTag);
        generateFireIntent(world, enemyId, behavior, enemyTag);
    }
}
```

### 简化后的 generateFireIntent

```typescript
function generateFireIntent(
    world: World,
    enemyId: EntityId,
    behavior: { fireInterval: number },
    enemyTag: EnemyTag
): void {
    const comps = world.entities.get(enemyId);
    if (!comps) return;

    const weapon = comps.find(Weapon.check);
    if (!weapon) return;

    if (weapon.curCD > 0) return;

    if (enemyTag.timer < behavior.fireInterval) return;

    // ✅ 移除 aggressiveness 概率判断
    addComponent(world, enemyId, new FireIntent({ firing: true }));
    enemyTag.timer = 0;
}
```

---

## 实施步骤

### Step 1: 创建新的 enemyGrowth.ts
- [ ] 定义 `EnemyBehavior` 枚举
- [ ] 定义 `EnemyConfig` 接口
- [ ] 创建 `ENEMY_CONFIGS` 配置表（整合行为和成长数据）
- [ ] 实现 `getEnemyStats()` 和 `getEnemyBehavior()` 函数

### Step 2: 修改 SpawnSystem
- [ ] 添加 `applyEnemyGrowth()` 内部函数
- [ ] 添加 `doSpawnEnemy()` 封装函数
- [ ] 修改主函数的刷怪调用（使用 `doSpawnEnemy`）

### Step 3: 重构 EnemySystem
- [ ] 删除 `ENEMY_BEHAVIORS` 硬编码配置
- [ ] 导入 `getEnemyBehavior`
- [ ] 修改 `EnemySystem` 主函数
- [ ] 修改 `generateMoveIntent` 和 `generateFireIntent` 函数签名
- [ ] 移除 `aggressiveness` 概率判断

### Step 4: 校对和测试
- [ ] 校对所有敌人的配置字段（HP、速度、伤害等）
- [ ] 测试不同关卡的敌人属性成长
- [ ] 验证 AI 行为是否正常
- [ ] 性能测试

---

## 设计亮点

1. **配置集中管理**：所有敌人相关配置在一处，易于查找和修改
2. **职责分离清晰**：配置 → 蓝图 → 工厂 → 系统，层次分明
3. **扩展性好**：未来添加难度系数、特殊属性等都很方便
4. **与现有系统一致**：与 `weapon-upgrades.ts`、`playerGrowth.ts` 的模式保持一致
5. **对称设计**：`doSpawnEnemy` 与 `doSpawnBoss` 对称，结构统一

---

## 注意事项

1. **level 从 1 开始**：`level=1` 时 `levelBonus=0`，表示第1关无加成
2. **fireInterval: Infinity**：表示不开火（如 KAMIKAZE）
3. **使用倍率而非绝对值**：与武器系统一致，便于平衡
4. **默认值保护**：所有函数都有默认值，防止配置缺失导致崩溃
5. **保留蓝图静态数据**：蓝图中的基础值作为模板，成长倍率在此基础上计算
