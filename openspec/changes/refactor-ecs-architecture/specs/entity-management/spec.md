## ADDED Requirements

### Requirement: World状态容器
World SHALL 作为单一状态容器，统一管理所有实体、组件和事件。

#### Scenario: World创建
- **GIVEN** Blueprint配置
- **WHEN** 调用createWorld(bp)
- **THEN** 创建空的World对象
- **AND** 初始化entities为空Map
- **AND** 初始化所有components为空Map
- **AND** 初始化events为空数组
- **AND** 设置width和height为0
- **AND** 设置time为0

#### Scenario: World状态结构
- **GIVEN** World对象
- **THEN** 包含width、height、time空间维度
- **AND** 包含entities Map存储实体
- **AND** 包含components对象存储各类型组件Map
- **AND** 包含events数组存储游戏事件
- **AND** 包含player和boss字段存储单例实体ID

### Requirement: Entity创建和销毁
系统 SHALL 使用工厂函数创建实体，支持标记删除。

#### Scenario: 实体创建
- **GIVEN** World对象和实体类型
- **WHEN** 调用createEntity(world, type)
- **THEN** 生成唯一实体ID
- **AND** 在entities Map中创建实体
- **AND** 返回实体ID

#### Scenario: 实体标记删除
- **GIVEN** World对象和实体ID
- **WHEN** 调用markEntityForDeletion(world, entityId)
- **THEN** 设置实体的markedForDeletion为true
- **AND** 实体保留在World中，直到CleanupSystem清理

#### Scenario: 实体销毁
- **GIVEN** World对象和标记删除的实体ID
- **WHEN** CleanupSystem执行
- **THEN** 从entities Map中删除实体
- **AND** 从所有components Map中删除该实体的组件
- **AND** 清空相关事件

### Requirement: Component组件系统
World SHALL 按类型分组存储组件，支持高效的组件查询。

#### Scenario: 组件添加
- **GIVEN** World对象、实体ID和组件
- **WHEN** 将组件添加到对应类型的components Map
- **THEN** 组件以entityId为key存储
- **AND** 其他系统可访问该组件

#### Scenario: 组件查询
- **GIVEN** World对象和实体ID
- **WHEN** 查询特定类型的组件
- **THEN** 从对应components Map中获取
- **AND** 返回组件或undefined

#### Scenario: 组件组合查询
- **GIVEN** World对象
- **WHEN** 查询拥有多个组件的实体
- **THEN** 使用queryEntities(world, ...componentTypes)
- **AND** 返回同时拥有所有指定组件的实体ID数组

### Requirement: 核心组件类型
系统 SHALL 定义核心组件类型，涵盖游戏基本功能。

#### Scenario: 位置组件
- **GIVEN** PositionComponent
- **THEN** 包含x、y坐标
- **AND** 包含angle角度（可选）

#### Scenario: 速度组件
- **GIVEN** VelocityComponent
- **THEN** 包含vx、vy速度向量
- **AND** 包含speed速度标量（可选）

#### Scenario: 渲染组件
- **GIVEN** RenderComponent
- **THEN** 包含spriteKey精灵图键
- **AND** 包含width、height尺寸
- **AND** 包含color颜色
- **AND** 包含frame帧号（可选）

#### Scenario: 碰撞组件
- **GIVEN** ColliderComponent
- **THEN** 包含width、height碰撞箱尺寸
- **AND** 包含hitboxShrink碰撞箱缩小比例（可选）
- **AND** 包含collisionType碰撞类型
- **AND** 包含isElite精英标记（可选）
- **AND** 包含invulnerable无敌状态（可选）

#### Scenario: 战斗组件
- **GIVEN** CombatComponent
- **THEN** 包含hp当前生命值
- **AND** 包含maxHp最大生命值
- **AND** 包含damage伤害值（可选）
- **AND** 包含shield护盾值（可选）
- **AND** 包含defensePct防御百分比（可选）
- **AND** 包含tags标签对象（可选）

#### Scenario: 武器组件
- **GIVEN** WeaponComponent
- **THEN** 包含weaponType武器类型
- **AND** 包含level武器等级
- **AND** 包含fireTimer开火计时器
- **AND** 包含owner拥有者实体ID（可选）

#### Scenario: AI组件
- **GIVEN** AIComponent
- **THEN** 包含state状态值
- **AND** 包含timer计时器
- **AND** 包含movePattern移动模式
- **AND** 包含target目标实体ID（可选）
- **AND** 包含searchRange索敌范围（可选）
- **AND** 包含turnSpeed转向速度（可选）

#### Scenario: Boss组件
- **GIVEN** BossComponent
- **THEN** 包含bossType Boss类型
- **AND** 包含phase当前阶段
- **AND** 包含phaseTimer阶段计时器
- **AND** 包含wingmen僚机ID数组
- **AND** 包含teleportTimer瞬移计时器（可选）

### Requirement: 实体查询工具
系统 SHALL 提供高效的实体查询工具函数。

#### Scenario: 按类型查询实体
- **GIVEN** World对象
- **WHEN** 调用getEntitiesByType(world, EntityType.ENEMY)
- **THEN** 返回所有指定类型的实体ID数组

#### Scenario: 按组件查询实体
- **GIVEN** World对象
- **WHEN** 调用queryEntities(world, 'positions', 'colliders')
- **THEN** 返回同时拥有指定组件的所有实体ID数组

#### Scenario: 按位置范围查询
- **GIVEN** World对象和中心点坐标
- **WHEN** 调用getEntitiesInRange(world, x, y, range)
- **THEN** 返回指定范围内的实体ID数组

#### Scenario: 获取单例实体
- **GIVEN** World对象
- **WHEN** 调用getPlayer(world)或getBoss(world)
- **THEN** 返回player或boss实体ID
- **AND** 如果不存在则返回undefined

## REMOVED Requirements

### Requirement: EntityManager类
**原因**: EntityManager使用多个数组分别存储实体类型，不符合ECS模式

**迁移**:
- enemies数组 → getEntitiesByType(world, EntityType.ENEMY)
- bullets数组 → getEntitiesByType(world, EntityType.BULLET)
- powerups数组 → getEntitiesByType(world, EntityType.POWERUP)
- boss字段 → getBoss(world)
- options字段 → getEntitiesByType(world, EntityType.OPTION)

### Requirement: Entity大而全类型
**原因**: Entity包含115+个属性，违反单一职责原则

**迁移**:
- Entity基础字段（id, type, markedForDeletion）保留
- 位置相关字段 → PositionComponent
- 速度相关字段 → VelocityComponent
- 渲染相关字段 → RenderComponent
- 碰撞相关字段 → ColliderComponent
- 战斗相关字段 → CombatComponent
- 武器相关字段 → WeaponComponent
- AI相关字段 → AIComponent
- Boss相关字段 → BossComponent
