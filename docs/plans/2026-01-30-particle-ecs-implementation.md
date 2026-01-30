# 粒子特效系统ECS实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 还原老版本子弹击中敌人的粒子动画效果 - 多个颜色大小方向各异的粒子向四周飞散

**架构:**
- 粒子作为独立实体，使用 Transform + Velocity + Particle + Lifetime 组件
- EffectPlayer 监听 HitEvent/KillEvent，调用 spawnExplosionParticles() 生成粒子
- MovementSystem 更新位置，LifetimeSystem 管理生命周期，RenderSystem 负责渲染

**技术栈:** TypeScript, Canvas 2D, ECS架构

---

## 前置检查

### Task 0: 验证现有实现状态

**Files:**
- Read: `src/engine/systems/EffectPlayer.ts`
- Read: `src/engine/blueprints/effects.ts`
- Read: `src/engine/systems/RenderSystem.ts`

**Step 1: 检查 EffectPlayer 中的粒子生成逻辑**

确认 `spawnExplosionParticles()` 函数已存在且正确实现：
- 生成指定数量的粒子
- 每个粒子有随机角度和速度
- 使用 Velocity 组件存储速度
- 使用 Particle.maxLife 存储生命周期

**Step 2: 检查 EXPLOSION_PARTICLES 配置**

确认配置表中包含：
- `small`: 小型爆炸（8粒子，300ms生命周期）
- `large`: 大型爆炸（30粒子，800ms生命周期）
- `hit`: 击中特效（5粒子，200ms生命周期）

**Step 3: 检查 RenderSystem 的粒子渲染**

确认 `drawParticles()` 函数：
- 使用 `lighter` 混合模式
- 基于 `Lifetime.timer / Particle.maxLife` 计算透明度
- 使用 `arc()` 绘制圆形粒子

**Expected Result:**
- 所有核心逻辑已存在
- 系统架构完整

**如果检查失败:** 执行以下修复任务

---

## 修复任务 1: 修复速度单位换算（必须执行）

**Files:**
- Modify: `src/engine/blueprints/effects.ts:208-236`

**发现问题:** 当前配置中的速度值使用的是老版本的"像素/帧"数值，但ECS的MovementSystem使用"像素/秒"作为单位。

**换算关系**: 老版本速度值 × 60fps = ECS版本速度值（像素/秒）

**Step 1: 调整速度数值**

将速度从"像素/帧"转换为"像素/秒"（假设60fps）：

```typescript
export const EXPLOSION_PARTICLES: Record<string, ExplosionParticleConfig> = {
    small: {
        count: 8,
        speedMin: 60,      // = 1 像素/帧 @ 60fps
        speedMax: 240,     // = 4 像素/帧 @ 60fps
        sizeMin: 2,
        sizeMax: 4,
        life: 300,
        color: '#ffe066'
    },
    large: {
        count: 30,
        speedMin: 180,     // = 3 像素/帧 @ 60fps
        speedMax: 600,     // = 10 像素/帧 @ 60fps
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#ff6600'
    },
    hit: {
        count: 5,
        speedMin: 120,     // = 2 像素/帧 @ 60fps
        speedMax: 300,     // = 5 像素/帧 @ 60fps
        sizeMin: 2,
        sizeMax: 4,
        life: 200,
        color: '#ffffff'
    }
};
```

**Step 2: 运行游戏测试视觉效果**

Run: `pnpm run dev`
Expected: 粒子飞散速度与老版本一致

**Step 3: 微调速度数值**

如果速度仍不匹配，按比例调整所有 speedMin/speedMax 值。

**Step 4: 提交修复**

```bash
git add src/engine/blueprints/effects.ts
git commit -m "fix(particles): 调整粒子速度单位以匹配老版本视觉效果"
```

---

## 修复任务 2: 确保粒子正确清理

**Files:**
- Modify: `src/engine/systems/LifetimeSystem.ts`

**Condition:** 仅当粒子没有正确清理时执行

**Step 1: 检查 LifetimeSystem 实现**

```typescript
export function LifetimeSystem(world: World, dt: number): void {
    for (const [id, [lifetime]] of view(world, [Lifetime])) {
        lifetime.timer -= dt;
        if (lifetime.timer <= 0) {
            // 标记为删除或直接移除
            world.entities.delete(id);
        }
    }
}
```

**Step 2: 验证清理逻辑**

Run: `pnpm run dev`
Expected: 粒子在生命周期结束后消失，不会累积

**Step 3: 提交修复**

```bash
git add src/engine/systems/LifetimeSystem.ts
git commit -m "fix(lifetime): 确保过期粒子正确清理"
```

---

## 修复任务 3: 验证事件触发链路

**Files:**
- Read: `src/engine/systems/CollisionSystem.ts`
- Read: `src/engine/systems/DamageResolutionSystem.ts`
- Read: `src/engine/systems/EffectPlayer.ts`

**Condition:** 仅当粒子没有生成时执行

**Step 1: 确认 CollisionSystem 生成 HitEvent**

检查碰撞检测代码是否正确触发事件：

```typescript
// 碰撞发生时
const hitEvent: HitEvent = {
    type: 'Hit',
    pos: { x: collisionX, y: collisionY },
    damage: bulletDamage,
    owner: playerId,
    victim: enemyId
};
world.events.push(hitEvent);
```

**Step 2: 确认 DamageResolutionSystem 传递 HitEvent**

```typescript
// DamageResolutionSystem 中
for (const event of hitEvents) {
    applyDamage(world, event);
    // 事件应保留在 events 数组中供 EffectPlayer 读取
}
```

**Step 3: 确认 EffectPlayer 响应 HitEvent**

```typescript
// EffectPlayer 中
for (const event of events) {
    switch (event.type) {
        case 'Hit':
            handleHitEvent(world, event as HitEvent);
            break;
        // ...
    }
}
```

**Step 4: 提交修复**

```bash
git add src/engine/systems/CollisionSystem.ts src/engine/systems/DamageResolutionSystem.ts
git commit -m "fix(events): 确保HitEvent正确传递到EffectPlayer"
```

---

## 增强任务 4: 添加调试模式

**Files:**
- Modify: `src/engine/systems/EffectPlayer.ts`
- Modify: `src/engine/blueprints/effects.ts`

**Step 1: 添加粒子调试开关**

在 `src/engine/blueprints/effects.ts` 添加：

```typescript
// 调试配置
export const PARTICLE_DEBUG = {
    enabled: false,
    logSpawns: false,
    showCount: false
};
```

**Step 2: 在 EffectPlayer 中添加调试日志**

```typescript
function spawnExplosionParticles(...) {
    if (PARTICLE_DEBUG.enabled && PARTICLE_DEBUG.logSpawns) {
        console.log(`[EffectPlayer] Spawning ${config.count} particles at (${x}, ${y})`);
    }
    // ... 现有代码
}
```

**Step 3: 提交增强**

```bash
git add src/engine/systems/EffectPlayer.ts src/engine/blueprints/effects.ts
git commit -m "feat(particles): 添加粒子系统调试模式"
```

---

## 测试任务 5: 视觉效果验证

**Step 1: 启动游戏**

Run: `pnpm run dev`

**Step 2: 验证小型爆炸（子弹击中）**

- 射击敌人
- Expected: 每次击中生成 8 个黄色粒子
- Expected: 粒子向四周飞散
- Expected: 粒子约 0.3 秒后消失

**Step 3: 验证大型爆炸（敌人死亡）**

- 击杀敌人
- Expected: 生成 30 个橙红色粒子
- Expected: 粒子飞散范围更大
- Expected: 粒子约 0.8 秒后消失

**Step 4: 验证发光叠加效果**

- 多个粒子重叠时
- Expected: 重叠区域更亮（lighter 混合模式）

**Step 5: 记录测试结果**

创建测试报告：

```markdown
# 粒子系统测试结果

- [ ] 小型爆炸粒子数量正确 (8个)
- [ ] 大型爆炸粒子数量正确 (30个)
- [ ] 粒子方向均匀分布 (360度)
- [ ] 粒子速度随机分布
- [ ] 粒子大小随机分布 (2-6px)
- [ ] 粒子透明度正确衰减
- [ ] 粒子生命周期正确结束
- [ ] 发光叠加效果正常
```

---

## 完成标准

系统满足以下条件即视为完成：

1. ✅ 子弹击中敌人时生成 5-8 个白色/黄色粒子
2. ✅ 敌人死亡时生成 30 个橙红色粒子
3. ✅ 粒子向 360 度方向均匀飞散
4. ✅ 粒子透明度随生命周期线性衰减
5. ✅ 重叠粒子产生发光叠加效果
6. ✅ 粒子在生命周期结束后正确清理
7. ✅ 视觉效果与老版本一致

---

## 附录：老版本参考代码

### createExplosion() 原始实现

```typescript
// game/GameEngine.ts:1537-1553
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

### 粒子渲染原始实现

```typescript
// game/systems/RenderSystem.ts:358-366
this.ctx.globalCompositeOperation = 'lighter';
particles.forEach(p => {
    this.ctx.globalAlpha = p.life / p.maxLife;
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
});
```
