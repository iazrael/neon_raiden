## 重构目标

* 将庞大且高耦合的 `game/GameEngine.ts` 拆分为高内聚、低耦合的多模块架构，保留 `GameEngine` 作为统一驱动与编排层。

* 引入战机领域对象 `Starfighter`（继承 `Entity`），以及 `FighterFactory` 以配置/ID 方式创建战机实例，便于新增战机与扩展。

* 将碰撞检测完整下沉为引擎子模块，独立于 `GameEngine`，支持后续空间分区优化。

* 增加强类型 `EventBus` 作为事件总线，解耦系统与模块交互。

* 规划关卡与波次、刷怪、Boss 流程等常见 2D 太空射击系统，并与现有 `systems/*` 协同。

* 需要彻底重构 `GameEngine，不能妥协，可以分步骤进行。`

* 严格类型、零冗余，保持所有数值逻辑与配置在 `config/*`，涉及玩法/数值变更前后同步设计文档（GAME\_BALANCE\_DESIGN）。

## 现状与问题定位

* `GameEngine` 承担过多职责：输入、渲染、音频、刷怪、Boss、武器、子弹、碰撞、数值增益、关卡、效果体、以及玩家数据等，难以维护与扩展。

* 玩家相关信息高度分散于 `GameEngine` 字段与方法（如武器、护盾、升级、定时器等），新增战机代价高。

* 碰撞相关逻辑内联在 `GameEngine.checkCollisions()` 与若干工具方法中，难以重用与优化。

* 系统初始化存在顺序问题：`BossSystem` 构造时依赖 `difficultySys` 尚未初始化（game/GameEngine.ts:145 与 149）。

关键代码热点参考：

* 玩家移动与边界：`game/GameEngine.ts:409-436`

* 开火与武器协同：`game/GameEngine.ts:447-473`

* 刷怪与难度：`game/GameEngine.ts:475-512`、`623-646`

* Boss 预警与生成/阶段：`game/GameEngine.ts:521-566`、`838-847`、`902-904`

* 子弹特殊行为：`game/GameEngine.ts:706-756`、`758-836`

* 碰撞与命中处理：`game/GameEngine.ts:992-1068`、`1093-1209`、`1557-1581`

* 玩家数值与升级：`game/GameEngine.ts:1070-1091`、`1665-1687`、`1604-1608`

* 基础类型定义：`types/index.ts:64-115`、`types/sprite.ts:184-226`（战机/升级配置）

## 目标架构（模块划分）

* **编排层**：`GameEngine` 仅负责生命周期（init/start/stop/pause/resume）、帧驱动（update/draw/loop）、模块装配与事件编排，不再持有玩家领域数据与碰撞实现。

* **领域对象**：

  * `entities/Starfighter.ts`：继承 `Entity`，封装战机的状态与行为（移动、边界、护盾、受击、升级、装备、炸弹触发等），对外暴露严格 API。

  * `engine/FighterFactory.ts`：根据配置/ID 构建 `Starfighter`（读取 `config/player.ts` 与 `types`），支持多战机扩展。

* **引擎子模块**：

  * `engine/EventBus.ts`：强类型事件总线，模块解耦（支持同步/异步派发、优先级）。

  * `engine/CollisionSystem.ts`：AABB/玩家缩放碰撞（先实现），对接 `EventBus` 产生碰撞事件（后续可替换为四叉树/网格）。

  * `engine/EntityManager.ts`：统一管理实体集合（玩家/僚机/敌人/子弹/掉落/效果体），提供只读视图与增删改查 API。

  * `engine/LevelManager.ts`：关卡进度、波次调度、Boss 预警与生成窗口，与 `EnemySystem`、`BossSystem`、`DifficultySystem` 协同。

* **系统层（保留并增强接口）**：复用现有 `systems/*`，新增以下职责划分：

  * `systems/BulletSystem.ts`（新）：子弹飞行/旋转/寿命与特殊行为（导弹追踪、反弹、减速场影响），从 `GameEngine` 迁移 `updateEnemyBullets` 与 `updateBulletsProp`。

  * `systems/PowerupSystem.ts`（新）：道具拾取与效果应用，整合 `applyPowerup` 与协同系统交互。

## 事件模型（EventBus）

* 定义事件枚举与载荷类型（强类型）：

  * `CollisionEvent`：`BulletHitEnemy`、`BulletHitBoss`、`EnemyBulletHitPlayer`、`PowerupCollected`、`PlayerCollideEnemy`、`PlayerCollideBoss`。

  * `CombatEvent`：`WeaponFired`、`ExplosionCreated`、`ShieldChanged`、`PlayerDamaged`、`EnemyKilled`、`BossKilled`。

  * `LevelEvent`：`LevelStarted`、`LevelProgress`、`BossWarning`、`BossSpawned`、`LevelCompleted`、`Victory`。

  * `InputEvent`、`UIEvent` 等根据需要扩展。

* 约束：事件载荷包含必要上下文，如实体引用与数值，禁止 `any`。

* 使用方式：系统/模块订阅自身关心事件；`GameEngine` 负责发布关键生命周期/关卡事件与组装交互事件。

## 数据流与生命周期

* `GameEngine.startGame()`：通过 `FighterFactory` 创建 `Starfighter`，注册到 `EntityManager`；发布 `LevelStarted`。

* 帧循环：

  * `InputSystem` → `Starfighter.update(input, dt)` 负责移动、边界与速度；

  * `LevelManager.update(dt)` 决定刷怪节奏与 Boss 预警，发布 `LevelProgress`/`BossSpawned`；

  * `WeaponSystem`/`BulletSystem.update(dt)` 维护开火与子弹行为；

  * `EnemySystem.update(dt)`、`BossSystem.update(dt)` 更新 AI 与状态；

  * `CollisionSystem.update(dt, snapshots)` 产出碰撞事件 → `EventBus`；

  * 订阅者处理：`PowerupSystem` 应用效果、`ComboSystem`/`SynergySystem` 处理加成、`DifficultySystem` 自适应调参；

  * `RenderSystem.draw(snapshot)` 渲染只读快照。

* `GameEngine` 作为唯一驱动，聚合各系统输出并推进状态机（PLAYING/PAUSED/VICTORY 等）。

## 详细设计（关键类与接口）

### Starfighter

* 字段迁移：`weaponType`、`secondaryWeapon`、`weaponLevel`、`bombs`、`shield`、`playerLevel`、`nextLevelScore`、`playerDefensePct`、`playerFireRateBonusPct`、`playerDamageBonusPct`、`levelingShieldBonus`、`playerConfig`、定时器（如 `shieldRegenTimer`）。

* 方法：`update(input, dt, bounds)`、`takeDamage(amount)`、`triggerBomb(target?)`、`applyLevelUp(scoreDelta)`、`getShieldCap()`、`getShieldPercent()`、`equipWeapon(type, level)`、`equipSecondary(type?)`。

* 依赖：只读取 `WeaponConfig`、`PlayerConfig`；行为事件通过 `EventBus` 派发（如 `ShieldChanged`、`PlayerDamaged`）。

### FighterFactory

* 输入：`fighterId` 或配置对象（兼容 `config/player.ts` 与 `types/FighterEntity`）。

* 输出：`Starfighter` 实例，完成类型与数值初始化，零 `any`。

### CollisionSystem

* 输入：来自 `EntityManager` 的只读快照（玩家、敌人、子弹、掉落、效果体、Boss/僚机）。

* 实现：

  * AABB 检测（复用并改造 `isColliding` 与玩家缩放 `isPlayerColliding`）。

  * 分类：`Player vs Enemy/EnemyBullet/Boss/Wingmen`、`Bullet vs Enemy/Boss/Wingmen`、`Player vs Powerup`。

  * 输出：事件列表，通过 `EventBus` 派发给订阅者（如 `PowerupSystem`、`ComboSystem`、`WeaponSystem`）。

* 可扩展：后续可切换到四叉树/网格分区，接口不变。

### EventBus

* API：`subscribe<TEvent>(type, handler)`、`publish<TEvent>(payload)`、`unsubscribe(token)`；可选优先级与一次性订阅。

* 类型：事件到载荷的映射类型，禁止 `any`，确保编译期安全。

### LevelManager

* 职责：关卡进度、最短关卡时长、Boss 预警与生成窗口（参考现有逻辑 `game/GameEngine.ts:521-566`）。

* 交互：与 `EnemySystem` 协同刷怪（结合 `DifficultySystem`）、与 `BossSystem` 协同生成 Boss 与僚机；对外发布 `LevelProgress`、`BossWarning`、`BossSpawned`、`LevelCompleted`。

### BulletSystem（新）

* 迁移逻辑：`updateEnemyBullets`（game/GameEngine.ts:706-756）、`updateBulletsProp`（game/GameEngine.ts:758-836）。

* 增强：统一处理旋转角、寿命计时、慢场影响、导弹索敌与速度上限、反弹回调等；对外发布 `BulletExpired`、`BulletHit`（由碰撞系统确认命中）。

### PowerupSystem（新）

* 迁移逻辑：`applyPowerup`（game/GameEngine.ts:1391-1519）。

* 交互：根据拾取事件应用效果、更新 `Starfighter`、与 `SynergySystem`/`ComboSystem` 同步；保持所有数值读取自 `config/*`。

## 目录结构规划

* `game/engine/EventBus.ts`

* `game/engine/CollisionSystem.ts`

* `game/engine/EntityManager.ts`

* `game/engine/FighterFactory.ts`

* `game/engine/LevelManager.ts`

* `game/entities/Starfighter.ts`

* `game/systems/BulletSystem.ts`

* `game/systems/PowerupSystem.ts`

* 保留并复用：`systems/*`、`config/*`、`types/*`

## 迁移与改造步骤

1. 新增 `EventBus` 与 `EntityManager`，将 `GameEngine` 中的实体数组迁移到 `EntityManager`（玩家、僚机、敌人、子弹、掉落、效果体、慢场等）。
2. 新增 `Starfighter` 与 `FighterFactory`，将玩家相关字段与方法迁移出 `GameEngine`，`GameEngine` 仅持有 `player: Starfighter` 引用。
3. 新增 `CollisionSystem`，复制并改造 `isColliding`/`isPlayerColliding`，重写 `checkCollisions` 为事件派发流程；移除引擎内联碰撞更新。
4. 新增 `BulletSystem`，迁移 `updateEnemyBullets` 与 `updateBulletsProp`，统一子弹行为入口。
5. 新增 `LevelManager`，迁移关卡进度、定时器与 Boss 预警窗口逻辑，统一刷怪节奏；修复系统初始化顺序问题（`DifficultySystem` 先于 `BossSystem`）。
6. 新增 `PowerupSystem`，接入拾取事件→应用效果→触发渲染与音频反馈。
7. 收敛 `GameEngine`：仅编排 `update(dt)` 调用序与事件汇总，保留 `loop/draw`；减少内部状态为只读派生或委托到模块层。
8. 保持现有 `RenderSystem` 与 UI 回调不变，通过快照与事件传递所需数据（如护盾百分比、连击状态、Boss 预警）。
9. 清理冗余与重复字段，统一从 `config/*` 与 `types/*` 读取数值；如需数值调整，先审阅并更新 GAME\_BALANCE\_DESIGN 文档。

## 测试与验证

* 单元测试：

  * `CollisionSystem`：AABB/缩放碰撞、分类命中、事件派发。

  * `EventBus`：订阅/退订/优先级、强类型校验。

  * `FighterFactory`：按 ID/配置创建、初始数值正确性。

  * `Starfighter`：受击/护盾耗尽溢出、升级成长边界、炸弹触发副作用。

  * `BulletSystem`：导弹索敌、速度上限、反弹与寿命。

  * `LevelManager`：关卡进度门槛、最短时长、Boss 预警与生成。

* 集成测试：`GameEngine` 帧驱动下的事件链路（发射→命中→得分/掉落→升级/协同）。

* 可视验证：保留现有渲染，确认 UI 与音频回调正确触发。

## 性能与后续优化

* 碰撞首次实现采用分组 AABB，后续可引入四叉树/均匀网格以降低 O(N^2)。

* `EntityManager` 提供按类型分桶视图，加速子系统迭代。

* `EventBus` 可增加批处理与事件记录以支持回溯与调试。

## 交付物

* 新增与改造的 TypeScript 源文件（遵循现有风格与路径别名）。

* 完整测试用例与通过结果。

* 更新设计文档（GAME\_BALANCE\_DESIGN），记录涉及的数值/机制边界与不变式。

## 实施注意

* 代码中不添加注释（遵循项目规则）；类型严格，禁止 `any`。

* 变更范围尽量模块化与可回滚；保留 `GameEngine` 外部 API 与 UI 回调兼容。

* 保持与现有 `systems/*` 的接口一致，逐步迁移互相依赖的逻辑。

