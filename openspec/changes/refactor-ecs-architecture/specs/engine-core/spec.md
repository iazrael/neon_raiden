## ADDED Requirements

### Requirement: Engine核心架构
引擎 SHALL 实现轻量化的ECS架构，仅负责游戏循环和系统编排。

#### Scenario: 引擎启动
- **GIVEN** 一个有效的HTMLCanvasElement和Blueprint配置
- **WHEN** 调用Engine.start(canvas, bp)
- **THEN** 创建World对象
- **AND** 初始化Canvas上下文
- **AND** 启动游戏循环
- **AND** 按顺序执行所有系统

#### Scenario: 引擎暂停和恢复
- **GIVEN** 引擎正在运行
- **WHEN** 调用Engine.pause()
- **THEN** 取消当前动画帧
- **WHEN** 调用Engine.resume()
- **THEN** 恢复游戏循环

#### Scenario: 引擎停止
- **GIVEN** 引擎正在运行
- **WHEN** 调用Engine.stop()
- **THEN** 取消动画帧
- **AND** 断开ResizeObserver
- **AND** 清空World事件和实体
- **AND** 清空快照

### Requirement: 游戏循环
引擎 SHALL 维护精准的游戏循环，支持帧时间步长。

#### Scenario: 游戏循环执行
- **GIVEN** 引擎正在运行
- **WHEN** 每一帧执行
- **THEN** 计算帧时间步长dt
- **AND** 更新World.time
- **AND** 按阶段执行所有系统
- **AND** 生成游戏快照

#### Scenario: 系统执行顺序
- **GIVEN** 游戏循环开始
- **WHEN** 执行系统
- **THEN** 按以下顺序执行：
  1. 决策层（Input, Difficulty, Spawn, BossPhase, Boss, Enemy, AISteer）
  2. 状态层（Buff, Leveling, ShieldRegen, WeaponSynergy, Weapon）
  3. 物理层（Movement）
  4. 交互层（Collision）
  5. 结算层（Pickup, DamageResolution, Loot, Combo）
  6. 表现层（Camera, EffectPlayer, Audio）
  7. 清理层（Lifetime, Cleanup）

### Requirement: 响应式画布
引擎 SHALL 支持响应式画布，自动适配窗口尺寸变化。

#### Scenario: 画布尺寸初始化
- **GIVEN** 有效的Canvas元素
- **WHEN** 引擎启动
- **THEN** 同步Canvas尺寸到World.width和World.height
- **AND** 设置Canvas.width和Canvas.height

#### Scenario: 画布尺寸变化监听
- **GIVEN** 画布尺寸发生变化
- **WHEN** ResizeObserver触发
- **THEN** 更新Canvas.width和Canvas.height
- **AND** 更新World.width和World.height

### Requirement: 游戏快照
引擎 SHALL 每帧生成游戏快照，供React UI渲染。

#### Scenario: 快照生成
- **GIVEN** 游戏循环正在执行
- **WHEN** 每帧渲染前
- **THEN** 构建包含所有实体、粒子、得分的快照
- **AND** 通过snapshot$ Observable发出快照
- **AND** 快照包含玩家、敌人、子弹、Boss等所有可见实体

## MODIFIED Requirements

### Requirement: 系统函数签名
所有系统 SHALL 改为函数式设计，接受World和dt参数。

#### Scenario: 系统函数调用
- **GIVEN** 一个系统函数
- **WHEN** 调用该系统
- **THEN** 传入World对象
- **AND** 传入帧时间步长dt
- **AND** 系统直接修改World状态

### Requirement: 引擎初始化
引擎 SHALL 支持Blueprint配置，初始化游戏世界。

#### Scenario: Blueprint初始化
- **GIVEN** 有效的Blueprint配置
- **WHEN** 引擎启动
- **THEN** 使用Blueprint创建World
- **AND** 根据Blueprint生成玩家实体
- **AND** 初始化游戏配置

## REMOVED Requirements

### Requirement: GameEngine类
**原因**: GameEngine作为上帝类，职责过多，需要拆分为轻量的Engine和World

**迁移**:
- 游戏循环逻辑 → Engine.loop()
- 系统管理 → Engine.framePipeline()
- 实体存储 → World.entities和World.components
- 系统实例化 → 系统改为函数，在framePipeline中调用
- 事件系统 → World.events
- 快照机制 → buildSnapshot(world)函数
