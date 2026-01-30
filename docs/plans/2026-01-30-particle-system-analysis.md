# 子弹击中粒子特效系统分析与设计方案

> **创建日期**: 2026-01-30
> **分析目标**: 分析老版本子弹击中敌人的粒子动画效果，并在ECS系统中还原实现

---

## 第一部分：老版本粒子系统分析

### 1.1 核心实现原理

老版本的粒子动画系统采用**物理粒子飞散**的方式实现子弹击中敌人的视觉效果。

**关键代码位置**: `game/GameEngine.ts` 的 `createExplosion()` 方法（第1537-1553行）

```typescript
createExplosion(x: number, y: number, size: ExplosionSize, color: string) {
    const count = size === ExplosionSize.SMALL ? 8 : 30;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (size === ExplosionSize.SMALL ? 4 : 10);
        this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: size === ExplosionSize.SMALL ? 300 : 800,
            maxLife: size === ExplosionSize.SMALL ? 300 : 800,
            color: color,
            size: Math.random() * 4 + 2,
            type: 'spark'
        });
    }
}
```

### 1.2 粒子数据结构

老版本中粒子（Particle）的结构：

```typescript
interface Particle {
    x: number;          // 当前X坐标
    y: number;          // 当前Y坐标
    vx: number;         // X轴速度（像素/帧）
    vy: number;         // Y轴速度（像素/帧）
    life: number;       // 剩余生命周期（毫秒）
    maxLife: number;    // 最大生命周期（毫秒）
    color: string;      // 粒子颜色
    size: number;       // 粒子大小（半径）
    type: string;       // 粒子类型（如 'spark'）
}
```

### 1.3 粒子更新逻辑

**位置**: `game/GameEngine.ts` 第650-656行

```typescript
// Particles
this.particles.forEach(p => {
    p.x += p.vx * timeScale;  // 速度 × 时间缩放
    p.y += p.vy * timeScale;
    p.life -= dt;              // 生命周期递减
});
this.particles = this.particles.filter(p => p.life > 0);  // 清理过期粒子
```

### 1.4 粒子渲染逻辑

**位置**: `game/systems/RenderSystem.ts` 第358-366行

```typescript
// Particles
this.ctx.globalCompositeOperation = 'lighter';  // 关键：叠加混合模式
particles.forEach(p => {
    this.ctx.globalAlpha = p.life / p.maxLife;  // 透明度随生命周期衰减
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);  // 绘制圆形粒子
    this.ctx.fill();
});
this.ctx.globalAlpha = 1.0;
this.ctx.globalCompositeOperation = 'source-over';
```

### 1.5 特效调用场景

| 场景 | 粒子数量 | 速度范围 | 生命周期 | 颜色 |
|------|---------|---------|---------|------|
| **子弹击中** | 8 | 1-4 | 300ms | #ffe066 (黄色) |
| **敌人死亡** | 30 | 3-10 | 800ms | 随机色或敌人色 |
| **小型爆炸** | 8 | 1-4 | 300ms | 黄色 |
| **大型爆炸** | 30 | 3-10 | 800ms | 橙红色 |

### 1.6 视觉效果关键点

1. **随机方向**: `Math.random() * Math.PI * 2` - 360度全方位飞散
2. **随机速度**: 每个粒子速度不同，产生层次感
3. **随机大小**: `Math.random() * 4 + 2` - 大小范围 2-6px
4. **渐隐消失**: `globalAlpha = life / maxLife` - 随生命周期线性衰减
5. **发光叠加**: `globalCompositeOperation = 'lighter'` - 重叠粒子更亮

---

## 第二部分：ECS系统中的实现设计

### 2.1 现有ECS架构分析

**已完成**的粒子系统位于 `src/engine/systems/EffectPlayer.ts`：

```typescript
// 当前实现（已存在）
function spawnExplosionParticles(world: World, x: number, y: number, config: typeof EXPLOSION_PARTICLES[keyof typeof EXPLOSION_PARTICLES]): void {
    for (let i = 0; i < config.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);

        const particleBlueprint: Blueprint = {
            Transform: { x: 0, y: 0, rot: 0 },
            Velocity: {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            },
            Particle: {
                frame: 0,
                maxFrame: 60,
                fps: 60,
                color: config.color,
                scale: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
                maxLife: config.life
            },
            Lifetime: {
                timer: config.life
            }
        };

        spawnFromBlueprint(world, particleBlueprint, x, y, 0);
    }
}
```

### 2.2 配置结构（已存在）

**位置**: `src/engine/blueprints/effects.ts`

```typescript
export interface ExplosionParticleConfig {
    count: number;          // 粒子数量
    speedMin: number;       // 最小速度
    speedMax: number;       // 最大速度
    sizeMin: number;        // 最小大小
    sizeMax: number;        // 最大大小
    life: number;           // 生命周期（毫秒）
    color: string;          // 颜色
}

export const EXPLOSION_PARTICLES: Record<string, ExplosionParticleConfig> = {
    small: {
        count: 8,
        speedMin: 1,
        speedMax: 4,
        sizeMin: 2,
        sizeMax: 4,
        life: 300,
        color: '#ffe066'
    },
    large: {
        count: 30,
        speedMin: 3,
        speedMax: 10,
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#ff6600'
    },
    hit: {
        count: 5,
        speedMin: 2,
        speedMax: 5,
        sizeMin: 2,
        sizeMax: 4,
        life: 200,
        color: '#ffffff'
    }
};
```

### 2.3 ECS组件映射

| 老版本字段 | ECS组件 | 说明 |
|-----------|---------|------|
| x, y | Transform | 位置 |
| vx, vy | Velocity | 速度 |
| life | Lifetime.timer | 剩余生命周期 |
| maxLife | Particle.maxLife | 最大生命周期 |
| color | Particle.color | 颜色 |
| size | Particle.scale | 大小 |

### 2.4 系统执行流程

```
CollisionSystem (检测碰撞)
    ↓
    触发 HitEvent
    ↓
DamageResolutionSystem (处理伤害)
    ↓
    触发 HitEvent / KillEvent
    ↓
EffectPlayer (播放特效)
    ↓
    spawnExplosionParticles() → 生成粒子实体
    ↓
MovementSystem (更新粒子位置)
    ↓
LifetimeSystem (清理过期粒子)
    ↓
RenderSystem (渲染粒子)
```

### 2.5 渲染系统对比

| 特性 | 老版本 | ECS版本 |
|------|--------|---------|
| 混合模式 | `lighter` | `lighter` ✅ |
| 透明度计算 | `life / maxLife` | `lifetime.timer / maxLife` ✅ |
| 粒子形状 | 圆形 (`arc`) | 圆形 (`arc`) ✅ |
| 位置更新 | 手动遍历 | MovementSystem ✅ |

---

## 第三部分：对比与差异分析

### 3.1 已正确实现的部分 ✅

1. **粒子生成逻辑**: `spawnExplosionParticles()` 完全复刻了老版本的生成方式
2. **随机角度和速度**: 使用相同的随机算法
3. **渲染混合模式**: 使用 `lighter` 叠加模式
4. **生命周期衰减**: 基于 `Lifetime.timer` 计算透明度

### 3.2 可能存在的差异 ⚠️

| 方面 | 老版本 | ECS版本 | 状态 |
|------|--------|---------|------|
| 速度单位 | 像素/帧 | 像素/秒 | ⚠️ 需要确认 |
| 时间缩放 | timeScale | 世界时间缩放 | ⚠️ 需要确认 |
| 粒子清理 | 每帧过滤 | LifetimeSystem | ✅ 等效 |
| 事件触发 | 直接调用 | HitEvent/KillEvent | ✅ 更优雅 |

### 3.3 关键差异点：速度单位

**老版本**:
```typescript
// 速度单位：像素/帧
p.x += p.vx * timeScale;  // timeScale ≈ 1.0（正常速度）
```

**ECS版本**:
```typescript
// Velocity 组件：像素/秒（src/engine/components/base.ts）
// MovementSystem 会除以 1000 转换为毫秒
```

**需要验证**: 速度数值是否需要调整以匹配老版本的视觉效果。

---

## 第四部分：还原效果的实施建议

### 4.1 确认当前实现状态

当前ECS系统中的粒子效果**基本已完成**，与老版本高度一致。建议：

1. **运行游戏**，对比新老版本的粒子效果
2. **调整速度数值**（如果需要），在 `EXPLOSION_PARTICLES` 配置中微调
3. **确认颜色**与老版本一致

### 4.2 需要微调的参数

如果视觉效果有差异，可调整以下参数：

```typescript
// 在 src/engine/blueprints/effects.ts 中
export const EXPLOSION_PARTICLES = {
    small: {
        count: 8,           // 粒子数量 - 可增减以改变爆炸密度
        speedMin: 60,       // 最小速度（像素/秒）≈ 1 像素/帧 @ 60fps
        speedMax: 240,      // 最大速度（像素/秒）≈ 4 像素/帧 @ 60fps
        sizeMin: 2,         // 最小粒子大小
        sizeMax: 4,         // 最大粒子大小
        life: 300,          // 生命周期（毫秒）
        color: '#ffe066'    // 颜色 - 黄色火花
    },
    // ... 其他配置
};
```

### 4.3 单位换算参考

| 老版本（像素/帧） | ECS版本（像素/秒）@60fps |
|------------------|------------------------|
| 1 | 60 |
| 4 | 240 |
| 10 | 600 |

---

## 第五部分：测试验证清单

- [ ] 小型爆炸（子弹击中）生成 8 个粒子
- [ ] 大型爆炸（敌人死亡）生成 30 个粒子
- [ ] 粒子向 360 度方向均匀飞散
- [ ] 粒子速度在范围内随机分布
- [ ] 粒子大小在 2-6px 范围内随机
- [ ] 粒子透明度随生命周期线性衰减
- [ ] 重叠粒子产生发光叠加效果
- [ ] 粒子生命周期结束后正确清理
- [ ] 颜色与老版本一致

---

## 第六部分：文件索引

### 老版本核心文件

| 文件 | 作用 |
|------|------|
| `game/GameEngine.ts:1537-1553` | `createExplosion()` 粒子生成 |
| `game/GameEngine.ts:650-656` | 粒子更新逻辑 |
| `game/systems/RenderSystem.ts:358-366` | 粒子渲染逻辑 |
| `game/systems/RenderSystem.ts:1093-1209` | `handleBulletHit()` 击中处理 |

### ECS版本核心文件

| 文件 | 作用 |
|------|------|
| `src/engine/systems/EffectPlayer.ts` | 特效播放器，监听事件生成粒子 |
| `src/engine/systems/RenderSystem.ts:664-713` | 粒子渲染（`drawParticles()`） |
| `src/engine/systems/MovementSystem.ts` | 粒子位置更新 |
| `src/engine/systems/LifetimeSystem.ts` | 粒子生命周期管理 |
| `src/engine/blueprints/effects.ts` | 粒子配置（`EXPLOSION_PARTICLES`） |
| `src/engine/components/render.ts` | Particle 组件定义 |
