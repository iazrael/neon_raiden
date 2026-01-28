# Boss系统重构设计文档

**日期**: 2026-01-28
**作者**: Claude Sonnet 4.5
**状态**: 设计阶段

---

## 问题概述

当前 `BossSystem.ts`（约350行）存在以下架构问题：

1. **职责混乱**：单一系统同时负责入场、移动、战斗三个职责
2. **违反ECS原则**：直接修改组件数组、跨系统修改组件
3. **魔法数字泛滥**：150、250等硬编码值遍布代码
4. **代码重复**：多次调用 `comps.find()` 查找相同组件
5. **浮点数比较不安全**：直接比较可能导致精度问题

**影响**：代码难以维护、测试困难、扩展性差

---

## 设计目标

- ✅ 符合ECS单一职责原则
- ✅ 消除所有魔法数字
- ✅ 修复所有CRITICAL和HIGH级别问题
- ✅ 提高测试覆盖率
- ✅ 保持现有功能无回归

---

## 架构设计

### 系统拆分

将 `BossSystem.ts` 拆分为三个独立系统：

```
src/engine/systems/boss/
├── BossEntranceSystem.ts    # 入场系统
├── BossMovementSystem.ts    # 移动系统
├── BossCombatSystem.ts      # 战斗系统
└── index.ts
```

### 系统职责

**BossEntranceSystem**
- **职责**：处理Boss从屏幕外移动到目标位置
- **输入**：`BossTag`, `BossEntrance`, `Transform`
- **输出**：`MoveIntent`, `SpeedModifier`
- **执行顺序**：P1.5 - 决策层

**BossMovementSystem**
- **职责**：处理Boss战斗阶段的移动行为
- **输入**：`BossTag`, `BossAI`, `Transform`, `Velocity`
- **输出**：更新 `Velocity.vx/vy`
- **执行顺序**：P1.6 - 决策层

**BossCombatSystem**
- **职责**：处理Boss武器攻击和阶段切换
- **输入**：`BossTag`, `BossAI`, `Weapon`, `Health`
- **输出**：`FireIntent`, `BossPhaseChangeEvent`
- **执行顺序**：P1.7 - 决策层

### 系统隔离机制

通过**ECS查询自然隔离**避免冲突：

```typescript
// BossEntranceSystem 只查询有 BossEntrance 的实体
view(world, [BossTag, BossEntrance])

// BossMovementSystem 排除有 BossEntrance 的实体
view(world, [BossTag, BossAI]).filter(([, comps]) =>
    !comps.some(BossEntrance.check)
)
```

当Boss入场完成，`BossEntrance` 组件被移除，自动转移到战斗系统。

---

## ECS API 扩展

### 新增函数

在 `src/engine/world.ts` 添加：

```typescript
/**
 * 一次性获取多个组件（类型安全）
 *
 * @example
 * const [entrance, speedMod] = getComponents(
 *     world, id, BossEntrance, SpeedModifier
 * );
 */
export function getComponents<T extends Ctor[]>(
    w: World,
    id: EntityId,
    ...types: T
): { [K in keyof T]: T[K] extends Ctor<infer U> ? U | undefined : undefined };

/**
 * 按类型移除组件
 *
 * @returns 是否成功移除
 */
export function removeComponentByType<T extends Component>(
    w: World,
    id: EntityId,
    compCtor: Ctor<T>
): boolean;

/**
 * 安全移除组件（不存在也不报错）
 */
export function removeComponentIfExists<T extends Component>(
    w: World,
    id: EntityId,
    compCtor: Ctor<T>
): void;
```

### 数学辅助函数

在 `src/engine/utils/math.ts` 添加：

```typescript
export const MATH = {
    EPSILON: 0.001,
    POSITION_EPSILON: 0.1,
    VELOCITY_EPSILON: 1.0,
} as const;

export function feq(a: number, b: number, epsilon?: number): boolean;
export function flt(a: number, b: number, epsilon?: number): boolean;
```

---

## 新增组件

### SpeedModifier

用于临时覆盖速度限制，解决跨系统修改 `SpeedStat` 的问题。

```typescript
// src/engine/components/meta.ts

export class SpeedModifier extends Component {
    constructor(cfg: {
        maxLinearOverride?: number;
        maxAngularOverride?: number;
        duration?: number;  // -1 表示持续到手动移除
    }) {
        super();
        this.maxLinearOverride = cfg.maxLinearOverride;
        this.maxAngularOverride = cfg.maxAngularOverride;
        this.duration = cfg.duration ?? -1;
        this.elapsed = 0;
    }

    public maxLinearOverride?: number;
    public maxAngularOverride?: number;
    public duration: number;
    public elapsed: number;
}
```

---

## 配置提取

### 扩展 bossConstants.ts

```typescript
export const BOSS_ARENA = {
    DEFAULT_TARGET_Y: 150,
    DEFAULT_CENTER_Y: 150,
    UPPER_BOUND_Y: 100,
    LOWER_BOUND_Y: 250,
    FIGURE8_RADIUS_X: 150,
    FIGURE8_RADIUS_Y: 50,
    AGGRESSIVE_CENTER_Y: 175,
    AGGRESSIVE_Y_SPREAD: 75,
    POSITION_EPSILON: 0.1,
} as const;

// 为每个移动模式提取所有算法参数
export const FIGURE_8 = {
    DEFAULT_FREQUENCY: 1.0,
    DEFAULT_Y_FREQUENCY: 2.0,
    DEFAULT_AMPLITUDE: 1.0,
    RADIUS_X: 150,  // 新增
    RADIUS_Y: 50,   // 新增
    CENTER_Y: 150,  // 新增
} as const;

// ... 其他移动模式同理
```

---

## 核心实现示例

### BossEntranceSystem

```typescript
export function BossEntranceSystem(world: World, dt: number): void {
    const dtInSeconds = dt / 1000;

    for (const [id, comps] of view(world, [BossTag, BossEntrance])) {
        const transform = comps.find(Transform.check)!;
        const entrance = comps.find(BossEntrance.check)!;

        // 使用浮点数安全比较
        if (flt(transform.y, entrance.targetY, BOSS_ARENA.POSITION_EPSILON)) {
            // 入场阶段
            if (!comps.find(SpeedModifier.check)) {
                addComponent(world, id, new SpeedModifier({
                    maxLinearOverride: entrance.entranceSpeed
                }));
            }

            const [moveIntent] = getComponents(world, id, MoveIntent);
            if (moveIntent) {
                moveIntent.dx = 0;
                moveIntent.dy = entrance.entranceSpeed;
                moveIntent.type = 'velocity';
            } else {
                addComponent(world, id, new MoveIntent({
                    dx: 0,
                    dy: entrance.entranceSpeed,
                    type: 'velocity'
                }));
            }
        } else {
            // 入场完成 - 使用新API
            removeComponentByType(world, id, BossEntrance);
            removeComponentByType(world, id, SpeedModifier);
            removeComponentIfExists(world, id, InvulnerableState);
        }
    }
}
```

### BossMovementSystem

```typescript
export function BossMovementSystem(world: World, dt: number): void {
    const dtInSeconds = dt / 1000;

    for (const [id, comps] of view(world, [BossTag, BossAI, Transform, Velocity])) {
        // 排除正在入场的Boss
        if (comps.some(BossEntrance.check)) continue;

        // 一次性获取组件（性能优化）
        const [transform, velocity, bossAI] = [
            comps.find(Transform.check)!,
            comps.find(Velocity.check)!,
            comps.find(BossAI.check)!,
        ];

        // 配置验证
        const bossSpec = BOSS_DATA[bossAI.bossId];
        if (!bossSpec) {
            console.error(`Boss配置不存在: ${bossAI.bossId}`);
            continue;
        }

        const phaseSpec = bossSpec.phases[bossAI.phase];
        if (!phaseSpec) {
            console.error(`Boss阶段不存在: phase=${bossAI.phase}`);
            continue;
        }

        // 处理移动（使用配置常量）
        handleBossMovement(world, { id, transform, velocity, bossAI }, phaseSpec, dtInSeconds);
    }
}

// 移动处理示例（8字形）
case BossMovementPattern.FIGURE_8:
    const freq = config.frequency || FIGURE_8.DEFAULT_FREQUENCY;
    const yFreq = config.frequency ? config.frequency * 2 : FIGURE_8.DEFAULT_Y_FREQUENCY;

    // 使用配置常量
    const centerX = world.width / 2;
    const centerY = config.centerY ?? FIGURE_8.CENTER_Y;
    const radiusX = config.radiusX ?? FIGURE_8.RADIUS_X;
    const radiusY = config.radiusY ?? FIGURE_8.RADIUS_Y;

    const targetX = centerX + Math.sin(time * freq) * radiusX;
    const targetY = centerY + Math.sin(time * yFreq) * radiusY;

    velocity.vx = (targetX - transform.x) * 2;
    velocity.vy = (targetY - transform.y) * 2;
    break;
```

---

## 测试策略

### 测试文件结构

```
tests/
├── systems/boss/
│   ├── BossEntranceSystem.test.ts
│   ├── BossMovementSystem.test.ts
│   ├── BossCombatSystem.test.ts
│   └── BossWorldHelpers.test.ts
├── integration/
│   └── BossIntegration.test.ts
└── configs/
    └── bossConstants.test.ts
```

### 测试覆盖重点

**BossEntranceSystem**
- ✅ 产生 `MoveIntent` 的正确性
- ✅ `SpeedModifier` 组件的添加和移除
- ✅ 浮点数精度处理
- ✅ 组件缺失的防御性处理

**BossMovementSystem**
- ✅ 每种移动模式的正确性
- ✅ 配置常量的使用
- ✅ 边界限制（不进入下半屏）
- ✅ 配置验证缺失的处理

**BossCombatSystem**
- ✅ 武器发射逻辑
- ✅ 阶段切换触发
- ✅ 事件推送

**集成测试**
- ✅ 完整流程：入场→战斗→阶段切换
- ✅ 多Boss互不干扰

---

## 实施计划

### 阶段1：基础设施（1-2h）
- [ ] 添加 `getComponents`, `removeComponentByType`, `removeComponentIfExists`
- [ ] 添加数学辅助函数
- [ ] 为新函数编写单元测试

### 阶段2：配置提取（1h）
- [ ] 扩展 `bossConstants.ts`
- [ ] 提取所有魔法数字
- [ ] 更新现有代码使用新配置

### 阶段3：新增组件（30m）
- [ ] 添加 `SpeedModifier` 组件

### 阶段4：系统拆分（2-3h）
- [ ] 创建 `BossEntranceSystem.ts`
- [ ] 创建 `BossMovementSystem.ts`
- [ ] 创建 `BossCombatSystem.ts`
- [ ] 更新系统执行顺序

### 阶段5：测试迁移（2-3h）
- [ ] 创建各系统的单元测试
- [ ] 更新集成测试
- [ ] 确保所有测试通过

### 阶段6：文档与清理（1h）
- [ ] 更新 `src/engine/README.md`
- [ ] 添加系统职责说明
- [ ] 删除或备份原 `BossSystem.ts`
- [ ] 运行性能测试

**总计：约8-11小时**

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 系统执行顺序错误 | HIGH | 详细文档 + 集成测试 |
| 类型推导失败 | MEDIUM | 每阶段运行 `tsc --noEmit` |
| 性能回退 | MEDIUM | 一次性组件查找 + 性能测试 |
| 测试覆盖率下降 | LOW | 每个系统独立测试 |

---

## 成功标准

- [ ] 所有测试通过（单元 + 集成）
- [ ] 0 CRITICAL/HIGH 问题残留
- [ ] 代码审查通过
- [ ] 60fps 稳定，无性能回退
- [ ] 文档完整
- [ ] 现有功能无回归

---

## 参考资料

- [原始代码审查报告](../../.claude/session-output/)
- [ECS设计原则](../../src/engine/README.md)
- [Boss设计文档](../../docs/designs/BOSS_DESIGN.md)
