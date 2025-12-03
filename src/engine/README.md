输入 → 武器(含协同) → 移动(玩家+敌人+精英) → 碰撞 → 伤害 → 连击/难度/环境
     → Boss(阶段→行为) → 计时 → 掉落 → 拾取 → 音频 → 清理 → 渲染

| 阶段        | 系统                     | 调整理由                                                     |
| --------- | ---------------------- | -------------------------------------------------------- |
| ① 输入      | InputSystem            | 硬件 → 意图                                                  |
| ② 武器      | WeaponSystem           | 读 Intent → 生成子弹实体                                        |
| ③ 武器协同    | WeaponSynergySystem    | **修正/增强武器数值**（必须在 Weapon 之后，但自己不再生实体）                    |
| ④ 行为      | AISteerSystem          | 生成**敌人移动意图**（给下一步 Movement 读）                            |
| ⑤ 移动      | MovementSystem         | 读所有 Velocity（玩家+敌人+Knockback）→ 写 Transform               |
| ⑥ 相机      | CameraSystem           | **立刻跟拍玩家**（避免渲染层看到上一帧位置）                                 |
| ⑦ 碰撞      | CollisionSystem        | 只认 Transform+HitBox → 扣血、反弹、穿透                           |
| ⑧ 伤害结算    | DamageResolutionSystem | 护盾、DOT、无敌帧；**写 DestroyTag**                              |
| ⑨ 连击      | ComboSystem            | **同一帧内**立即统计命中次数，给音频/难度实时用                               |
| ⑩ 难度      | DifficultySystem       | 根据本帧连击/时间 → 调下波刷新率、倍率                                    |
| ⑪ 环境      | EnvironmentSystem      | 移动平台、风向、毒圈（在 Spawn 前，避免新生成敌人立刻被挤）                        |
| ⑫ Boss 阶段 | BossPhaseSystem        | 读 Boss 血量 → 切 phase                                      |
| ⑬ Boss 行为 | BossSystem             | 根据当前 phase 放技能（**可能生成弹幕实体**，所以在 WeaponSystem 之后）         |
| ⑭ 计时      | LifetimeSystem         | 子弹/道具/Buff 超时 → **写 DestroyTag**                         |
| ⑮ 掉落      | LootSystem             | 读 DeadTag+DropTable → 生成 PickupItem 实体                   |
| ⑯ 拾取      | PickupSystem           | 玩家碰道具 → 吃/换武器（**可能写 Inventory**，音频立即需要）                  |
| ⑰  Buff   | BuffSystem             | 所有 Buff 计时-1，超时 → **写 DestroyTag**                       |
| ⑱ 效果      | EffectPlayer           | 收集本帧所有 **HitEvent/KillEvent/PickupEvent** → 生成粒子、力场、相机震屏 |
| ⑲ 音频      | AudioSystem            | **一次性播放**上一步所有事件对应的音效，避免 60 次/秒 new Audio()              |
| ⑳ 清理      | CleanupSystem          | **唯一** `Map.delete(id)` & 对象池回灌                          |
| ㉑ 渲染      | RenderSystem           | 只读 world → Canvas/WebGL 画精灵（可放 Worker）                   |
