# 视觉特效系统完善实施计划

## 概述

完善新架构中的子弹击中和敌人碰撞的视觉特效系统，将旧代码（game目录）中的特效逻辑迁移到新 ECS 架构的事件驱动系统（Event + EffectPlayer），并添加单元测试确保特效正确播放。

## 当前状态分析

### 旧代码特效（game目录）

#### 1. 子弹击中特效 (`GameEngine.ts:handleBulletHit`)
- **爆炸粒子** (`createExplosion`, 行 1537-1553)
  - 小型爆炸: 8 个粒子
  - 大型爆炸: 30 个粒子
  - 支持自定义颜色

- **等离子爆炸** (`createPlasmaExplosion`, 行 1313-1389)
  - 大型爆炸 + 冲击波
  - 范围伤害（`plasmaExplosions` 数组）
  - 特斯拉连锁特效

- **特斯拉连锁** (`createTeslaChain`, 行 1211-1268)
  - 查找范围内最近敌人
  - 发射连锁子弹

- **冲击波** (`addShockwave`, 行 1555-1559)
  - 初始半径: 10
  - 最大半径: 可配置
  - 线宽: 可配置
  - 生命周期: 1.0

#### 2. 敌人死亡特效 (`GameEngine.ts:killEnemy`)
- **大型爆炸**: 30 个粒子，颜色 `#c53030`（红色）
- **连击冲击波**: 连击升级时触发，根据连击等级不同颜色
- **震屏**: 连击升级时触发

### 新代码当前状态（src目录）

#### 1. 特效配置 (`EffectPlayer.ts:EFFECT_CONFIGS`)
已有特效配置：
- 爆炸: `explosion_small`, `explosion_medium`, `explosion_large`
- 飙血: `blood_light`, `blood_medium`, `blood_heavy`
- 拾取: `pickup`
- 升级: `levelup`, `combo_upgrade`
- Boss: `boss_phase`
- 狂暴: `berserk`
- 炸弹: `bomb_explosion`, `screen_flash`

**问题**：粒子生成时缺少 `Sprite` 组件，导致不可见

#### 2. 事件处理 (`EffectPlayer.ts:EffectPlayer`)
支持的事件：
- `Hit` -> `handleHitEvent` (爆炸 + 飙血)
- `Kill` -> `handleKillEvent` (大型爆炸)
- `Pickup`, `BossPhaseChange`, `CamShake`, `BloodFog`, `LevelUp`, `ComboUpgrade`, `BerserkMode`, `BombExploded`

#### 3. 粒子系统 (`EffectPlayer.ts:spawnParticle`)
当前创建的组件：
```typescript
world.entities.set(id, [transform, particle, lifetime]);
// ❌ 缺少 Sprite 组件
```

### 关键差异

| 特性 | 旧代码 (game) | 新代码 (src) | 状态 |
|------|---------------|--------------|------|
| 爆炸粒子 | 直接渲染 | ECS 实体 | ❌ 缺少 Sprite |
| 冲击波 | `Shockwave[]` 数组 | 未实现 | ❌ 待添加 |
| 飙血 | 未实现 | 已有事件 | ✅ 已有 |
| 震屏 | `screenShake` 变量 | `triggerCameraShake()` | ✅ 已实现 |
| 武器特效 | 直接调用 | 事件驱动 | ❌ 待添加 |

## 实施阶段

### Phase 1: 修复粒子渲染 (2-3小时)

#### Step 1.1: 修改 `spawnParticle()` 添加 Sprite 组件

**文件**: `src/engine/systems/EffectPlayer.ts`

**当前代码**:
```typescript
function spawnParticle(world: World, effectKey: string, x: number, y: number): number {
    const config = EFFECT_CONFIGS[effectKey];
    const transform = new Transform({ x, y, rot: 0 });
    const particle = new Particle({ frame: 0, maxFrame: config.frames, fps: config.fps });
    const lifetime = new Lifetime({ timer: config.lifetime * 1000 });

    const id = generateId();
    world.entities.set(id, [transform, particle, lifetime]); // ❌ 缺少 Sprite

    return id;
}
```

**修改为**:
```typescript
function spawnParticle(world: World, effectKey: string, x: number, y: number): number {
    const config = EFFECT_CONFIGS[effectKey];
    const transform = new Transform({ x, y, rot: 0 });

    // 添加 Sprite 组件，使用纯颜色绘制（无图片文件）
    const sprite = new Sprite({
        spriteKey: SpriteKey.PLAYER, // 临时使用，稍后添加 PARTICLE key
        color: config.color,
        scale: config.scale
    });

    const particle = new Particle({ frame: 0, maxFrame: config.frames, fps: config.fps });
    const lifetime = new Lifetime({ timer: config.lifetime * 1000 });

    const id = generateId();
    world.entities.set(id, [transform, sprite, particle, lifetime]); // ✅ 添加 Sprite

    return id;
}
```

#### Step 1.2: 添加 PARTICLE SpriteKey

**文件**: `src/engine/configs/sprites/base.ts`

**修改**:
```typescript
export enum SpriteKey {
  // Fighters
  PLAYER = 'player',
  OPTION = 'option',

  // Particles (纯颜色绘制)
  PARTICLE = 'particle',  // ✅ 取消注释

  // ... 其他
}

// 在 SPRITE_REGISTRY 中添加配置
[SpriteKey.PARTICLE]: {
  key: SpriteKey.PARTICLE,
  file: '', // 空文件，表示使用纯颜色绘制
  width: 32,
  height: 32,
  pivotX: 0.5,
  pivotY: 0.5,
},
```

#### Step 1.3: 确认 RenderSystem 支持纯颜色绘制

**文件**: `src/engine/systems/RenderSystem.ts`

**检查** `drawSprite()` 函数（行 268-318）:

```typescript
if (image && image.complete) {
    ctx.drawImage(image, -pivotX, -pivotY, width, height);
} else {
    // ✅ 图片未加载，使用颜色占位
    ctx.fillStyle = sprite.color || '#fff';
    ctx.fillRect(-pivotX, -pivotY, width, height);
}
```

**结论**: ✅ RenderSystem 已经支持纯颜色绘制

---

### Phase 2: 添加冲击波特效 (3-4小时)

#### Step 2.1: 添加 Shockwave 组件

**文件**: `src/engine/components/render.ts`

**添加**:
```typescript
/** 冲击波组件 - 控制冲击波动画 */
export class Shockwave extends Component {
    constructor(cfg: {
        maxRadius?: number;
        color?: string;
        width?: number;
    }) {
        super();
        this.radius = 10;
        this.maxRadius = cfg.maxRadius ?? 150;
        this.color = cfg.color ?? '#ffffff';
        this.width = cfg.width ?? 5;
        this.life = 1.0;
    }

    /** 当前半径 */
    public radius: number;
    /** 最大半径 */
    public maxRadius: number;
    /** 颜色 */
    public color: string;
    /** 线宽 */
    public width: number;
    /** 生命周期 (0-1) */
    public life: number;

    static check(c: any): c is Shockwave { return c instanceof Shockwave; }
}
```

#### Step 2.2: 添加冲击波生成函数

**文件**: `src/engine/systems/EffectPlayer.ts`

**添加**:
```typescript
/**
 * 生成冲击波特效
 * @param world 世界对象
 * @param x X 坐标
 * @param y Y 坐标
 * @param color 颜色
 * @param maxRadius 最大半径
 * @param width 线宽
 * @returns 实体 ID
 */
export function spawnShockwave(
    world: World,
    x: number,
    y: number,
    color: string = '#ffffff',
    maxRadius: number = 150,
    width: number = 5
): number {
    const transform = new Transform({ x, y, rot: 0 });
    const shockwave = new Shockwave({ maxRadius, color, width });
    const lifetime = new Lifetime({ timer: 1000 }); // 1秒生命周期

    const id = generateId();
    world.entities.set(id, [transform, shockwave, lifetime]);

    return id;
}
```

#### Step 2.3: 在事件处理中调用冲击波生成

**文件**: `src/engine/systems/EffectPlayer.ts`

**修改** `handleKillEvent()`:
```typescript
function handleKillEvent(world: World, event: KillEvent): void {
    // 生成大型爆炸特效
    spawnParticle(world, 'explosion_large', event.pos.x, event.pos.y);

    // ✅ 添加冲击波
    spawnShockwave(world, event.pos.x, event.pos.y, '#ffffff', 200, 8);
}
```

**修改** `handleComboUpgradeEvent()`:
```typescript
function handleComboUpgradeEvent(world: World, event: ComboUpgradeEvent): void {
    // 生成连击升级特效
    spawnParticle(world, 'combo_upgrade', event.pos.x, event.pos.y);

    // ✅ 添加冲击波
    spawnShockwave(world, event.pos.x, event.pos.y, event.color, 200, 8);
}
```

#### Step 2.4: 在 RenderSystem 中添加冲击波渲染

**文件**: `src/engine/systems/RenderSystem.ts`

**在** `RenderSystem()` **主函数中添加**（行 247 之后）:
```typescript
// 绘制玩家护盾
if (playerInfo) {
    drawPlayerEffects(context, playerInfo, camX, camY);
}

// ✅ 绘制冲击波
drawShockwaves(context, world, camX, camY, dt);

// 绘制 Boss 血条
if (bossInfo) {
    drawBossHealthBar(context, bossInfo, width, height);
}
```

**添加** `drawShockwaves()` **函数**:
```typescript
/**
 * 绘制冲击波特效
 */
function drawShockwaves(
    ctx: CanvasRenderingContext2D,
    world: World,
    camX: number,
    camY: number,
    dt: number
): void {
    for (const [id, comps] of world.entities) {
        const transform = comps.find(Transform.check) as Transform | undefined;
        const shockwave = comps.find(Shockwave.check) as Shockwave | undefined;

        if (!transform || !shockwave) continue;

        // 更新冲击波动画
        shockwave.radius += (shockwave.maxRadius - shockwave.radius) * 0.1 * (dt / 16.66);
        shockwave.life -= 0.02 * (dt / 16.66);

        // 绘制
        ctx.save();
        ctx.globalAlpha = Math.max(0, shockwave.life);
        ctx.lineWidth = shockwave.width;
        ctx.strokeStyle = shockwave.color;
        ctx.beginPath();
        ctx.arc(transform.x - camX, transform.y - camY, shockwave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}
```

---

### Phase 3: 完善特效配置 (2-3小时)

#### Step 3.1: 扩展 EFFECT_CONFIGS 添加武器特效

**文件**: `src/engine/systems/EffectPlayer.ts`

**添加**:
```typescript
const EFFECT_CONFIGS: Record<string, ParticleConfig> = {
    // ... 现有配置

    // 武器特效
    plasma_explosion: {
        scale: 2,
        color: '#ed64a6', // 粉色
        frames: 16,
        fps: 16,
        lifetime: 1.0
    },
    tesla_chain: {
        scale: 1.5,
        color: '#a855f7', // 紫色
        frames: 8,
        fps: 24,
        lifetime: 0.3
    },
    magma_burn: {
        scale: 1.2,
        color: '#ef4444', // 红色
        frames: 12,
        fps: 12,
        lifetime: 0.6
    },
    shuriken_bounce: {
        scale: 1,
        color: '#fbbf24', // 黄色
        frames: 6,
        fps: 20,
        lifetime: 0.3
    },
};
```

#### Step 3.2: 添加武器特效事件类型

**文件**: `src/engine/events.ts`

**添加**:
```typescript
export type Event =
    | HitEvent
    | KillEvent
    // ... 现有事件
    | WeaponEffectEvent; // ✅ 新增

export interface WeaponEffectEvent {
    type: 'WeaponEffect';
    pos: { x: number; y: number };
    weaponType: string;
    effectType: 'explosion' | 'chain' | 'burn' | 'bounce';
}

export const EventTags = {
    // ... 现有标签
    WeaponEffect: 'WeaponEffect',
} as const;
```

#### Step 3.3: 在 EffectPlayer 中处理武器特效事件

**文件**: `src/engine/systems/EffectPlayer.ts`

**在** `EffectPlayer()` **主函数中添加**:
```typescript
export function EffectPlayer(world: World, dt: number): void {
    const events = world.events;

    for (const event of events) {
        switch (event.type) {
            // ... 现有 case
            case 'WeaponEffect':
                handleWeaponEffectEvent(world, event as WeaponEffectEvent);
                break;
        }
    }
}
```

**添加** `handleWeaponEffectEvent()` **函数**:
```typescript
/**
 * 处理武器特效事件
 */
function handleWeaponEffectEvent(world: World, event: WeaponEffectEvent): void {
    let effectKey: string;

    switch (event.effectType) {
        case 'explosion':
            effectKey = 'plasma_explosion';
            break;
        case 'chain':
            effectKey = 'tesla_chain';
            break;
        case 'burn':
            effectKey = 'magma_burn';
            break;
        case 'bounce':
            effectKey = 'shuriken_bounce';
            break;
        default:
            return;
    }

    spawnParticle(world, effectKey, event.pos.x, event.pos.y);
}
```

---

### Phase 4: 单元测试 (3-4小时)

#### Step 4.1: 创建测试文件

**新建文件**: `src/engine/systems/EffectPlayer.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, generateId } from '../world';
import { EffectPlayer, updateParticles, spawnShockwave } from './EffectPlayer';
import { Transform, Particle, Lifetime, Sprite, Shockwave } from '../components';
import { HitEvent, KillEvent } from '../events';

describe('EffectPlayer', () => {
    let world: World;

    beforeEach(() => {
        world = createWorld();
        world.width = 800;
        world.height = 600;
    });

    describe('HitEvent 处理', () => {
        it('应该在 HitEvent 时生成爆炸和飙血粒子', () => {
            const hitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 200 },
                damage: 20,
                owner: 1,
                victim: 2,
                bloodLevel: 2
            };

            world.events.push(hitEvent);
            EffectPlayer(world, 16);

            // 验证粒子实体被创建
            let particleCount = 0;
            for (const [id, comps] of world.entities) {
                if (comps.some(Particle.check)) {
                    particleCount++;
                }
            }

            expect(particleCount).toBeGreaterThan(0);
        });

        it('应该根据伤害值选择爆炸大小', () => {
            // 测试小型爆炸
            const smallHit: HitEvent = {
                type: 'Hit',
                pos: { x: 100, y: 200 },
                damage: 10,
                owner: 1,
                victim: 2,
                bloodLevel: 1
            };

            world.events.push(smallHit);
            EffectPlayer(world, 16);

            // 应该生成 explosion_small
            let hasSmallExplosion = false;
            for (const [id, comps] of world.entities) {
                const sprite = comps.find(Sprite.check);
                if (sprite && sprite.color === '#ff6600') { // explosion_small 的颜色
                    hasSmallExplosion = true;
                }
            }

            expect(hasSmallExplosion).toBe(true);
        });
    });

    describe('KillEvent 处理', () => {
        it('应该在 KillEvent 时生成大型爆炸', () => {
            const killEvent: KillEvent = {
                type: 'Kill',
                pos: { x: 100, y: 200 },
                victim: 2,
                killer: 1,
                score: 100
            };

            world.events.push(killEvent);
            EffectPlayer(world, 16);

            // 验证大型爆炸粒子被创建
            let largeExplosionCount = 0;
            for (const [id, comps] of world.entities) {
                const particle = comps.find(Particle.check);
                if (particle && particle.maxFrame >= 16) { // 大型爆炸的帧数
                    largeExplosionCount++;
                }
            }

            expect(largeExplosionCount).toBeGreaterThan(0);
        });
    });

    describe('粒子动画', () => {
        it('应该正确更新粒子帧', () => {
            const id = generateId();
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const particle = new Particle({ frame: 0, maxFrame: 10, fps: 10 });
            const lifetime = new Lifetime({ timer: 1000 });

            world.entities.set(id, [transform, particle, lifetime]);

            updateParticles(world, 100); // 100ms

            // 帧应该增加
            expect(particle.frame).toBeGreaterThan(0);
        });

        it('应该在动画结束时标记粒子为销毁', () => {
            const id = generateId();
            const transform = new Transform({ x: 100, y: 200, rot: 0 });
            const particle = new Particle({ frame: 9, maxFrame: 10, fps: 10 });
            const lifetime = new Lifetime({ timer: 1000 });

            world.entities.set(id, [transform, particle, lifetime]);

            updateParticles(world, 200); // 超过动画结束时间

            // lifetime.timer 应该被设置为 0
            expect(lifetime.timer).toBe(0);
        });
    });

    describe('冲击波', () => {
        it('应该生成正确的冲击波实体', () => {
            const id = spawnShockwave(world, 100, 200, '#ff0000', 150, 5);

            const comps = world.entities.get(id);
            expect(comps).toBeDefined();

            const transform = comps?.find(Transform.check);
            const shockwave = comps?.find(Shockwave.check);

            expect(transform?.x).toBe(100);
            expect(transform?.y).toBe(200);
            expect(shockwave?.color).toBe('#ff0000');
            expect(shockwave?.maxRadius).toBe(150);
            expect(shockwave?.width).toBe(5);
        });

        it('应该在连击升级时生成冲击波', () => {
            const comboEvent: ComboUpgradeEvent = {
                type: 'ComboUpgrade',
                pos: { x: 100, y: 200 },
                level: 2,
                name: 'Double',
                color: '#00ffff'
            };

            world.events.push(comboEvent);
            EffectPlayer(world, 16);

            // 验证冲击波被创建
            let shockwaveCount = 0;
            for (const [id, comps] of world.entities) {
                if (comps.some(Shockwave.check)) {
                    shockwaveCount++;
                }
            }

            expect(shockwaveCount).toBeGreaterThan(0);
        });
    });
});
```

#### Step 4.2: 添加测试运行脚本

**文件**: `package.json`

**确认测试配置**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 风险与缓解

| 风险 | 严重性 | 缓解措施 |
|------|--------|----------|
| 粒子渲染性能问题 | Medium | 限制同时存在的粒子数量（最多 100 个） |
| 特效配置不一致 | Low | 创建配置验证函数；添加单元测试 |
| 旧代码特效未完全迁移 | Medium | 创建对齐检查表；逐个验证 |
| Sprite 加载失败 | Medium | 回退到纯颜色绘制；添加资源检查 |
| 测试覆盖不足 | Low | 设置覆盖率目标（>80%） |

---

## 成功标准

- [ ] 所有 HitEvent 产生正确的爆炸粒子特效
- [ ] 所有 KillEvent 产生大型爆炸特效 + 冲击波
- [ ] 冲击波特效正确渲染和动画
- [ ] 飙血特效根据 bloodLevel 正确显示
- [ ] 武器特效（等离子、特斯拉等）正确播放
- [ ] 单元测试覆盖率 > 80%
- [ ] 所有测试通过
- [ ] 手动游戏测试确认视觉效果良好

---

## 时间估算

| Phase | 预估时间 | 复杂度 |
|-------|---------|--------|
| Phase 1: 修复粒子渲染 | 2-3 小时 | Low |
| Phase 2: 添加冲击波特效 | 3-4 小时 | Medium |
| Phase 3: 完善特效配置 | 2-3 小时 | Low |
| Phase 4: 单元测试 | 3-4 小时 | Medium |
| **总计** | **10-14 小时** | **Medium** |

---

## 附录: 旧代码特效清单

### 子弹击中特效
1. **普通爆炸** - `createExplosion(x, y, size, color)`
   - 小型: 8 个粒子
   - 大型: 30 个粒子

2. **等离子爆炸** - `createPlasmaExplosion(x, y)`
   - 大型爆炸 + 冲击波 + 范围伤害

3. **特斯拉连锁** - `createTeslaChain(bullet, target)`
   - 查找最近敌人并发射连锁子弹

### 敌人死亡特效
1. **大型爆炸** - `killEnemy()` 行 1286
   - 30 个粒子，颜色 `#c53030`

2. **连击冲击波** - `killEnemy()` 行 1292
   - 连击升级时触发

### 冲击波特效
1. **添加冲击波** - `addShockwave(x, y, color, maxRadius, width)`
   - 初始半径: 10
   - 最大半径: 可配置
   - 生命周期: 1.0

---

**文档版本**: 1.0
**创建日期**: 2026-01-30
**最后更新**: 2026-01-30
