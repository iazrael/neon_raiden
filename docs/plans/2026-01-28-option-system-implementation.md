# OPTION僚机系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 实现环绕攻击型僚机系统，玩家拾取OPTION道具增加僚机（最多2个），僚机环绕玩家旋转并固定发射VULCAN武器。

**架构:** 基于现有ECS架构，通过新增Option和OptionCount组件管理僚机，OptionSystem处理环绕逻辑，WeaponSystem统一处理玩家和僚机的武器发射。

**技术栈:** TypeScript, ECS (Entity Component System), Canvas 2D

---

## 前置检查

**验证需求文档:**
- 阅读: `docs/plans/2026-01-28-option-system-design.md`
- 确认理解: 僚机拾取/环绕/发射的完整流程

**验证现有代码:**
- 检查: `src/engine/components/PlayerTag.ts` - 需要扩展isOption属性
- 检查: `src/engine/systems/PickupSystem.ts` - 需要修改OPTION分支
- 检查: `src/engine/systems/WeaponSystem.ts` - 需要支持僚机发射

---

## Task 1: 创建 Option 组件

**Files:**
- Create: `src/engine/components/Option.ts`
- Modify: `src/engine/components/index.ts`

**Step 1: 创建组件文件**

创建 `src/engine/components/Option.ts`:

```typescript
import { Component } from './base';

export class Option extends Component {
    static check = (comp: Component): comp is Option => comp instanceof Option;

    index: number;
    radius: number;
    angle: number;
    rotationSpeed: number;
    lerpFactor: number;

    constructor(index: number) {
        super();
        this.index = index;
        this.radius = 60;
        this.angle = index * Math.PI;
        this.rotationSpeed = 2;
        this.lerpFactor = 0.2;
    }
}
```

**Step 2: 导出组件**

修改 `src/engine/components/index.ts`，添加导出：

```typescript
export * from './Option';
```

**Step 3: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 4: 提交**

```bash
git add src/engine/components/Option.ts src/engine/components/index.ts
git commit -m "feat(components): 添加Option组件用于僚机实体"
```

---

## Task 2: 创建 OptionCount 组件

**Files:**
- Create: `src/engine/components/OptionCount.ts`
- Modify: `src/engine/components/index.ts`

**Step 1: 创建组件文件**

创建 `src/engine/components/OptionCount.ts`:

```typescript
import { Component } from './base';

export class OptionCount extends Component {
    static check = (comp: Component): comp is OptionCount => comp instanceof OptionCount;

    count: number;
    maxCount: number;

    constructor(count: number = 0, maxCount: number = 2) {
        super();
        this.count = Math.min(count, maxCount);
        this.maxCount = maxCount;
    }
}
```

**Step 2: 导出组件**

修改 `src/engine/components/index.ts`，添加导出：

```typescript
export * from './OptionCount';
```

**Step 3: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 4: 提交**

```bash
git add src/engine/components/OptionCount.ts src/engine/components/index.ts
git commit -m "feat(components): 添加OptionCount组件追踪僚机数量"
```

---

## Task 3: 扩展 PlayerTag 组件

**Files:**
- Modify: `src/engine/components/PlayerTag.ts`

**Step 1: 添加 isOption 属性**

在 `src/engine/components/PlayerTag.ts` 中找到 PlayerTag 类定义，添加属性：

```typescript
export class PlayerTag extends Component {
    static check = (comp: Component): comp is PlayerTag => comp instanceof PlayerTag;

    /** 是否为僚机（默认为false表示玩家） */
    isOption: boolean;

    constructor(options?: { isOption?: boolean }) {
        super();
        this.isOption = options?.isOption ?? false;
    }
}
```

**Step 2: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 3: 提交**

```bash
git add src/engine/components/PlayerTag.ts
git commit -m "feat(components): 扩展PlayerTag支持僚机标记"
```

---

## Task 4: 修改 PickupSystem 处理 OPTION 拾取

**Files:**
- Modify: `src/engine/systems/PickupSystem.ts`

**Step 1: 导入新组件**

在 `src/engine/systems/PickupSystem.ts` 顶部导入区域添加：

```typescript
import { Option, OptionCount } from '../components/Option';
import { PlayerTag } from '../components/PlayerTag';
import { Transform, Sprite, Weapon } from '../components';
import { WeaponId, AmmoType, WeaponPattern } from '../types';
import { generateId } from '../world';
```

**Step 2: 添加辅助函数**

在文件末尾添加辅助函数：

```typescript
function spawnOptionEntity(world: World, playerId: number, index: number): void {
    const playerComps = world.entities.get(playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    const optionId = generateId();
    const angle = index * Math.PI;

    world.entities.set(optionId, [
        new Transform({
            x: playerTransform.x + Math.cos(angle) * 60,
            y: playerTransform.y + Math.sin(angle) * 60,
            rot: 0
        }),
        new Sprite({
            spriteKey: 'option',
            color: '#00ffff',
            scale: 0.8
        }),
        new Option(index),
        new Weapon({
            id: WeaponId.VULCAN,
            ammoType: AmmoType.VULCAN_SPREAD,
            cooldown: 150,
            curCD: 0,
            maxLevel: 1,
            bulletCount: 1,
            spread: 0,
            pattern: WeaponPattern.AIMED,
            fireRateMultiplier: 1.0,
            damageMultiplier: 0.5,
            pierceBonus: 0,
            bouncesBonus: 0
        }),
        new PlayerTag({ isOption: true })
    ]);
}
```

**Step 3: 修改 BuffType.OPTION 分支**

找到 `case BuffType.OPTION:` 分支（约第149行），替换为：

```typescript
        case BuffType.OPTION:
            // OPTION: 增加僚机
            let optionCount = playerComps.find(OptionCount.check);
            if (optionCount) {
                // 已有 OptionCount 组件，增加计数
                const oldCount = optionCount.count;
                optionCount.count = Math.min(optionCount.count + 1, optionCount.maxCount);

                // 如果达到上限，播放提示音
                if (optionCount.count === optionCount.maxCount && oldCount < optionCount.maxCount) {
                    pushEvent(world, {
                        type: 'PlaySound',
                        soundId: 'option_max'
                    } as PlaySoundEvent);
                }

                // 创建新的僚机实体（如果未达到上限）
                if (optionCount.count < optionCount.maxCount) {
                    spawnOptionEntity(world, playerId, optionCount.count - 1);
                }
            } else {
                // 首次拾取，创建 OptionCount 组件和第一个僚机
                playerComps.push(new OptionCount(1, 2));
                spawnOptionEntity(world, playerId, 0);
            }

            // 播放拾取特效
            pushEvent(world, {
                type: 'Pickup',
                pos: { x: 0, y: 0 },
                itemId: BuffType.OPTION,
                owner: playerId
            } as PickupEvent);
            break;
```

**Step 4: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 5: 提交**

```bash
git add src/engine/systems/PickupSystem.ts
git commit -m "feat(PickupSystem): 拾取OPTION道具时增加僚机"
```

---

## Task 5: 创建 OptionSystem

**Files:**
- Create: `src/engine/systems/OptionSystem.ts`
- Modify: `src/engine/systems/index.ts`

**Step 1: 创建 OptionSystem 文件**

创建 `src/engine/systems/OptionSystem.ts`:

```typescript
/**
 * 僚机系统 (OptionSystem)
 *
 * 职责：
 * - 更新僚机位置（环绕玩家旋转）
 * - 同步僚机数量
 * - 管理僚机实体生命周期
 *
 * 系统类型：行动层
 * 执行顺序：P3 - 在 MovementSystem 之后
 */

import { World } from '../types';
import { Transform, Option, OptionCount, PlayerTag } from '../components';
import { removeComponent } from '../world';
import { generateId } from '../world';
import { WeaponId, AmmoType, WeaponPattern } from '../types';

/**
 * 环绕半径（像素）
 */
const OPTION_RADIUS = 60;

/**
 * 旋转速度（弧度/秒）
 */
const ROTATION_SPEED = 2;

/**
 * 缓动系数（0-1）
 */
const LERP_FACTOR = 0.2;

/**
 * 僚机系统主函数
 */
export function OptionSystem(world: World, dt: number): void {
    // 获取玩家组件
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    // 查找 OptionCount 组件
    const optionCount = playerComps.find(OptionCount.check);
    const currentCount = optionCount ? optionCount.count : 0;

    // 遍历所有实体，找出所有僚机
    const optionEntities: Array<{ id: number; comps: any[] }> = [];
    for (const [id, comps] of world.entities) {
        const playerTag = comps.find(PlayerTag.check);
        if (playerTag && (playerTag as PlayerTag).isOption) {
            optionEntities.push({ id, comps });
        }
    }

    // 更新每个僚机的位置
    const now = world.time;
    for (const { id, comps } of optionEntities) {
        const option = comps.find(Option.check);
        const transform = comps.find(Transform.check);

        if (!option || !transform) continue;

        // 计算目标位置（环绕玩家旋转）
        const angle = (now / 1000) * ROTATION_SPEED + option.angle;
        const targetX = playerTransform.x + Math.cos(angle) * OPTION_RADIUS;
        const targetY = playerTransform.y + Math.sin(angle) * OPTION_RADIUS;

        // 平滑移动到目标位置
        transform.x += (targetX - transform.x) * LERP_FACTOR;
        transform.y += (targetY - transform.y) * LERP_FACTOR;
    }

    // 如果当前数量和实体数量不匹配，同步
    if (optionEntities.length !== currentCount) {
        if (currentCount > optionEntities.length) {
            // 需要创建新僚机
            for (let i = optionEntities.length; i < currentCount; i++) {
                spawnOptionEntity(world, world.playerId, i);
            }
        } else if (currentCount < optionEntities.length) {
            // 需要删除多余的僚机（从末尾开始）
            for (let i = currentCount; i < optionEntities.length; i++) {
                const { id } = optionEntities[i];
                world.entities.delete(id);
            }
        }
    }
}

/**
 * 辅助函数：创建僚机实体
 */
function spawnOptionEntity(world: World, playerId: number, index: number): void {
    const playerComps = world.entities.get(playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    if (!playerTransform) return;

    const optionId = generateId();
    const angle = index * Math.PI;

    world.entities.set(optionId, [
        new Transform({
            x: playerTransform.x + Math.cos(angle) * OPTION_RADIUS,
            y: playerTransform.y + Math.sin(angle) * OPTION_RADIUS,
            rot: 0
        }),
        new Sprite({
            spriteKey: 'option',
            color: '#00ffff',
            scale: 0.8
        }),
        new Option(index),
        new Weapon({
            id: WeaponId.VULCAN,
            ammoType: AmmoType.VULCAN_SPREAD,
            cooldown: 150,
            curCD: 0,
            maxLevel: 1,
            bulletCount: 1,
            spread: 0,
            pattern: WeaponPattern.AIMED,
            fireRateMultiplier: 1.0,
            damageMultiplier: 0.5,
            pierceBonus: 0,
            bouncesBonus: 0
        }),
        new PlayerTag({ isOption: true })
    ]);
}
```

**Step 2: 导出系统**

修改 `src/engine/systems/index.ts`，添加导出：

```typescript
export * from './OptionSystem';
```

**Step 3: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 4: 提交**

```bash
git add src/engine/systems/OptionSystem.ts src/engine/systems/index.ts
git commit -m "feat(systems): 添加OptionSystem处理僚机环绕和同步"
```

---

## Task 6: 修改 WeaponSystem 支持僚机发射

**Files:**
- Modify: `src/engine/systems/WeaponSystem.ts` (或 WeaponFiringSystem)

**Step 1: 导入 PlayerTag**

在 WeaponSystem 顶部导入区域添加：

```typescript
import { PlayerTag } from '../components';
```

**Step 2: 修改武器发射逻辑**

找到武器发射逻辑，修改为收集所有有Weapon组件且标记为玩家或僚机的实体：

```typescript
// 收集所有有 Weapon 组件的实体（玩家 + 僚机）
const weaponEntities: Array<{ id: number; comps: Component[] }> = [];

for (const [id, comps] of world.entities) {
    const weapon = comps.find(Weapon.check);
    const playerTag = comps.find(PlayerTag.check);

    if (weapon && playerTag) {
        weaponEntities.push({ id, comps });
    }
}

// 为每个实体（玩家 + 僚机）处理武器发射
for (const { id, comps } of weaponEntities) {
    const weapon = comps.find(Weapon.check) as Weapon;
    const transform = comps.find(Transform.check) as Transform;
    const fireIntent = comps.find(FireIntent.check);

    if (!transform || !fireIntent) continue;

    // 处理冷却和发射
    weapon.curCD -= dt;
    if (weapon.curCD <= 0) {
        // 发射子弹逻辑（使用id作为owner）
        // ...
        weapon.curCD = weapon.cooldown;
    }
}
```

**注意:** 具体修改需要根据现有WeaponSystem的代码结构调整。

**Step 3: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 4: 提交**

```bash
git add src/engine/systems/WeaponSystem.ts
git commit -m "feat(WeaponSystem): 支持僚机发射VULCAN武器"
```

---

## Task 7: 更新 powerups.ts 配置

**Files:**
- Modify: `src/engine/configs/powerups.ts`

**Step 1: 添加 OPTION 配置**

在 `src/engine/configs/powerups.ts` 的 `BUFF_CONFIG` 对象中添加：

```typescript
    [BuffType.OPTION]: {
        /** 每次拾取增加的僚机数量 */
        countIncrease: 1,
        /** 最大僚机数量 */
        maxCount: 2,
        /** 达到上限时的提示音 */
        maxSound: 'option_max',
    },
```

添加位置：在现有配置项之后，确保在闭合的 `} as const;` 之前

**Step 2: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 3: 提交**

```bash
git add src/engine/configs/powerups.ts
git commit -m "feat(configs): 添加OPTION道具配置"
```

---

## Task 8: 引擎系统集成

**Files:**
- Modify: `src/engine/engine.ts`

**Step 1: 导入 OptionSystem 和 OptionCount**

在 `src/engine/engine.ts` 顶部导入区域添加：

```typescript
import { OptionSystem } from './systems/OptionSystem';
import { OptionCount } from './components/OptionCount';
```

**Step 2: 在 update 方法中添加 OptionSystem**

在 `src/engine/engine.ts` 的 `update` 方法中找到 `MovementSystem(world, dt);` 调用，在其后添加：

```typescript
        OptionSystem(world, dt);
```

添加位置：在 P3 行动层，MovementSystem 之后

**Step 3: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 4: 运行构建**

```bash
npm run build
```

Expected: 构建成功，无错误

**Step 5: 提交**

```bash
git add src/engine/engine.ts
git commit -m "feat(engine): 集成OptionSystem到主循环"
```

---

## Task 9: 为玩家实体初始化 OptionCount 组件

**Files:**
- Modify: `src/engine/blueprints/fighters.ts`

**Step 1: 查找玩家蓝图位置**

在 `src/engine/blueprints/fighters.ts` 中找到玩家蓝图定义

**Step 2: 添加 OptionCount 组件**

在玩家蓝图中添加：

```typescript
OptionCount: { count: 0, maxCount: 2 }
```

或如果是代码创建：

```typescript
new OptionCount(0, 2)
```

**Step 3: 验证类型检查**

```bash
npm run build
```

Expected: 构建成功，无类型错误

**Step 4: 提交**

```bash
git add <找到的玩家创建文件>
git commit -m "feat(player): 为玩家初始化OptionCount组件（0个僚机，最多2个）"
```

---

## Task 10: 集成测试和文档更新

**Files:**
- Modify: `src/engine/README.md` 或相关文档
- Create: 手动测试文档

**Step 1: 更新系统架构文档**

在相关文档中添加 OptionSystem 的说明：

```markdown
### OptionSystem (僚机系统)
- 职责：处理僚机环绕和发射逻辑
- 环绕模式：60像素半径，2弧度/秒旋转
- 武器：固定发射VULCAN武器
- 依赖：Option、OptionCount、PlayerTag组件
```

**Step 2: 创建手动测试清单**

创建 `docs/tests/option-system-test-checklist.md`:

```markdown
# 僚机系统测试清单

## 基础功能测试
- [ ] 拾取OPTION道具后，僚机数量从0增加到1
- [ ] 连续拾取2个OPTION道具，僚机数量达到2
- [ ] 拾取第3个OPTION道具，僚机数量保持2（达到上限）
- [ ] 僚机正确环绕玩家旋转（60像素半径）
- [ ] 2个僚机间隔180度（0和π弧度）

## 发射测试
- [ ] 僚机自动发射VULCAN子弹
- [ ] 僚机子弹伤害为玩家50%
- [ ] 玩家按开火键时，僚机同步发射

## 视觉测试
- [ ] 僚机颜色为青色（#00ffff）
- [ ] 僚机尺寸为玩家的80%
- [ ] 僚机环绕运动流畅无卡顿

## 边界情况测试
- [ ] 游戏开始时，玩家僚机数量为0
- [ ] 玩家移动时，僚机正确跟随
- [ ] 达到上限后，OPTION道具仍可拾取（但不增加僚机）
```

**Step 3: 运行所有测试**

```bash
npm test
```

Expected: 所有测试通过

**Step 4: 构建并验证**

```bash
npm run build
npm run type-check
```

Expected: 无错误

**Step 5: 提交**

```bash
git add docs/tests/option-system-test-checklist.md
git add <更新的文档>
git commit -m "docs: 添加僚机系统测试清单和文档更新"
```

---

## Task 11: 代码审查和最终验证

**Step 1: 代码审查清单**

检查以下内容：
- [ ] 所有导入语句正确
- [ ] 类型定义完整（无any类型）
- [ ] 僚机环绕数学正确性（cos/sin）
- [ ] 边界情况处理（达到上限、数量同步）
- [ ] 性能考虑（实体遍历优化）
- [ ] 代码风格一致（命名、注释、格式）

**Step 2: 最终集成测试**

启动游戏，手动测试：
1. 拾取OPTION道具
2. 观察1个僚机出现并环绕旋转
3. 再拾取OPTION道具，观察第2个僚机
4. 观察僚机发射VULCAN子弹
5. 验证僚机跟随玩家移动

**Step 3: 性能验证**

使用浏览器开发者工具：
- 检查帧率是否保持稳定
- 确认没有内存泄漏
- 确认实体数量正确

**Step 4: 最终提交**

```bash
git add .
git commit -m "feat(option): 完成僚机系统实现

特性：
- 拾取OPTION道具增加僚机（最多2个）
- 僚机环绕玩家旋转（60像素半径，2弧度/秒）
- 固定发射VULCAN武器
- 平滑移动（0.2缓动系数）
- 无敌模式（不处理碰撞）

详见：docs/plans/2026-01-28-option-system-design.md
测试清单：docs/tests/option-system-test-checklist.md
"
```

---

## 附录：文件结构总览

```
src/engine/
├── components/
│   ├── Option.ts                    [新建] 僚机实体组件
│   ├── OptionCount.ts               [新建] 僚机数量组件
│   ├── PlayerTag.ts                 [修改] 添加isOption属性
│   └── index.ts                     [修改] 导出新组件
├── systems/
│   ├── OptionSystem.ts              [新建] 僚机环绕系统
│   ├── PickupSystem.ts              [修改] 处理OPTION拾取
│   ├── WeaponSystem.ts              [修改] 支持僚机发射
│   └── index.ts                     [修改] 导出OptionSystem
├── configs/
│   └── powerups.ts                   [修改] 添加OPTION配置
└── engine.ts                        [修改] 集成OptionSystem

docs/
├── plans/
│   └── 2026-01-28-option-system-design.md  [设计文档]
│   └── 2026-01-28-option-system-implementation.md [本文件]
└── tests/
    └── option-system-test-checklist.md   [新建]
```

---

## 执行顺序

严格按照 Task 1 → Task 2 → ... → Task 11 的顺序执行。

每个 Task 完成后提交，确保可以随时回滚。

遇到问题时：
1. 检查类型定义
2. 查看相关文档
3. 运行测试验证
4. 提交前确保构建通过
