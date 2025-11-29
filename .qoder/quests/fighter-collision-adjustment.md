# 战机碰撞区域调整设计文档

## 需求概述
根据需求，需要将战机的碰撞区域向内收缩20%，以提供更精确的游戏体验。目前游戏中存在碰撞检测机制，但未针对玩家战机应用碰撞箱缩小功能。

## 当前实现分析
通过代码库分析，我们发现以下关键信息：

1. **玩家战机配置** (`game/config/player.ts`) 包含了一个 `hitboxShrink` 字段，默认值为0，但当前并未在碰撞检测中使用。

2. **碰撞检测实现** 在 `GameEngine.ts` 的 `isColliding` 方法中，使用标准的AABB（Axis-Aligned Bounding Box）碰撞检测算法：
   ```javascript
   isColliding(a: Entity, b: Entity) {
     return (
       a.x - a.width / 2 < b.x + b.width / 2 &&
       a.x + a.width / 2 > b.x - b.width / 2 &&
       a.y - a.height / 2 < b.y + b.height / 2 &&
       a.y + a.height / 2 > b.y - b.height / 2
     );
   }
   ```

3. **Boss碰撞箱调整** 在 `BossSystem.ts` 中已经实现了类似的功能，通过 `hitboxScale` 参数来调整碰撞区域大小。

## 设计方案

### 方案概述
我们将利用现有的 `hitboxShrink` 配置字段，在碰撞检测过程中动态计算玩家战机的实际碰撞边界，从而实现碰撞区域的向内收缩。

### 核心改动点

1. **更新玩家配置**:
   - 修改 `game/config/player.ts` 中的 `hitboxShrink` 值从 `0` 改为 `0.2`（表示收缩20%）

2. **修改碰撞检测逻辑**:
   - 在 `GameEngine.ts` 中创建专门用于玩家碰撞检测的方法
   - 该方法会考虑 `hitboxShrink` 参数来计算实际碰撞边界

### 技术实现细节

#### 1. 玩家配置更新
```typescript
// game/config/player.ts
export const PlayerConfig: FighterEntity = {
  // ... 其他配置保持不变
  hitboxShrink: 0.2, // 设置为20%收缩
};
```

#### 2. 碰撞检测增强
在 `GameEngine.ts` 中添加一个新的方法用于处理玩家相关的碰撞检测：

```typescript
private isPlayerColliding(player: Entity, other: Entity): boolean {
  // 获取玩家的碰撞箱收缩比例
  const shrinkFactor = this.playerConfig.hitboxShrink || 0;
  
  // 计算收缩后的宽度和高度
  const playerWidth = player.width * (1 - shrinkFactor);
  const playerHeight = player.height * (1 - shrinkFactor);
  
  // 使用收缩后的尺寸进行碰撞检测
  return (
    player.x - playerWidth / 2 < other.x + other.width / 2 &&
    player.x + playerWidth / 2 > other.x - other.width / 2 &&
    player.y - playerHeight / 2 < other.y + other.height / 2 &&
    player.y + playerHeight / 2 > other.y - other.height / 2
  );
}
```

#### 3. 替换现有碰撞检测调用
修改 `checkCollisions` 方法中的两处玩家碰撞检测逻辑：

```typescript
// 修改前:
if (this.isColliding(e, this.player))

// 修改后:
if (this.isPlayerColliding(this.player, e))
```

具体涉及以下两个位置：
1. 敌方子弹、敌机、僚机与玩家的碰撞检测（约在第865行）
2. Boss与玩家的碰撞检测（约在第873行）

## 影响范围评估

### 正面影响
- 提升玩家游戏体验，使碰撞更加精确
- 降低玩家因过大碰撞区域导致的意外死亡频率
- 增强游戏挑战性的可控性

### 潜在风险
- 可能需要微调其他游戏平衡参数以适应新的碰撞区域
- 需要充分测试确保所有碰撞场景正常工作

## 测试验证计划

1. **视觉确认**:
   - 在开发者模式下可视化显示玩家的实际碰撞边界
   - 确认边界确实向内收缩了20%

2. **功能性测试**:
   - 验证玩家与敌方子弹的碰撞检测准确性
   - 验证玩家与敌机的碰撞检测准确性
   - 验证玩家与Boss的碰撞检测准确性
   - 验证玩家与道具的拾取准确性

3. **边界情况测试**:
   - 屏幕边缘的碰撞检测
   - 高速移动情况下的碰撞检测
   - 多个实体同时与玩家接触的情况

## 配置参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| hitboxShrink | number | 0.2 | 玩家战机碰撞区域收缩比例，0表示无收缩，1表示完全收缩 |

## 后续优化建议

1. **可配置化扩展**:
   - 允许通过难度设置调整收缩比例
   - 为不同战机类型设置不同的默认收缩值

2. **动态调整机制**:
   - 根据玩家表现动态调整碰撞区域大小
通过代码库分析，我们发现以下关键信息：

1. **玩家战机配置** (`game/config/player.ts`) 包含了一个 `hitboxShrink` 字段，默认值为0，但当前并未在碰撞检测中使用。

2. **碰撞检测实现** 在 `GameEngine.ts` 的 `isColliding` 方法中，使用标准的AABB（Axis-Aligned Bounding Box）碰撞检测算法：
   ```javascript
   isColliding(a: Entity, b: Entity) {
     return (
       a.x - a.width / 2 < b.x + b.width / 2 &&
       a.x + a.width / 2 > b.x - b.width / 2 &&
       a.y - a.height / 2 < b.y + b.height / 2 &&
       a.y + a.height / 2 > b.y - b.height / 2
     );
   }
   ```

3. **Boss碰撞箱调整** 在 `BossSystem.ts` 中已经实现了类似的功能，通过 `hitboxScale` 参数来调整碰撞区域大小。

## 设计方案

### 方案概述
我们将利用现有的 `hitboxShrink` 配置字段，在碰撞检测过程中动态计算玩家战机的实际碰撞边界，从而实现碰撞区域的向内收缩。

### 核心改动点

1. **更新玩家配置**:
   - 修改 `game/config/player.ts` 中的 `hitboxShrink` 值从 `0` 改为 `0.2`（表示收缩20%）

2. **修改碰撞检测逻辑**:
   - 在 `GameEngine.ts` 中创建专门用于玩家碰撞检测的方法
   - 该方法会考虑 `hitboxShrink` 参数来计算实际碰撞边界

### 技术实现细节

#### 1. 玩家配置更新
```typescript
// game/config/player.ts
export const PlayerConfig: FighterEntity = {
  // ... 其他配置保持不变
  hitboxShrink: 0.2, // 设置为20%收缩
};
```

#### 2. 碰撞检测增强
在 `GameEngine.ts` 中添加一个新的方法用于处理玩家相关的碰撞检测：

```typescript
private isPlayerColliding(player: Entity, other: Entity): boolean {
  // 获取玩家的碰撞箱收缩比例
  const shrinkFactor = this.playerConfig.hitboxShrink || 0;
  
  // 计算收缩后的宽度和高度
  const playerWidth = player.width * (1 - shrinkFactor);
  const playerHeight = player.height * (1 - shrinkFactor);
  
  // 使用收缩后的尺寸进行碰撞检测
  return (
    player.x - playerWidth / 2 < other.x + other.width / 2 &&
    player.x + playerWidth / 2 > other.x - other.width / 2 &&
    player.y - playerHeight / 2 < other.y + other.height / 2 &&
    player.y + playerHeight / 2 > other.y - other.height / 2
  );
}
```

#### 3. 替换现有碰撞检测调用
修改 `checkCollisions` 方法中的两处玩家碰撞检测逻辑：

```typescript
// 修改前:
if (this.isColliding(e, this.player))

// 修改后:
if (this.isPlayerColliding(this.player, e))
```

具体涉及以下两个位置：
1. 敌方子弹、敌机、僚机与玩家的碰撞检测（约在第865行）
2. Boss与玩家的碰撞检测（约在第873行）

## 影响范围评估

### 正面影响
- 提升玩家游戏体验，使碰撞更加精确
- 降低玩家因过大碰撞区域导致的意外死亡频率
- 增强游戏挑战性的可控性

### 潜在风险
- 可能需要微调其他游戏平衡参数以适应新的碰撞区域
- 需要充分测试确保所有碰撞场景正常工作

## 测试验证计划

1. **视觉确认**:
   - 在开发者模式下可视化显示玩家的实际碰撞边界
   - 确认边界确实向内收缩了20%

2. **功能性测试**:
   - 验证玩家与敌方子弹的碰撞检测准确性
   - 验证玩家与敌机的碰撞检测准确性
   - 验证玩家与Boss的碰撞检测准确性
   - 验证玩家与道具的拾取准确性

3. **边界情况测试**:
   - 屏幕边缘的碰撞检测
   - 高速移动情况下的碰撞检测
   - 多个实体同时与玩家接触的情况

## 配置参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| hitboxShrink | number | 0.2 | 玩家战机碰撞区域收缩比例，0表示无收缩，1表示完全收缩 |

## 后续优化建议

1. **可配置化扩展**:
   - 允许通过难度设置调整收缩比例
   - 为不同战机类型设置不同的默认收缩值

2. **动态调整机制**:
   - 根据玩家表现动态调整碰撞区域大小
   - 在特定道具激活时临时改变收缩比例## 当前实现分析
