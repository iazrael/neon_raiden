Kimi:  # 前端 2D 太空射击完整技术汇总（React + ECS）

---

## 一、子系统清单（含可选）
按固定帧序执行，全部可选系统已标 ★

| 序号 | 系统 | 工作内容 |
|----|------|----------|
| 1 | InputSystem | 键盘/手柄/触摸 → 生成 MoveIntent / FireIntent |
| 2 | WeaponSystem | 冷却-发射-生成子弹实体；读 Intent + Weapon |
| 3 | MovementSystem | Transform += Velocity * dt；边界/绕屏 |
| 4 | CollisionSystem |  broadphase→细碰撞；扣血、反弹、穿透、触发 onHit |
| 5 | DamageResolutionSystem | 护盾吸收、DOT、无敌帧、最终 DestroyTag |
| 6 | LifetimeSystem | 子弹/道具/特效/无敌帧计时器；超时贴 DestroyTag |
| 7 | LootSystem ★ | 刚死实体读 DropTable → 生成 PickupItem 实体 |
| 8 | PickupSystem ★ | 玩家碰撞 PickupItem → 塞进 Inventory 或换 Weapon |
| 9 | AISteerSystem ★ | 读 EnemyTag → 写 MoveIntent（复用 Movement） |
|10 | BuffSystem ★ | 处理 SpeedBuff、DamageBuff、Invincible 等计时组件 |
|11 | EffectPlayer ★ | 播放 onHit/onTick 效果：伤害圈、铺火、黑洞力场、相机震屏 |
|12 | CameraSystem ★ | 读 PlayerTransform → 写 CameraOffset |
|13 | SpawnSystem ★ | 时间线或击杀数 → spawnEnemy / spawnBoss |
|14 | CleanupSystem | 帧末统一删除带 DestroyTag 实体 & 回池 |
|15 | RenderSystem ★ | 纯渲染：Canvas/WebGL 画精灵（可放 Worker） |

---

## 二、字体（组件）职责与流程
**“字体”= 组件（Component）**，只存数据，无方法。

| 组件 | 字段 | 谁写入 | 谁读取 |
|-----|------|--------|--------|
| Transform | x, y, rot | Movement | 所有需要位置的系统 |
| Velocity | vx, vy (vrot) | Input/AI/Buff | Movement |
| SpeedStat | maxLinear, maxAngular | Buff | Input/AI（钳制） |
| Health | hp, max | DamageResolution | Collision/HUD |
| Shield | value, regen | DamageResolution | HUD |
| Weapon | ammoType, cooldown, curCD | Input/Buff | WeaponSystem |
| Bullet | owner, ammoType, pierceLeft, bouncesLeft | Weapon | Collision |
| HitBox | radius | Factory | Collision |
| Lifetime | timer | Factory | LifetimeSystem |
| DropTable | table[] | Factory | LootSystem |
| PickupItem | kind, blueprint, autoPickup | Loot | Pickup |
| Buff | type, value, timer | Pickup/Buff | BuffSystem |
| DestroyTag | reason, reusePool | 任何系统 | CleanupSystem |
| PlayerTag | ∅ | Factory | Input/Pickup/HUD |
| EnemyTag | ∅ | Factory | AI/Loot |
| Particle | frame, maxFrame | Effect | Render |
| CameraShake | intensity, timer | Effect | Render |
| MoveIntent | dx, dy | Input/AI | Movement |
| FireIntent | ∅ | Input | Weapon |
| Inventory | weapons[] | Pickup | HUD |
| Knockback | vx, vy | Effect | Movement |
| SpatialNode | cellKey | Collision | Collision（可选 broadphase） |

**流程口诀**：  
*“意图→开火→移动→撞→结算→计时→掉落→拾取→清理→渲染”*

---

## 三、核心数据结构定义
```typescript
type EntityId = number;

interface World {
  entities: Map<EntityId, Component[]>; // ECS 数据库
  playerId: EntityId;
}

interface GameSnapshot {   // 只读 UI 流
  t: number;
  player: { hp, maxHp, shield, ammo, x, y };
  bullets: { x, y }[];
  enemies: { x, y, hp }[];
}

type Blueprint = Record<string, Component>; // 配置表
```

---

## 四、实现注意事项（Checklist）

### 1. 性能
- 每帧全量 snapshot 先上「差分+节流」；实体>5k 换 Archetype 或 Worker  
- Canvas 画精灵放 RAF **独立线程**；React 只画 HUD  
- 对象池回收 `Transform/Velocity/Bullet` 数组，减少 GC

### 2. 确定性 & 回放
- 所有系统 **同步执行**，禁用 `setTimeout/Math.random`（随机用种子序列）  
- 事件、输入、快照全部可录制 → 可重放/回滚  
- 存档时重置 `nextId=0` 并重新编号，防止 ID 溢出

### 3. 数据安全
- 销毁统一用 `DestroyTag` + **帧末 CleanupSystem** 真正 `Map.delete(id)`  
- 系统只通过 `view()` 迭代，**永不手动 `entities.get` 后假设组件存在**  
- 网络对战：客户端预测 → 服务器发权威快照 → 直接覆盖 `world.entities`

### 4. 扩展性
- 新武器 = 新增一行 `AmmoType` 表 + 可选 `onHit/onTick` 效果 ID  
- 新道具 = 新增 `Blueprint` → 工厂函数 0 代码改动  
- 新系统 = 在顺序表插入即可，老系统无依赖

### 5. React 端戒律
- **不**在组件里 `requestAnimationFrame`  
- **不**把实体当 state 存，只订阅 `snapshot$` 流  
- **不**用 JSX 画精灵，Canvas 层独立

---

## 五、一句话总结
**“意图→开火→移动→撞→结算→计时→掉落→拾取→清理→渲染”** 15 步流水线，  
组件即字体，系统即排版；**数据驱动 + 帧末统一清理**，  
让「换枪、反弹、黑洞、掉宝」都能靠**配表 + 插系统**完成，**不改老代码**。

