# 霓电战记 - 实施计划

> 基于代码分析报告的详细实施路线图  
> 版本：v1.0  
> 创建日期：2026-01-14

---

## 📋 目录

- [一、总体路线图](#一总体路线图)
- [二、第一阶段：功能完善（1-2 周）](#二第一阶段功能完善1-2-周)
- [三、第二阶段：性能优化（2-3 周）](#三第二阶段性能优化2-3-周)
- [四、第三阶段：架构重构（1-2 个月）](#四第三阶段架构重构1-2-个月)
- [五、第四阶段：长期改进（3-6 个月）](#五四第四阶段长期改进3-6-个月)
- [六、测试与部署](#六测试与部署)
- [七、团队协作](#七团队协作)

---

## 一、总体路线图

### 优先级分类

| 优先级 | 类别 | 预计工作量 | 影响范围 |
|--------|------|-----------|---------|
| **P0** | 功能完善 | 2 周 | 阻塞核心功能 |
| **P1** | 性能优化 | 3 周 | 用户体验关键 |
| **P2** | 架构重构 | 2 个月 | 长期可维护性 |
| **P3** | 长期改进 | 6 个月 | 战略性提升 |

### 时间线

```
Week 1-2   ██████████  功能完善（P0）
Week 3-5   ████████████  性能优化（P1）
Week 6-13  █████████████████████████████████████████████  架构重构（P2）
Week 14+   █████████████████████████████████████████████████████████████████████████████████  长期改进（P3）
```

---

## 二、第一阶段：功能完善（1-2 周）

### 目标
完成未实现的核心功能，确保游戏可玩性达到基本标准。

### 任务 2.1：完善快照系统

**问题描述**：
- `snapshot.ts` 存在大量 TODO 项
- 缺少 UI 需要的关键状态
- 类型定义与实际实现不一致

**实施步骤**：

1. **补充缺失的状态字段**
   ```typescript
   // src/engine/snapshot.ts
   export function buildSnapshot(world: World, t: number): GameSnapshot {
     // ... 现有代码 ...
     
     // 补充关卡过渡状态
     const levelingSystem = world.levelingSystem; // 需要从 LevelingSystem 获取
     showLevelTransition: levelingSystem?.isTransitioning ?? false,
     levelTransitionTimer: levelingSystem?.transitionTimer ?? 0,
     
     // 补充 Boss 预警状态
     const bossSystem = world.bossSystem; // 需要从 BossSystem 获取
     showBossWarning: bossSystem?.isWarningActive ?? false,
     
     // 补充炸弹数量
     const bombComponent = player.find(Components.Bomb.check);
     bombs: bombComponent?.count ?? 0,
     
     // 补充主动武器协同
     const synergies = getActiveSynergies(world, world.playerId);
     activeSynergies: synergies,
   }
   ```

2. **统一类型定义**
   ```typescript
   // src/ui/types.ts
   export interface GameSnapshot {
     // 确保与 snapshot.ts 定义一致
     // 添加完整的 JSDoc 注释
   }
   ```

3. **更新 System 接口**
   ```typescript
   // src/engine/systems/LevelingSystem.ts
   export interface LevelingSystemState {
     isTransitioning: boolean;
     transitionTimer: number;
     // ... 其他状态
   }
   
   // src/engine/systems/BossSystem.ts
   export interface BossSystemState {
     isWarningActive: boolean;
     warningTimer: number;
     // ... 其他状态
   }
   ```

4. **测试验证**
   - 运行游戏，确认 HUD 显示正常
   - 验证关卡过渡动画
   - 验证 Boss 预警显示

**预计时间**：2 天  
**风险等级**：低

---

### 任务 2.2：完成 UI 层重构

**问题描述**：
- UI 组件从 `_old` 目录迁移至 `src/ui/` 未完成
- 导入路径不一致
- 可能存在功能缺失

**实施步骤**：

1. **创建完整的 UI 组件结构**
   ```
   src/ui/
   ├── components/
   │   ├── HUD.tsx           (已存在)
   │   ├── GameUI.tsx        (从 _old 迁移)
   │   ├── MainMenu.tsx      (从 _old 迁移)
   │   ├── PauseMenu.tsx     (从 _old 迁移)
   │   ├── LevelUpModal.tsx  (从 _old 迁移)
   │   ├── BossWarning.tsx   (从 _old 迁移)
   │   └── ComboDisplay.tsx  (从 _old 迁移)
   ├── hooks/
   │   └── useGameSnapshot.ts (新增)
   └── App.tsx               (从根目录迁移)
   ```

2. **创建自定义 Hook**
   ```typescript
   // src/ui/hooks/useGameSnapshot.ts
   import { useState, useEffect } from 'react';
   import { Engine } from '@/engine';
   
   export function useGameSnapshot(engine: Engine) {
     const [snapshot, setSnapshot] = useState(engine.snapshot$.value);
     
     useEffect(() => {
       const subscription = engine.snapshot$.subscribe(setSnapshot);
       return () => subscription.unsubscribe();
     }, [engine]);
     
     return snapshot;
   }
   ```

3. **重构 App.tsx**
   ```typescript
   // src/ui/App.tsx
   import { Engine } from '@/engine';
   import { Blueprint } from '@/engine/blueprints';
   import { useGameSnapshot } from './hooks/useGameSnapshot';
   import { GameUI } from './components/GameUI';
   import { HUD } from './components/HUD';
   
   export default function App() {
     const canvasRef = useRef<HTMLCanvasElement>(null);
     const [engine] = useState(() => new Engine());
     const snapshot = useGameSnapshot(engine);
     
     // ... 其余逻辑
     
     return (
       <div className="relative w-full h-screen">
         <canvas ref={canvasRef} />
         {snapshot && (
           <>
             <HUD player={snapshot.player} />
             <GameUI snapshot={snapshot} engine={engine} />
           </>
         )}
       </div>
     );
   }
   ```

4. **统一导入路径**
   - 更新所有 `import` 语句
   - 确保 TypeScript 路径别名配置正确
   - 移除对 `_old` 目录的引用

5. **功能验证**
   - 测试所有 UI 交互
   - 验证菜单功能
   - 确认样式正确

**预计时间**：3 天  
**风险等级**：中

---

### 任务 2.3：完成 EffectPlayer

**问题描述**：
- `EffectPlayer.ts` 处于框架搭建阶段
- 粒子生成逻辑不完整
- 缺少具体的粒子渲染实现

**实施步骤**：

1. **设计粒子效果配置**
   ```typescript
   // src/engine/configs/particles.ts
   export interface ParticleEffect {
     type: 'explosion' | 'blood' | 'spark' | 'trail';
     count: number;
     lifetime: number;
     speed: number;
     colors: string[];
     size: { min: number; max: number };
   }
   
   export const PARTICLE_EFFECTS: Record<string, ParticleEffect> = {
     EXPLOSION_SMALL: {
       type: 'explosion',
       count: 10,
       lifetime: 500,
       speed: 100,
       colors: ['#ff6600', '#ffcc00', '#ffffff'],
       size: { min: 2, max: 5 }
     },
     EXPLOSION_BIG: {
       type: 'explosion',
       count: 30,
       lifetime: 800,
       speed: 200,
       colors: ['#ff0000', '#ff6600', '#ffcc00'],
       size: { min: 5, max: 15 }
     },
     BLOOD: {
       type: 'blood',
       count: 8,
       lifetime: 300,
       speed: 80,
       colors: ['#cc0000', '#880000'],
       size: { min: 2, max: 4 }
     }
   };
   ```

2. **实现粒子生成逻辑**
   ```typescript
   // src/engine/systems/EffectPlayer.ts
   import { World } from '@/engine/types';
   import { pushEvent } from '@/engine/world';
   import { Particle } from '@/engine/components/render';
   import { Transform, Velocity, Lifetime } from '@/engine/components/base';
   import { PARTICLE_EFFECTS } from '@/engine/configs/particles';
   
   export function EffectPlayer(world: World, dt: number) {
     // 处理 HitEvent
     const hitEvents = world.events.filter(e => e.type === 'Hit');
     for (const event of hitEvents) {
       spawnParticles(world, event.pos, 'EXPLOSION_SMALL', event.bloodLevel);
     }
     
     // 处理 KillEvent
     const killEvents = world.events.filter(e => e.type === 'Kill');
     for (const event of killEvents) {
       spawnParticles(world, event.pos, 'EXPLOSION_BIG', 3);
     }
     
     // 处理 BloodFogEvent
     const bloodFogEvents = world.events.filter(e => e.type === 'BloodFog');
     for (const event of bloodFogEvents) {
       spawnParticles(world, event.pos, 'BLOOD', event.level);
     }
   }
   
   function spawnParticles(world: World, pos: { x: number; y: number }, 
                          effectType: string, level: number) {
     const effect = PARTICLE_EFFECTS[effectType];
     if (!effect) return;
     
     const count = Math.floor(effect.count * level);
     
     for (let i = 0; i < count; i++) {
       const id = generateId();
       const angle = Math.random() * Math.PI * 2;
       const speed = effect.speed * (0.5 + Math.random());
       const size = effect.size.min + Math.random() * (effect.size.max - effect.size.min);
       const color = effect.colors[Math.floor(Math.random() * effect.colors.length)];
       
       world.entities.set(id, [
         new Transform({ x: pos.x, y: pos.y, rot: angle }),
         new Velocity({ 
           vx: Math.cos(angle) * speed, 
           vy: Math.sin(angle) * speed 
         }),
         new Lifetime({ timer: effect.lifetime }),
         new Particle({
           frame: 0,
           maxFrame: 1,
           fps: 60,
           color: color,
           size: size,
           alpha: 1.0
         })
       ]);
     }
   }
   ```

3. **增强 Particle 组件**
   ```typescript
   // src/engine/components/render.ts
   export class Particle extends Component {
     constructor(cfg: {
       frame: number;
       maxFrame: number;
       fps: number;
       color?: string;
       size?: number;
       alpha?: number;
     }) {
       super();
       this.frame = cfg.frame;
       this.maxFrame = cfg.maxFrame;
       this.fps = cfg.fps;
       this.color = cfg.color ?? '#ffffff';
       this.size = cfg.size ?? 4;
       this.alpha = cfg.alpha ?? 1.0;
     }
     
     public frame: number;
     public maxFrame: number;
     public fps: number;
     public color: string;
     public size: number;
     public alpha: number;
     private frameTimer: number = 0;
     
     update(dt: number): void {
       this.frameTimer += dt;
       if (this.frameTimer >= 1000 / this.fps) {
         this.frame++;
         this.frameTimer = 0;
       }
       
       // 淡出效果
       const progress = this.frame / this.maxFrame;
       this.alpha = 1.0 - progress;
     }
     
     isFinished(): boolean {
       return this.frame >= this.maxFrame;
     }
     
     static check(c: any): c is Particle {
       return c instanceof Particle;
     }
   }
   ```

4. **更新 RenderSystem**
   ```typescript
   // src/engine/systems/RenderSystem.ts
   // 添加粒子渲染
   for (const [id, [tr, particle]] of view(world, [Transform, Particle])) {
     ctx.save();
     ctx.globalAlpha = particle.alpha;
     ctx.fillStyle = particle.color;
     ctx.beginPath();
     ctx.arc(tr.x, tr.y, particle.size, 0, Math.PI * 2);
     ctx.fill();
     ctx.restore();
     
     // 更新粒子
     particle.update(dt);
     
     // 标记销毁
     if (particle.isFinished()) {
       pushEvent(world, { type: 'EntityDestroy', entityId: id });
     }
   }
   ```

5. **测试验证**
   - 测试击中效果
   - 测试爆炸效果
   - 测试血雾效果
   - 性能测试（大量粒子）

**预计时间**：3 天  
**风险等级**：中

---

### 任务 2.4：实现炸弹系统

**问题描述**：
- `BombIntent` 组件已定义
- 但炸弹系统逻辑未实现
- UI 显示炸弹数量，但无法使用

**实施步骤**：

1. **创建 Bomb 组件**
   ```typescript
   // src/engine/components/combat.ts (新增)
   export class Bomb extends Component {
     constructor(cfg: {
       count: number;
       maxCount: number;
       cooldown: number;
       radius: number;
       damage: number;
     }) {
       super();
       this.count = cfg.count;
       this.maxCount = cfg.maxCount;
       this.cooldown = cfg.cooldown;
       this.radius = cfg.radius;
       this.damage = cfg.damage;
       this.currentCooldown = 0;
     }
     
     public count: number;
     public maxCount: number;
     public cooldown: number;
     public radius: number;
     public damage: number;
     public currentCooldown: number;
     
     update(dt: number): void {
       if (this.currentCooldown > 0) {
         this.currentCooldown -= dt;
       }
     }
     
     canUse(): boolean {
       return this.count > 0 && this.currentCooldown <= 0;
     }
     
     use(): void {
       if (this.canUse()) {
         this.count--;
         this.currentCooldown = this.cooldown;
       }
     }
     
     static check(c: any): c is Bomb {
       return c instanceof Bomb;
     }
   }
   ```

2. **实现 BombSystem**
   ```typescript
   // src/engine/systems/BombSystem.ts
   import { World } from '@/engine/types';
   import { view } from '@/engine/world';
   import { Bomb, Transform, DamageOverTime, InvulnerableState } from '@/engine/components';
   import { pushEvent } from '@/engine/world';
   import { KillEvent, HitEvent, CamShakeEvent, ScreenClearEvent } from '@/engine/events';
   import { spawnParticles } from './EffectPlayer';
   
   export function BombSystem(world: World, dt: number) {
     // 更新冷却
     for (const [id, [bomb]] of view(world, [Bomb])) {
       bomb.update(dt);
     }
     
     // 处理 BombIntent
     for (const [id, [player, bomb, tr]] of view(world, [PlayerTag, Bomb, Transform])) {
       if (bomb.canUse()) {
         // 使用炸弹
         bomb.use();
         
         // 震屏
         pushEvent(world, {
           type: 'CamShake',
           intensity: 20,
           duration: 0.5
         });
         
         // 清屏事件
         pushEvent(world, {
           type: 'ScreenClear'
         });
         
         // 特效
         spawnParticles(world, tr, 'EXPLOSION_BIG', 5);
         
         // 对所有敌人造成伤害
         for (const [enemyId, [enemyTr, health, enemyTag]] of 
              view(world, [Transform, Health, EnemyTag, BossTag])) {
           const distance = Math.hypot(enemyTr.x - tr.x, enemyTr.y - tr.y);
           
           if (distance <= bomb.radius) {
             // 造成伤害
             const damage = bomb.damage * (1 - distance / bomb.radius);
             pushEvent(world, {
               type: 'Hit',
               pos: { x: enemyTr.x, y: enemyTr.y },
               damage: damage,
               owner: id,
               victim: enemyId,
               bloodLevel: 3
             });
           }
         }
       }
     }
   }
   ```

3. **更新 InputSystem**
   ```typescript
   // src/engine/systems/InputSystem.ts
   // 添加炸弹输入处理
   if (InputManager.getInstance().isKeyPressed('Space') || 
       InputManager.getInstance().isKeyPressed('KeyB')) {
     for (const [id] of view(world, [PlayerTag])) {
       const bomb = world.entities.get(id)?.find(Bomb.check);
       if (bomb?.canUse()) {
         addComponent(world, id, new BombIntent());
       }
     }
   }
   ```

4. **更新 UI**
   ```typescript
   // src/ui/components/GameUI.tsx
   // 添加炸弹按钮
   <button 
     onClick={() => engine?.useBomb()}
     disabled={snapshot?.player.bombs === 0}
     className="bomb-button"
   >
     💣 {snapshot?.player.bombs}
   </button>
   ```

5. **测试验证**
   - 测试炸弹冷却
   - 测试炸弹伤害范围
   - 测试炸弹特效
   - UI 交互测试

**预计时间**：2 天  
**风险等级**：低

---

### 任务 2.5：实现关卡切换

**问题描述**：
- `levels.ts` 定义了关卡配置
- 但关卡切换逻辑未实现
- `showLevelTransition` 始终为 false

**实施步骤**：

1. **扩展关卡配置**
   ```typescript
   // src/engine/configs/levels.ts
   export interface LevelConfig {
     id: number;
     name: string;
     duration: number;          // 关卡时长（秒）
     enemySpawnRate: number;     // 敌人生成速率
     bossId?: string;            // Boss ID（可选）
     background?: string;         // 背景图
     music?: string;              // 背景音乐
   }
   
   export const LEVELS: LevelConfig[] = [
     {
       id: 1,
       name: "初次接触",
       duration: 60,
       enemySpawnRate: 2.0,
       background: "bg_space.png"
     },
     {
       id: 2,
       name: "敌方增援",
       duration: 90,
       enemySpawnRate: 1.5,
       background: "bg_planet.png"
     },
     // ... 更多关卡
   ];
   ```

2. **实现 LevelingSystem**
   ```typescript
   // src/engine/systems/LevelingSystem.ts
   import { World } from '@/engine/types';
   import { view } from '@/engine/world';
   import { PlayerTag, Health } from '@/engine/components';
   import { LEVELS } from '@/engine/configs/levels';
   
   export interface LevelingSystemState {
     currentLevel: number;
     levelTimer: number;
     isTransitioning: boolean;
     transitionTimer: number;
     maxLevelReached: number;
   }
   
   export function LevelingSystem(world: World, dt: number) {
     // 初始化系统状态
     if (!world.levelingSystem) {
       world.levelingSystem = {
         currentLevel: 1,
         levelTimer: 0,
         isTransitioning: false,
         transitionTimer: 0,
         maxLevelReached: 1
       };
     }
     
     const state = world.levelingSystem;
     const levelConfig = LEVELS.find(l => l.id === state.currentLevel);
     
     if (!levelConfig) return;
     
     if (!state.isTransitioning) {
       // 正常游戏状态
       state.levelTimer += dt / 1000;
       
       // 检查是否完成关卡
       if (state.levelTimer >= levelConfig.duration) {
         startLevelTransition(world, state);
       }
     } else {
       // 关卡过渡状态
       state.transitionTimer += dt / 1000;
       
       if (state.transitionTimer >= 3) { // 3 秒过渡
         endLevelTransition(world, state);
       }
     }
   }
   
   function startLevelTransition(world: World, state: LevelingSystemState) {
     state.isTransitioning = true;
     state.transitionTimer = 0;
     
     // 保存当前关卡的最高记录
     if (state.currentLevel > state.maxLevelReached) {
       state.maxLevelReached = state.currentLevel;
     }
   }
   
   function endLevelTransition(world: World, state: LevelingSystemState) {
     state.isTransitioning = false;
     state.levelTimer = 0;
     state.currentLevel++;
     
     // 如果超过最大关卡，循环到最后一个
     if (state.currentLevel > LEVELS.length) {
       state.currentLevel = LEVELS.length;
     }
     
     // 升级玩家
     pushEvent(world, {
       type: 'LevelUp',
       oldLevel: state.currentLevel - 1,
       newLevel: state.currentLevel,
       source: 'levelEnd'
     });
     
     // 清理当前关卡敌人
     for (const [id, [enemyTag]] of view(world, [EnemyTag])) {
       pushEvent(world, { type: 'EntityDestroy', entityId: id });
     }
   }
   ```

3. **更新快照系统**
   ```typescript
   // src/engine/snapshot.ts
   const levelingSystem = world.levelingSystem;
   showLevelTransition: levelingSystem?.isTransitioning ?? false,
   levelTransitionTimer: levelingSystem?.transitionTimer ?? 0,
   maxLevelReached: levelingSystem?.maxLevelReached ?? 1,
   ```

4. **添加关卡过渡 UI**
   ```typescript
   // src/ui/components/LevelTransition.tsx
   import { GameSnapshot } from '@/engine/types';
   
   export function LevelTransition({ snapshot }: { snapshot: GameSnapshot }) {
     if (!snapshot.showLevelTransition) return null;
     
     return (
       <div className="level-transition">
         <h2>LEVEL {snapshot.level} COMPLETED!</h2>
         <p>即将进入下一关...</p>
       </div>
     );
   }
   ```

5. **测试验证**
   - 测试关卡计时
   - 测试关卡过渡
   - 测试玩家升级
   - 测试关卡循环

**预计时间**：3 天  
**风险等级**：中

---

### 第一阶段总结

| 任务 | 预计时间 | 优先级 | 风险 |
|------|---------|--------|------|
| 完善快照系统 | 2 天 | P0 | 低 |
| 完成 UI 层重构 | 3 天 | P0 | 中 |
| 完成 EffectPlayer | 3 天 | P0 | 中 |
| 实现炸弹系统 | 2 天 | P0 | 低 |
| 实现关卡切换 | 3 天 | P0 | 中 |
| **总计** | **13 天 (~2 周)** | **P0** | **中** |

**交付物**：
- 完整可玩的游戏
- UI 层重构完成
- 特效系统完善
- 核心功能测试通过

---

## 三、第二阶段：性能优化（2-3 周）

### 目标
优化游戏性能，确保在低端设备上也能稳定运行 60 FPS。

### 任务 3.1：优化碰撞检测

**问题描述**：
- `CollisionSystem` 使用 O(N²) 双重循环
- 100 个实体时每帧 10,000 次检测
- 性能瓶颈明显

**解决方案**：引入空间索引

#### 方案 A：Quadtree（推荐）

1. **实现 Quadtree**
   ```typescript
   // src/engine/utils/Quadtree.ts
   export class Quadtree {
     private bounds: Rectangle;
     private capacity: number;
     private points: QuadtreePoint[] = [];
     private divided: boolean = false;
     private northwest?: Quadtree;
     private northeast?: Quadtree;
     private southwest?: Quadtree;
     private southeast?: Quadtree;
     
     constructor(bounds: Rectangle, capacity: number = 10) {
       this.bounds = bounds;
       this.capacity = capacity;
     }
     
     insert(point: QuadtreePoint): boolean {
       if (!this.contains(this.bounds, point)) {
         return false;
       }
       
       if (this.points.length < this.capacity) {
         this.points.push(point);
         return true;
       }
       
       if (!this.divided) {
         this.subdivide();
       }
       
       return (this.northwest!.insert(point) ||
               this.northeast!.insert(point) ||
               this.southwest!.insert(point) ||
               this.southeast!.insert(point));
     }
     
     query(range: Rectangle, found: QuadtreePoint[] = []): QuadtreePoint[] {
       if (!this.intersects(this.bounds, range)) {
         return found;
       }
       
       for (const point of this.points) {
         if (this.contains(range, point)) {
           found.push(point);
         }
       }
       
       if (this.divided) {
         this.northwest!.query(range, found);
         this.northeast!.query(range, found);
         this.southwest!.query(range, found);
         this.southeast!.query(range, found);
       }
       
       return found;
     }
     
     private subdivide() {
       const x = this.bounds.x;
       const y = this.bounds.y;
       const w = this.bounds.w / 2;
       const h = this.bounds.h / 2;
       
       this.northwest = new Quadtree({ x, y, w, h }, this.capacity);
       this.northeast = new Quadtree({ x: x + w, y, w, h }, this.capacity);
       this.southwest = new Quadtree({ x, y: y + h, w, h }, this.capacity);
       this.southeast = new Quadtree({ x: x + w, y: y + h, w, h }, this.capacity);
       
       this.divided = true;
     }
     
     clear() {
       this.points = [];
       this.divided = false;
       this.northwest = undefined;
       this.northeast = undefined;
       this.southwest = undefined;
       this.southeast = undefined;
     }
     
     private contains(bounds: Rectangle, point: QuadtreePoint): boolean {
       return point.x >= bounds.x && 
              point.x < bounds.x + bounds.w &&
              point.y >= bounds.y && 
              point.y < bounds.y + bounds.h;
     }
     
     private intersects(bounds1: Rectangle, bounds2: Rectangle): boolean {
       return !(bounds2.x >= bounds1.x + bounds1.w ||
                bounds2.x + bounds2.w <= bounds1.x ||
                bounds2.y >= bounds1.y + bounds1.h ||
                bounds2.y + bounds2.h <= bounds1.y);
     }
   }
   
   interface Rectangle {
     x: number;
     y: number;
     w: number;
     h: number;
   }
   
   interface QuadtreePoint {
     x: number;
     y: number;
     entityId: number;
     userData?: any;
   }
   ```

2. **重构 CollisionSystem**
   ```typescript
   // src/engine/systems/CollisionSystem.ts
   import { Quadtree } from '@/engine/utils/Quadtree';
   
   let quadtree: Quadtree | null = null;
   
   export function CollisionSystem(world: World, dt: number) {
     // 初始化 Quadtree
     if (!quadtree) {
       quadtree = new Quadtree({
         x: 0,
         y: 0,
         w: world.width,
         h: world.height
       }, 10);
     }
     
     quadtree.clear();
     
     // 插入所有有 HitBox 的实体
     for (const [id, [tr, hb]] of view(world, [Transform, HitBox])) {
       const radius = hb.shape === 'circle' ? hb.radius! : 
                     Math.max(hb.halfWidth!, hb.halfHeight!);
       
       quadtree.insert({
         x: tr.x - radius,
         y: tr.y - radius,
         entityId: id,
         userData: { tr, hb }
       });
     }
     
     // 查询碰撞
     for (const [id, [tr, hb]] of view(world, [Transform, HitBox])) {
       const radius = hb.shape === 'circle' ? hb.radius! : 
                     Math.max(hb.halfWidth!, hb.halfHeight!);
       
       const range = {
         x: tr.x - radius * 2,
         y: tr.y - radius * 2,
         w: radius * 4,
         h: radius * 4
       };
       
       const nearby = quadtree.query(range);
       
       for (const point of nearby) {
         if (point.entityId === id) continue;
         
        const otherTr = point.userData.tr;
        const otherHb = point.userData.hb;
        
        if (checkCollision(tr, hb, otherTr, otherHb)) {
          handleCollision(world, id, point.entityId);
        }
      }
    }
   }
   ```

3. **性能对比测试**
   - 测试不同实体数量的性能
   - 对比 O(N²) vs O(N log N)
   - 验证 60 FPS 稳定性

**预计时间**：5 天  
**风险等级**：中

---

### 任务 3.2：优化视图查询

**问题描述**：
- `view` 函数使用 `instanceof` 遍历所有实体
- 每次查询都要遍历整个实体 Map
- 无缓存机制，重复计算

**解决方案**：添加组件索引

1. **实现组件索引**
   ```typescript
   // src/engine/world.ts (扩展)
   export interface World {
     // ... 现有属性
     componentIndexes: Map<any, Set<EntityId>>;  // 组件类型 → 实体 ID 集合
   }
   
   export function addComponent<T extends Component>(w: World, id: EntityId, comp: T) {
     if (!w.entities.has(id)) w.entities.set(id, []);
     w.entities.get(id)!.push(comp);
     
     // 更新索引
     const compType = comp.constructor;
     if (!w.componentIndexes.has(compType)) {
       w.componentIndexes.set(compType, new Set());
     }
     w.componentIndexes.get(compType)!.add(id);
   }
   
   export function removeComponent<T extends Component>(w: World, id: EntityId, comp: T) {
     const comps = w.entities.get(id);
     if (comps) {
       const index = comps.indexOf(comp);
       if (index !== -1) {
         comps.splice(index, 1);
         
         // 更新索引
         const compType = comp.constructor;
         w.componentIndexes.get(compType)?.delete(id);
       }
     }
   }
   
   export function removeEntity(w: World, id: EntityId) {
     const comps = w.entities.get(id);
     if (comps) {
       // 更新所有索引
       for (const comp of comps) {
         const compType = comp.constructor;
         w.componentIndexes.get(compType)?.delete(id);
       }
     }
     w.entities.delete(id);
   }
   
   // 优化后的 view 函数
   export function* view<T extends Ctor[]>(w: World, types: [...T]): Iterable<[EntityId, InstanceTuple<T>]> {
     // 找到实体数量最少的组件类型
     const minType = types.reduce((min, curr) => {
       const minSize = w.componentIndexes.get(min)?.size ?? 0;
       const currSize = w.componentIndexes.get(curr)?.size ?? 0;
       return currSize < minSize ? curr : min;
     });
     
     const candidateIds = w.componentIndexes.get(minType) ?? [];
     const len = types.length;
     
     for (const id of candidateIds) {
       const comps = w.entities.get(id);
       if (!comps) continue;
       
       const bucket: any[] = [];
       let hasAll = true;
       
       for (let i = 0; i < len; i++) {
         const Ctor = types[i];
         const found = comps.find(c => c instanceof Ctor);
         
         if (!found) {
           hasAll = false;
           break;
         }
         bucket.push(found);
       }
       
       if (hasAll) {
         yield [id, bucket as unknown as InstanceTuple<T>];
       }
     }
   }
   ```

2. **初始化索引**
   ```typescript
   // src/engine/world.ts
   export function createWorld(): World {
     return {
       time: 0,
       entities: new Map(),
       events: [],
       score: 0,
       level: 1,
       playerId: 0,
       playerLevel: 1,
       difficulty: 1,
       spawnCredits: 0,
       spawnTimer: 0,
       enemyCount: 0,
       width: 0,
       height: 0,
       componentIndexes: new Map()  // 新增
     };
   }
   ```

3. **性能测试**
   - 测试查询速度提升
   - 验证索引维护成本
   - 确保内存使用合理

**预计时间**：3 天  
**风险等级**：低

---

### 任务 3.3：渲染性能优化

**问题描述**：
- 每帧都绘制所有实体
- 无视锥体剔除
- 无批量绘制

**解决方案**：

1. **实现视锥体剔除**
   ```typescript
   // src/engine/systems/RenderSystem.ts
   export function RenderSystem(ctx: CanvasRenderingContext2D, world: World) {
     // 清除画布
     ctx.clearRect(0, 0, world.width, world.height);
     
     // 应用相机变换
     ctx.save();
     const camera = world.camera;
     if (camera) {
       ctx.translate(-camera.x + world.width / 2, -camera.y + world.height / 2);
     }
     
     // 计算可见区域
     const visibleRect = {
       x: camera.x - world.width / 2,
       y: camera.y - world.height / 2,
       w: world.width,
       h: world.height
     };
     
     // 只绘制可见实体
     for (const [id, [tr, sprite]] of view(world, [Transform, Sprite])) {
       if (!isVisible(tr, sprite, visibleRect)) continue;
       
       // ... 绘制逻辑
     }
     
     ctx.restore();
   }
   
   function isVisible(tr: Transform, sprite: Sprite, rect: Rectangle): boolean {
     const size = sprite.scale * (sprite.srcW ?? 32);
     const left = tr.x - size / 2;
     const right = tr.x + size / 2;
     const top = tr.y - size / 2;
     const bottom = tr.y + size / 2;
     
     return !(right < rect.x || 
              left > rect.x + rect.w ||
              bottom < rect.y || 
              top > rect.y + rect.h);
   }
   ```

2. **实现批量绘制**
   ```typescript
   // 按纹理批量绘制
   const batches: Map<string, [EntityId, Transform, Sprite][]> = new Map();
   
   for (const [id, [tr, sprite]] of view(world, [Transform, Sprite])) {
     if (!isVisible(tr, sprite, visibleRect)) continue;
     
     if (!batches.has(sprite.image)) {
       batches.set(sprite.image, []);
     }
     batches.get(sprite.image)!.push([id, tr, sprite]);
   }
   
   // 批量绘制
   for (const [image, entities] of batches) {
     const img = assets.get(image);
     if (!img) continue;
     
     for (const [, tr, sprite] of entities) {
       ctx.save();
       ctx.translate(tr.x, tr.y);
       ctx.rotate(tr.rot);
       ctx.scale(sprite.scale, sprite.scale);
       
       ctx.drawImage(
         img,
         sprite.srcX ?? 0, sprite.srcY ?? 0,
         sprite.srcW ?? 32, sprite.srcH ?? 32,
         -sprite.srcW! / 2, -sprite.srcH! / 2,
         sprite.srcW ?? 32, sprite.srcH ?? 32
       );
       
       ctx.restore();
     }
   }
   ```

3. **使用离屏 Canvas 缓存**
   ```typescript
   // 缓存静态背景
   const backgroundCanvas = document.createElement('canvas');
   backgroundCanvas.width = world.width;
   backgroundCanvas.height = world.height;
   const bgCtx = backgroundCanvas.getContext('2d')!;
   
   // 预渲染背景
   function renderBackground(ctx: CanvasRenderingContext2D, world: World) {
     if (!world.backgroundCached) {
       // 渲染到离屏 Canvas
       bgCtx.drawImage(assets.get('background.png'), 0, 0);
       world.backgroundCached = true;
     }
     
     // 直接绘制缓存的背景
     ctx.drawImage(backgroundCanvas, 0, 0);
   }
   ```

**预计时间**：3 天  
**风险等级**：低

---

### 任务 3.4：内存优化

**问题描述**：
- 频繁创建/销毁对象
- GC 抖动影响性能
- 内存泄漏风险

**解决方案**：

1. **扩展对象池**
   ```typescript
   // src/engine/world.ts
   export const pools: Record<string, Component[][]> = {
     bullet: [],
     enemy: [],
     pickup: [],
     particle: [],  // 新增粒子池
     effect: [],    // 新增特效池
   };
   ```

2. **实现内存监控**
   ```typescript
   // src/engine/utils/MemoryMonitor.ts
   export class MemoryMonitor {
     private static instance: MemoryMonitor;
     private memoryData: { timestamp: number; used: number }[] = [];
     
     private constructor() {
       setInterval(() => this.record(), 1000);
     }
     
     static getInstance(): MemoryMonitor {
       if (!MemoryMonitor.instance) {
         MemoryMonitor.instance = new MemoryMonitor();
       }
       return MemoryMonitor.instance;
     }
     
     private record() {
       if (performance.memory) {
         this.memoryData.push({
           timestamp: Date.now(),
           used: performance.memory.usedJSHeapSize / 1024 / 1024
         });
         
         // 只保留最近 5 分钟的数据
         if (this.memoryData.length > 300) {
           this.memoryData.shift();
         }
       }
     }
     
     getStats() {
       return {
         current: this.memoryData[this.memoryData.length - 1]?.used ?? 0,
         max: Math.max(...this.memoryData.map(d => d.used))
       };
     }
   }
   ```

3. **检测内存泄漏**
   ```typescript
   // 添加到 Engine
   export class Engine {
     private memoryMonitor = MemoryMonitor.getInstance();
     
     start(canvas: HTMLCanvasElement, bp: Blueprint) {
       // ... 现有代码
       
       // 定期检查内存泄漏
       setInterval(() => {
         const stats = this.memoryMonitor.getStats();
         if (stats.current > stats.max * 1.5) {
           console.warn('Potential memory leak detected:', stats);
         }
       }, 10000);
     }
   }
   ```

**预计时间**：2 天  
**风险等级**：低

---

### 第二阶段总结

| 任务 | 预计时间 | 优先级 | 风险 |
|------|---------|--------|------|
| 优化碰撞检测 | 5 天 | P1 | 中 |
| 优化视图查询 | 3 天 | P1 | 低 |
| 渲染性能优化 | 3 天 | P1 | 低 |
| 内存优化 | 2 天 | P1 | 低 |
| **总计** | **13 天 (~3 周)** | **P1** | **低** |

**交付物**：
- 碰撞检测性能提升 10 倍以上
- 视图查询性能提升 5 倍以上
- 渲染帧率稳定在 60 FPS
- 内存使用优化 30%

---

## 四、第三阶段：架构重构（1-2 个月）

### 目标
重构代码架构，提升可维护性和扩展性。

### 任务 4.1：重构 EnemySystem

**问题描述**：
- `EnemySystem.ts` 包含巨大的 `switch` 语句
- 违反开闭原则
- 文件膨胀

**解决方案**：策略模式 + AI 注册机制

1. **定义 AI 策略接口**
   ```typescript
   // src/engine/ai/AI.ts
   export interface AIStrategy {
     update(world: World, entityId: EntityId, dt: number): void;
     canExecute(world: World, entityId: EntityId): boolean;
   }
   
   export class AIRegistry {
     private static strategies: Map<string, AIStrategy> = new Map();
     
     static register(id: string, strategy: AIStrategy) {
       this.strategies.set(id, strategy);
     }
     
     static get(id: string): AIStrategy | undefined {
       return this.strategies.get(id);
     }
   }
   ```

2. **实现具体的 AI 策略**
   ```typescript
   // src/engine/ai/strategies/
   
   // BasicAI.ts
   export class BasicAI implements AIStrategy {
     update(world: World, entityId: EntityId, dt: number): void {
       // 基础 AI 逻辑
     }
     
     canExecute(world: World, entityId: EntityId): boolean {
       return true;
     }
   }
   
   // KamikazeAI.ts
   export class KamikazeAI implements AIStrategy {
     update(world: World, entityId: EntityId, dt: number): void {
       // 自爆 AI 逻辑
     }
     
     canExecute(world: World, entityId: EntityId): boolean {
       return true;
     }
   }
   
   // SniperAI.ts
   export class SniperAI implements AIStrategy {
     update(world: World, entityId: EntityId, dt: number): void {
       // 狙击 AI 逻辑
     }
     
     canExecute(world: World, entityId: EntityId): boolean {
       return true;
     }
   }
   ```

3. **注册 AI 策略**
   ```typescript
   // src/engine/ai/index.ts
   import { AIRegistry } from './AI';
   import { BasicAI } from './strategies/BasicAI';
   import { KamikazeAI } from './strategies/KamikazeAI';
   import { SniperAI } from './strategies/SniperAI';
   
   AIRegistry.register('basic', new BasicAI());
   AIRegistry.register('kamikaze', new KamikazeAI());
   AIRegistry.register('sniper', new SniperAI());
   ```

4. **重构 EnemySystem**
   ```typescript
   // src/engine/systems/EnemySystem.ts
   import { AIRegistry } from '@/engine/ai';
   
   export function EnemySystem(world: World, dt: number) {
     for (const [id, [enemyAI, tr, velocity]] of 
          view(world, [EnemyAI, Transform, Velocity])) {
       
       const strategy = AIRegistry.get(enemyAI.type);
       if (strategy && strategy.canExecute(world, id)) {
         strategy.update(world, id, dt);
       }
     }
   }
   ```

**预计时间**：7 天  
**风险等级**：中

---

### 任务 4.2：Boss 初始化重构

**问题描述**：
- `factory.ts` 中的 `spawnBoss` 存在硬编码逻辑
- 违背数据驱动原则

**解决方案**：移入蓝图定义

1. **扩展蓝图类型**
   ```typescript
   // src/engine/blueprints/bosses.ts
   export function createBossBlueprint(config: {
     base: Blueprint;
     ai: {
       type: string;
       phases: BossPhase[];
     };
     weapons: {
       primary: WeaponConfig;
       phases: Record<number, WeaponConfig>;
     };
   }): Blueprint {
     const blueprint: Blueprint = { ...config.base };
     
     // 添加 BossAI 组件
     blueprint.BossAI = {
       type: config.ai.type,
       phases: config.ai.phases
     };
     
     // 添加武器组件
     blueprint.Weapon = config.weapons.primary;
     
     return blueprint;
   }
   ```

2. **简化 spawnBoss**
   ```typescript
   // src/engine/factory.ts
   export function spawnBoss(world: World, bp: Blueprint, x: number, y: number, rot: number): EntityId {
     const id = spawnFromBlueprint(world, bp, x, y, rot, 'enemy');
     
     // 移除硬编码，由蓝图决定
     const bossComps = world.entities.get(id);
     if (bossComps) {
       const bossTag = bossComps.find(c => c instanceof Components.BossTag);
       if (bossTag) {
         // 确保有必要的组件，但不硬编码默认值
         if (!bossComps.find(c => c instanceof Components.MoveIntent)) {
           addComponent(world, id, new Components.MoveIntent({ dx: 0, dy: 0, type: 'velocity' }));
         }
         if (!bossComps.find(c => c instanceof Components.FireIntent)) {
           addComponent(world, id, new Components.FireIntent({ firing: false }));
         }
       }
     }
     
     return id;
   }
   ```

**预计时间**：3 天  
**风险等级**：低

---

### 任务 4.3：事件系统增强

**问题描述**：
- 事件消费顺序依赖系统执行顺序
- 缺少事件优先级
- 难以追踪事件流

**解决方案**：事件优先级 + 调试工具

1. **添加事件优先级**
   ```typescript
   // src/engine/events.ts
   export interface Event {
     type: string;
     priority?: number;  // 新增优先级
     timestamp?: number;
     source?: string;   // 调试用
   }
   
   export function pushEvent(w: World, event: Event) {
     if (event.timestamp === undefined) {
       event.timestamp = Date.now();
     }
     w.events.push(event);
   }
   
   // 按优先级排序事件
   export function getSortedEvents(w: World): Event[] {
     return [...w.events].sort((a, b) => {
       const priorityA = a.priority ?? 0;
       const priorityB = b.priority ?? 0;
       if (priorityA !== priorityB) {
         return priorityB - priorityA;  // 优先级高的先处理
       }
       return a.timestamp! - b.timestamp!;
     });
   }
   ```

2. **实现事件追踪器**
   ```typescript
   // src/engine/utils/EventTracker.ts
   export class EventTracker {
     private static enabled = false;
     private static events: { event: Event; frame: number; source: string }[] = [];
     
     static enable() {
       this.enabled = true;
     }
     
     static disable() {
       this.enabled = false;
     }
     
     static track(event: Event, frame: number, source: string) {
       if (this.enabled) {
         this.events.push({ event, frame, source });
         
         // 只保留最近 1000 个事件
         if (this.events.length > 1000) {
           this.events.shift();
         }
       }
     }
     
     static getEvents() {
       return this.events;
     }
     
     static clear() {
       this.events = [];
     }
   }
   ```

3. **添加事件可视化工具**
   ```typescript
   // src/engine/debug/EventVisualizer.tsx
   import React from 'react';
   import { EventTracker } from '@/engine/utils/EventTracker';
   
   export function EventVisualizer() {
     const [events, setEvents] = React.useState(EventTracker.getEvents());
     
     React.useEffect(() => {
       const interval = setInterval(() => {
         setEvents(EventTracker.getEvents());
       }, 100);
       return () => clearInterval(interval);
     }, []);
     
     return (
       <div className="event-visualizer">
         <h3>Event Tracker</h3>
         <ul>
           {events.map((e, i) => (
             <li key={i}>
               <strong>{e.event.type}</strong>
               <span className="source">{e.source}</span>
               <span className="frame">Frame {e.frame}</span>
             </li>
           ))}
         </ul>
       </div>
     );
   }
   ```

**预计时间**：4 天  
**风险等级**：低

---

### 任务 4.4：配置系统增强

**问题描述**：
- 缺少配置验证
- 配置错误在运行时才发现
- 无可视化编辑器

**解决方案**：Schema 验证 + 编辑器

1. **定义配置 Schema**
   ```typescript
   // src/engine/configs/schemas/weaponSchema.ts
   import { z } from 'zod';
   
   export const WeaponSchema = z.object({
     id: z.string(),
     name: z.string(),
     description: z.string(),
     cooldown: z.number().min(100).max(5000),
     damage: z.number().min(1).max(1000),
     bulletCount: z.number().min(1).max(10),
     spread: z.number().min(0).max(360),
     pattern: z.enum(['straight', 'spread', 'spiral']),
     level: z.number().min(1).max(10),
     cost: z.number().min(0),
   });
   
   export type WeaponConfig = z.infer<typeof WeaponSchema>;
   ```

2. **实现配置验证**
   ```typescript
   // src/engine/utils/ConfigValidator.ts
   import { WeaponSchema } from '@/engine/configs/schemas/weaponSchema';
   
   export class ConfigValidator {
     static validateWeapon(config: unknown): WeaponConfig {
       try {
         return WeaponSchema.parse(config);
       } catch (error) {
         if (error instanceof z.ZodError) {
           console.error('Invalid weapon config:', error.errors);
           throw new Error('Weapon config validation failed');
         }
         throw error;
       }
     }
     
     static validateAll(configs: { [key: string]: unknown }) {
       const results: { valid: boolean; errors: string[] } = { valid: true, errors: [] };
       
       for (const [key, config] of Object.entries(configs)) {
         try {
           this.validateWeapon(config);
         } catch (error) {
           results.valid = false;
           results.errors.push(`${key}: ${error}`);
         }
       }
       
       return results;
     }
   }
   ```

3. **构建时验证**
   ```typescript
   // scripts/validate-configs.ts
   import { ConfigValidator } from '@/engine/utils/ConfigValidator';
   import { WEAPONS } from '@/engine/configs/gallery/weapons';
   
   const results = ConfigValidator.validateAll(WEAPONS);
   
   if (!results.valid) {
     console.error('Config validation failed:');
     results.errors.forEach(err => console.error(`  - ${err}`));
     process.exit(1);
   } else {
     console.log('All configs are valid!');
   }
   ```

4. **可视化配置编辑器**
   ```typescript
   // src/tools/ConfigEditor.tsx
   import React, { useState } from 'react';
   import { WEAPONS } from '@/engine/configs/gallery/weapons';
   
   export function ConfigEditor() {
     const [config, setConfig] = useState(WEAPONS);
     const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);
     
     const handleSave = () => {
       // 保存配置
       localStorage.setItem('weapons-config', JSON.stringify(config));
     };
     
     return (
       <div className="config-editor">
         <div className="sidebar">
           <h3>Weapons</h3>
           <ul>
             {Object.keys(config).map(id => (
               <li 
                 key={id}
                 onClick={() => setSelectedWeapon(id)}
                 className={selectedWeapon === id ? 'selected' : ''}
               >
                 {config[id].name}
               </li>
             ))}
           </ul>
         </div>
         
         <div className="editor">
           {selectedWeapon && (
             <WeaponEditor 
               weapon={config[selectedWeapon]} 
               onChange={(updates) => {
                 setConfig({
                   ...config,
                   [selectedWeapon]: { ...config[selectedWeapon], ...updates }
                 });
               }}
             />
           )}
         </div>
         
         <button onClick={handleSave}>Save</button>
       </div>
     );
   }
   ```

**预计时间**：7 天  
**风险等级**：中

---

### 第三阶段总结

| 任务 | 预计时间 | 优先级 | 风险 |
|------|---------|--------|------|
| 重构 EnemySystem | 7 天 | P2 | 中 |
| Boss 初始化重构 | 3 天 | P2 | 低 |
| 事件系统增强 | 4 天 | P2 | 低 |
| 配置系统增强 | 7 天 | P2 | 中 |
| **总计** | **21 天 (~4 周)** | **P2** | **中** |

**交付物**：
- AI 系统插件化
- 数据驱动 Boss 配置
- 事件追踪和调试工具
- 配置验证和编辑器

---

## 五、第四阶段：长期改进（3-6 个月）

### 目标
战略性功能扩展，提升游戏品质和开发效率。

### 任务 5.1：AI 系统增强

**实现目标**：
- 行为树架构
- 状态机
- 更复杂的 AI 行为

**实施步骤**：
1. 设计行为树节点类型
2. 实现行为树编辑器
3. 重构现有 AI 为行为树
4. 添加更多 AI 行为

**预计时间**：3-4 周

---

### 任务 5.2：网络多人游戏

**实现目标**：
- 客户端-服务器架构
- 实时同步
- 延迟补偿

**实施步骤**：
1. 设计网络协议
2. 实现服务器
3. 客户端同步
4. 延迟优化

**预计时间**：6-8 周

---

### 任务 5.3：关卡编辑器

**实现目标**：
- 可视化关卡设计
- 拖拽式编辑
- 实时预览

**实施步骤**：
1. 设计编辑器 UI
2. 实现关卡序列化
3. 实现撤销/重做
4. 添加模板库

**预计时间**：4-6 周

---

### 任务 5.4：性能监控系统

**实现目标**：
- 实时 FPS 监控
- 内存使用监控
- 性能瓶颈分析

**实施步骤**：
1. 实现性能数据收集
2. 可视化仪表盘
3. 性能报告生成
4. 优化建议系统

**预计时间**：2-3 周

---

### 第四阶段总结

| 任务 | 预计时间 | 优先级 | 风险 |
|------|---------|--------|------|
| AI 系统增强 | 3-4 周 | P3 | 高 |
| 网络多人游戏 | 6-8 周 | P3 | 高 |
| 关卡编辑器 | 4-6 周 | P3 | 中 |
| 性能监控系统 | 2-3 周 | P3 | 低 |
| **总计** | **15-21 周** | **P3** | **中** |

---

## 六、测试与部署

### 测试策略

#### 6.1 单元测试

**测试框架**：Jest + ts-jest

**测试覆盖目标**：
- 组件：90%
- 系统：80%
- 工具函数：95%

**示例测试**：
```typescript
// src/engine/utils/Quadtree.test.ts
import { Quadtree } from './Quadtree';

describe('Quadtree', () => {
  it('should insert points', () => {
    const quadtree = new Quadtree({ x: 0, y: 0, w: 100, h: 100 }, 4);
    expect(quadtree.insert({ x: 10, y: 10, entityId: 1 })).toBe(true);
  });
  
  it('should query points in range', () => {
    const quadtree = new Quadtree({ x: 0, y: 0, w: 100, h: 100 }, 4);
    quadtree.insert({ x: 10, y: 10, entityId: 1 });
    quadtree.insert({ x: 90, y: 90, entityId: 2 });
    
    const results = quadtree.query({ x: 0, y: 0, w: 50, h: 50 });
    expect(results.length).toBe(1);
    expect(results[0].entityId).toBe(1);
  });
});
```

#### 6.2 集成测试

**测试场景**：
- 完整游戏流程
- 关卡切换
- Boss 战
- 连击系统

**测试工具**：
- Playwright (E2E)
- Puppeteer (自动化测试)

#### 6.3 性能测试

**测试工具**：
- Chrome DevTools Performance
- Lighthouse
- WebPageTest

**测试指标**：
- FPS: >60
- 首次渲染: <1s
- 内存使用: <500MB

---

### 部署策略

#### 6.1 CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

#### 6.2 环境配置

**开发环境**：
- 本地开发服务器
- 热重载
- 详细日志

**生产环境**：
- CDN 加速
- 压缩优化
- 性能监控

---

## 七、团队协作

### 7.1 代码规范

**风格指南**：
- ESLint + Prettier
- Airbnb JavaScript Style Guide
- TypeScript 最佳实践

**提交规范**：
```bash
feat: add bomb system
fix: resolve collision detection bug
docs: update API documentation
refactor: optimize view queries
test: add unit tests for Quadtree
```

### 7.2 分支策略

**Git Flow**：
- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支
- `hotfix/*`: 紧急修复

**分支命名**：
```
feature/bomb-system
feature/quadtree-optimization
bugfix/collision-detection
hotfix/crash-issue
```

### 7.3 代码审查

**审查清单**：
- [ ] 代码符合规范
- [ ] 测试覆盖充分
- [ ] 文档更新完整
- [ ] 性能影响评估
- [ ] 安全问题检查

**审查工具**：
- GitHub Pull Requests
- CodeClimate
- SonarQube

---

## 八、风险管理

### 风险矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 性能优化失败 | 中 | 高 | 分阶段优化，充分测试 |
| 架构重构导致 Bug | 高 | 中 | 完整的测试覆盖 |
| 第三方库更新 | 低 | 中 | 锁定版本，定期评估 |
| 团队成员变动 | 中 | 中 | 知识文档化，代码可读性 |

### 应急预案

**性能回退**：
- 保留优化前的代码
- 使用功能开关控制
- 灰度发布

**Bug 修复**：
- Hotfix 流程
- 紧急发布流程
- 回滚机制

---

## 九、总结

本实施计划基于对霓电战记代码库的深入分析，提供了一个清晰、可执行的改进路线图。

### 关键成果

1. **第一阶段（2 周）**：完成核心功能，游戏可玩
2. **第二阶段（3 周）**：性能优化，稳定 60 FPS
3. **第三阶段（2 个月）**：架构重构，提升可维护性
4. **第四阶段（6 个月）**：战略功能扩展

### 成功标准

- ✅ 所有 P0 任务完成
- ✅ 性能提升 10 倍以上
- ✅ 代码质量显著提升
- ✅ 开发效率提高 30%

### 后续展望

随着实施计划的推进，霓电战记将成为一个高性能、可扩展、易维护的现代网页游戏，为未来的功能扩展和商业化奠定坚实的基础。

---

**文档版本**：v1.0  
**创建日期**：2026-01-14  
**下次更新**：根据实施进度调整
