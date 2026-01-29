# ECS 重构设计：PickupSystem、BuffSystem、OptionSystem 优化

**日期**: 2026-01-29
**目标**: 重构三个相关系统，消除重复代码，引入蓝图系统，改进 Buff 处理逻辑

---

## 一、整体架构和系统职责划分

### 系统职责重新定义

#### PickupSystem（拾取分发器）
- **输入**：监听 `PickupEvent`（由 CollisionSystem 生成）
- **职责**：
  - 识别道具类型（武器/Buff/僚机）
  - 分发到对应的处理函数
  - 武器道具：直接修改玩家 Weapon 组件
  - Buff 道具：添加 Buff 组件到玩家（BuffSystem 处理效果）
  - 僚机道具：调用 `spawnOption()` 创建僚机实体
  - 播放拾取音效
- **不再包含**：硬编码的实体创建逻辑、Buff 效果应用逻辑

#### BuffSystem（Buff 状态管理）
- **职责**：
  - 更新所有实体上的 Buff 组件剩余时间
  - 应用持续效果（INVINCIBILITY、TIME_SLOW、SHIELD 等）
  - 移除过期 Buff 并清理副作用
- **不再包含**：一次性效果的处理（HP 恢复直接在 PickupSystem 中完成）

#### OptionSystem（僚机运动系统）
- **职责**：
  - 更新所有僚机实体的位置（环绕玩家旋转）
  - 根据玩家 OptionCount 组件同步僚机数量
  - 清理多余僚机实体
- **不再包含**：创建僚机实体的逻辑（删除 spawnOptionEntity 函数）

---

## 二、蓝图系统配置设计

### 蓝图定义（在 `blueprints/fighters.ts` 中）

```typescript
/**
 * 僚机蓝图 - Vulcan机炮型
 */
export const BLUEPRINT_OPTION_VULCAN: Blueprint = {
    Transform: { x: 0, y: 0, rot: 0 },
    Velocity: { vx: 0, vy: 0, vrot: 0 },
    Sprite: { spriteKey: SpriteKey.OPTION, scale: 0.8, color: '#00ffff' },
    HitBox: { shape: 'circle', radius: 16, layer: CollisionLayer.Player },
    Weapon: {
        ...WEAPON_TABLE[WeaponId.VULCAN],
        damageMultiplier: 0.5,
        pattern: WeaponPattern.AIMED
    },
    Option: { index: 0 },
    PlayerTag: { isOption: true }
};
```

### 配置映射（在 `configs/powerups.ts` 中）

```typescript
export const OPTION_BLUEPRINT_MAP: Record<string, Blueprint> = {
    'OPTION_VULCAN': BLUEPRINT_OPTION_VULCAN,
    'OPTION_LASER': BLUEPRINT_OPTION_LASER
};

export const POWERUP_CONFIG = {
    [BuffType.OPTION]: {
        blueprintType: 'OPTION_VULCAN',
        maxCount: 2
    }
};
```

### Factory 接口（在 `factory.ts` 中）

```typescript
export function spawnOption(world: World, bp: Blueprint, index: number, x: number, y: number): EntityId {
    const id = spawnFromBlueprint(world, bp, x, y, 0);

    const optionComps = world.entities.get(id);
    const option = optionComps?.find(Option.check);
    if (option) {
        option.index = index;
    }

    return id;
}
```

---

## 三、PickupSystem Handler 模式设计

### Handler 接口

```typescript
interface PickupHandler {
    handle(world: World, playerId: number, itemId: string): void;
}
```

### 武器拾取 Handler

```typescript
const weaponPickupHandler: PickupHandler = {
    handle(world: World, playerId: number, weaponId: string): void {
        const playerComps = world.entities.get(playerId);
        if (!playerComps) return;

        const existingWeapon = playerComps.find(Weapon.check);

        if (existingWeapon && existingWeapon.id === weaponId) {
            existingWeapon.level = Math.min(
                existingWeapon.level + 1,
                POWERUP_LIMITS.MAX_WEAPON_LEVEL
            );
            existingWeapon.bulletCount = Math.min(
                existingWeapon.bulletCount + 1,
                POWERUP_LIMITS.MAX_BULLET_COUNT
            );
        } else {
            if (existingWeapon) {
                const idx = playerComps.indexOf(existingWeapon);
                if (idx !== -1) playerComps.splice(idx, 1);
            }
            const weaponConfig = WEAPON_TABLE[weaponId as WeaponId];
            playerComps.push(new Weapon(weaponConfig));
        }

        pushEvent(world, {
            type: 'PlaySound',
            name: 'weapon_pickup'
        } as PlaySoundEvent);
    }
};
```

### Buff 拾取 Handler

```typescript
const buffPickupHandler: PickupHandler = {
    handle(world: World, playerId: number, buffType: BuffType): void {
        const category = BUFF_CATEGORY_CONFIG[buffType];

        if (category === BuffCategory.INSTANT) {
            applyInstantBuff(world, playerId, buffType);
        } else {
            addDurationBuff(world, playerId, buffType);
        }

        pushEvent(world, {
            type: 'PlaySound',
            name: 'buff_pickup'
        } as PlaySoundEvent);
    }
};
```

### 僚机拾取 Handler

```typescript
const optionPickupHandler: PickupHandler = {
    handle(world: World, playerId: number, blueprintType: string): void {
        const playerComps = world.entities.get(playerId);
        if (!playerComps) return;

        const playerTransform = playerComps.find(Transform.check);
        if (!playerTransform) return;

        let optionCount = playerComps.find(OptionCount.check);
        if (optionCount) {
            optionCount.count = Math.min(optionCount.count + 1, optionCount.maxCount);
        } else {
            optionCount = new OptionCount({ count: 1, maxCount: 2 });
            playerComps.push(optionCount);
        }

        const index = optionCount.count - 1;
        const angle = index * Math.PI;
        const x = playerTransform.x + Math.cos(angle) * 60;
        const y = playerTransform.y + Math.sin(angle) * 60;

        const bp = OPTION_BLUEPRINT_MAP[blueprintType];
        if (bp) {
            spawnOption(world, bp, index, x, y);
        }

        pushEvent(world, {
            type: 'PlaySound',
            name: 'buff_pickup'
        } as PlaySoundEvent);
    }
};
```

### PickupSystem 主函数

```typescript
export function PickupSystem(world: World, dt: number): void {
    const pickupEvents = getEvents<PickupEvent>(world, EventTags.Pickup);
    if (pickupEvents.length === 0) return;

    for (const event of pickupEvents) {
        const { itemId, owner: playerId } = event;

        if (isWeaponId(itemId)) {
            PICKUP_HANDLERS.weapons.handle(world, playerId, itemId);
        } else if (isBuffType(itemId)) {
            if (itemId === BuffType.OPTION) {
                const blueprintType = POWERUP_CONFIG[BuffType.OPTION].blueprintType;
                PICKUP_HANDLERS.options.handle(world, playerId, blueprintType);
            } else {
                PICKUP_HANDLERS.buffs.handle(world, playerId, itemId);
            }
        }
    }
}
```

---

## 四、Buff 处理逻辑设计

### Buff 分类

```typescript
enum BuffCategory {
    INSTANT = 'INSTANT',   // 一次性效果
    DURATION = 'DURATION'  // 持续效果
}

const BUFF_CATEGORY_CONFIG: Record<BuffType, BuffCategory> = {
    [BuffType.POWER]: BuffCategory.INSTANT,
    [BuffType.HP]: BuffCategory.INSTANT,
    [BuffType.BOMB]: BuffCategory.INSTANT,
    [BuffType.INVINCIBILITY]: BuffCategory.DURATION,
    [BuffType.TIME_SLOW]: BuffCategory.DURATION,
    [BuffType.SHIELD]: BuffCategory.DURATION,
    [BuffType.RAPID_FIRE]: BuffCategory.DURATION,
    [BuffType.PENETRATION]: BuffCategory.DURATION,
    [BuffType.SPEED]: BuffCategory.DURATION
};
```

### DurationBuffHandler 接口

```typescript
interface DurationBuffHandler {
    update(buff: Buff, world: World, comps: Component[], dt: number): void;
    onExpired?(buff: Buff, world: World, comps: Component[]): void;
}
```

### Handler 实现（关键示例）

#### TIME_SLOW Handler

```typescript
const timeSlowHandler: DurationBuffHandler = {
    update(buff: Buff, world: World, comps: Component[], dt: number): void {
        world.difficulty = 0.5;
    },

    onExpired(buff: Buff, world: World, comps: Component[]): void {
        let hasTimeSlow = false;
        for (const [id, [otherBuff]] of view(world, [Buff])) {
            if (otherBuff.type === BuffType.TIME_SLOW && otherBuff !== buff) {
                hasTimeSlow = true;
                break;
            }
        }
        if (!hasTimeSlow) {
            world.difficulty = 1;
        }
    }
};
```

#### SPEED Handler

```typescript
const speedHandler: DurationBuffHandler = {
    update(buff: Buff, world: World, comps: Component[], dt: number): void {
        const speedStat = comps.find(SpeedStat.check);
        if (speedStat) {
            if (speedStat.originalMaxLinear === undefined) {
                speedStat.originalMaxLinear = speedStat.maxLinear;
            }
            speedStat.maxLinear = speedStat.originalMaxLinear * (1 + buff.value * 0.1);
        }
    },

    onExpired(buff: Buff, world: World, comps: Component[]): void {
        const speedStat = comps.find(SpeedStat.check);
        if (speedStat && speedStat.originalMaxLinear !== undefined) {
            speedStat.maxLinear = speedStat.originalMaxLinear;
            delete speedStat.originalMaxLinear;
        }
    }
};
```

### BuffSystem 主函数

```typescript
export function BuffSystem(world: World, dt: number): void {
    for (const [id, [buff], comps] of view(world, [Buff])) {
        buff.update(dt);

        const handler = DURATION_BUFF_HANDLERS[buff.type];
        if (handler) {
            handler.update(buff, world, comps, dt);
        }

        if (buff.isFinished()) {
            if (handler?.onExpired) {
                handler.onExpired(buff, world, comps);
            }
            removeComponent(world, id, buff);
        }
    }
}
```

---

## 五、代码迁移步骤

### 步骤 1：添加僚机蓝图和配置
- **文件**：`blueprints/fighters.ts`、`configs/powerups.ts`
- **测试**：编译通过

### 步骤 2：添加工厂函数 + 单元测试
- **文件**：`factory.ts`、`tests/factory.test.ts`
- **测试**：`npm test -- factory.test.ts`

### 步骤 3：重构 OptionSystem + 单元测试
- **文件**：`OptionSystem.ts`、`tests/systems/OptionSystem.test.ts`
- **操作**：删除 `spawnOptionEntity`，使用蓝图创建
- **测试**：单元测试 + 手动游戏测试

### 步骤 4：重构 PickupSystem 僚机处理 + 单元测试
- **文件**：`PickupSystem.ts`、`tests/systems/PickupSystem.test.ts`
- **操作**：删除 `spawnOptionEntity`，使用蓝图创建
- **测试**：单元测试 + 手动游戏测试

### 步骤 5-7：Buff 相关重构
- 引入 Buff 分类配置
- 重构 BuffSystem Handler 接口（添加 `world: World` 参数）
- 重构 BuffSystem 主函数

### 步骤 8：重构 PickupSystem Handler 模式 + 单元测试
- **文件**：`PickupSystem.ts`、`tests/systems/PickupSystem.test.ts`
- **操作**：引入 Handler 模式，简化主函数
- **测试**：扩展单元测试覆盖所有 Handler

### 步骤 9：重构 BuffSystem + 单元测试
- **文件**：`BuffSystem.ts`、`tests/systems/BuffSystem.test.ts`
- **操作**：移除一次性效果 Handler，修正持续效果 Handler
- **测试**：完整的 Buff 效果测试

### 步骤 10：清理重复代码
- 从 BuffSystem 移除一次性效果 Handler
- 确保职责清晰

### 步骤 11：添加 SpriteKey.OPTION
- **文件**：`configs/sprites.ts`

### 步骤 12：运行完整测试套件
```bash
npm test
npm run test:coverage
npm run test:watch
```

---

## 六、测试文件清单

- [ ] `tests/factory.test.ts` - spawnOption 函数测试
- [ ] `tests/systems/OptionSystem.test.ts` - 僚机系统测试
- [ ] `tests/systems/PickupSystem.test.ts` - 拾取系统测试（含 Handler）
- [ ] `tests/systems/BuffSystem.test.ts` - Buff 系统测试

---

## 七、最终检查清单

### 代码质量
- [ ] 所有文件编译通过
- [ ] 无 TypeScript 错误
- [ ] 无重复代码
- [ ] 代码结构清晰，职责分明

### 单元测试
- [ ] factory 测试通过
- [ ] OptionSystem 测试通过
- [ ] PickupSystem 测试通过
- [ ] BuffSystem 测试通过

### 功能测试
- [ ] 武器拾取和升级
- [ ] HP/POWER/BOMB 立即生效
- [ ] INVINCIBILITY/TIME_SLOW 等持续效果
- [ ] Buff 过期时副作用清除
- [ ] 僚机拾取、创建、运动、开火
- [ ] OptionSystem 正确同步数量

### 集成测试
- [ ] 完整游戏流程无异常
- [ ] 性能无明显下降

---

## 八、关键改进点

1. **职责清晰**：PickupSystem、BuffSystem、OptionSystem 各司其职
2. **蓝图统一**：僚机创建与其他实体一致，使用蓝图系统
3. **Handler 模式**：PickupSystem 和 BuffSystem 使用 Handler 模式避免函数体过大
4. **Buff 分类**：一次性效果与持续效果分离处理
5. **副作用管理**：Buff 过期时正确清理副作用
6. **单元测试**：每个重构步骤配套测试，确保正确性

---

**设计完成，准备实施！**
