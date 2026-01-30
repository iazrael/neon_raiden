# 粒子系统测试结果报告

> **执行日期**: 2026-01-30
> **执行计划**: 2026-01-30-particle-ecs-implementation.md

---

## 实施状态总结

| 任务 | 状态 | 说明 |
|------|------|------|
| Task 0: 验证现有实现状态 | ✅ 完成 | 核心逻辑已存在，系统架构完整 |
| 修复任务 1: 修复速度单位换算 | ✅ 完成 | 速度值已从"像素/帧"转换为"像素/秒"（×60fps） |
| 修复任务 2: 确保粒子正确清理 | ✅ 完成 | LifetimeSystem + CleanupSystem 链路正确 |
| 修复任务 3: 验证事件触发链路 | ✅ 完成 | CollisionSystem → HitEvent → EffectPlayer 链路完整 |
| 增强任务 4: 添加调试模式 | ✅ 完成 | PARTICLE_DEBUG 配置已添加 |
| 测试任务 5: 视觉效果验证 | ⏳ 待运行游戏确认 | 需要启动游戏进行视觉确认 |

---

## 已完成的代码修改

### 1. 速度单位修复 ([`src/engine/blueprints/effects.ts:208-236`](src/engine/blueprints/effects.ts#L208-L236))

```typescript
export const EXPLOSION_PARTICLES: Record<string, ExplosionParticleConfig> = {
    small: {
        count: 8,
        speedMin: 60,       // 老版本 1 像素/帧 × 60fps = 60 像素/秒
        speedMax: 240,      // 老版本 4 像素/帧 × 60fps = 240 像素/秒
        sizeMin: 2,
        sizeMax: 4,
        life: 300,
        color: '#ffe066'    // 黄色火花
    },
    large: {
        count: 30,
        speedMin: 180,      // 老版本 3 像素/帧 × 60fps = 180 像素/秒
        speedMax: 600,      // 老版本 10 像素/帧 × 60fps = 600 像素/秒
        sizeMin: 2,
        sizeMax: 6,
        life: 800,
        color: '#ff6600'    // 橙红色爆炸
    },
    hit: {
        count: 5,
        speedMin: 120,      // 老版本 2 像素/帧 × 60fps = 120 像素/秒
        speedMax: 300,      // 老版本 5 像素/帧 × 60fps = 300 像素/秒
        sizeMin: 2,
        sizeMax: 4,
        life: 200,
        color: '#ffffff'    // 白色击中闪光
    }
};
```

### 2. 调试模式 ([`src/engine/blueprints/effects.ts:188-195`](src/engine/blueprints/effects.ts#L188-L195))

```typescript
export const PARTICLE_DEBUG = {
    enabled: false,      // 设置为 true 启用调试日志
    logSpawns: false,    // 记录粒子生成
    showCount: false     // 显示粒子计数
};
```

### 3. 调试日志 ([`src/engine/systems/EffectPlayer.ts:102-105`](src/engine/systems/EffectPlayer.ts#L102-L105))

```typescript
if (PARTICLE_DEBUG.enabled && PARTICLE_DEBUG.logSpawns) {
    console.log(`[EffectPlayer] 生成爆炸粒子: ${config.count}个, 位置(${x.toFixed(1)}, ${y.toFixed(1)}), 颜色=${config.color}`);
}
```

---

## 待确认项目（需要运行游戏）

### 视觉效果检查清单

运行 `pnpm run dev` 启动游戏，验证以下效果：

- [ ] **小型爆炸**：子弹击中时生成 8 个黄色粒子
- [ ] **大型爆炸**：敌人死亡时生成 30 个橙红色粒子
- [ ] **粒子方向**：粒子向 360 度方向均匀飞散
- [ ] **粒子速度**：速度在范围内随机分布
- [ ] **粒子大小**：大小在 2-6px 范围内随机
- [ ] **渐隐效果**：粒子透明度随生命周期线性衰减
- [ ] **发光叠加**：重叠粒子产生发光效果（lighter 混合模式）
- [ ] **粒子清理**：粒子在生命周期结束后消失

---

## 启用调试模式

如需调试粒子系统，修改 [`src/engine/blueprints/effects.ts`](src/engine/blueprints/effects.ts):

```typescript
export const PARTICLE_DEBUG = {
    enabled: true,       // 启用调试
    logSpawns: true,     // 记录粒子生成
    showCount: true      // 显示统计
};
```

然后在浏览器控制台查看日志输出。

---

## 与老版本的对比

| 特性 | 老版本 | ECS版本 | 状态 |
|------|--------|---------|------|
| 粒子数量 | 8/30 | 8/30 | ✅ 一致 |
| 随机方向 | ✓ | ✓ | ✅ 一致 |
| 速度单位 | 像素/帧 | 像素/秒 | ✅ 已修复 |
| 随机大小 | 2-6px | 2-6px | ✅ 一致 |
| 渐隐效果 | life/maxLife | timer/maxLife | ✅ 一致 |
| 发光叠加 | lighter | lighter | ✅ 一致 |
| 生命周期清理 | 每帧过滤 | LifetimeSystem | ✅ 等效 |

---

## 系统执行流程

```
游戏循环
    │
    ├─ CollisionSystem (检测碰撞)
    │     └─ 触发 HitEvent → world.events
    │
    ├─ DamageResolutionSystem (处理伤害)
    │     └─ 触发 KillEvent → world.events (HP <= 0)
    │
    ├─ EffectPlayer (播放特效)
    │     ├─ handleHitEvent() → spawnExplosionParticles(hit)
    │     └─ handleKillEvent() → spawnExplosionParticles(large)
    │           └─ 生成粒子实体 (Transform + Velocity + Particle + Lifetime)
    │
    ├─ MovementSystem (更新位置)
    │     └─ transform.x += vx * dt
    │
    ├─ LifetimeSystem (管理生命周期)
    │     └─ lifetime.timer -= dt
    │     └─ timer <= 0 → 添加 DestroyTag
    │
    ├─ CleanupSystem (清理实体)
    │     └─ 删除带 DestroyTag 的实体
    │
    └─ RenderSystem (渲染)
          ├─ drawParticles() → lighter 混合模式
          └─ 透明度 = lifetime.timer / Particle.maxLife
```

---

## 下一步

1. 运行 `pnpm run dev` 启动游戏
2. 射击敌人验证小型爆炸效果
3. 击杀敌人验证大型爆炸效果
4. 如需调整速度，修改 `EXPLOSION_PARTICLES` 中的 `speedMin/speedMax` 值
5. 测试通过后提交修改
