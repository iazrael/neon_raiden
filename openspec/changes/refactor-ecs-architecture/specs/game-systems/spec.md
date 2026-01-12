## MODIFIED Requirements

### Requirement: 系统函数化
所有游戏系统 SHALL 改为函数式设计，接受(World, dt)参数。

#### Scenario: 系统函数签名
- **GIVEN** 任意游戏系统（InputSystem, MovementSystem等）
- **WHEN** 定义系统函数
- **THEN** 函数签名为(world: World, dt: number) => void
- **AND** 系统直接修改World状态
- **AND** 不维护内部状态

#### Scenario: 输入系统
- **GIVEN** World对象
- **WHEN** InputSystem(world, dt)执行
- **THEN** 读取键盘、鼠标、触摸输入
- **AND** 更新玩家InputComponent
- **AND** 发射输入事件

#### Scenario: 移动系统
- **GIVEN** World对象
- **WHEN** MovementSystem(world, dt)执行
- **THEN** 遍历所有VelocityComponent
- **AND** 更新对应PositionComponent的x、y坐标
- **AND** 应用速度和方向
- **AND** 处理边界检查

#### Scenario: 碰撞系统
- **GIVEN** World对象
- **WHEN** CollisionSystem(world, dt)执行
- **THEN** 查询所有ColliderComponent
- **AND** 检测实体间碰撞
- **AND** 发射collision事件
- **AND** 避免重复检测

#### Scenario: 武器系统
- **GIVEN** World对象
- **WHEN** WeaponSystem(world, dt)执行
- **THEN** 查询玩家WeaponComponent
- **AND** 更新fireTimer
- **AND** 触发射击
- **AND** 创建子弹实体
- **AND** 发射weapon_fired事件

#### Scenario: 敌人系统
- **GIVEN** World对象
- **WHEN** EnemySystem(world, dt)执行
- **THEN** 更新AI状态
- **AND** 执行AI决策
- **AND** 发射敌人子弹
- **AND** 管理敌人行为模式

#### Scenario: Boss系统
- **GIVEN** World对象
- **WHEN** BossSystem(world, dt)执行
- **THEN** 查询BossComponent
- **AND** 更新Boss阶段
- **AND** 执行Boss移动模式
- **AND** 发射Boss武器
- **AND** 管理Boss僚机

#### Scenario: 渲染系统
- **GIVEN** World对象和Canvas上下文
- **WHEN** RenderSystem(ctx, world)执行
- **THEN** 清空画布
- **AND** 遍历所有RenderComponent
- **AND** 绘制精灵图
- **AND** 绘制粒子和特效
- **AND** 应用相机变换

#### Scenario: 音频系统
- **GIVEN** World对象
- **WHEN** AudioSystem(world, dt)执行
- **THEN** 处理事件队列中的音频事件
- **AND** 播放音效（射击、爆炸、升级等）
- **AND** 播放背景音乐

#### Scenario: Buff系统
- **GIVEN** World对象
- **WHEN** BuffSystem(world, dt)执行
- **THEN** 更新BuffComponent
- **AND** 处理Buff效果（伤害加成、无敌等）
- **AND** 处理Buff过期
- **AND** 移除过期Buff

#### Scenario: Combo系统
- **GIVEN** World对象
- **WHEN** ComboSystem(world, dt)执行
- **THEN** 监听击杀事件
- **AND** 更新连击计数
- **AND** 计算连击奖励
- **AND** 处理连击超时重置

#### Scenario: 武器协同系统
- **GIVEN** World对象
- **WHEN** WeaponSynergySystem(world, dt)执行
- **THEN** 检测武器组合
- **AND** 应用协同效果（电磁折射、能量共鸣等）
- **AND** 处理协同触发条件

#### Scenario: 等级系统
- **GIVEN** World对象
- **WHEN** LevelingSystem(world, dt)执行
- **THEN** 计算玩家经验
- **AND** 升级战机等级
- **AND** 应用等级加成（生命值、伤害、防御等）
- **AND** 计算下一级所需经验

#### Scenario: 护盾恢复系统
- **GIVEN** World对象
- **WHEN** ShieldRegenSystem(world, dt)执行
- **THEN** 更新护盾恢复计时器
- **AND** 自动恢复护盾
- **AND** 处理护盾上限

#### Scenario: 拾取系统
- **GIVEN** World对象
- **WHEN** PickupSystem(world, dt)执行
- **THEN** 监听collision事件
- **AND** 检测道具拾取
- **AND** 应用道具效果（武器、HP、炸弹等）
- **AND** 发射pickup事件

#### Scenario: 伤害结算系统
- **GIVEN** World对象
- **WHEN** DamageResolutionSystem(world, dt)执行
- **THEN** 处理collision事件
- **AND** 计算伤害（考虑连击加成、防御等）
- **AND** 扣减生命值或护盾
- **AND** 触发死亡事件
- **AND** 处理击退效果

#### Scenario: 掉落系统
- **GIVEN** World对象
- **WHEN** LootSystem(world, dt)执行
- **THEN** 监听死亡事件
- **AND** 根据掉落配置生成道具
- **AND** 创建道具实体
- **AND** 计算掉落位置

#### Scenario: 相机系统
- **GIVEN** World对象
- **WHEN** CameraSystem(world, dt)执行
- **THEN** 跟随玩家
- **AND** 更新相机位置
- **AND** 应用相机震动
- **AND** 处理相机缩放

#### Scenario: 特效播放系统
- **GIVEN** World对象
- **WHEN** EffectPlayer(world, dt)执行
- **THEN** 更新粒子系统
- **AND** 播放冲击波
- **AND** 播放等离子爆炸
- **AND** 播放减速场
- **AND** 管理特效生命周期

#### Scenario: 难度系统
- **GIVEN** World对象
- **WHEN** DifficultySystem(world, dt)执行
- **THEN** 每15秒评估玩家表现
- **AND** 调整难度状态（EASY/NORMAL/HARD）
- **AND** 应用难度加成（敌人生成、血量、速度等）
- **AND** 检查保底掉落

#### Scenario: Boss阶段系统
- **GIVEN** World对象
- **WHEN** BossPhaseSystem(world, dt)执行
- **THEN** 监听Boss血量变化
- **AND** 检测阶段转换条件
- **AND** 发射boss_phase_change事件
- **AND** 应用阶段特效

#### Scenario: AI转向系统
- **GIVEN** World对象
- **WHEN** AISteerSystem(world, dt)执行
- **THEN** 查询AIComponent
- **AND** 计算移动意图
- **AND** 更新VelocityComponent
- **AND** 实现追踪、躲避、圆周等移动模式

#### Scenario: 生命周期系统
- **GIVEN** World对象
- **WHEN** LifetimeSystem(world, dt)执行
- **THEN** 更新LifetimeComponent
- **AND** 检查生命周期过期
- **AND** 标记过期实体删除

#### Scenario: 清理系统
- **GIVEN** World对象
- **WHEN** CleanupSystem(world, dt)执行
- **THEN** 遍历所有标记删除的实体
- **AND** 从entities Map删除
- **AND** 从所有components Map删除组件
- **AND** 清理相关事件

### Requirement: 系统间通信
系统 SHALL 使用事件驱动的通信机制，避免直接引用。

#### Scenario: 事件定义
- **GIVEN** 游戏事件系统
- **THEN** 支持collision事件（实体碰撞）
- **AND** 支持damage事件（伤害计算）
- **AND** 支持death事件（实体死亡）
- **AND** 支持pickup事件（道具拾取）
- **AND** 支持boss_phase_change事件（Boss阶段变化）
- **AND** 支持weapon_fired事件（武器开火）

#### Scenario: 事件发射
- **GIVEN** World对象
- **WHEN** 系统需要通知其他系统
- **THEN** 调用emitEvent(world, event)
- **AND** 将事件添加到events数组

#### Scenario: 事件处理
- **GIVEN** World对象
- **WHEN** 特定系统处理事件
- **THEN** 遍历events数组
- **AND** 根据事件类型调用对应处理函数
- **AND** 处理后清空事件数组

#### Scenario: 事件顺序
- **GIVEN** 游戏循环
- **WHEN** 处理事件
- **THEN** 在CollisionSystem之后立即处理
- **AND** 在结算层系统中处理（Pickup, DamageResolution, Loot）
- **AND** 保证事件处理顺序符合游戏逻辑

## REMOVED Requirements

### Requirement: 系统类实例化
**原因**: 系统作为类需要维护内部状态，增加了耦合度

**迁移**:
- 系统构造函数参数 → 系统函数直接从World获取
- 系统属性 → World中的组件存储
- 系统方法调用 → 在framePipeline中按顺序调用系统函数

### Requirement: 系统间直接引用
**原因**: 系统间通过构造函数传递引用，导致紧耦合

**迁移**:
- WeaponSystem依赖AudioSystem → WeaponSystem发射事件，AudioSystem监听事件
- EnemySystem依赖GameEngine状态 → EnemySystem直接从World读取
- 所有系统共享状态 → World作为单一状态容器
