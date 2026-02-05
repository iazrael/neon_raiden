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

### InputSystem 现有逻辑
- 获取 `pointerDelta` 作为相对偏移
- 优先使用指针输入，其次键盘
- 检查 `isFiring()` 决定是否创建 `FireIntent`

## 设计方案

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

### 2. InputManager 修改

**文件**: `src/engine/input/InputManager.ts`

#### 2.1 新增字段存储鼠标绝对位置

```typescript
// 新增：存储鼠标绝对位置
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

#### 2.3 修改 mousemove 事件

```typescript
canvas.addEventListener('mousemove', (e) => {
    // follow 模式不需要按下，drag 模式需要按下
    if (GAME_CONFIG.mouseControlMode === 'follow' || this.isPointerDown) {
        this.movePointer(e.clientX, e.clientY);
    }
});
```

#### 2.4 修改 movePointer()

```typescript
private movePointer(x: number, y: number) {
    const dx = x - this.lastPointer.x;
    const dy = y - this.lastPointer.y;

    // 累加位移
    this.pointerDelta.x += dx;
    this.pointerDelta.y += dy;

    // 记录绝对位置（供 follow 模式使用）
    this.pointerPosition.x = x;
    this.pointerPosition.y = y;

    this.lastPointer.x = x;
    this.lastPointer.y = y;
}
```

#### 2.5 新增 getPointerPosition()

```typescript
/**
 * 获取鼠标在 canvas 中的绝对位置
 * 用于 follow 模式下的精确跟随
 */
public getPointerPosition() {
    return { ...this.pointerPosition };
}
```

### 3. InputSystem 修改

**文件**: `src/engine/systems/InputSystem.ts`

#### 3.1 获取鼠标位置

```typescript
const mousePosition = inputManager.getPointerPosition();
```

#### 3.2 分模式处理移动

```typescript
// 获取玩家当前位置
const playerTransform = playerComps.find(Transform.check);

if (GAME_CONFIG.mouseControlMode === 'follow') {
    // follow 模式：计算从玩家到鼠标的位移
    if (playerTransform) {
        // 获取 canvas 尺寸（需要从 world 或其他地方获取）
        const canvasWidth = world.canvasWidth;
        const canvasHeight = world.canvasHeight;
        const playerRadius = 16; // 从配置获取

        // 计算目标位置（带边界限制）
        const targetX = clamp(mousePosition.x, playerRadius, canvasWidth - playerRadius);
        const targetY = clamp(mousePosition.y, playerRadius, canvasHeight - playerRadius);

        // 计算位移
        const dx = targetX - playerTransform.x;
        const dy = targetY - playerTransform.y;

        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            // 清除键盘速度
            if (playerVel) {
                playerVel.vx = 0;
                playerVel.vy = 0;
            }
            playerComps.push(new MoveIntent({ dx, dy, type: 'offset' }));
        }
    }
} else {
    // drag 模式：保持现有逻辑
    if (Math.abs(pointerDelta.x) > 0.1 || Math.abs(pointerDelta.y) > 0.1) {
        // ... 现有代码
    }
}
```

## 待确认事项

1. `world` 中是否已有 canvas 尺寸信息，或需要新增
2. 玩家半径是否已有配置常量
3. 边界限制是否需要考虑战机精灵的实际碰撞盒大小

## 实现检查清单

- [ ] 在 `global.ts` 添加配置项
- [ ] 修改 `InputManager.isFiring()`
- [ ] 修改 `InputManager` 的 `mousemove` 事件
- [ ] 修改 `InputManager.movePointer()` 记录绝对位置
- [ ] 新增 `InputManager.getPointerPosition()`
- [ ] 修改 `InputSystem` 处理 follow 模式
- [ ] 添加边界限制
- [ ] 测试两种模式切换
- [ ] 测试自动开火
- [ ] 确保 lint / test / build 通过
