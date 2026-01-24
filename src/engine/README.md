# System 执行顺序

| 阶段 | 序号 | 系统名称 | 职责 (Inputs $\to$ Outputs) |
| :--- | :--- | :--- | :--- |
| **P1. 决策层**<br>(输入与AI) | 1 | **InputSystem** | 读键盘/手柄 $\to$ 写 `MoveIntent`, `FireIntent` (玩家) |
| | 2 | **DifficultySystem** | 读全局时间/击杀 $\to$ 改 `World.difficulty` (影响刷怪/掉率) |
| | 3 | **SpawnSystem** | 读 `World.time` $\to$ `new EnemyEntity` (刷怪) |
| | 4 | **BossPhaseSystem** | 读 `Health` $\to$ 改 `BossState.phase` (转阶段逻辑) |
| | 5 | **BossSystem** | 读 `BossState` $\to$ 写 `MoveIntent`, `FireIntent` (Boss行为) |
| | 6 | **EnemySystem**<br>*(含 EliteAI)* | 读 `EnemyTag` $\to$ 写 `MoveIntent`, `FireIntent` (敌人决策) |
| | 7 | **AISteerSystem** | 读 `MoveIntent` (寻路/避障算法) $\to$ 修正 `MoveIntent` |
| **P2. 状态层**<br>(数值更新) | 8 | **BuffSystem** | 读 `Buff` (计时/过期) $\to$ 改 `Speed`, `Weapon.cooldown` |
| | 9 | **WeaponSynergySystem** | 读 `Inventory` (武器组合) $\to$ 产生协同特效/Buff |
| | 10 | **WeaponSystem** | 读 `FireIntent` + `Weapon` $\to$ `new BulletEntity` (发射) |
| **P3. 物理层**<br>(位移) | 11 | **MovementSystem** | 读 `MoveIntent` + `Velocity` $\to$ 改 `Transform` (x,y) |
| **P4. 交互层**<br>(核心碰撞) | 12 | **CollisionSystem** | 读 `HitBox` + `Transform` $\to$ 推送 `HitEvent`, `PickupEvent` (不直接扣血) |
| **P5. 结算层**<br>(事件处理) | 13 | **PickupSystem** | 消费 `PickupEvent` $\to$ 加武器/Buff，销毁道具 |
| | 14 | **DamageResolutionSystem** | 消费 `HitEvent` $\to$ 扣 `Health`，闪避/无敌判断，推 `DeathEvent` |
| | 15 | **LootSystem** | 消费 `DeathEvent` (敌人死亡) $\to$ `new PickupEntity` (掉落) |
| | 16 | **ComboSystem** | 消费 `DeathEvent` $\to$ 加 `World.score`, 更新连击倍率 |
| **P6. 表现层**<br>(视听反馈) | 17 | **CameraSystem** | 读 Player `Transform` / 震屏事件 $\to$ 改 Camera View |
| | 18 | **EffectPlayer** | 消费所有事件 (Hit/Die/Shoot) $\to$ `new ParticleEntity` (视觉特效) |
| | 19 | **AudioSystem** | 消费所有事件 $\to$ 播放音效 (AudioContext) |
| | 20 | **RenderSystem** | 读 `Sprite`, `Transform`, `Particle` $\to$ Canvas/WebGL 绘制 |
| **P7. 清理层**<br>(生命周期) | 21 | **LifetimeSystem** | `Timer` -= dt $\to$ 给超时的实体打 `DestroyTag` |
| | 22 | **CleanupSystem** | 遍历 `DestroyTag` $\to$ 真正的 `delete entity`，清空本帧 `Events` |
