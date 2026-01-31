# 炸弹触发机制重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将炸弹触发机制重构为符合 ECS 架构的事件驱动模式,使 UI 层不直接修改炸弹数量。

**架构:** 引入 InputManager.triggerBomb() API,统一键盘和 UI 按钮的炸弹触发逻辑,数据完全由 ECS World 管理。

**Tech Stack:** TypeScript, ECS 架构, Jest 测试框架

---

## 前置条件

**分支:** `claude_esc2` (当前分支)
**相关文件:**
- `src/engine/input/InputManager.ts`
- `src/engine/systems/InputSystem.ts`
- `src/engine/ReactEngine.ts`
- `src/engine/systems/BombSystem.ts` (参考,无需修改)

**设计文档:** `docs/plans/2026-01-31-bomb-trigger-mechanism-design.md`

---

## Task 1: InputManager 添加程序触发支持

**Files:**
- Modify: `src/engine/input/InputManager.ts`

**Step 1: 添加程序触发状态位**

在 `InputManager` 类中添加私有字段 (约 line 20,在 `_isBombing` 之后):

```typescript
// 在 line 20 之后添加
private _programmaticBomb = false;
```

**Step 2: 添加 triggerBomb() 公共 API**

在 `isBombing()` 方法之后 (约 line 130 之后) 添加:

```typescript
/**
 * 程序化触发炸弹 (供 UI 按钮调用)
 */
public triggerBomb(): void {
    this._programmaticBomb = true;
}
```

**Step 3: 修改 isBombing() 方法**

替换现有的 `isBombing()` 方法 (line 128-130):

```typescript
public isBombing(): boolean {
    return this.keys.has('KeyB') || this._programmaticBomb;
}
```

**Step 4: 添加 consumeProgrammaticBomb() 方法**

在 `isBombing()` 方法之后添加:

```typescript
/**
 * 消费程序触发状态 (供 InputSystem 调用)
 * @returns 是否成功消费
 */
public consumeProgrammaticBomb(): boolean {
    if (this._programmaticBomb) {
        this._programmaticBomb = false;
        return true;
    }
    return false;
}
```

**Step 5: 类型检查**

```bash
pnpm run type-check
```

Expected: 无错误

**Step 6: 提交**

```bash
git add src/engine/input/InputManager.ts
git commit -m "feat(input): 添加程序化炸弹触发API

- 添加 _programmaticBomb 状态位
- 添加 triggerBomb() 公共 API 供 UI 调用
- 修改 isBombing() 同时检查键盘和程序触发
- 添加 consumeProgrammaticBomb() 清除程序触发状态"
```

---

## Task 2: InputSystem 处理程序触发

**Files:**
- Modify: `src/engine/systems/InputSystem.ts`

**Step 1: 修改炸弹处理逻辑**

替换现有的炸弹处理代码块 (line 103-111):

```typescript
// === 处理炸弹 (B键 + 程序触发) ===
const existingBomb = playerComps.find(BombIntent.check);
const isBombing = inputManager.isBombing(); // 同时检查键盘和程序触发

if (isBombing) {
    // 炸弹通常是一次性触发,这里持续按住会持续产生意图
    // 后续 BombSystem 需要处理冷却或消耗
    if (!existingBomb) {
        playerComps.push(new BombIntent());
    }
    // 消费程序触发状态,防止重复触发
    inputManager.consumeProgrammaticBomb();
} else {
    if (existingBomb) removeComponent(world, world.playerId, existingBomb);
}
```

**Step 2: 类型检查**

```bash
pnpm run type-check
```

Expected: 无错误

**Step 3: 提交**

```bash
git add src/engine/systems/InputSystem.ts
git commit -m "feat(input-system): 处理程序化炸弹触发

- 修改炸弹逻辑同时读取键盘和程序触发状态
- 调用 consumeProgrammaticBomb() 清除程序触发
- 统一 B 键和 UI 按钮的处理流程"
```

---

## Task 3: ReactEngine 简化炸弹触发

**Files:**
- Modify: `src/engine/ReactEngine.ts`

**Step 1: 添加 InputManager 导入**

在文件顶部的导入部分添加 (约 line 14):

```typescript
import { inputManager } from './input/InputManager';
```

**Step 2: 重写 triggerBomb() 方法**

完全替换 `triggerBomb()` 方法 (line 180-195):

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
    // 炸弹消费在 BombSystem 中处理
    // 数量变化通过 snapshot 同步
}
```

**Step 3: 类型检查**

```bash
pnpm run type-check
```

Expected: 无错误

**Step 4: 提交**

```bash
git add src/engine/ReactEngine.ts
git commit -m "refactor(react-engine): 简化炸弹触发逻辑

- 移除直接修改炸弹数量的代码
- 改为调用 InputManager.triggerBomb()
- 炸弹数据完全由 ECS World 管理
- 遵循 ECS 架构原则"
```

---

## Task 4: 验证与测试

**Step 1: 运行所有测试**

```bash
pnpm test
```

Expected: 所有测试通过

**Step 2: 类型检查**

```bash
pnpm run type-check
```

Expected: 无错误

**Step 3: 手动验证 (可选)**

启动游戏并验证:
- [ ] 键盘 B 键能正常触发炸弹
- [ ] UI 按钮能正常触发炸弹
- [ ] 炸弹数量正确减少
- [ ] 冷却期内重复触发被拦截
- [ ] 炸弹数量为 0 时播放空弹音效

**Step 4: 提交最终更新**

```bash
git add docs/plans/2026-01-31-bomb-trigger-mechanism.md
git commit -m "docs(bomb): 添加炸弹触发机制实施计划"
```

---

## 验证清单

完成上述所有任务后,确认以下检查点:

- [x] InputManager 提供 `triggerBomb()` API
- [x] InputSystem 同时处理键盘和程序触发
- [x] ReactEngine 不再直接修改炸弹数量
- [x] 所有类型检查通过
- [x] 所有测试通过
- [x] 代码已提交到 git

---

## 架构验证

重构后应满足:

1. **单一数据源:** 炸弹数量只存储在 ECS World 的 BombComponent 中
2. **单向数据流:** InputManager → BombIntent → BombSystem → BombComponent
3. **职责分离:** UI 层只触发,ECS 层负责执行和状态管理
4. **统一接口:** 键盘和 UI 按钮使用相同的触发机制

---

## 回滚计划

如果出现问题,可以通过以下命令回滚:

```bash
# 回滚到实施前的状态
git reset --hard <实施前的commit hash>

# 查看提交历史找到 commit hash
git log --oneline -10
```

---

## 参考资料

- 设计文档: `docs/plans/2026-01-31-bomb-trigger-mechanism-design.md`
- BombSystem 参考: `src/engine/systems/BombSystem.ts`
- ECS 架构模式: `CLAUDE.md`
