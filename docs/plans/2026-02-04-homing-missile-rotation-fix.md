# 导弹索敌旋转修复实施方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 修复导弹追踪目标时精灵图保持竖直的问题，并优化目标搜索逻辑（限制每个敌人同时被锁定的导弹数量）。

**架构：** 在 HomingSystem 中修正旋转角度计算（增加90度偏移），在 HomingUpgrade 配置中添加可配置的最大锁定导弹数量参数，优化搜索逻辑避免过度集中火力。

**技术栈：** TypeScript, ECS架构, 组件配置系统

---

## 问题分析

### 当前问题
1. **旋转角度错误**：HomingSystem 第88行设置 `transform.rot = newAngle`，但缺少90度偏移
2. **缺少火力分散**：所有导弹可能锁定同一敌人，没有火力分散机制
3. **配置不可扩展**：没有配置项来控制锁定限制

### 对比旧版实现
旧版 GameEngine.ts 第831行：
```typescript
b.angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
```
关键差异：增加了 `Math.PI / 2` (90度) 偏移

---

## 实施步骤

### Task 0: 扩展标签组件支持 incomingMissiles 计数

**说明：** 为了让导弹能够同时追踪普通敌人和Boss，需要统一 EnemyTag 和 BossTag 的锁定计数机制。

**文件：**
- 修改: `src/engine/components/meta.ts:38-69`
- 测试: `tests/components/meta.test.ts`

**Step 1: 为 EnemyTag 添加 incomingMissiles 字段**

```typescript
// src/engine/components/meta.ts 第38-58行
export class EnemyTag extends Component {
    constructor(cfg: {
        id: EnemyId;
        state?: number;
        timer?: number;
        phaseOffset?: number;
    }) {
        super();
        this.id = cfg.id;
        this.state = cfg.state ?? 0;
        this.timer = cfg.timer ?? 0;
        this.phaseOffset = cfg.phaseOffset ?? 0;
        this.incomingMissiles = 0;  // 初始化计数器
    }
    public id: EnemyId;
    public state: number;
    public timer: number; // 计时器，用于行为模式切换等, 单位毫秒
    public phaseOffset: number; // 移动相位偏移，避免同步摆动

    /** 当前追踪此实体的导弹数量 */
    public incomingMissiles: number = 0;

    static check(c: any): c is EnemyTag { return c instanceof EnemyTag; }
}
```

**Step 2: 为 BossTag 添加 incomingMissiles 字段**

```typescript
// src/engine/components/meta.ts 第60-69行
export class BossTag extends Component {
    constructor(cfg: { id: BossId }) {
        super();
        this.id = cfg.id;
        this.incomingMissiles = 0;  // 初始化计数器
    }
    public id: BossId;

    /** 当前追踪此实体的导弹数量 */
    public incomingMissiles: number = 0;

    static check(c: any): c is BossTag { return c instanceof BossTag; }
}
```

**Step 3: 提交标签扩展**

```bash
git add src/engine/components/meta.ts
git commit -m "feat(tags): 为 EnemyTag 和 BossTag 添加 incomingMissiles 计数器"
```

---

### Task 1: 在 HomingUpgrade 配置中添加最大锁定导弹数量参数

**文件：**
- 修改: `src/engine/blueprints/base.ts:77-95`
- 测试: `tests/blueprints/ammo.test.ts`

**Step 1: 扩展 HomingUpgrade 接口**

```typescript
// 在 base.ts 中修改 HomingUpgrade 接口
export interface HomingUpgrade {
    /** 索敌范围（像素） */
    searchRange: number;
    /** 转向速度（弧度/秒） */
    turnSpeed: number;
    /** 单个敌人同时能被锁定的最大导弹数量（默认1，防止火力过度集中） */
    maxMissilesPerTarget?: number;
}
```

**Step 2: 提交配置扩展**

```bash
git add src/engine/blueprints/base.ts
git commit -m "feat(homing): 添加 maxMissilesPerTarget 配置项"
```

---

### Task 2: 修复 HomingSystem 旋转角度偏移

**文件：**
- 修改: `src/engine/systems/HomingSystem.ts:88`
- 测试: `tests/systems/HomingSystem.test.ts`

**Step 1: 编写失败测试 - 验证旋转角度**

```typescript
// tests/systems/HomingSystem.test.ts
describe('HomingSystem - 旋转角度', () => {
    it('应该将速度向量角度转换为精灵图旋转角度（加90度偏移）', () => {
        // 创建测试世界
        const world = createWorld(800, 600);

        // 创建子弹（速度向右：vx=10, vy=0）
        const bulletId = createEntity(world);
        addComponent(world, bulletId, new Transform({ x: 400, y: 300, rot: 0 }));
        addComponent(world, bulletId, new Velocity({ vx: 10, vy: 0 }));

        // 创建目标敌人
        const enemyId = createEntity(world);
        addComponent(world, enemyId, new Transform({ x: 500, y: 300 }));
        addComponent(world, enemyId, new EnemyTag());

        // 添加 Homing 组件
        addComponent(world, bulletId, new Homing({
            searchRange: 200,
            turnSpeed: Math.PI, // 足够大的转向速度，确保能立即转向
            targetId: enemyId
        }));

        // 执行系统
        HomingSystem(world, 16);

        // 验证：速度向右（0弧度），精灵图旋转应该加90度（PI/2）
        const comps = getEntity(world, bulletId);
        const transform = comps?.find(Transform.check) as Transform;
        expect(transform.rot).toBeCloseTo(Math.PI / 2, 2); // 允许0.01误差
    });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/HomingSystem.test.ts -t "应该将速度向量角度转换为精灵图旋转角度"
```

预期：FAIL - 当前实现返回 0 而不是 Math.PI/2

**Step 3: 修复 HomingSystem 旋转角度**

在 `src/engine/systems/HomingSystem.ts` 第88行修改：

```typescript
// 旧代码
transform.rot = newAngle;

// 新代码 - 加上90度偏移，因为精灵图原始朝向是向上的
transform.rot = newAngle + Math.PI / 2;
```

**Step 4: 运行测试验证通过**

```bash
pnpm test tests/systems/HomingSystem.test.ts -t "应该将速度向量角度转换为精灵图旋转角度"
```

预期：PASS

**Step 5: 提交旋转修复**

```bash
git add src/engine/systems/HomingSystem.ts tests/systems/HomingSystem.test.ts
git commit -m "fix(homing): 修正导弹旋转角度，增加90度偏移以匹配精灵图朝向"
```

---

### Task 3: 实现基于实体类型的差异化锁定限制

**说明：** Boss 和普通敌人应该有不同的默认锁定限制，以匹配游戏设计需求。

**设计原则：**
- 普通敌人（100 HP）：默认1枚导弹锁定
- Boss（5000 HP）：默认3枚导弹锁定，集中火力
- 仍然支持通过 `maxMissilesPerTarget` 配置覆盖

**文件：**
- 修改: `src/engine/systems/HomingSystem.ts:1-15, 38-56`
- 测试: `tests/systems/HomingSystem.test.ts`

**Step 1: 添加辅助函数获取默认锁定限制**

在 `src/engine/systems/HomingSystem.ts` 文件顶部（导入语句之后）添加：

```typescript
/**
 * 获取目标的默认导弹锁定限制
 * @param targetComps 目标实体的组件列表
 * @param userConfig 用户配置的限制（如果提供）
 * @returns 最大锁定导弹数量
 */
function getDefaultMaxMissiles(
    targetComps: Component[] | undefined,
    userConfig?: number
): number {
    // 如果用户提供了明确配置，使用用户配置
    if (userConfig !== undefined) {
        return userConfig;
    }

    // 否则根据实体类型返回默认值
    if (!targetComps) {
        return 1; // 默认1枚
    }

    const hasBossTag = targetComps.some(BossTag.check);
    const hasEnemyTag = targetComps.some(EnemyTag.check);

    if (hasBossTag) {
        return 3; // Boss 可以被3枚导弹锁定（集中火力）
    } else if (hasEnemyTag) {
        return 1; // 普通敌人1枚（避免火力浪费）
    }

    return 1; // 其他情况默认1枚
}
```

**Step 2: 更新导入语句以包含 BossTag**

```typescript
// src/engine/systems/HomingSystem.ts 第13行
// 旧代码
import { Transform, Velocity, Homing, Health, EnemyTag } from '../components';

// 新代码
import { Transform, Velocity, Homing, Health, EnemyTag, BossTag } from '../components';
```

**Step 3: 编写失败测试 - 验证 Boss 和普通敌人的差异化锁定**

```typescript
// tests/systems/HomingSystem.test.ts
describe('HomingSystem - 差异化锁定限制', () => {
    it('Boss 默认可以被3枚导弹锁定，普通敌人默认1枚', () => {
        const world = createWorld(800, 600);

        // 创建 Boss
        const bossId = createEntity(world);
        addComponent(world, bossId, new Transform({ x: 400, y: 200 }));
        addComponent(world, bossId, new Velocity({ vx: 0, vy: 2 }));
        addComponent(world, bossId, new BossTag({ id: 'guardian' as any }));
        addComponent(world, bossId, new Health({ hp: 5000, maxHp: 5000 }));

        // 创建普通敌人
        const enemyId = createEntity(world);
        addComponent(world, enemyId, new Transform({ x: 200, y: 200 }));
        addComponent(world, enemyId, new Velocity({ vx: 0, vy: 2 }));
        addComponent(world, enemyId, new EnemyTag({ id: 'scout' as any }));
        addComponent(world, enemyId, new Health({ hp: 100, maxHp: 100 }));

        // 创建5枚导弹
        const missileIds = [1, 2, 3, 4, 5].map(() => {
            const id = createEntity(world);
            addComponent(world, id, new Transform({ x: 400, y: 500 }));
            addComponent(world, id, new Velocity({ vx: 0, vy: -10 }));
            addComponent(world, id, new Homing({
                searchRange: 1000,
                turnSpeed: Math.PI
                // 不设置 maxMissilesPerTarget，使用默认值
            }));
            return id;
        });

        // 执行系统
        HomingSystem(world, 16);

        // 统计锁定 Boss 的导弹数量（应该是3枚）
        const bossLockedCount = missileIds.filter(id => {
            const comps = getEntity(world, id);
            const homing = comps?.find(Homing.check) as Homing;
            return homing.targetId === bossId;
        }).length;

        // 统计锁定普通敌人的导弹数量（应该是1枚）
        const enemyLockedCount = missileIds.filter(id => {
            const comps = getEntity(world, id);
            const homing = comps?.find(Homing.check) as Homing;
            return homing.targetId === enemyId;
        }).length;

        // 验证：Boss 应该被3枚导弹锁定
        expect(bossLockedCount).toBe(3);

        // 验证：普通敌人应该被1枚导弹锁定
        expect(enemyLockedCount).toBe(1);

        // 验证：Boss 的 incomingMissiles 计数正确
        const bossComps = getEntity(world, bossId);
        const bossTag = bossComps?.find(BossTag.check) as BossTag;
        expect(bossTag.incomingMissiles).toBe(3);

        // 验证：普通敌人的 incomingMissiles 计数正确
        const enemyComps = getEntity(world, enemyId);
        const enemyTag = enemyComps?.find(EnemyTag.check) as EnemyTag;
        expect(enemyTag.incomingMissiles).toBe(1);
    });

    it('应该能够追踪 Boss 实体', () => {
        const world = createWorld(800, 600);

        // 创建 Boss（使用 BossTag）
        const bossId = createEntity(world);
        addComponent(world, bossId, new Transform({ x: 400, y: 200 }));
        addComponent(world, bossId, new Velocity({ vx: 0, vy: 2 }));
        addComponent(world, bossId, new BossTag({ id: 'guardian' as any }));
        addComponent(world, bossId, new Health({ hp: 5000, maxHp: 5000 }));

        // 创建导弹
        const missileId = createEntity(world);
        addComponent(world, missileId, new Transform({ x: 400, y: 500 }));
        addComponent(world, missileId, new Velocity({ vx: 0, vy: -10 }));
        addComponent(world, missileId, new Homing({
            searchRange: 500,
            turnSpeed: Math.PI
        }));

        // 执行系统
        HomingSystem(world, 16);

        // 验证：导弹应该锁定 Boss
        const missileComps = getEntity(world, missileId);
        const homing = missileComps?.find(Homing.check) as Homing;
        expect(homing.targetId).toBe(bossId);

        // 验证：Boss 的 incomingMissiles 计数应该增加
        const bossComps = getEntity(world, bossId);
        const bossTag = bossComps?.find(BossTag.check) as BossTag;
        expect(bossTag.incomingMissiles).toBe(1);
    });

    it('应该同时在敌人和 Boss 中选择最近的目标', () => {
        const world = createWorld(800, 600);

        // 创建导弹位置：(400, 500)
        const missileId = createEntity(world);
        addComponent(world, missileId, new Transform({ x: 400, y: 500 }));
        addComponent(world, missileId, new Velocity({ vx: 0, vy: -10 }));
        addComponent(world, missileId, new Homing({
            searchRange: 1000,
            turnSpeed: Math.PI
        }));

        // 创建远处的敌人：(200, 200) - 距离约360
        const enemyId = createEntity(world);
        addComponent(world, enemyId, new Transform({ x: 200, y: 200 }));
        addComponent(world, enemyId, new EnemyTag({ id: 'scout' as any }));
        addComponent(world, enemyId, new Health({ hp: 100, maxHp: 100 }));

        // 创建近处的 Boss：(450, 300) - 距离约223
        const bossId = createEntity(world);
        addComponent(world, bossId, new Transform({ x: 450, y: 300 }));
        addComponent(world, bossId, new BossTag({ id: 'guardian' as any }));
        addComponent(world, bossId, new Health({ hp: 5000, maxHp: 5000 }));

        // 执行系统
        HomingSystem(world, 16);

        // 验证：应该锁定更近的 Boss
        const missileComps = getEntity(world, missileId);
        const homing = missileComps?.find(Homing.check) as Homing;
        expect(homing.targetId).toBe(bossId);
    });

    it('用户配置可以覆盖默认的锁定限制', () => {
        const world = createWorld(800, 600);

        // 创建 Boss
        const bossId = createEntity(world);
        addComponent(world, bossId, new Transform({ x: 400, y: 200 }));
        addComponent(world, bossId, new BossTag({ id: 'guardian' as any }));
        addComponent(world, bossId, new Health({ hp: 5000, maxHp: 5000 }));

        // 创建5枚导弹，但限制最多1枚锁定（覆盖默认的3枚）
        const missileIds = [1, 2, 3, 4, 5].map(() => {
            const id = createEntity(world);
            addComponent(world, id, new Transform({ x: 400, y: 500 }));
            addComponent(world, id, new Velocity({ vx: 0, vy: -10 }));
            addComponent(world, id, new Homing({
                searchRange: 1000,
                turnSpeed: Math.PI,
                maxMissilesPerTarget: 1  // 覆盖默认值
            }));
            return id;
        });

        // 执行系统
        HomingSystem(world, 16);

        // 统计锁定 Boss 的导弹数量
        const bossLockedCount = missileIds.filter(id => {
            const comps = getEntity(world, id);
            const homing = comps?.find(Homing.check) as Homing;
            return homing.targetId === bossId;
        }).length;

        // 验证：虽然 Boss 默认可以被3枚导弹锁定，但用户配置限制为1枚
        expect(bossLockedCount).toBe(1);
    });
});
```

**Step 3: 运行测试验证失败**

```bash
pnpm test tests/systems/HomingSystem.test.ts -t "应该能够追踪 Boss"
```

预期：FAIL - 当前实现只搜索 EnemyTag，不包含 BossTag

**Step 4: 修改 HomingSystem 实现差异化锁定限制**

在 `src/engine/systems/HomingSystem.ts` 的搜索逻辑中，使用 `getDefaultMaxMissiles` 函数：

```typescript
// 搜索新目标
if (homing.targetId === undefined) {
    // 使用距离平方比较，避免 Math.sqrt 开销
    const searchRangeSq = homing.searchRange * homing.searchRange;
    let nearestDistSq = searchRangeSq;
    let nearestId: EntityId | undefined;

    // 同时搜索带 Transform 和 EnemyTag 的实体
    for (const [enemyId, [enemyTransform, enemyTag]] of view(world, [Transform, EnemyTag])) {
        const dx = enemyTransform.x - transform.x;
        const dy = enemyTransform.y - transform.y;
        const distSq = dx * dx + dy * dy;

        // 使用差异化锁定限制
        const enemyComps = getEntity(world, enemyId);
        const maxLocks = getDefaultMaxMissiles(enemyComps, homing.maxMissilesPerTarget);
        if (enemyTag.incomingMissiles >= maxLocks) {
            continue; // 跳过已达到锁定上限的敌人
        }

        if (distSq < nearestDistSq) {
            nearestDistSq = distSq;
            nearestId = enemyId;
        }
    }

    // 搜索 Boss（使用相同逻辑）
    for (const [bossId, [bossTransform, bossTag]] of view(world, [Transform, BossTag])) {
        const dx = bossTransform.x - transform.x;
        const dy = bossTransform.y - transform.y;
        const distSq = dx * dx + dy * dy;

        // 使用差异化锁定限制
        const bossComps = getEntity(world, bossId);
        const maxLocks = getDefaultMaxMissiles(bossComps, homing.maxMissilesPerTarget);
        if (bossTag.incomingMissiles >= maxLocks) {
            continue; // 跳过已达到锁定上限的Boss
        }

        if (distSq < nearestDistSq) {
            nearestDistSq = distSq;
            nearestId = bossId;
        }
    }

    // 锁定目标后增加计数
    if (nearestId !== undefined) {
        // 获取目标的标签组件（EnemyTag 或 BossTag）
        const comps = getEntity(world, nearestId);
        const enemyTag = comps?.find(EnemyTag.check);
        const bossTag = comps?.find(BossTag.check);

        if (enemyTag) {
            enemyTag.incomingMissiles++;
        } else if (bossTag) {
            bossTag.incomingMissiles++;
        }

        homing.targetId = nearestId;
    }
}
```

**Step 5: 更新目标验证逻辑以支持 Boss**

在 `src/engine/systems/HomingSystem.ts` 第22-35行的目标验证逻辑中：

```typescript
// 验证目标有效性
if (homing.targetId !== undefined) {
    const target = getEntity(world, homing.targetId);
    if (!target) {
        // 目标实体不存在，清除目标ID并减少计数
        const oldComps = getEntity(world, homing.targetId);
        const enemyTag = oldComps?.find(EnemyTag.check);
        const bossTag = oldComps?.find(BossTag.check);

        if (enemyTag && enemyTag.incomingMissiles > 0) {
            enemyTag.incomingMissiles--;
        } else if (bossTag && bossTag.incomingMissiles > 0) {
            bossTag.incomingMissiles--;
        }

        homing.targetId = undefined;
    } else {
        const [targetHealth] = getComponents(world, homing.targetId, [Health]);
        if (!targetHealth || targetHealth.hp <= 0) {
            // 目标死亡，清除目标ID并减少计数
            const oldComps = getEntity(world, homing.targetId);
            const enemyTag = oldComps?.find(EnemyTag.check);
            const bossTag = oldComps?.find(BossTag.check);

            if (enemyTag && enemyTag.incomingMissiles > 0) {
                enemyTag.incomingMissiles--;
            } else if (bossTag && bossTag.incomingMissiles > 0) {
                bossTag.incomingMissiles--;
            }

            homing.targetId = undefined;
        }
    }
}
```

**Step 6: 运行测试验证通过**

```bash
pnpm test tests/systems/HomingSystem.test.ts -t "应该能够追踪 Boss"
pnpm test tests/systems/HomingSystem.test.ts -t "应该同时在敌人和 Boss 中选择最近的目标"
```

预期：PASS

**Step 7: 提交 Boss 追踪支持**

```bash
git add src/engine/systems/HomingSystem.ts tests/systems/HomingSystem.test.ts
git commit -m "feat(homing): 支持同时追踪普通敌人和 Boss"
```

---

### Task 4: 实现 maxMissilesPerTarget 限制逻辑

**文件：**
- 修改: `src/engine/systems/HomingSystem.ts:38-89`（已在 Task 3 中完成）
- 测试: `tests/systems/HomingSystem.test.ts`

**说明：** 锁定限制逻辑已在 Task 3 的 Step 4 中实现（检查 `incomingMissiles >= maxLocks`）

**Step 1: 编写失败测试 - 验证锁定限制**

```typescript
// tests/systems/HomingSystem.test.ts
describe('HomingSystem - 锁定限制', () => {
    it('应该限制每个敌人最多被1枚导弹锁定（默认配置）', () => {
        const world = createWorld(800, 600);

        // 创建1个敌人
        const enemyId = createEntity(world);
        addComponent(world, enemyId, new Transform({ x: 400, y: 200 }));
        addComponent(world, enemyId, new EnemyTag());

        // 创建3枚导弹（都应该能锁定同一个敌人，因为没有限制）
        const missileIds = [1, 2, 3].map(() => {
            const id = createEntity(world);
            addComponent(world, id, new Transform({ x: 400, y: 500 }));
            addComponent(world, id, new Velocity({ vx: 0, vy: -10 }));
            addComponent(world, id, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI
            }));
            return id;
        });

        // 执行系统
        HomingSystem(world, 16);

        // 验证：如果没有限制，所有导弹都应该锁定敌人
        // 这个测试在实现限制后会失败，需要添加 maxMissilesPerTarget 支持
        missileIds.forEach(id => {
            const comps = getEntity(world, id);
            const homing = comps?.find(Homing.check) as Homing;
            expect(homing.targetId).toBe(enemyId);
        });
    });

    it('应该限制每个敌人最多被2枚导弹锁定（配置 maxMissilesPerTarget=2）', () => {
        const world = createWorld(800, 600);

        // 创建1个敌人
        const enemyId = createEntity(world);
        addComponent(world, enemyId, new Transform({ x: 400, y: 200 }));
        addComponent(world, enemyId, new EnemyTag());

        // 创建5枚导弹
        const missileIds = [1, 2, 3, 4, 5].map(() => {
            const id = createEntity(world);
            addComponent(world, id, new Transform({ x: 400, y: 500 }));
            addComponent(world, id, new Velocity({ vx: 0, vy: -10 }));
            addComponent(world, id, new Homing({
                searchRange: 500,
                turnSpeed: Math.PI,
                maxMissilesPerTarget: 2  // 配置限制
            }));
            return id;
        });

        // 执行系统
        HomingSystem(world, 16);

        // 统计锁定该敌人的导弹数量
        const lockedCount = missileIds.filter(id => {
            const comps = getEntity(world, id);
            const homing = comps?.find(Homing.check) as Homing;
            return homing.targetId === enemyId;
        }).length;

        // 验证：最多2枚导弹应该锁定敌人
        expect(lockedCount).toBeLessThanOrEqual(2);
    });
});
```

**Step 2: 运行测试验证失败**

```bash
pnpm test tests/systems/HomingSystem.test.ts -t "应该限制每个敌人最多被"
```

预期：FAIL - 当前实现没有检查 `incomingMissiles` 计数

**Step 3: 添加 EnemyTag 组件的 incomingMissiles 计数**

首先需要在 `EnemyTag` 组件中添加 `incomingMissiles` 字段：

```typescript
// src/engine/components/combat.ts
export class EnemyTag extends Component {
    static check = (comp: Component): comp is EnemyTag => comp instanceof EnemyTag;

    /** 当前追踪此敌人的导弹数量 */
    incomingMissiles: number = 0;
}
```

**Step 4: 实现 HomingSystem 的锁定限制逻辑**

在 `src/engine/systems/HomingSystem.ts` 的搜索目标逻辑中添加计数检查：

```typescript
// 在第44-54行的搜索目标逻辑中修改
for (const [enemyId, [enemyTransform, enemyTag]] of view(world, [Transform, EnemyTag])) {
    const dx = enemyTransform.x - transform.x;
    const dy = enemyTransform.y - transform.y;
    const distSq = dx * dx + dy * dy;

    // 检查是否超过锁定限制
    const maxLocks = homing.maxMissilesPerTarget ?? 1;
    if (enemyTag.incomingMissiles >= maxLocks) {
        continue; // 跳过已达到锁定上限的敌人
    }

    if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearestId = enemyId;
    }
}

// 锁定目标后增加计数
if (nearestId !== undefined) {
    const [targetTag] = getComponents(world, nearestId, [EnemyTag]);
    if (targetTag) {
        targetTag.incomingMissiles++;
    }
}
```

**Step 5: 在 CleanupSystem 中清理计数（同时支持 EnemyTag 和 BossTag）**

当导弹被销毁时，需要减少目标敌人的计数：

```typescript
// 在清除目标时减少计数
if (homing.targetId !== undefined) {
    const target = getEntity(world, homing.targetId);
    if (!target) {
        // 减少旧目标的计数
        const [oldTag] = getComponents(world, homing.targetId, [EnemyTag]);
        if (oldTag && oldTag.incomingMissiles > 0) {
            oldTag.incomingMissiles--;
        }
        homing.targetId = undefined;
    } else {
        const [targetHealth] = getComponents(world, homing.targetId, [Health]);
        if (!targetHealth || targetHealth.hp <= 0) {
            // 减少死亡目标的计数
            const [oldTag] = getComponents(world, homing.targetId, [EnemyTag]);
            if (oldTag && oldTag.incomingMissiles > 0) {
                oldTag.incomingMissiles--;
            }
            homing.targetId = undefined;
        }
    }
}
```

**Step 6: 在 CleanupSystem 中清理计数**

当导弹被销毁时，需要减少目标敌人的计数：

```typescript
// 在 src/engine/systems/CleanupSystem.ts 中添加逻辑
export function cleanupDeadMissiles(world: World) {
    for (const [id] of view(world, [DestroyTag])) {
        const [homing] = getComponents(world, id, [Homing]);

        // 如果导弹有锁定目标，减少目标的计数（支持 EnemyTag 和 BossTag）
        if (homing && homing.targetId !== undefined) {
            const targetComps = getEntity(world, homing.targetId);
            if (targetComps) {
                const enemyTag = targetComps.find(EnemyTag.check);
                const bossTag = targetComps.find(BossTag.check);

                if (enemyTag && enemyTag.incomingMissiles > 0) {
                    enemyTag.incomingMissiles--;
                } else if (bossTag && bossTag.incomingMissiles > 0) {
                    bossTag.incomingMissiles--;
                }
            }
        }

        destroyEntity(world, id);
    }
}
```

**Step 7: 运行测试验证通过**

```bash
pnpm test tests/systems/HomingSystem.test.ts
```

预期：PASS

**Step 8: 提交锁定限制实现**

```bash
git add src/engine/systems/HomingSystem.ts src/engine/components/combat.ts src/engine/systems/CleanupSystem.ts tests/systems/HomingSystem.test.ts
git commit -m "feat(homing): 实现 maxMissilesPerTarget 限制，防止火力过度集中"
```

---

### Task 5: 添加配置默认值并验证集成

**文件：**
- 修改: `src/engine/systems/WeaponSystem.ts:283`
- 测试: `tests/integration/weapon-features-integration.test.ts`

**Step 1: 在 WeaponSystem 中应用默认配置**

```typescript
// src/engine/systems/WeaponSystem.ts 第283行附近
bulletBlueprint.Homing = {
    searchRange: upgradeConfig.homing.searchRange,
    turnSpeed: upgradeConfig.homing.turnSpeed,
    maxMissilesPerTarget: 1  // 默认每个敌人最多被1枚导弹锁定
};
```

**Step 2: 编写集成测试验证端到端行为**

```typescript
// tests/integration/homing-integration.test.ts
describe('导弹索敌集成测试', () => {
    it('应该在真实游戏循环中正确追踪目标并旋转', () => {
        const world = createWorld(800, 600);

        // 创建玩家
        const playerId = createEntity(world);
        addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
        addComponent(world, playerId, new Velocity({ vx: 0, vy: 0 }));
        addComponent(world, playerId, new PlayerTag());
        addComponent(world, playerId, new Weapon({
            weaponId: WeaponId.MISSILE,
            level: 1,
            cooldown: 0
        }));

        // 创建多个敌人
        const enemyIds = [1, 2, 3].map(i => {
            const id = createEntity(world);
            addComponent(world, id, new Transform({ x: 300 + i * 100, y: 200 }));
            addComponent(world, id, new Velocity({ vx: 0, vy: 2 }));
            addComponent(world, id, new EnemyTag({ id: 'scout' as any }));
            addComponent(world, id, new Health({ hp: 100, maxHp: 100 }));
            return id;
        });

        // 执行武器系统发射导弹
        WeaponSystem(world, 16);

        // 获取发射的导弹
        const missiles = [];
        for (const [id, comps] of view(world, [Homing])) {
            missiles.push({ id, comps });
        }

        // 验证：导弹应该分散锁定不同的敌人
        const lockedEnemies = new Set();
        missiles.forEach(missile => {
            const homing = missile.comps.find(Homing.check) as Homing;
            if (homing.targetId !== undefined) {
                lockedEnemies.add(homing.targetId);
            }
        });

        // 至少应该锁定了2个不同的敌人
        expect(lockedEnemies.size).toBeGreaterThanOrEqual(2);

        // 模拟游戏循环
        for (let i = 0; i < 60; i++) {
            HomingSystem(world, 16);
            MovementSystem(world, 16);
        }

        // 验证：导弹的旋转角度应该朝向目标
        missiles.forEach(missile => {
            const transform = missile.comps.find(Transform.check) as Transform;
            const homing = missile.comps.find(Homing.check) as Homing;
            const velocity = missile.comps.find(Velocity.check) as Velocity;

            if (homing.targetId !== undefined) {
                const targetComps = getEntity(world, homing.targetId);
                const targetTransform = targetComps?.find(Transform.check) as Transform;

                if (targetTransform) {
                    // 计算期望的角度（速度向量角度 + 90度偏移）
                    const expectedAngle = Math.atan2(velocity.vy, velocity.vx) + Math.PI / 2;
                    expect(transform.rot).toBeCloseTo(expectedAngle, 1);
                }
            }
        });
    });

    it('应该能够同时追踪普通敌人和 Boss', () => {
        const world = createWorld(800, 600);

        // 创建玩家
        const playerId = createEntity(world);
        addComponent(world, playerId, new Transform({ x: 400, y: 500 }));
        addComponent(world, playerId, new Velocity({ vx: 0, vy: 0 }));
        addComponent(world, playerId, new PlayerTag());
        addComponent(world, playerId, new Weapon({
            weaponId: WeaponId.MISSILE,
            level: 1,
            cooldown: 0
        }));

        // 创建普通敌人
        const enemyId = createEntity(world);
        addComponent(world, enemyId, new Transform({ x: 200, y: 200 }));
        addComponent(world, enemyId, new Velocity({ vx: 0, vy: 2 }));
        addComponent(world, enemyId, new EnemyTag({ id: 'scout' as any }));
        addComponent(world, enemyId, new Health({ hp: 100, maxHp: 100 }));

        // 创建 Boss（更近）
        const bossId = createEntity(world);
        addComponent(world, bossId, new Transform({ x: 450, y: 200 }));
        addComponent(world, bossId, new Velocity({ vx: 0, vy: 2 }));
        addComponent(world, bossId, new BossTag({ id: 'guardian' as any }));
        addComponent(world, bossId, new Health({ hp: 5000, maxHp: 5000 }));

        // 执行武器系统发射多枚导弹
        for (let i = 0; i < 5; i++) {
            WeaponSystem(world, 16);
        }

        // 获取发射的导弹
        const missiles = [];
        for (const [id, comps] of view(world, [Homing])) {
            missiles.push({ id, comps });
        }

        // 验证：至少有部分导弹锁定 Boss
        const bossLockedCount = missiles.filter(missile => {
            const homing = missile.comps.find(Homing.check) as Homing;
            return homing.targetId === bossId;
        }).length;

        expect(bossLockedCount).toBeGreaterThan(0);

        // 验证：Boss 的 incomingMissiles 计数正确
        const bossComps = getEntity(world, bossId);
        const bossTag = bossComps?.find(BossTag.check) as BossTag;
        expect(bossTag.incomingMissiles).toBe(bossLockedCount);
    });
});
```

**Step 3: 运行集成测试**

```bash
pnpm test tests/integration/homing-integration.test.ts
```

预期：PASS

**Step 4: 提交集成验证**

```bash
git add src/engine/systems/WeaponSystem.ts tests/integration/homing-integration.test.ts
git commit -m "test(homing): 添加端到端集成测试验证旋转和锁定限制"
```

---

### Task 6: 更新文档和类型定义

**文件：**
- 修改: `src/engine/blueprints/base.ts` (更新注释)
- 测试: 无

**Step 1: 更新 HomingUpgrade 接口文档**

```typescript
/**
 * 导弹索敌升级配置
 *
 * @remarks
 * 控制导弹的自动索敌行为，包括搜索范围、转向速度和锁定限制。
 *
 * **差异化锁定默认值：**
 * - 普通敌人（100 HP）：默认1枚导弹锁定，避免火力浪费
 * - Boss（5000 HP）：默认3枚导弹锁定，集中火力输出
 *
 * @example
 * ```typescript
 * // 使用默认值（Boss=3，普通敌人=1）
 * const homingConfig: HomingUpgrade = {
 *     searchRange: 300,
 *     turnSpeed: Math.PI
 * };
 *
 * // 覆盖默认值
 * const customConfig: HomingUpgrade = {
 *     searchRange: 300,
 *     turnSpeed: Math.PI,
 *     maxMissilesPerTarget: 5  // Boss也可以被5枚导弹锁定
 * };
 * ```
 */
export interface HomingUpgrade {
    /** 索敌范围（像素） */
    searchRange: number;

    /**
     * 转向速度（弧度/秒）
     *
     * @remarks
     * 控制导弹每秒能转向的最大角度。例如 `Math.PI` 表示180度/秒。
     */
    turnSpeed: number;

    /**
     * 单个目标同时能被锁定的最大导弹数量（可选，覆盖默认值）
     *
     * @remarks
     * 如果不提供，将使用基于实体类型的默认值：
     * - Boss：默认3枚（集中火力）
     * - 普通敌人：默认1枚（避免火力浪费）
     *
     * 设置此值将覆盖默认行为：
     * - `1`：强制每个目标最多被1枚导弹锁定
     * - `3`：允许最多3枚导弹锁定同一目标
     * - `undefined`：使用默认的差异化限制（推荐）
     *
     * @default undefined（使用基于实体类型的默认值）
     */
    maxMissilesPerTarget?: number;
}
```

**Step 2: 提交文档更新**

```bash
git add src/engine/blueprints/base.ts
git commit -m "docs(homing): 更新 HomingUpgrade 接口文档，说明 maxMissilesPerTarget 用法"
```

---

## 验收标准

### 功能验收
1. ✅ 导弹飞行时精灵图正确朝向目标（不再竖直）
2. ✅ 导弹能够同时追踪普通敌人（EnemyTag）和 Boss（BossTag）
3. ✅ **差异化锁定限制**：
   - 普通敌人：默认最多1枚导弹锁定（100HP，1枚够用）
   - Boss：默认最多3枚导弹锁定（5000HP，需要集中火力）
   - 用户配置可覆盖默认值
4. ✅ 导弹丢失目标或目标死亡时正确清理计数（EnemyTag 和 BossTag）
5. ✅ 所有现有测试通过
6. ✅ 新增单元测试和集成测试覆盖（包括 Boss 追踪和差异化锁定）

### 性能验收
- HomingSystem 执行时间不超过 0.1ms（每帧）
- 不引入额外的内存分配

### 代码质量验收
- 所有类型定义完整，无 `any` 类型
- 遵循 ECS 架构原则
- JSDoc 注释完整

---

## 风险与注意事项

### 风险1: 旋转角度偏移可能影响其他系统
**缓解措施:**
- 检查 RenderSystem 是否依赖 `transform.rot`
- 确认其他子弹类型的旋转逻辑

### 风险2: incomingMissiles 计数可能不同步
**缓解措施:**
- 在所有导弹销毁路径上清理计数
- 添加单元测试验证计数正确性

### 风险3: maxMissilesPerTarget 配置可能导致目标稀缺时无目标可锁定
**缓解措施:**
- 默认值设为1（保守）
- 文档中说明可调整该值

### 风险4: Boss 和普通敌人的 incomingMissiles 计数可能不一致
**缓解措施:**
- 统一使用两个独立的计数器（EnemyTag 和 BossTag 各自维护）
- 在所有计数更新处同时处理两种标签
- 添加单元测试验证 Boss 计数的正确性

### 风险5: Boss 可能被过多导弹锁定导致性能问题
**缓解措施:**
- Boss 的默认锁定限制为3枚（平衡性能和体验）
- 可通过配置调整 Boss 的锁定限制
- 在 HomingSystem 中优先选择距离最近的目标

### 风险6: 默认值可能不匹配所有游戏场景
**缓解措施:**
- 提供配置覆盖机制（maxMissilesPerTarget）
- 文档清晰说明默认值的选择理由
- 可根据游戏难度动态调整

---

## 后续优化建议

1. **智能目标优先级**：不仅考虑距离，还考虑目标血量、威胁程度
2. **动态调整锁定限制**：根据场上敌人数和导弹数动态平衡
3. **视觉反馈**：显示敌人被锁定的导弹数量
4. **性能优化**：使用空间分区加速索敌（当前O(N)复杂度）

---

**计划完成日期**: 2026-02-04
**预计工作量**: 2-3小时
**优先级**: P0 (核心体验问题)
