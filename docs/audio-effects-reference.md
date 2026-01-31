# GameEngine 音效系统参考文档

> 本文档整理了旧版 GameEngine (game/GameEngine.ts) 中所有音效的播放时机和上下文，供重构参考。

## 目录
- [战斗音效](#战斗音效)
- [道具与升级音效](#道具与升级音效)
- [游戏状态音效](#游戏状态音效)
- [护盾相关音效](#护盾相关音效)
- [特殊效果音效](#特殊效果音效)
- [系统控制](#系统控制)

---

## 战斗音效

### `playExplosion(size: ExplosionSize)`

**说明**: 爆炸音效，根据爆炸大小使用不同的音效参数

**播放时机**:

| 场景 | 位置 | 大小参数 | 触发条件 |
|------|------|----------|----------|
| 炸弹击中敌人 | triggerBomb() | `LARGE` | 对所有敌人造成伤害时 |
| 玩家死亡 | update() - 玩家HP归零 | `LARGE` | `this.player.hp <= 0` |
| 敌人被击败 | killEnemy() | `LARGE` | 敌人HP归零 |
| Boss被击败 | killBoss() | `LARGE` | Boss HP归零，连续15次爆炸 |
| 子弹撞击障碍物 | checkCollisions() | `SMALL` | 玩家子弹与障碍物碰撞 |
| 敌人子弹撞击障碍物 | checkCollisions() | `SMALL` | 敌人子弹与障碍物碰撞 |
| 玩家受击 | checkCollisions() | `SMALL` | 敌人/敌人子弹与玩家碰撞 |
| 等离子弹爆炸 | createPlasmaExplosion() | `LARGE` | PLASMA子弹击中任何目标 |
| 导弹自毁 | updateBulletsProp() | `SMALL` | 导弹生命周期结束 |
| 普通击中 | handleBulletHit() | `SMALL` | 子弹击中敌人（非PLASMA） |
| 武器协同效果 | handleBulletHit() | `SMALL` | 各种协同触发的爆炸效果 |

**代码位置**: GameEngine.ts:1299

---

### `playHit()`

**说明**: 击中音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 玩家受击 | takeDamage() | 玩家受到伤害 |
| 子弹击中敌人 | handleBulletHit() | 任何子弹击中敌人 |

**代码位置**:
- GameEngine.ts:1097 - 玩家受击
- GameEngine.ts:1199 - 子弹击中敌人

---

### `playBomb()`

**说明**: 炸弹释放音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 触发炸弹 | triggerBomb() | `this.bombs > 0 && this.state === GameState.PLAYING && this.player.hp > 0` |

**代码位置**: GameEngine.ts:298

---

## 道具与升级音效

### `playPowerUp()`

**说明**: 拾取道具音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 拾取道具 | checkCollisions() | 玩家与任何道具碰撞 |

**代码位置**: GameEngine.ts:1069

---

### `playLevelUp()`

**说明**: 玩家等级提升音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 玩家升级 | checkAndApplyLevelUp() | `this.score >= this.nextLevelScore && this.playerLevel < conf.maxLevel` |

**代码位置**: GameEngine.ts:1709

---

## 游戏状态音效

### `playDefeat()`

**说明**: 游戏失败音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 玩家失败 | update() - 玩家HP归零 | `this.player.hp <= 0`，状态变为GAME_OVER |

**代码位置**: GameEngine.ts:1702

---

### `playVictory()`

**说明**: 游戏通关胜利音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 通关胜利 | killBoss() - setTimeout | 击败最后一关Boss，`this.level >= this.maxLevels` |

**代码位置**: GameEngine.ts:16938

---

### `playBossDefeat()`

**说明**: Boss被击败音效（胜利号角）

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| Boss被击败 | killBoss() | Boss HP归零 |

**代码位置**: GameEngine.ts:1890

---

### `playWarning()`

**说明**: Boss即将出现警告音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| Boss警告 | update() - Boss生成逻辑 | `this.levelProgress >= minProgress && levelDuration >= minDuration` 或调试模式下 `levelDuration >= 10 && this.debugEnemyKillCount >= 10` |

**代码位置**: GameEngine.ts:1529, 1539

---

## 护盾相关音效

### `playShieldLoop()`

**说明**: 护盾循环音效（持续播放直到护盾结束）

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 护盾激活 | update() | `this.player.invulnerable && this.player.invulnerableTimer > 0`，每帧检查并播放 |

**代码位置**: GameEngine.ts:1363

---

### `stopShieldLoop()`

**说明**: 停止护盾循环音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 护盾结束 | update() | `this.player.invulnerableTimer <= 0` 或护盾状态被清除时 |

**代码位置**:
- GameEngine.ts:1368 - 计时器结束
- GameEngine.ts:1373 - 状态清理

---

### `playShieldBreak()`

**说明**: 护盾破碎音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 护盾破碎 | takeDamage() | `prevShield > 0 && this.shield === 0`，护盾值从大于0变为0 |

**代码位置**: GameEngine.ts:1094

---

## 特殊效果音效

### `playSlowMotionEnter()`

**说明**: 时间减缓效果音效

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 激活时间减缓 | applyPowerup() - TIME_SLOW | 拾取TIME_SLOW道具 |

**代码位置**: GameEngine.ts:1474

---

## 系统控制

### `pause()`

**说明**: 暂停音频系统（停止所有声音）

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 游戏暂停 | pause() | `this.state === GameState.PLAYING` |
| 游戏结束 | stop() | 状态变为GAME_OVER |

**代码位置**:
- GameEngine.ts:1324 - 暂停
- GameEngine.ts:1338 - 结束

---

### `resume()`

**说明**: 恢复音频系统

**播放时机**:

| 场景 | 位置 | 触发条件 |
|------|------|----------|
| 从暂停恢复 | resume() | `this.state === GameState.PAUSED` |
| 开始游戏 | startGame() | 游戏初始化完成后 |

**代码位置**:
- GameEngine.ts:1332 - 从暂停恢复
- GameEngine.ts:1261 - 开始游戏

---

## 音效播放频率分析

### 高频音效（每帧/频繁触发）
- `playShieldLoop()` - 护盾期间持续播放
- `playHit()` - 战斗中频繁触发
- `playExplosion(SMALL)` - 击中效果，频繁触发

### 中频音效（每秒/定期触发）
- `playExplosion(LARGE)` - 敌人死亡时
- `playPowerUp()` - 拾取道具时

### 低频音效（偶尔/单次触发）
- `playBomb()` - 主动释放炸弹
- `playLevelUp()` - 玩家升级
- `playBossDefeat()` / `playVictory()` / `playDefeat()` - 游戏状态变化
- `playWarning()` - Boss出现前
- `playShieldBreak()` - 护盾破碎
- `playSlowMotionEnter()` - 时间减缓激活

---

## 重构建议

### ECS架构下的音效系统设计

1. **创建独立的AudioSystem组件**
   - 位置: `src/engine/systems/AudioSystem.ts`
   - 职责: 管理所有音效播放、暂停、恢复

2. **音效触发事件**
   - 战斗事件: 击中、爆炸、死亡
   - 游戏状态事件: 升级、胜利、失败
   - 道具事件: 拾取、激活效果
   - 护盾事件: 激活、破碎

3. **音效配置化**
   - 将音效路径、音量、音调等参数移至配置文件
   - 位置: `src/engine/configs/audio.config.ts`

4. **性能优化**
   - 循环音效（如护盾）应避免重复触发
   - 高频音效考虑使用对象池
   - 可添加音效启用/禁用开关

---

## 附录: 音效枚举类型

```typescript
// ExplosionSize
enum ExplosionSize {
  SMALL,  // 小爆炸：击中效果、导弹自毁
  LARGE   // 大爆炸：死亡效果、炸弹、等离子弹
}
```

---

*文档生成时间: 2025-01-31*
*基于代码版本: game/GameEngine.ts*
