# 游戏状态事件驱动重构设计

**日期**: 2026-02-03
**状态**: 设计完成
**作者**: AI 设计助手

## 背景问题

当前 `GameState` 管理存在以下问题：

1. **Engine/World 不持有 GameState** - 符合 ECS 纯粹性原则
2. **ReactEngine 持有 state** - 但 `onStateChange` 回调无法正常工作
3. **snapshot.ts 中 state 硬编码** - `buildSnapshot` 始终返回 `GameState.PLAYING`
4. **状态同步混乱** - ReactEngine 订阅 snapshot 但 state 无意义

## 设计方案：事件驱动

采用**事件驱动**模式，保持 ECS 解耦：

- **UI 操作**（暂停/恢复/开始）→ ReactEngine 直接调用 Engine 方法
- **游戏内状态变化**（失败/胜利/Boss）→ System 发出事件 → snapshot 携带 → ReactEngine 接收

## 1. 事件定义

在 `src/engine/events.ts` 中新增事件类型：

```typescript
/** 游戏胜利事件 */
export interface VictoryEvent {
    type: 'victory';
}

/** 游戏失败事件 */
export interface DefeatEvent {
    type: 'defeat';
}

/** Boss 出场事件 */
export interface BossSpawnEvent {
    type: 'boss-spawn';
    bossId: BossId;
}

/** Boss 击杀事件 */
export interface BossDefeatEvent {
    type: 'boss-defeat';
    bossId: BossId;
}
```

## 2. GameSnapshot 接口变更

```typescript
export interface GameSnapshot {
    t: number;
    // ❌ 移除: state: GameState;
    score: number;
    level: number;
    showLevelTransition: boolean;
    levelTransitionTimer: number;
    showBossWarning: boolean;
    comboState: ComboState | null;

    // ✅ 新增: 事件字段（分离设计）
    gameStateEvent: 'defeat' | 'victory' | null;
    bossEvent: { type: 'spawn' | 'defeat'; bossId: BossId } | null;

    player: { /* ... */ };
    boss: { /* ... */ } | null;
    bullets: Array<{ /* ... */ }>;
    enemies: Array<{ /* ... */ }>;
}
```

## 3. buildSnapshot 实现

```typescript
export function buildSnapshot(world: World, t: number): GameSnapshot {
    // ... 现有逻辑 ...

    // 收集游戏状态事件
    let gameStateEvent: 'defeat' | 'victory' | null = null;
    let bossEvent: { type: 'spawn' | 'defeat'; bossId: BossId } | null = null;

    for (const event of world.events) {
        if (event.type === 'defeat') gameStateEvent = 'defeat';
        else if (event.type === 'victory') gameStateEvent = 'victory';
        else if (event.type === 'boss-spawn') bossEvent = { type: 'spawn', bossId: event.bossId };
        else if (event.type === 'boss-defeat') bossEvent = { type: 'defeat', bossId: event.bossId };
    }

    return {
        t,
        score: world.score || 0,
        level: world.level || 1,
        showLevelTransition: false,
        levelTransitionTimer: 0,
        showBossWarning: false,
        comboState: world.comboState,
        gameStateEvent,   // ✅ 新增
        bossEvent,        // ✅ 新增
        player,
        boss,
        bullets,
        enemies,
    };
}
```

## 4. System 事件触发

### 4.1 DamageResolutionSystem

```typescript
// 玩家死亡时
if (playerHp.hp <= 0 && !playerInvuln) {
    world.events.push({ type: 'defeat' });
}

// Boss 死亡时
if (bossHp.hp <= 0) {
    const bossTag = getComponent(world, bossId, BossTag);
    if (bossTag) {
        world.events.push({ type: 'boss-defeat', bossId: bossTag.id });
    }
}
```

### 4.2 SpawnSystem.doSpawnBoss

```typescript
function doSpawnBoss(world: World, bossId: BossId): void {
    const blueprint = BOSSES_TABLE[bossId];
    if (!blueprint) {
        console.warn(`SpawnSystem: No blueprint found for Boss ID '${bossId}'`);
        return;
    }

    const x = world.width / 2;
    const y = -150;
    const id = spawnBoss(world, blueprint, x, y, 0);
    world.bossState.bossId = id;

    // ✅ 发出 Boss 出场事件
    world.events.push({ type: 'boss-spawn', bossId });
}
```

### 4.3 未来 VictorySystem

```typescript
// 达成胜利条件时
world.events.push({ type: 'victory' });
```

## 5. ReactEngine 变更

### 5.1 移除旧逻辑

```typescript
// ❌ 删除
snapshot.state = this.state;

// ❌ 删除
if (snapshot.state !== this.state) {
    this.state = snapshot.state;
    this.onStateChange(this.state);
}
```

### 5.2 syncFromSnapshot 新逻辑

```typescript
private syncFromSnapshot(snapshot: GameSnapshot): void {
    // 处理游戏状态事件
    if (snapshot.gameStateEvent === 'defeat') {
        this.setState(GameState.GAME_OVER);
    } else if (snapshot.gameStateEvent === 'victory') {
        this.setState(GameState.VICTORY);
    }

    // 处理 Boss 事件
    if (snapshot.bossEvent) {
        if (snapshot.bossEvent.type === 'spawn') {
            this.showBossWarning = true;
            this.onBossWarning(true);
        } else if (snapshot.bossEvent.type === 'defeat') {
            this.showBossWarning = false;
            this.onBossWarning(false);
        }
    }

    // ... 其他同步逻辑 ...
}

private setState(newState: GameState): void {
    if (this.state !== newState) {
        this.state = newState;
        this.onStateChange(this.state);
    }
}
```

## 修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/engine/events.ts` | 新增 `VictoryEvent`、`DefeatEvent`、`BossSpawnEvent`、`BossDefeatEvent` |
| `src/engine/snapshot.ts` | 1. `GameSnapshot`：移除 `state`，新增 `gameStateEvent` 和 `bossEvent`<br>2. `buildSnapshot`：从 events 收集这两个字段 |
| `src/engine/systems/DamageResolutionSystem.ts` | 玩家死亡时发出 `DefeatEvent`，Boss 死亡时发出 `BossDefeatEvent` |
| `src/engine/systems/SpawnSystem.ts` | `doSpawnBoss` 中发出 `BossSpawnEvent` |
| `src/engine/ReactEngine.ts` | 1. `syncFromSnapshot`：根据 `gameStateEvent`/`bossEvent` 更新状态<br>2. 移除 `snapshot.state = this.state` 和旧 state 同步逻辑<br>3. 新增 `setState` 辅助方法 |
| `src/engine/engine.ts` | 无需修改 |

## 优势

1. **ECS 纯粹性** - Engine/World 不持有状态，符合设计原则
2. **解耦** - System 不直接依赖 ReactEngine，通过事件通信
3. **可扩展** - 新增状态事件只需定义类型并在 System 中发出
4. **统一机制** - 复用现有的 `World.events` 和 `snapshot$` 流程
