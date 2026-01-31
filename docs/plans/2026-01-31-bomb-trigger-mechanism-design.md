# 炸弹触发机制重构设计

**日期**: 2026-01-31
**设计目标**: 将炸弹触发机制重构为符合 ECS 架构的事件驱动模式

---

## 1. 架构概述

### 问题核心
当前 `ReactEngine.triggerBomb()` 直接修改炸弹数量,违背了 ECS 架构原则。炸弹数据应完全由 ECS World 管理,UI 层只负责发送触发意图。

### 设计目标
- 将炸弹数量管理完全移交给 ECS 层 (BombComponent)
- ReactEngine 只提供触发接口,不直接修改炸弹数量
- 保持 InputManager 作为输入系统的单一入口点
- 统一键盘(B键)和 UI 按钮的炸弹触发逻辑

### 核心原则
- **单一数据源**: 炸弹数量只存储在 ECS World 的 BombComponent 中
- **单向数据流**: InputManager → BombIntent → BombSystem → BombComponent
- **职责分离**: UI 层只触发,ECS 层负责执行和状态管理

### 数据流
```
UI 按钮点击 → ReactEngine.triggerBomb() → InputManager.triggerBomb()
→ BombIntent → BombSystem → BombComponent (消费数量)
→ Snapshot → ReactEngine.bombs (UI 显示)
```

---

## 2. 组件职责定义

### InputManager 新增职责
- 提供编程式触发 API: `triggerBomb()`
- 维护 `programmaticBomb` 状态位,标记程序触发
- 每帧在 `isBombing()` 查询时同时检查键盘(B键)和程序触发

### InputSystem 调整
- 读取 `inputManager.isBombing()` 时,该返回值需要同时考虑键盘输入和程序触发
- 生成 BombIntent 后,需要清除 `programmaticBomb` 状态(单次触发)

### ReactEngine 简化
- `triggerBomb()` 方法不再修改 `this.bombs`
- 改为调用 `inputManager.triggerBomb()` 发送触发信号
- 炸弹数量变化通过 `syncFromSnapshot()` 从 BombComponent 同步

### BombSystem (无需修改)
- 已经正确实现了炸弹消费逻辑 (line 55: `bomb.count--`)
- 已经正确处理了冷却时间检查 (line 48-52)
- 已经正确处理了空弹情况 (line 38-46)

---

## 3. 具体修改实现

### 3.1 InputManager 修改

文件: `src/engine/input/InputManager.ts`

新增状态位和方法:

```typescript
// 在类开头添加状态位
private _programmaticBomb = false;

// 新增公共 API
public triggerBomb(): void {
    this._programmaticBomb = true;
}

// 修改 isBombing() 方法
public isBombing(): boolean {
    return this.keys.has('KeyB') || this._programmaticBomb;
}

// 新增消费方法(供 InputSystem 调用)
public consumeProgrammaticBomb(): boolean {
    if (this._programmaticBomb) {
        this._programmaticBomb = false;
        return true;
    }
    return false;
}
```

### 3.2 InputSystem 修改

文件: `src/engine/systems/InputSystem.ts`

在炸弹处理逻辑中添加程序触发的清理:

```typescript
// 在处理 BombIntent 的部分(当前 line 104-111)
const existingBomb = playerComps.find(BombIntent.check);
const isBombing = inputManager.isBombing(); // 现在会同时检查键盘和程序触发

if (isBombing) {
    if (!existingBomb) playerComps.push(new BombIntent());
    // 消费程序触发状态,防止重复触发
    inputManager.consumeProgrammaticBomb();
} else {
    if (existingBomb) removeComponent(world, world.playerId, existingBomb);
}
```

### 3.3 ReactEngine 修改

文件: `src/engine/ReactEngine.ts`

简化 `triggerBomb()` 方法:

```typescript
/**
 * 触发炸弹
 * @param x 目标 X 坐标 (可选,暂未使用)
 * @param y 目标 Y 坐标 (可选,暂未使用)
 */
triggerBomb(x?: number, y?: number): void {
    if (this.state !== GameState.PLAYING) return;

    // 通过 InputManager 触发炸弹意图
    // 实际炸弹数量由 BombSystem 中的 BombComponent 管理
    inputManager.triggerBomb();

    // 不再在这里减少炸弹数量
    // this.bombs--; // ❌ 删除这行
    // this.onBombChange(this.bombs); // ❌ 删除这行
}
```

---

## 4. 完整调用流程

### 场景1: 键盘 B 键触发
```
用户按下 B 键
→ InputManager 监听到 keydown
→ keys.add('KeyB')
→ InputSystem 调用 isBombing()
→ 返回 true (因为 keys.has('KeyB'))
→ 生成 BombIntent
→ BombSystem 检查 BombComponent.count
→ 扣除炸弹
→ 发送爆炸事件
→ Snapshot 更新
→ ReactEngine.syncFromSnapshot()
→ this.bombs 同步
→ UI 更新
```

### 场景2: UI 按钮触发
```
用户点击炸弹按钮
→ ReactEngine.triggerBomb()
→ inputManager.triggerBomb()
→ 设置 _programmaticBomb = true
→ 下一帧 InputSystem 调用 isBombing()
→ 返回 true
→ 生成 BombIntent
→ consumeProgrammaticBomb() 清除状态位
→ BombSystem 处理(同场景1后续步骤)
```

---

## 5. 边界情况与测试策略

### 5.1 关键边界情况处理

1. **冷却期防重复触发:**
   - BombSystem 已通过 `BOMB_COOLDOWN` (3000ms) 和 `lastBombTime` 处理
   - 即使在冷却期内多次调用 `triggerBomb()`,BombSystem 也会拦截
   - `consumeProgrammaticBomb()` 确保每帧只生成一个 BombIntent

2. **空弹处理:**
   - BombSystem line 38-45: 当 `bomb.count <= 0` 时,移除 Intent 并播放"空弹"音效
   - ReactEngine 不需要预检查,完全依赖 ECS 层反馈

3. **状态同步一致性:**
   - ReactEngine 的 `this.bombs` 仅用于 UI 显示
   - 真实数据源是 ECS World 中的 BombComponent
   - `syncFromSnapshot()` 确保每次帧更新时同步

4. **游戏状态校验:**
   - ReactEngine.triggerBomb() 检查 `state === GameState.PLAYING`
   - 非游戏状态下不响应炸弹触发

### 5.2 测试验证点

- [ ] 键盘 B 键能正常触发炸弹
- [ ] UI 按钮能正常触发炸弹
- [ ] 冷却期内重复触发被正确拦截
- [ ] 炸弹数量为 0 时播放空弹音效
- [ ] 炸弹数量变化正确同步到 UI
- [ ] 暂停/菜单状态下炸弹不响应

---

## 总结

本设计通过引入 `InputManager.triggerBomb()` API,实现了 UI 按钮触发的炸弹机制,同时遵循 ECS 架构原则:

- ✅ 炸弹数据完全由 ECS World 管理
- ✅ UI 层只发送触发信号
- ✅ 统一了键盘和 UI 按钮的处理逻辑
- ✅ 最小化修改,职责清晰
