# 自动开火与鼠标跟随功能设计

**日期**: 2026-02-05
**状态**: 设计中

## 需求概述

### 功能一：自动开火
- 添加代码配置项，开启后武器自动发射，无需按住按键
- 全局生效，影响所有武器
- 与控制方式独立

### 功能二：鼠标跟随控制
- 鼠标在画布内时，战机 1:1 精确跟随鼠标位置
- 不需要按住按键，"指哪飞哪"
- 战机严格限制在屏幕边界内
- 与自动开火功能独立

## 当前实现分析

### InputManager 现有逻辑
- `isFiring()`: 检查空格键或 `_isFiring` 状态（由触摸/点击触发）
- `mousemove`: 仅在 `isPointerDown` 为 true 时记录位移
- `consumePointerDelta()`: 返回相对位移并清零
- **已有 `canvas` 引用**（通过 `init(canvas)` 设置）

### InputSystem 现有逻辑
- 获取 `pointerDelta` 作为相对偏移
- 优先使用指针输入，其次键盘
- 检查 `isFiring()` 决定是否创建 `FireIntent`

### MovementSystem 现有逻辑
- 已有 `applyBounds()` 函数处理边界限制
- 使用 `world.width` / `world.height` 获取画布尺寸

## 设计方案

### 核心思路（ECS 职责分离）

| 层级 | 职责 |
|------|------|
| **InputManager** | 记录鼠标在 canvas 中的绝对位置（坐标系转换） |
| **InputSystem** | 生成 `MoveIntent`（计算到目标的位移） |
| **MovementSystem** | 执行移动 + 边界限制（已有逻辑） |

---

### 1. 配置项

**文件**: `src/engine/configs/global.ts`

```typescript
export const GAME_CONFIG = {
    // ... 现有配置

    /**
     * 武器是否自动发射
     * true: 持续自动开火，无需按键
     * false: 需要按住空格或鼠标点击才开火
     */
    autoFire: true,

    /**
     * 鼠标控制模式
     * 'drag': 拖拽模式（当前实现）- 需要按住才移动
     * 'follow': 跟随模式（新功能）- 鼠标在哪战机就跟到哪
     */
    mouseControlMode: 'follow' as 'drag' | 'follow',
}
```

---

### 2. InputManager 修改

**文件**: `src/engine/input/InputManager.ts`

#### 2.1 新增字段存储 canvas 内坐标

```typescript
/**
 * 鼠标在 canvas 内的绝对位置（逻辑像素）
 * 用于 follow 模式的精确跟随
 */
private pointerPosition = { x: 0, y: 0 };
```

#### 2.2 修改 isFiring()

```typescript
public isFiring() {
    // 自动开火模式下始终返回 true
    if (GAME_CONFIG.autoFire) return true;
    return this.keys.has('Space') || this._isFiring;
}
```

#### 2.3 修改 mousemove 事件监听

```typescript
canvas.addEventListener('mousemove', (e) => {
    // follow 模式不需要按下，drag 模式需要按下
    const shouldTrack = GAME_CONFIG.mouseControlMode === 'follow' || this.isPointerDown;
    if (shouldTrack) {
        this.movePointer(e.clientX, e.clientY);
    }
});
```

#### 2.4 修改 movePointer() - 只记录原始坐标

```typescript
private movePointer(x: number, y: number) {
    // 计算相对位移（drag 模式使用）
    const dx = x - this.lastPointer.x;
    const dy = y - this.lastPointer.y;
    this.pointerDelta.x += dx;
    this.pointerDelta.y += dy;

    // 记录原始 clientX/Y（follow 模式使用）
    this.pointerPosition.x = x;
    this.pointerPosition.y = y;

    this.lastPointer.x = x;
    this.lastPointer.y = y;
}
```

#### 2.5 新增 getPointerPosition() - 负责坐标系转换

```typescript
/**
 * 获取鼠标在 canvas 中的绝对位置（逻辑像素）
 * 坐标系转换：clientX/Y → canvas 内部坐标
 */
public getPointerPosition() {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
        x: (this.pointerPosition.x - rect.left) * scaleX,
        y: (this.pointerPosition.y - rect.top) * scaleY,
    };
}
```

---

### 3. InputSystem 修改

**文件**: `src/engine/systems/InputSystem.ts`

#### 3.1 follow 模式：生成 MoveIntent

```typescript
// 处理鼠标移动
const mousePos = inputManager.getPointerPosition();

if (GAME_CONFIG.mouseControlMode === 'follow') {
    // follow 模式：计算到目标的位移，生成 MoveIntent
    const playerTransform = playerComps.find(Transform.check);
    if (playerTransform) {
        const dx = mousePos.x - playerTransform.x;
        const dy = mousePos.y - playerTransform.y;

        // 只有当需要移动时才生成意图
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            playerComps.push(new MoveIntent({ dx, dy, type: 'offset' }));
        }
    }
} else {
    // drag 模式：保持现有逻辑
    const pointerDelta = inputManager.consumePointerDelta();
    if (Math.abs(pointerDelta.x) > 0.1 || Math.abs(pointerDelta.y) > 0.1) {
        // ... 现有代码
    }
}
```

**关键设计**：
- InputSystem **只负责生成意图**，不处理边界
- 边界限制由 `MovementSystem.applyBounds()` 统一处理
- 使用现有的 `MoveIntent` 和 `type: 'offset'`，无需新增组件

---

### 4. MovementSystem 无需修改

- 现有的 `applyBounds()` 已处理边界限制
- 现有的 `offset` 类型处理已支持直接位移
- **无需改动**

---

## 实现检查清单

- [ ] 在 `global.ts` 添加配置项
- [ ] 修改 `InputManager.isFiring()`
- [ ] 修改 `InputManager.movePointer()` 添加坐标系转换
- [ ] 新增 `InputManager.getPointerPosition()`
- [ ] 修改 `InputManager` 的 `mousemove` 事件监听
- [ ] 修改 `InputSystem` 添加 follow 模式逻辑
- [ ] 测试两种模式切换
- [ ] 测试自动开火
- [ ] 测试边界限制（鼠标移出画布边缘）
- [ ] 确保 `pnpm lint` / `pnpm test` / `pnpm build` 通过

---

## 设计说明

### 为什么这样设计简单？

1. **复用现有架构**：利用已有的 `MoveIntent` + `MovementSystem.applyBounds()`
2. **职责清晰**：InputSystem 只管生成意图，MovementSystem 管移动和边界
3. **无新增组件**：不需要 `TargetPosition` 等新组件

### 坐标系转换说明

| 坐标系 | 来源 | 用途 |
|--------|------|------|
| clientX/Y | 鼠标事件 | 视口坐标 |
| pointerPosition | 转换后 | Canvas 内逻辑像素坐标 |
| world.width/height | World | 边界检查 |

转换公式：
```typescript
canvasX = (clientX - rect.left) * (canvas.width / rect.width)
canvasY = (clientY - rect.top) * (canvas.height / rect.height)
```

这样可以正确处理：
- Canvas 非 fullscreen
- CSS padding/margin
- DPR（设备像素比）
