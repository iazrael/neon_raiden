# 子弹旋转逻辑优化设计文档

## 1. 问题描述

当前在 `RenderSystem.ts` 中，有两种需要围绕自身中心旋转的子弹类型：
1. `bullet_plasma` (玩家等离子球子弹)
2. `bullet_enemy_spiral` (敌方螺旋弹)

目前的实现使用 `Date.now()` 来计算旋转角度，这种方式存在以下问题：
- 旋转效果不连贯，无法看出旋转动画
- 不符合游戏物理逻辑，应该基于子弹自身的旋转属性来计算

## 2. 当前实现分析

### 2.1 渲染系统中的问题代码
在 `RenderSystem.ts` 的 `drawEntity` 方法中：

```typescript
if (e.spriteKey === 'bullet_plasma') {
    this.ctx.rotate(Date.now() / 100);
}

// Enemy spiral bullet self-rotation animation
if (e.spriteKey === 'bullet_enemy_spiral') {
    this.ctx.rotate(Date.now() / 80); // Slightly faster rotation for spiral effect
}
```

### 2.2 武器系统中的正确实现
在 `WeaponSystem.ts` 中，PLASMA 子弹的创建逻辑已经正确设置了旋转属性：

```typescript
// Add rotation: 0.05 radians per frame (about 3 degrees per frame, slower rotation)
spawn(player.x, player.y - 40, 0, -config.speed, damage, weaponType, config.sprite, width, height, undefined, undefined, 0.03);
```

### 2.3 Entity 类型定义
在 `types/index.ts` 中，Entity 接口已定义了旋转相关的属性：
- `angle?: number` - 当前旋转角度
- `rotationSpeed?: number` - 旋转速度（弧度/帧）

## 3. 解决方案设计

### 3.1 核心思路
移除 `RenderSystem.ts` 中基于 `Date.now()` 的旋转逻辑，改为使用子弹实体自身的 `angle` 和 `rotationSpeed` 属性来计算旋转。

### 3.2 实现步骤

1. 在 `GameEngine.ts` 中更新子弹旋转逻辑：
   - 每帧根据 `rotationSpeed` 更新子弹的 `angle` 值
   - 确保 PLASMA 和 SPIRAL 子弹正确更新旋转角度

2. 在 `RenderSystem.ts` 中修改渲染逻辑：
   - 移除基于 `Date.now()` 的旋转代码
   - 使用子弹实体的 `angle` 属性进行旋转

### 3.3 具体修改点

#### 3.3.1 GameEngine.ts 修改
在子弹更新逻辑中添加旋转角度更新：

```typescript
// 更新玩家子弹旋转角度
this.bullets.forEach(b => {
    // ... 现有代码 ...
    
    // 更新旋转角度
    if (b.rotationSpeed !== undefined) {
        b.angle = (b.angle || 0) + b.rotationSpeed;
    }
});

// 更新敌方子弹旋转角度
this.enemyBullets.forEach(b => {
    // ... 现有代码 ...
    
    // 更新旋转角度
    if (b.rotationSpeed !== undefined) {
        b.angle = (b.angle || 0) + b.rotationSpeed;
    }
});
```

#### 3.3.2 RenderSystem.ts 修改
移除不正确的旋转逻辑，使用实体的 angle 属性：

```typescript
// 移除以下代码：
// if (e.spriteKey === 'bullet_plasma') {
//     this.ctx.rotate(Date.now() / 100);
// }
// 
// // Enemy spiral bullet self-rotation animation
// if (e.spriteKey === 'bullet_enemy_spiral') {
//     this.ctx.rotate(Date.now() / 80); // Slightly faster rotation for spiral effect
// }

// 保留现有的 angle 处理逻辑：
if (e.angle) {
    this.ctx.rotate(e.angle);
}
```

#### 3.3.3 EnemySystem.ts 修改
在创建 `bullet_enemy_spiral` 子弹时添加旋转属性：

```typescript
// Barrage - Spiral pattern firing
if (e.subType === EnemyType.BARRAGE) {
    // ... 现有代码 ...
    enemyBullets.push({
        // ... 现有属性 ...
        angle: Math.random() * Math.PI * 2, // 随机初始角度
        rotationSpeed: 0.15 // 设置较快的旋转速度
    });
}
```

## 4. 预期效果

1. `bullet_plasma` 和 `bullet_enemy_spiral` 子弹将具有平滑、连贯的旋转动画
2. 旋转速度将符合游戏设计预期，不再依赖系统时间
3. 不同子弹的旋转效果将独立计算，互不影响
4. 性能影响极小，仅增加少量计算

## 5. 兼容性考虑

1. 此修改向后兼容，不会影响其他类型的子弹渲染
2. 对于没有设置 `rotationSpeed` 属性的子弹，旋转逻辑保持不变
3. 现有的子弹配置和生成逻辑无需修改

## 6. 测试验证点

1. 验证 PLASMA 子弹是否正常旋转
2. 验证敌方螺旋弹是否正常旋转
3. 确认其他子弹类型的渲染未受影响
4. 检查旋转速度是否符合设计预期
4. 检查 PLASMA 子弹旋转较慢，敌方螺旋弹旋转较快的效果
5. 验证在不同帧率下旋转效果的一致性
