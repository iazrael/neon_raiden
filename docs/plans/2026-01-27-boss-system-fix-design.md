# Boss系统修复设计文档

**日期**: 2026-01-27
**状态**: 设计完成，待实施
**优先级**: 高（阻止Boss多阶段行为正常工作）

---

## 概述

本设计文档描述了Boss系统的全面修复方案，解决代码审查中发现的17个问题。Boss系统由两个核心System组成：`BossPhaseSystem`（阶段判定和切换）和`BossSystem`（行为执行）。修复后Boss将能够正确地在不同血量阈值切换阶段、更换武器、改变移动模式，并触发特殊事件。

**修复范围**: 全部17个问题（4个Critical + 6个Important + 7个Minor）

---

## 问题清单

### Critical级别（必须修复）

1. **Boss蓝图缺少Weapon组件** ([bosses.ts:26-43](../src/engine/blueprints/bosses.ts#L26-L43))
   - Boss生成时使用默认武器而非配置的第一阶段武器
   - 影响所有Boss的初始行为

2. **武器切换未实现** ([BossPhaseSystem.ts:117-125](../src/engine/systems/BossPhaseSystem.ts#L117-L125))
   - 标记为TODO，阶段切换时不会更换武器
   - Guardian P2、Destroyer等多阶段Boss无法切换武器

3. **阶段索引初始化不一致**
   - factory.ts初始化phase为1，blueprints.ts初始化为0
   - 可能导致跳过第一阶段或数组索引错误

4. **RANDOM_TELEPORT移动模式未实现** ([BossSystem.ts:182-187](../src/engine/systems/BossSystem.ts#L182-L187))
   - Annihilator和Apocalypse P3无法瞬移，只能缓慢下降

### Important级别（应该修复）

5. **fireRate修正器应用不完整**
6. **damage修正器未应用**
7. **特殊事件未触发** (spawn_minions、laser_sweep等)
8. **ADAPTIVE移动模式未实现**
9. **缺少Boss配置验证**
10. **未使用的导入** (EnemyWeaponId)

### Minor级别（改进项）

11. 阶段索引显示不一致
12. 移动模式参数硬编码
13. 阶段切换未重置武器冷却
14. phaseColor未应用
15. 魔法数字过多
16. JSDoc文档缺失
17. 速度修正器累积问题

---

## 架构设计

### 核心原则

1. **数据驱动设计**: Boss的所有行为（移动、武器、阶段）通过配置数据定义
2. **职责分离**:
   - `BossPhaseSystem`: 阶段判定和切换（血量驱动）
   - `BossSystem`: 行为执行（移动、开火）
   - 事件驱动: BossPhaseSystem触发事件，其他系统监听处理特殊效果
3. **单次修正原则**: 阶段修正器采用覆盖模式，避免多次切换的累积问题

### 配置文件结构

```typescript
// 扩展BossPhaseSpec接口
export interface MovementConfig {
    speedMultiplier?: number;      // 速度倍率
    radius?: number;               // 圆形/8字移动半径
    frequency?: number;            // 振动频率
    amplitude?: number;            // 振幅
    verticalSpeed?: number;        // 垂直速度
    teleportInterval?: number;     // 瞬移间隔（毫秒）
    dashSpeed?: number;            // 冲刺速度
    centerY?: number;              // 圆心Y坐标
    zigzagInterval?: number;       // 之字形切换间隔
    closeRangeThreshold?: number;  // 自适应模式近距离阈值
}

export interface BossPhaseSpec {
    threshold: number;             // 血量阈值（0-1）
    movePattern: BossMovementPattern;
    movementConfig?: MovementConfig;  // 新增：移动参数配置
    weaponId: EnemyWeaponId;
    modifiers: {
        moveSpeed?: number;        // 移动速度倍率
        fireRate?: number;         // 射击频率倍率
        damage?: number;           // 伤害倍率
    };
    phaseColor?: string;           // 阶段视觉提示颜色
    specialEvents?: string[];      // 特殊事件列表
}
```

---

## 实施方案

### 阶段1：数据层修复

**文件**: `src/engine/configs/bossData.ts`

1. **添加MovementConfig接口定义**
2. **扩展BossPhaseSpec接口**
3. **实现配置验证函数**:
   ```typescript
   export function validateBossConfigs(): { valid: boolean; errors: string[] }
   ```
4. **补充所有Boss的完整配置**（使用movementConfig）
5. **在开发环境自动调用验证**

### 阶段2：蓝图层修复

**文件**: `src/engine/blueprints/bosses.ts`

修改`createBossBlueprint`函数，从`BOSS_DATA`读取第一阶段武器：

```typescript
import { BOSS_DATA } from '../configs/bossData';
import { ENEMY_WEAPON_TABLE } from '../configs/weapons';

function createBossBlueprint(bossId: BossId, hp: number, radius: number, score: number): Blueprint {
    const bossSpec = BOSS_DATA[bossId];
    const phase1WeaponId = bossSpec?.phases[0]?.weaponId;
    const weaponSpec = phase1WeaponId ? ENEMY_WEAPON_TABLE[phase1WeaponId] : undefined;

    return {
        Transform: { x: 400, y: -200, rot: 180 },
        Health: { hp, max: hp },
        Sprite: { spriteKey: BOSS_SPRITE_MAP[bossId], scale: 1 },
        BossTag: { id: bossId },
        BossAI: { phase: 0, nextPatternTime: 0 },  // 确保0-based索引
        HitBox: { shape: 'circle', radius: radius * 0.8, layer: CollisionLayer.Enemy },
        SpeedStat: { maxLinear: 120, maxAngular: 2 },
        ScoreValue: { value: score },
        DropTable: { table: DROPTABLE_BOSS },
        Weapon: weaponSpec  // 初始化第一阶段武器
    };
}
```

**文件**: `src/engine/types.ts`

添加BossVisual组件：
```typescript
export class BossVisual implements Component {
    static check = (c: Component): c is BossVisual => c instanceof BossVisual;
    color: string;
    constructor(props: { color: string }) {
        this.color = props.color;
    }
}
```

### 阶段3：BossPhaseSystem修复

**文件**: `src/engine/systems/BossPhaseSystem.ts`

实现完整的`applyPhaseModifiers`函数：

```typescript
import { BossVisual } from '../types';
import { ENEMY_WEAPON_TABLE } from '../configs/weapons';

function applyPhaseModifiers(
    world: World,
    entityId: number,
    bossAI: BossAI,
    phaseIndex: number,
    phaseSpec: BossPhaseSpec,
    comps: Component[]
): void {
    // 1. 更新阶段索引
    bossAI.phase = phaseIndex;

    // 2. 生成阶段切换事件
    pushEvent(world, {
        type: 'BossPhaseChange',
        phase: phaseIndex + 1,
        bossId: entityId
    });

    pushEvent(world, {
        type: 'PlaySound',
        name: 'boss_phase_change'
    });

    // 3. 应用修正器
    const modifiers = phaseSpec.modifiers || {};

    // 速度修正（覆盖模式，使用基础值120）
    const speedStat = comps.find(SpeedStat.check);
    if (speedStat && modifiers.moveSpeed) {
        speedStat.maxLinear = 120 * modifiers.moveSpeed;
    }

    // 武器切换
    if (phaseSpec.weaponId) {
        const weapon = comps.find(Weapon.check);
        if (weapon) {
            const newWeaponSpec = ENEMY_WEAPON_TABLE[phaseSpec.weaponId];
            if (newWeaponSpec) {
                Object.assign(weapon, {
                    id: newWeaponSpec.id,
                    ammoType: newWeaponSpec.ammoType,
                    cooldown: newWeaponSpec.cooldown,
                    bulletCount: newWeaponSpec.bulletCount,
                    spread: newWeaponSpec.spread,
                    pattern: newWeaponSpec.pattern,
                    curCD: 0,  // 重置冷却
                    damageMultiplier: modifiers.damage || 1.0,
                    fireRateMultiplier: modifiers.fireRate || 1.0
                });
            }
        }
    }

    // 阶段颜色
    if (phaseSpec.phaseColor) {
        let visual = comps.find(BossVisual.check);
        if (!visual) {
            visual = new BossVisual({ color: phaseSpec.phaseColor });
            comps.push(visual);
        } else {
            visual.color = phaseSpec.phaseColor;
        }
    }

    // 特殊事件
    if (phaseSpec.specialEvents) {
        for (const eventName of phaseSpec.specialEvents) {
            pushEvent(world, {
                type: 'BossSpecialEvent',
                event: eventName,
                bossId: entityId,
                phase: phaseIndex
            });
        }
    }
}
```

### 阶段4：BossSystem修复

**文件**: `src/engine/systems/BossSystem.ts`

1. **创建常量文件** `src/engine/systems/bossConstants.ts`:
   ```typescript
   export const BASE_MOVE_SPEED = 100;
   export const VERTICAL_SPEED = { SLOW: 20, NORMAL: 30, FAST: 40, VERY_FAST: 50 };
   export const CIRCLE_MOVE = { DEFAULT_RADIUS: 150, DEFAULT_CENTER_Y: 200, DEFAULT_FREQUENCY: 0.5 };
   export const TELEPORT = { DEFAULT_INTERVAL: 3000, DEFAULT_TELEPORT_WINDOW: 50 };
   // ... 其他常量
   ```

2. **实现RANDOM_TELEPORT模式**:
   ```typescript
   case BossMovementPattern.RANDOM_TELEPORT: {
       const config = phaseSpec.movementConfig || {};
       const teleportInterval = config.teleportInterval || TELEPORT.DEFAULT_INTERVAL;
       const timeInCycle = time % teleportInterval;

       if (timeInCycle < 50) {  // 瞬移窗口
           const margin = TELEPORT.MARGIN_X || 100;
           boss.transform.x = margin + Math.random() * (world.width - margin * 2);
           boss.transform.y = TELEPORT.MARGIN_Y + Math.random() * TELEPORT.MAX_Y_SPREAD;
           boss.velocity.vx = 0;
           boss.velocity.vy = 0;
       } else {
           boss.velocity.vx = 0;
           boss.velocity.vy = VERTICAL_SPEED.SLOW;
       }
       break;
   }
   ```

3. **实现ADAPTIVE模式**:
   ```typescript
   case BossMovementPattern.ADAPTIVE: {
       const config = phaseSpec.movementConfig || {};
       const threshold = config.closeRangeThreshold || 200;

       const playerComps = world.entities.get(world.playerId);
       if (playerComps) {
           const playerTransform = playerComps.find(Transform.check);
           if (playerTransform) {
               const dx = playerTransform.x - boss.transform.x;
               const dy = playerTransform.y - boss.transform.y;
               const dist = Math.sqrt(dx * dx + dy * dy);

               if (dist < threshold) {
                   // 近距离：闪避（8字形）
                   boss.velocity.vx = Math.sin(time * 3) * baseSpeed * 1.5;
                   boss.velocity.vy = Math.cos(time * 3) * baseSpeed;
               } else {
                   // 远距离：追踪
                   boss.velocity.vx = (dx / dist) * baseSpeed;
                   boss.velocity.vy = (dy / dist) * baseSpeed * 0.5;
               }
           }
       }
       break;
   }
   ```

4. **重构现有移动模式**，使用`movementConfig`参数而非硬编码

5. **修改processBoss函数签名**，传入`movementConfig`:
   ```typescript
   function processBoss(...): void {
       handleBossMovement(world, boss, phaseSpec.movePattern, phaseSpec.modifiers, phaseSpec.movementConfig, dt);
       handleBossFiring(world, boss, phaseSpec, dt);
   }
   ```

### 阶段5：清理和优化

1. **移除factory.ts中的错误初始化**（BossAI.phase从1改为0）
2. **移除未使用的导入**
3. **添加JSDoc文档**
4. **在bossData.ts末尾调用配置验证**（开发环境）

---

## 测试策略

### 测试文件结构

```
tests/
├── systems/
│   ├── BossSystem.test.ts          (扩展：添加移动模式测试)
│   ├── BossPhaseSystem.test.ts     (扩展：添加修正器测试)
│   └── BossIntegration.test.ts     (新增：集成测试)
├── configs/
│   └── bossData.test.ts            (新增：配置验证测试)
└── blueprints/
    └── bosses.test.ts              (新增：蓝图测试)
```

### BossPhaseSystem.test.ts 扩展

- ✅ 测试阶段切换事件触发
- ✅ 测试武器切换逻辑
- ✅ 测试速度修正器（覆盖模式）
- ✅ 测试damage/fireRate修正器
- ✅ 测试特殊事件触发
- ✅ 测试phaseColor应用

### BossSystem.test.ts 扩展

- ✅ 测试所有基础移动模式（SINE, FIGURE_8, CIRCLE, ZIGZAG, FOLLOW, TRACKING, DASH）
- ✅ 测试RANDOM_TELEPORT模式
- ✅ 测试ADAPTIVE模式
- ✅ 测试movementConfig参数
- ✅ 测试开火行为和fireRate修正

### BossIntegration.test.ts 新增

- ✅ Guardian完整生命周期测试（P1 -> P2 -> 死亡）
- ✅ Destroyer三阶段切换测试
- ✅ Apocalypse四阶段 + 特殊事件测试
- ✅ 多Boss并存测试

### bossData.test.ts 新增

- ✅ 配置完整性验证测试
- ✅ 武器存在性测试
- ✅ 移动模式实现完整性测试

### bosses.test.ts 新增

- ✅ Weapon组件存在性测试
- ✅ 初始武器正确性测试
- ✅ BossAI.phase初始化测试（应为0）

---

## 新增代码量估算

| 模块 | 行数 | 说明 |
|------|------|------|
| bossData.ts配置验证 | ~100 | 验证函数和补充配置 |
| bosses.ts蓝图修复 | ~20 | 武器初始化 |
| BossPhaseSystem修复 | ~80 | 武器切换和修正器 |
| BossSystem移动模式 | ~150 | RANDOM_TELEPORT和ADAPTIVE |
| bossConstants.ts | ~80 | 常量定义 |
| 测试代码 | ~600 | 全面的单元和集成测试 |
| 文档 | ~200 | JSDoc和使用指南 |
| **总计** | **~1230行** | |

---

## 实施顺序

为了避免依赖问题，按照以下顺序实施：

1. ✅ **阶段1**: 数据层修复（bossData.ts）
2. ✅ **阶段2**: 蓝图层修复（bosses.ts, types.ts）
3. ✅ **阶段3**: BossPhaseSystem修复
4. ✅ **阶段4**: BossSystem修复（包括常量文件）
5. ✅ **阶段5**: 清理和优化
6. ✅ **阶段6**: 测试实现
7. ✅ **阶段7**: 文档更新

---

## 验收标准

修复完成后，以下场景应该正常工作：

1. **Boss生成**:
   - ✅ Boss出生时拥有正确的第一阶段武器
   - ✅ BossAI.phase初始化为0

2. **阶段切换**:
   - ✅ 血量降到阈值时自动切换阶段
   - ✅ 武器正确切换
   - ✅ 速度/伤害/射速修正器生效
   - ✅ 阶段颜色更新
   - ✅ 特殊事件触发
   - ✅ 武器冷却重置

3. **移动行为**:
   - ✅ 所有移动模式正常工作
   - ✅ RANDOM_TELEPORT Boss能瞬移
   - ✅ ADAPTIVE Boss能根据距离切换行为
   - ✅ movementConfig参数生效

4. **测试覆盖**:
   - ✅ 所有单元测试通过
   - ✅ 集成测试通过
   - ✅ 配置验证通过

---

## 风险和缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 武器切换导致现有武器失效 | 高 | 编写集成测试验证武器切换 |
| 速度修正器覆盖模式破坏现有平衡 | 中 | 通过关卡配置调整基础值 |
| 移动模式参数配置化增加复杂度 | 低 | 提供合理默认值，配置可选 |
| 测试工作量较大 | 中 | 优先测试Critical和Important问题 |

---

## 后续优化建议

1. **Boss技能系统**: 创建独立的BossSkillSystem处理specialEvents
2. **编辑器工具**: 开发Boss配置编辑器，可视化调整参数
3. **性能监控**: 添加Boss行为性能分析工具
4. **AI强化**: 考虑引入行为树或状态机管理复杂Boss AI

---

## 附录：Boss配置示例

```typescript
// Guardian: 2阶段Boss示例
[BossId.GUARDIAN]: {
    id: BossId.GUARDIAN,
    phases: [
        { // P1: 100% - 50%
            threshold: 1.0,
            movePattern: BossMovementPattern.SINE,
            movementConfig: {
                frequency: 2,
                verticalSpeed: 30
            },
            weaponId: EnemyWeaponId.GUARDIAN_RADIAL,
            modifiers: { moveSpeed: 1.0, fireRate: 1.0 }
        },
        { // P2: 50% - 0%
            threshold: 0.5,
            movePattern: BossMovementPattern.FOLLOW,
            weaponId: EnemyWeaponId.GUARDIAN_RADIAL_ENRAGED,
            modifiers: { moveSpeed: 1.5, fireRate: 1.5 },
            phaseColor: '#ffaa00'
        }
    ]
}

// Annihilator: 使用瞬移的Boss
[BossId.ANNIHILATOR]: {
    id: BossId.ANNIHILATOR,
    phases: [
        {
            threshold: 1.0,
            movePattern: BossMovementPattern.RANDOM_TELEPORT,
            movementConfig: {
                teleportInterval: 3000
            },
            weaponId: EnemyWeaponId.GENERIC_TARGETED,
            modifiers: { fireRate: 1.2 }
        }
    ]
}

// Apocalypse: 最复杂的4阶段Boss
[BossId.APOCALYPSE]: {
    id: BossId.APOCALYPSE,
    phases: [
        { // P1: 100% - 75%
            threshold: 1.0,
            movePattern: BossMovementPattern.ADAPTIVE,
            movementConfig: {
                closeRangeThreshold: 200
            },
            weaponId: EnemyWeaponId.APOCALYPSE_MIXED,
            modifiers: { moveSpeed: 1.0 }
        },
        { // P2: 75% - 50% (装甲模式)
            threshold: 0.75,
            movePattern: BossMovementPattern.IDLE,
            weaponId: EnemyWeaponId.APOCALYPSE_DEFENSE,
            modifiers: { moveSpeed: 0.8, damage: 0.5 },
            phaseColor: '#ffff00'
        },
        { // P3: 50% - 25% (狂暴模式)
            threshold: 0.5,
            movePattern: BossMovementPattern.RANDOM_TELEPORT,
            movementConfig: { teleportInterval: 2000 },
            weaponId: EnemyWeaponId.APOCALYPSE_BERSERK,
            modifiers: { moveSpeed: 1.5, fireRate: 1.6 },
            phaseColor: '#ff4500'
        },
        { // P4: 25% - 0% (绝境反击)
            threshold: 0.25,
            movePattern: BossMovementPattern.DASH,
            movementConfig: { dashSpeed: 300 },
            weaponId: EnemyWeaponId.APOCALYPSE_FINAL,
            modifiers: { moveSpeed: 2.0, fireRate: 2.0 },
            phaseColor: '#8b0000',
            specialEvents: ['screen_clear', 'last_stand']
        }
    ]
}
```

---

**文档版本**: 1.0
**最后更新**: 2026-01-27
