# 护盾系统重构设计

**日期**: 2025-01-31
**状态**: 设计完成

## 背景与问题

当前护盾系统存在以下问题：
1. 护盾组件包含 `regen` 字段，但没有任何系统在使用它进行自动恢复
2. BuffSystem 中的 shieldHandler 只是设置 `regen` 值，没有实际恢复逻辑
3. PickupId 和 pickupRegistry 中缺少护盾 Buff 的注册

## 设计方案

### 1. 护盾组件结构

**Shield 组件** (`src/engine/components/combat.ts`)
- 移除 `regen` 字段
- 只保留 `value`（当前护盾值）和 `max`（最大护盾值）
- 构造函数参数简化为 `{ value: number, max: number }`

### 2. 护盾 Buff 行为

**shieldHandler 逻辑** (`src/engine/systems/BuffSystem.ts`)

当玩家捡到护盾 Buff 时：

1. **立即加满**：护盾值立即恢复到最大值
2. **持续恢复**：在 Buff 持续期间，每帧按 `buff.value`（每秒恢复量）恢复护盾
3. **不超过最大值**：恢复时始终检查不超过 `shield.max`
4. **Buff 结束**：无额外操作

**实现示例**：
```typescript
const shieldHandler: DurationBuffHandler = {
    update(buff: Buff, world: World, comps: Component[], dt: number): void {
        const shield = comps.find(Shield.check);
        if (shield) {
            // 立即加满
            shield.value = shield.max;

            // 持续恢复（buff.value 是每秒恢复量，dt 是毫秒）
            const recovery = (buff.value * dt) / 1000;
            shield.value = Math.min(shield.value + recovery, shield.max);
        }
    }
};
```

**行为示例**：
- 护盾：`{ value: 30, max: 100 }`
- Buff：`{ type: SHIELD, value: 20, remaining: 5000 }`（每秒恢复 20 点，持续 5 秒）
- 第 1 帧（100ms）：护盾立即变为 100
- 如果受伤：护盾降到 50
- 持续恢复：每帧恢复 `20 * dt / 1000`，直到 Buff 结束或护盾再次满值

### 3. 补充缺失的护盾拾取物

需要在以下文件中补充护盾 Buff 的注册：

#### 3.1 PickupId 枚举 (`src/engine/types/ids.ts`)
```typescript
export const PickupId = {
    // ... 现有项目 ...
    SHIELD: 'pickup_buff_shield',  // 新增
    // ...
};
```

#### 3.2 buffPickups 蓝图 (`src/engine/blueprints/pickups/buffPickups.ts`)
```typescript
export const BLUEPRINT_POWERUP_SHIELD: Blueprint = {
    Transform: { x: 0, y: 0, rot: 0 },
    Velocity: { vx: 0, vy: PICKUP_FALL_SPEED, vrot: 0 },
    Sprite: { spriteKey: SpriteKey.POWERUP_SHIELD, scale: 1 },
    PickupItem: { kind: 'buff', blueprint: BuffType.SHIELD, autoPickup: true },
    HitBox: { shape: 'rect', halfWidth: 12, halfHeight: 12, layer: CollisionLayer.Pickup },
};
```

#### 3.3 pickupRegistry (`src/engine/configs/pickupRegistry.ts`)
```typescript
export const PICKUP_REGISTRY: Record<string, Blueprint> = {
    // ... 现有注册 ...
    [PickupId.SHIELD]: BuffPickups.BLUEPRINT_POWERUP_SHIELD,  // 新增
    // ...
};
```

### 4. 测试用例更新

**BuffSystem.test.ts** 需要更新的测试用例：

1. **立即加满测试**：验证 Buff 应用后护盾立即变为最大值
2. **持续恢复测试**：在 Buff 持续期间，如果护盾受损，会按速率恢复
3. **不超过最大值测试**：恢复时不超过 max

**示例**：
```typescript
it('应该立即加满护盾并持续恢复', () => {
    const shield = new Shield({ value: 30, max: 100 });
    // ... 添加 Buff ...

    BuffSystem(world, 100);

    // 立即加满
    expect(shield.value).toBe(100);

    // 模拟受伤
    shield.value = 50;

    // 持续恢复
    BuffSystem(world, 1000); // 1 秒
    expect(shield.value).toBe(70); // 50 + 20*1
});
```

## 修改文件清单

1. ✅ **src/engine/components/combat.ts**
   - 移除 `Shield.regen` 字段
   - 更新构造函数参数

2. ✅ **src/engine/systems/BuffSystem.ts**
   - 修改 `shieldHandler` 逻辑：立即加满 + 按速率持续恢复
   - 移除对 `shield.regen` 的引用

3. ✅ **tests/systems/BuffSystem.test.ts**
   - 更新所有测试用例，移除 `regen` 参数
   - 调整断言以匹配新行为

4. ✅ **src/engine/blueprints/fighters.ts**
   - 移除 `Shield` 配置中的 `regen` 字段

5. ✅ **src/engine/types/ids.ts**
   - 添加 `PickupId.SHIELD`

6. ✅ **src/engine/blueprints/pickups/buffPickups.ts**
   - 添加 `BLUEPRINT_POWERUP_SHIELD` 蓝图

7. ✅ **src/engine/configs/pickupRegistry.ts**
   - 注册护盾拾取物

8. ✅ **tests/systems/DamageResolutionSystem.test.ts**
   - 移除测试中的 `regen: 0` 参数

## 设计优点

1. **简洁明了**：移除了未使用的 `regen` 字段，代码更清晰
2. **游戏性更好**：捡到护盾后有"立即满血+持续恢复"的爽快感
3. **易于平衡**：通过 Buff 持续时间和恢复速率控制恢复期的长短
4. **符合预期**：玩家捡到护盾 → 立刻满盾 + 能持续一段时间慢慢恢复

## 风险评估

- **低风险**：主要是移除未使用的代码和补充缺失的注册
- **测试覆盖**：需要确保所有相关测试用例更新并通过
- **兼容性**：不影响现有的护盾伤害吸收逻辑
