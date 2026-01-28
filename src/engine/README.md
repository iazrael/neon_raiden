# System 执行顺序

| 阶段 | 序号 | 系统名称 | 职责 (Inputs $\to$ Outputs) |
| :--- | :--- | :--- | :--- |
| **P1. 决策层**<br>(输入与AI) | 1 | **InputSystem** | 读键盘/手柄 $\to$ 写 `MoveIntent`, `FireIntent` (玩家) |
| | 2 | **DifficultySystem** | 读全局时间/击杀 $\to$ 改 `World.difficulty` (影响刷怪/掉率) |
| | 3 | **SpawnSystem** | 读 `World.time` $\to$ `new EnemyEntity` (刷怪) |
| | 4 | **BossPhaseSystem** | 读 `Health` $\to$ 改 `BossState.phase` (转阶段逻辑) |
| | 5.1 | **BossEntranceSystem** | 读 `BossEntrance` $\to$ 写 `MoveIntent`, `SpeedModifier` (Boss入场) |
| | 5.2 | **BossMovementSystem** | 读 `BossAI`, `Transform`, `Velocity` $\to$ 更新 `Velocity.vx/vy` (Boss移动) |
| | 5.3 | **BossCombatSystem** | 读 `BossAI`, `Weapon` $\to$ 写 `FireIntent` (Boss战斗) |
| | 6 | **EnemySystem**<br>*(含 EliteAI)* | 读 `EnemyTag` $\to$ 写 `MoveIntent`, `FireIntent` (敌人决策) |
| | 7 | **AISteerSystem** | 读 `MoveIntent` (寻路/避障算法) $\to$ 修正 `MoveIntent` |
| **P2. 状态层**<br>(数值更新) | 8 | **BuffSystem** | 读 `Buff` (计时/过期) $\to$ 改 `Speed`, `Weapon.cooldown` |
| | 9 | **WeaponSynergySystem** | 读 `Inventory` (武器组合) $\to$ 产生协同特效/Buff |
| | 10 | **WeaponSystem** | 读 `FireIntent` + `Weapon` $\to$ `new BulletEntity` (发射) |
| **P3. 物理层**<br>(位移) | 11 | **MovementSystem** | 读 `MoveIntent` + `Velocity` $\to$ 改 `Transform` (x,y) |
| **P4. 交互层**<br>(核心碰撞) | 12 | **CollisionSystem** | 读 `HitBox` + `Transform` $\to$ 推送 `HitEvent`, `PickupEvent` (不直接扣血) |
| | 13 | **BombSystem** | 读 `BombIntent` + `Bomb` $\to$ 推送 `BombExplodedEvent` (炸弹使用) |
| **P5. 结算层**<br>(事件处理) | 14 | **PickupSystem** | 消费 `PickupEvent` $\to$ 加武器/Buff，销毁道具 |
| | 15 | **DamageResolutionSystem** | 消费 `HitEvent`, `BombExplodedEvent` $\to$ 扣 `Health`，闪避/无敌判断，推 `DeathEvent` |
| | 16 | **LootSystem** | 消费 `DeathEvent` (敌人死亡) $\to$ `new PickupEntity` (掉落) |
| | 17 | **ComboSystem** | 消费 `DeathEvent` $\to$ 加 `World.score`, 更新连击倍率 |
| **P6. 表现层**<br>(视听反馈) | 18 | **CameraSystem** | 读 Player `Transform` / 震屏事件 $\to$ 改 Camera View |
| | 19 | **EffectPlayer** | 消费所有事件 (Hit/Die/Shoot/Bomb) $\to$ `new ParticleEntity` (视觉特效) |
| | 20 | **AudioSystem** | 消费所有事件 $\to$ 播放音效 (AudioContext) |
| | 21 | **RenderSystem** | 读 `Sprite`, `Transform`, `Particle` $\to$ Canvas/WebGL 绘制 |
| **P7. 清理层**<br>(生命周期) | 22 | **LifetimeSystem** | `Timer` -= dt $\to$ 给超时的实体打 `DestroyTag` |
| | 23 | **CleanupSystem** | 遍历 `DestroyTag` $\to$ 真正的 `delete entity`，清空本帧 `Events` |

---

## Velocity 单位标准

**重要**：所有 velocity 相关组件统一使用**像素/秒**作为单位。

### 组件单位规范

1. **Velocity** 组件 (`src/engine/components/base.ts`)
   - `vx`: X轴速度（像素/秒）
   - `vy`: Y轴速度（像素/秒）
   - `vrot`: 旋转速度（弧度/秒）

2. **MoveIntent** 组件 (`src/engine/components/movement.ts`)
   - 当 `type='velocity'` 时：
     - `dx`: X轴速度（像素/秒）
     - `dy`: Y轴速度（像素/秒）
   - 当 `type='offset'` 时：
     - `dx`: X轴位移（像素，绝对值）
     - `dy`: Y轴位移（像素，绝对值）

3. **Knockback** 组件 (`src/engine/components/movement.ts`)
   - `vx`: X轴击退速度（像素/秒）
   - `vy`: Y轴击退速度（像素/秒）

4. **SpeedStat** 组件 (`src/engine/components/base.ts`)
   - `maxLinear`: 最大线性速度（像素/秒）
   - `maxAngular`: 最大角速度（弧度/秒）

### 时间单位

- 所有系统的 `dt` 参数使用**毫秒**
- 在 MovementSystem 中，dt 会被转换为秒进行位置更新：`dtInSeconds = dt / 1000`

### 参考速度值

| 实体类型 | 最大速度 | 说明 |
|---------|---------|------|
| 玩家 | 400 像素/秒 | SpeedStat 默认值 |
| Boss | 120 像素/秒 | Boss 工厂配置 |
| Boss 入场 | 150 像素/秒 | BossEntrance 组件 |
| 子弹 | 600-800 像素/秒 | 弹药配置 |
| 敌人 | 100-200 像素/秒 | 敌人行为配置 |

### 注释规范

在代码中定义 velocity 相关字段时，请遵循以下注释格式：

```typescript
/** X轴速度（像素/秒） */
vx: number;

/** Y轴速度（像素/秒） */
vy: number;

/** 旋转速度（弧度/秒） */
vrot: number;
```

### 常见错误

❌ **错误**：在 MoveIntent 中使用 `dx: 0.5`（以为是像素/毫秒）
✅ **正确**：使用 `dx: 500`（直接使用像素/秒）

❌ **错误**：在 MovementSystem 中转换 `vx = moveIntent.dx * 1000`
✅ **正确**：直接使用 `vx = moveIntent.dx`
