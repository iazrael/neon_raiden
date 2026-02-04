# 导弹索敌视觉验证指南

本文档说明如何使用视觉验证工具来确认导弹的精灵图是否正确朝向目标敌人。

## 背景

导弹索敌功能修复后，需要验证：
1. ✅ 导弹的旋转角度包含90度偏移（精灵图原始朝上是向上的）
2. ✅ 导弹能够追踪普通敌人和Boss
3. ✅ 差异化锁定限制正常工作（Boss=3，敌人=1）

单元测试已经覆盖了所有这些功能，但视觉验证可以确认游戏中的实际表现。

## 方法1：控制台输出（推荐用于快速验证）

### 在游戏中使用

1. 在游戏的入口文件（如 `src/game.ts` 或主循环文件）中导入调试工具：

```typescript
import { setupGlobalDebugFunctions } from './engine/debug';

// 在游戏初始化后调用
setupGlobalDebugFunctions(world);
```

2. 打开浏览器开发者工具（F12）
3. 发射一些追踪导弹
4. 在控制台输入：

```javascript
debugMissiles.verify()
```

5. 查看输出结果：

```
🚀 导弹旋转角度验证
共 5 枚导弹

✅ 正确: 5 | ❌ 错误: 0
```

如果有错误的导弹，会显示详细信息：

```
❌ 导弹#123 → 目标#456
  速度方向: -45.0°
  精灵旋转: 45.0°
  期望旋转: 45.0°
  偏差: 0.0°
```

## 方法2：可视化调试层（推荐用于详细观察）

### 使用方法

1. 按照方法1导入调试工具
2. 在控制台输入：

```javascript
debugMissiles.visualize()
```

3. 观察屏幕上的可视化线条：
   - **蓝色线**：导弹的速度方向（导弹实际飞行的方向）
   - **黄色线**：导弹的精灵朝向（考虑了90度偏移）
   - **绿色虚线**：导弹到目标的连线

4. 验证要点：
   - 蓝色线和黄色线应该重合（说明精灵图朝向正确）
   - 绿色虚线应该指向最近的敌人或Boss

5. 清除可视化层：

```javascript
debugMissiles.clear()
```

## 预期结果

### 正确的情况

- ✅ 蓝色线和黄色线重合（偏差<5度）
- ✅ 导弹头朝向飞行方向
- ✅ 导弹平滑转向目标

### 错误的情况

- ❌ 蓝色线和黄色线有明显夹角
- ❌ 导弹保持竖直或水平，不随飞行方向旋转
- ❌ 导弹突然转向或旋转不流畅

## 示例代码

### 完整示例：在开发环境中启用调试

```typescript
// src/game.ts
import { createWorld } from './engine/world';
import { setupGlobalDebugFunctions } from './engine/debug';
import { HomingSystem } from './engine/systems/HomingSystem';

// 创建世界
const world = createWorld();

// 仅在开发环境启用调试
if (import.meta.env.DEV) {
    setupGlobalDebugFunctions(world);
    console.log('🚀 导弹调试已启用，使用 debugMissiles.verify() 验证');
}

// 游戏主循环
function gameLoop(dt: number) {
    // ... 其他系统
    HomingSystem(world, dt);
    // ... 其他系统
}
```

### 手动验证特定场景

```typescript
import { verifyMissileRotation } from './engine/debug';

// 在测试代码中使用
const results = verifyMissileRotation(world);

// 验证所有导弹的旋转都正确
const allCorrect = results.every(r => r.isCorrect);
if (!allCorrect) {
    console.error('发现旋转错误的导弹！', results);
}
```

## 性能说明

- `debugMissiles.verify()` - 性能开销很小，可以在每帧调用
- `debugMissiles.visualize()` - 每帧调用会创建新的canvas，建议仅在调试时使用
- 建议在开发环境使用，生产环境禁用

## 故障排除

### 问题：控制台显示 "debugMissiles is not defined"

**解决**：确保已调用 `setupGlobalDebugFunctions(world)`

### 问题：可视化层不显示

**解决**：
1. 确保有导弹实体存在
2. 检查canvas的z-index是否被其他元素覆盖
3. 尝试手动设置canvas样式：

```javascript
const canvas = document.querySelector('canvas');
if (canvas) {
    canvas.style.zIndex = '10000';
}
```

### 问题：所有导弹都显示错误

**可能原因**：
1. HomingSystem未正确执行
2. Transform组件的rot值未更新
3. 速度为0（无法计算角度）

**调试步骤**：
1. 检查HomingSystem是否在游戏循环中调用
2. 检查missile的Velocity组件是否有效值
3. 检查missile的Transform组件是否正确更新

## 相关文件

- 实现文件：[src/engine/debug/HomingMissileVisualizer.ts](../../src/engine/debug/HomingMissileVisualizer.ts)
- 测试文件：[tests/systems/HomingSystem.test.ts](../../tests/systems/HomingSystem.test.ts)
- 系统实现：[src/engine/systems/HomingSystem.ts](../../src/engine/systems/HomingSystem.ts)

## 反馈

如果发现视觉验证工具有问题，或有改进建议，请提交Issue。
