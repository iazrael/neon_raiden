# Design: ECS架构重构

## Context

### 当前架构问题

现有`GameEngine.ts`是一个上帝类（God Class），承担了过多职责：

1. **状态分散**: 游戏状态分散在20+个实例属性中（player, enemies, bullets, weapons, score, level等）
2. **系统耦合**: 所有系统作为类成员实例化，系统间通过直接引用传递（如`WeaponSystem`依赖`AudioSystem`）
3. **实体管理混乱**: 使用多个数组分别存储不同类型实体（enemies, bullets, enemyBullets, powerups等）
4. **缺乏组件化**: Entity类型包含所有可能字段（115+个属性），违反了单一职责原则
5. **扩展困难**: 添加新功能需要修改GameEngine核心类

### 约束条件

- 必须保持现有游戏功能完整（10关卡、8武器、Boss战等）
- 目标性能：移动端和桌面端均达到60FPS
- TypeScript严格模式，零`any`类型
- 无外部游戏资源依赖
- React集成层需要适配新API

## Goals / Non-Goals

### Goals

1. 实现纯ECS架构：Entity-Component-System模式清晰分离
2. Engine类轻量化：仅负责游戏循环和系统编排
3. World作为单一状态容器：所有实体、组件、事件统一管理
4. 系统函数化：系统作为纯函数，接受(world, dt)参数
5. 组件化设计：Entity通过组件组合，减少冗余字段
6. 事件驱动通信：系统间通过World.events解耦
7. 高性能查询：支持高效的组件查询和过滤
8. 易于测试：系统和组件可独立测试

### Non-Goals

- 不引入第三方ECS库（保持自实现，轻量可控）
- 不改变游戏核心玩法和数值
- 不修改React UI层（仅适配Engine API）
- 不改变配置文件结构

## Decisions

### 1. 核心架构设计

#### World对象结构

```typescript
interface World {
  // 空间维度
  width: number;
  height: number;
  time: number;

  // 实体存储：使用Map<entityId, Entity>
  entities: Map<string, Entity>;

  // 组件存储：按类型分组，支持快速查询
  components: {
    // 位置组件
    positions: Map<string, PositionComponent>;
    // 速度组件
    velocities: Map<string, VelocityComponent>;
    // 渲染组件
    renders: Map<string, RenderComponent>;
    // 碰撞组件
    colliders: Map<string, ColliderComponent>;
    // 战斗组件
    combats: Map<string, CombatComponent>;
    // 武器组件
    weapons: Map<string, WeaponComponent>;
    // 输入组件
    inputs: Map<string, InputComponent>;
    // AI组件
    ais: Map<string, AIComponent>;
    // Boss组件
    bosses: Map<string, BossComponent>;
    // Buff组件
    buffs: Map<string, BuffComponent>;
    // 生命周期组件
    lifetimes: Map<string, LifetimeComponent>;
    // ... 其他组件
  };

  // 事件队列：系统间通信
  events: GameEvent[];

  // 单例引用：常用实体快速访问
  player?: string;  // 存储player entity ID
  boss?: string;    // 存储boss entity ID
}
```

#### Component设计原则

每个组件只负责单一职责：

```typescript
// 位置组件
interface PositionComponent {
  x: number;
  y: number;
  angle?: number;
}

// 速度组件
interface VelocityComponent {
  vx: number;
  vy: number;
  speed?: number;
}

// 渲染组件
interface RenderComponent {
  spriteKey: string;
  width: number;
  height: number;
  color: string;
  frame?: number;
  hitFlashUntil?: number;
  phaseGlowColor?: string;
  phaseGlowUntil?: number;
}

// 碰撞组件
interface ColliderComponent {
  width: number;
  height: number;
  hitboxShrink?: number;
  collisionType: CollisionType;  // PLAYER, ENEMY, BULLET, POWERUP
  isElite?: boolean;
  invulnerable?: boolean;
  invulnerableTimer?: number;
}

// 战斗组件
interface CombatComponent {
  hp: number;
  maxHp: number;
  damage?: number;
  shield?: number;
  defensePct?: number;
  tags?: Record<string, number>;
}

// 武器组件
interface WeaponComponent {
  weaponType: WeaponType;
  level: number;
  fireTimer: number;
  owner?: string;  // owner entity ID
}

// AI组件
interface AIComponent {
  state: number;
  timer: number;
  movePattern: MovePattern;
  target?: string;  // target entity ID
  searchRange?: number;
  turnSpeed?: number;
}

// Boss组件
interface BossComponent {
  bossType: BossType;
  phase: number;
  phaseTimer: number;
  wingmen: string[];  // wingman entity IDs
  teleportTimer?: number;
  originalBulletCount?: number;
  currentBulletCount?: number;
}
```

### 2. 实体管理

#### Entity创建

使用工厂函数创建实体并添加组件：

```typescript
function createEntity(world: World, type: EntityType): string {
  const id = generateEntityId();
  world.entities.set(id, { id, type, markedForDeletion: false });
  return id;
}

// 示例：创建玩家
function spawnPlayer(world: World, x: number, y: number): string {
  const id = createEntity(world, EntityType.PLAYER);
  world.player = id;

  // 添加组件
  world.components.positions.set(id, { x, y });
  world.components.velocities.set(id, { vx: 0, vy: 0, speed: 7 });
  world.components.renders.set(id, {
    spriteKey: 'player',
    width: 40,
    height: 40,
    color: '#00ffff'
  });
  world.components.colliders.set(id, {
    width: 40,
    height: 40,
    collisionType: CollisionType.PLAYER,
    hitboxShrink: 0.3
  });
  world.components.combats.set(id, {
    hp: PlayerConfig.initialHp,
    maxHp: PlayerConfig.maxHp,
    shield: 0
  });
  world.components.weapons.set(id, {
    weaponType: WeaponType.VULCAN,
    level: 1,
    fireTimer: 0
  });

  return id;
}
```

#### 实体查询

使用组件组合查询实体：

```typescript
// 查询拥有指定组件的所有实体ID
function queryEntities(world: World, ...componentTypes: ComponentType[]): string[] {
  const firstComponent = componentTypes[0];
  const entities = world.components[firstComponent]?.keys() || [];

  return Array.from(entities).filter(id =>
    componentTypes.every(type => world.components[type]?.has(id))
  );
}

// 示例：查询所有有位置和碰撞的敌人
function getEnemies(world: World): string[] {
  return queryEntities(world, 'positions', 'colliders')
    .filter(id => {
      const entity = world.entities.get(id);
      return entity?.type === EntityType.ENEMY;
    });
}

// 示例：查询特定位置的实体
function getEntitiesAt(world: World, x: number, y: number, range: number): string[] {
  return queryEntities(world, 'positions').filter(id => {
    const pos = world.components.positions.get(id);
    if (!pos) return false;
    const dx = pos.x - x;
    const dy = pos.y - y;
    return dx * dx + dy * dy < range * range;
  });
}
```

### 3. 系统函数化

#### 系统签名

所有系统统一为函数签名：

```typescript
type System = (world: World, dt: number) => void;

// 示例：移动系统
function MovementSystem(world: World, dt: number): void {
  for (const [id, velocity] of world.components.velocities) {
    const position = world.components.positions.get(id);
    if (!position) continue;

    position.x += velocity.vx;
    position.y += velocity.vy;

    // 边界检查
    if (position.x < 0) position.x = 0;
    if (position.x > world.width) position.x = world.width;
    if (position.y < 0) position.y = 0;
    if (position.y > world.height) position.y = world.height;
  }
}
```

#### 系统编排

Engine类负责按顺序执行系统：

```typescript
class Engine {
  private world: World;
  private ctx: CanvasRenderingContext2D;

  start(canvas: HTMLCanvasElement, bp: Blueprint) {
    this.ctx = canvas.getContext('2d')!;
    this.world = createWorld(bp);

    this.loop();
  }

  private loop() {
    const step = (t: number) => {
      const dt = t - (this.world.time || t);
      this.world.time = t;
      this.framePipeline(this.world, dt);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private framePipeline(world: World, dt: number) {
    // 按阶段执行系统
    InputSystem(world, dt);
    DifficultySystem(world, dt);
    SpawnSystem(world, dt);
    BossPhaseSystem(world, dt);
    BossSystem(world, dt);
    EnemySystem(world, dt);
    AISteerSystem(world, dt);

    BuffSystem(world, dt);
    LevelingSystem(world, dt);
    ShieldRegenSystem(world, dt);
    WeaponSynergySystem(world, dt);
    WeaponSystem(world, dt);

    MovementSystem(world, dt);

    CollisionSystem(world, dt);

    PickupSystem(world, dt);
    DamageResolutionSystem(world, dt);
    LootSystem(world, dt);
    ComboSystem(world, dt);

    CameraSystem(world, dt);
    EffectPlayer(world, dt);
    AudioSystem(world, dt);

    // 拍快照
    this.snapshot$.next(buildSnapshot(world));

    LifetimeSystem(world, dt);
    CleanupSystem(world, dt);
    RenderSystem(this.ctx, world);
  }
}
```

### 4. 事件驱动通信

#### 事件类型定义

```typescript
type GameEvent =
  | { type: 'collision', entityId: string, otherId: string }
  | { type: 'damage', entityId: string, amount: number }
  | { type: 'death', entityId: string }
  | { type: 'pickup', entityId: string, powerupType: PowerupType }
  | { type: 'boss_phase_change', entityId: string, newPhase: number }
  | { type: 'weapon_fired', entityId: string, bulletIds: string[] };
```

#### 事件队列管理

```typescript
function emitEvent(world: World, event: GameEvent) {
  world.events.push(event);
}

function processEvents(world: World) {
  const events = world.events;
  world.events = [];

  for (const event of events) {
    switch (event.type) {
      case 'collision':
        handleCollision(world, event);
        break;
      case 'damage':
        handleDamage(world, event);
        break;
      case 'death':
        handleDeath(world, event);
        break;
      // ... 其他事件处理
    }
  }
}
```

### 5. 快照机制

#### 游戏快照

```typescript
interface GameSnapshot {
  player?: EntitySnapshot;
  enemies: EntitySnapshot[];
  bullets: EntitySnapshot[];
  powerups: EntitySnapshot[];
  boss?: EntitySnapshot;
  particles: Particle[];
  score: number;
  level: number;
  combo: number;
  // ... 其他UI需要的状态
}

function buildSnapshot(world: World): GameSnapshot {
  return {
    player: world.player ? buildEntitySnapshot(world, world.player) : undefined,
    enemies: getEnemies(world).map(id => buildEntitySnapshot(world, id)),
    bullets: getBullets(world).map(id => buildEntitySnapshot(world, id)),
    // ...
  };
}
```

### 6. 性能优化

#### 对象池模式

对于频繁创建销毁的对象（子弹、粒子），使用对象池：

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  acquire(): T {
    return this.pool.pop() || this.factory();
  }

  release(obj: T) {
    this.pool.push(obj);
  }
}
```

#### 空间划分

碰撞检测使用四叉树或网格分区优化：

```typescript
class SpatialGrid {
  private cells: Map<string, string[]> = new Map();
  private cellSize: number;

  insert(entityId: string, x: number, y: number) {
    const key = this.getKey(x, y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(entityId);
  }

  query(x: number, y: number, radius: number): string[] {
    const results: string[] = [];
    const minCell = this.getKey(x - radius, y - radius);
    const maxCell = this.getKey(x + radius, y + radius);

    // 遍历相关格子
    // ...

    return results;
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }
}
```

## Risks / Trade-offs

### Risks

1. **大规模重构风险**: 重构涉及所有系统和集成层
   - 缓解：分阶段迁移，保持旧API可用直到完全迁移完成
2. **性能回归风险**: 新架构可能引入性能问题
   - 缓解：使用性能测试基准（60FPS目标），逐步优化
3. **测试覆盖不足**: 现有测试可能不覆盖新架构
   - 缓解：为每个系统和组件编写单元测试
4. **迁移复杂度**: React集成层需要适配
   - 缓解：创建适配层，保持UI接口不变

### Trade-offs

1. **内存 vs 性能**: 组件存储使用多个Map可能增加内存
   - 权衡：接受略微增加的内存使用，换取更好的查询性能和代码组织
2. **类型安全 vs 灵活性**: 严格的组件类型可能限制动态组合
   - 权衡：使用泛型类型保持灵活性，同时提供类型安全
3. **函数式 vs 面向对象**: 系统改为函数可能失去面向对象的优势
   - 权衡：函数式系统更易测试和组合，失去的OOP特性可通过工具函数补偿

## Migration Plan

### 阶段1：基础设施（Week 1-2）

1. 创建World类型和createWorld函数
2. 定义核心组件类型（Position, Velocity, Render, Collider, Combat等）
3. 实现实体创建、查询、销毁工具函数
4. 实现事件系统
5. 创建新Engine类，保持与旧GameEngine并行

### 阶段2：系统迁移（Week 3-4）

1. 迁移输入系统
2. 迁移移动系统
3. 迁移碰撞系统
4. 迁移渲染系统
5. 迁移武器系统
6. 迁移敌人系统
7. 迁移Boss系统
8. 迁移其他系统（Buff, Combo, Synergy等）

### 阶段3：功能验证（Week 5）

1. 编写单元测试
2. 集成测试
3. 性能测试
4. Bug修复

### 阶段4：React集成（Week 6）

1. 创建适配层，保持React组件接口不变
2. 更新快照机制
3. 集成测试

### 阶段5：清理和优化（Week 7-8）

1. 删除旧GameEngine代码
2. 性能优化（对象池、空间划分）
3. 文档更新
4. 代码审查

### 回滚计划

如果新架构出现严重问题：

1. 保留旧GameEngine代码直到完全稳定
2. 使用特性标志切换新旧引擎
3. 每个阶段完成后打tag，便于回滚

## Open Questions

1. **组件粒度**: 某些组件是否需要进一步拆分？（如CombatComponent拆分为HP, Shield, Defense）
2. **查询性能**: Map查询vs 数组遍历的性能权衡？
3. **对象池**: 哪些类型需要对象池？子弹、粒子？
4. **序列化**: 游戏存档如何序列化World对象？
5. **调试工具**: 是否需要ECS可视化调试工具？
6. **配置系统**: Blueprint如何与World初始化集成？
