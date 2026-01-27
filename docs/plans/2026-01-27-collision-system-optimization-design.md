# 碰撞系统优化设计文档

**日期**: 2026-01-27
**状态**: 设计中
**优先级**: 高

## 背景与问题分析

### 当前实现问题

当前 `CollisionSystem.ts` 存在以下性能和设计问题：

1. **O(N²) 全两两检测**：对所有实体对进行碰撞检测，当实体数量达到 100-500 时性能急剧下降
2. **重复组件查找**：`checkCollisionType` 中多次使用 `find()` 遍历组件数组
3. **无空间分区**：没有使用四叉树、网格分区等优化结构
4. **无碰撞过滤**：无法跳过不需要检测的实体对
5. **职责混杂**：碰撞检测、伤害计算、子弹销毁逻辑耦合在一起
6. **胶囊形状简化**：capsule 用圆形近似，精度不够

### 设计目标

- **实体规模**: 中型 (100-500 实体)
- **性能优先级**: 速度优先，简单形状
- **重构程度**: 保守优化，保持单文件结构

## 整体架构

### 核心优化策略

1. **空间哈希网格** - 将复杂度从 O(N²) 降至 O(N·K)
2. **碰撞层过滤** - 使用位掩码预过滤不需要检测的实体对
3. **对象池与缓存** - 复用碰撞检测结果和临时对象

### 保持的结构

- 单文件 `CollisionSystem.ts`
- 现有的碰撞类型枚举
- 事件驱动的设计（HitEvent、PickupEvent）

## 空间哈希网格设计

### 数据结构

```typescript
interface SpatialGrid {
  cellSize: number;                    // 网格单元大小 (px)
  cells: Map<string, EntityId[]>;      // 网格单元 -> 实体列表
  entityCells: Map<EntityId, string[]>; // 实体 -> 所在网格单元
}
```

### 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| cellSize | 128px | 约为最大碰撞盒直径的 1.5 倍 |
| 重建策略 | 每帧重建 | 对于 100-500 实体，重建比更新更快 |

### 算法流程

```
1. 清空网格
2. 遍历所有带 HitBox 的实体：
   - 计算其占据的网格单元
   - 将实体 ID 加入对应网格
3. 遍历每个网格：
   - 检测网格内实体两两碰撞
   - 检测与相邻网格（3x3 区域）实体的碰撞
```

### 网格键计算

```typescript
function cellKey(x: number, y: number, cellSize: number): string {
  const cx = Math.floor(x / cellSize);
  const cy = Math.floor(y / cellSize);
  return `${cx},${cy}`;
}

function getOccupiedCells(hitBox: HitBox, transform: Transform, cellSize: number): string[] {
  const cells: string[] = [];
  const minX = Math.floor((transform.x - (hitBox.radius ?? 20)) / cellSize);
  const maxX = Math.floor((transform.x + (hitBox.radius ?? 20)) / cellSize);
  const minY = Math.floor((transform.y - (hitBox.radius ?? 20)) / cellSize);
  const maxY = Math.floor((transform.y + (hitBox.radius ?? 20)) / cellSize);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      cells.push(`${x},${y}`);
    }
  }
  return cells;
}
```

## 碰撞层设计

### 设计决策：CollisionLayer 合并到 HitBox

经过评估，决定将 `CollisionLayer` 作为 `HitBox` 组件的一部分，而非创建独立的 `CollisionLayerComp` 组件。

**理由**：
1. **职责单一**：碰撞层是碰撞检测的属性，与碰撞盒（HitBox）本质上是同一概念
2. **消除冗余**：避免与 PlayerTag/EnemyTag 等标签的信息重复
3. **性能优化**：无需运行时推断，直接从 HitBox.layer 读取
4. **类型安全**：蓝图显式声明碰撞层，编译时可检查

### 类型定义位置

新建 `src/engine/types/collision.ts` 统一管理碰撞相关类型：

```typescript
// src/engine/types/collision.ts
export enum CollisionLayer {
    None = 0,
    Player = 1 << 0,
    Enemy = 1 << 1,
    PlayerBullet = 1 << 2,
    EnemyBullet = 1 << 3,
    Pickup = 1 << 4,
}

export function shouldCheckCollision(layer1: CollisionLayer, layer2: CollisionLayer): boolean;
```

### HitBox 组件改造

```typescript
// src/engine/components/base.ts
export class HitBox extends Component {
    shape: 'circle' | 'rect' | 'capsule' = 'circle';
    radius?: number;
    halfWidth?: number;
    halfHeight?: number;
    capRadius?: number;
    capHeight?: number;

    /** 碰撞层 - 必须在蓝图中显式设置 */
    layer: CollisionLayer = CollisionLayer.None;

    constructor(cfg: Partial<HitBox> = {}) {
        super();
        Object.assign(this, cfg);
    }
}
```

### 层定义

```typescript
enum CollisionLayer {
  None = 0,
  Player = 1 << 0,       // 1
  Enemy = 1 << 1,        // 2
  PlayerBullet = 1 << 2, // 4
  EnemyBullet = 1 << 3,  // 8
  Pickup = 1 << 4,       // 16
}
```

### 碰撞矩阵

```typescript
const CollisionMatrix: Record<CollisionLayer, CollisionLayer> = {
  [CollisionLayer.Player]: CollisionLayer.Enemy | CollisionLayer.EnemyBullet | CollisionLayer.Pickup,
  [CollisionLayer.Enemy]: CollisionLayer.Player | CollisionLayer.PlayerBullet,
  [CollisionLayer.PlayerBullet]: CollisionLayer.Enemy | CollisionLayer.EnemyBullet,
  [CollisionLayer.EnemyBullet]: CollisionLayer.Player,
  [CollisionLayer.Pickup]: CollisionLayer.Player,
};

function shouldCheckCollision(layer1: CollisionLayer, layer2: CollisionLayer): boolean {
  return (CollisionMatrix[layer1] & layer2) !== 0;
}
```

### 碰撞层分配

| 实体类型 | 碰撞层 |
|---------|--------|
| 玩家 | Player |
| 敌人 | Enemy |
| 玩家子弹 | PlayerBullet |
| 敌人子弹 | EnemyBullet |
| 拾取物品 | Pickup |

## 代码结构优化

### 主函数重写

```typescript
export function CollisionSystem(world: World, dt: number): void {
  // 1. 重建空间网格
  rebuildSpatialGrid(world);

  // 2. 收集碰撞对（使用空间网格 + 碰撞层过滤）
  const collisions = collectCollisions(world);

  // 3. 处理碰撞（保持现有逻辑）
  for (const collision of collisions) {
    handleCollision(world, collision);
  }
}
```

### 组件缓存

```typescript
interface CollisionCache {
  hitBox: HitBox;
  transform: Transform;
  layer: CollisionLayer;
  entityList: Component[];
}

// 缓存常用组件，避免重复 find
const cache = new Map<EntityId, CollisionCache>();
```

### 内存优化

```typescript
// 复用碰撞对数组，避免每帧 new
const collisionPairs: CollisionPair[] = [];
let collisionCount = 0;

// 使用时清空计数而非清空数组
collisionCount = 0;
// ... 填充
// ... 处理前 collisionCount 个
```

### 函数提取

- `consumeBullet(entityList: Component[], bullet: Bullet)` - 处理子弹穿透和销毁
- `markForDestroy(entityList: Component[], reason: string, pool?: string)` - 标记实体销毁
- `checkInvulnerable(entityList: Component[])` - 检查无敌状态

## 单元测试设计

### 测试文件结构

```
src/engine/systems/__tests__/
├── CollisionSystem.test.ts
├── spatial-helpers.test.ts
└── collision-mock-data.ts
```

### 测试覆盖范围

#### 1. 空间网格测试

```typescript
describe('SpatialGrid', () => {
  test('buildGrid - 实体正确分配到网格');
  test('buildGrid - 跨越多个网格的实体');
  test('getPotentialCollisions - 只返回相邻网格的实体');
  test('getPotentialCollisions - 空网格返回空数组');
});
```

#### 2. 碰撞层过滤测试

```typescript
describe('CollisionLayer', () => {
  test('shouldCheckCollision - 相同层不检测');
  test('shouldCheckCollision - Player 与 Enemy 需要检测');
  test('shouldCheckCollision - PlayerBullet 与 Pickup 不需要检测');
});
```

#### 3. 形状检测测试

```typescript
describe('ShapeCollision', () => {
  describe('circleVsCircle', () => {
    test('相切圆返回 true');
    test('分离圆返回 false');
    test('包含圆返回 true');
  });
  describe('circleVsRect', () => {
    test('圆心在矩形内返回 true');
    test('圆与矩形角接触返回 true');
    test('圆与矩形边接触返回 true');
    test('分离情况返回 false');
  });
  describe('rectVsRect', () => {
    test('AABB 重叠');
    test('AABB 分离');
    test('边缘接触');
  });
});
```

#### 4. 集成测试

```typescript
describe('CollisionSystem Integration', () => {
  test('子弹击中敌人 - 生成 HitEvent 并销毁子弹');
  test('子弹穿透 - 击中多个敌人后销毁');
  test('玩家无敌状态 - 不生成 HitEvent');
  test('子弹互击 - 双方都销毁');
  test('玩家拾取道具 - 生成 PickupEvent');
});
```

## 实现计划

### 阶段 1: 类型重构
- [x] 空间哈希网格实现（已完成）
- [ ] 创建 `src/engine/types/collision.ts`
- [ ] 从 `combat.ts` 删除 CollisionLayer 相关代码
- [ ] 在 `HitBox` 中添加 `layer` 字段

### 阶段 2: 蓝图更新
- [ ] 更新 `fighters.ts` - 添加 `CollisionLayer.Player`
- [ ] 更新 `enemies.ts` - 添加 `CollisionLayer.Enemy`
- [ ] 更新 `ammo.ts` - 添加 `PlayerBullet` / `EnemyBullet`
- [ ] 更新 `pickups/` - 添加 `CollisionLayer.Pickup`

### 阶段 3: 系统简化
- [ ] 简化 `buildCollisionCache` - 移除推断逻辑，直接读取 `HitBox.layer`
- [ ] 更新 `CollisionSystem` 的 import 路径

### 阶段 4: 测试更新
- [ ] 更新测试文件 import 路径
- [ ] 确保所有测试通过

## 性能预期

| 实体数 | 优化前 | 优化后 | 提升 |
|-------|--------|--------|------|
| 100 | ~5000 次检测 | ~500 次检测 | 10x |
| 300 | ~45000 次检测 | ~1500 次检测 | 30x |
| 500 | ~125000 次检测 | ~2500 次检测 | 50x |

*假设每个网格平均 5 个实体*

## 风险与注意事项

1. **cellSize 调优**: 需要根据实际游戏中的实体密度调整
2. **边界情况**: 处理跨越多个网格的实体
3. **调试困难**: 空间分区使问题定位变复杂，需要可视化工具
4. **向后兼容**: 确保现有事件格式不变
