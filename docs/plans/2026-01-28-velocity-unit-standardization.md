# Velocity单位统一方案

**日期**: 2026-01-28
**作者**: Claude
**状态**: 设计完成

## 问题概述

当前代码中velocity相关组件的单位使用混乱：
- Velocity组件注释说是"像素/毫秒"，但实际使用"像素/秒"
- MoveIntent使用"像素/毫秒"
- SpeedStat使用"像素/秒"
- BossEntrance使用"像素/秒"
- 存在多处单位转换逻辑（*1000、/1000）

这导致代码难以理解和维护，容易出错。

## 解决方案

采用**渐进式重构**，将所有velocity相关的单位统一为"像素/秒"。

### 为什么选择"像素/秒"？

1. 更符合游戏开发标准
2. 速度值更直观易读（400 vs 0.4）
3. 与现有SpeedStat、BossEntrance组件一致
4. 与物理引擎的标准单位系统一致

## 实施方案（5个阶段）

### 阶段1：文档和注释修正

**目标**：统一所有velocity相关组件的文档注释，明确标注单位为"像素/秒"。

**需要修改的文件**：

1. **[src/engine/components/base.ts](src/engine/components/base.ts)**
   - Velocity组件注释更新：
     - `vx`: "单位像素/毫秒" → "单位像素/秒"
     - `vy`: "单位像素/毫秒" → "单位像素/秒"
     - `vrot`: "单位像素/毫秒" → "单位弧度/秒"

2. **[src/engine/components/movement.ts](src/engine/components/movement.ts)**
   - Knockback组件：添加"单位：像素/秒"说明
   - MoveIntent组件：添加"单位：像素/秒（当type='velocity'时）"说明

3. **[src/engine/systems/MovementSystem.ts](src/engine/systems/MovementSystem.ts)**
   - 删除错误的转换注释

**预期影响**：仅修改文档，不影响运行时行为。

---

### 阶段2：核心转换逻辑修正

**目标**：移除单位转换逻辑，统一使用"像素/秒"。

**需要修改的文件**：

1. **[src/engine/systems/MovementSystem.ts](src/engine/systems/MovementSystem.ts)**

   ```typescript
   // 修改前：
   vx = moveIntent.dx * 1000;
   vy = moveIntent.dy * 1000;

   // 修改后：
   vx = moveIntent.dx;
   vy = moveIntent.dy;
   ```

2. **[src/engine/systems/BossSystem.ts](src/engine/systems/BossSystem.ts)**

   ```typescript
   // 修改前：
   moveIntent.dy = entrance.entranceSpeed / 1000; // 转换为像素/毫秒

   // 修改后：
   moveIntent.dy = entrance.entranceSpeed; // 直接使用像素/秒
   ```

3. **检查其他位置**：
   - 搜索所有创建MoveIntent的地方
   - 确保传入的值已经是"像素/秒"
   - 检查是否有硬编码的速度值需要调整

**预期影响**：
- MoveIntent的dx/dy直接存储"像素/秒"
- 所有单位转换逻辑被移除

---

### 阶段3：测试数据调整

**目标**：更新所有测试中涉及速度的硬编码值。

**需要检查的测试文件**：
- [tests/systems/BossSystem.test.ts](tests/systems/BossSystem.test.ts)
- [tests/integration/BossIntegration.test.ts](tests/integration/BossIntegration.test.ts)
- [tests/systems/BossEntrance.test.ts](tests/systems/BossEntrance.test.ts)
- 其他包含velocity相关测试的文件

**调整原则**：
- 如果速度值像"像素/毫秒"（如0.5, 0.3），乘以1000
- 如果速度值像"像素/秒"（如100, 200, 400），保持不变
- 不确定时查看实际游戏逻辑或组件定义

**预期影响**：测试数值会变大（如果原来按毫秒写的）。

---

### 阶段4：验证和调优

**目标**：运行测试并修复问题，验证游戏中的移动速度。

**验证步骤**：

1. 运行测试：`npm test`
2. 如果测试失败，检查并修复
3. 启动游戏，测试：
   - 玩家移动速度
   - Boss入场速度
   - 敌人移动速度
   - 子弹速度
4. 速度调优（如果需要）：
   - SpeedStat的maxLinear默认值（[base.ts:70](src/engine/components/base.ts#L70)）
   - Boss的SpeedStat（[factory.ts:122](src/engine/factory.ts#L122)）
   - BossEntrance的entranceSpeed（[factory.ts:129](src/engine/factory.ts#L129)）

**可能的调整**：
- Boss入场速度：从50调整到合理值
- 玩家最大速度：从400调整到合理值

---

### 阶段5：文档更新

**目标**：记录单位标准，防止未来再次混淆。

**需要创建/更新的文档**：

1. **本文档**：记录完整的修改清单和验证记录

2. **更新[docs/designs/GAME_DESIGN.md](docs/designs/GAME_DESIGN.md)**（如果存在）
   - 在物理系统部分添加单位说明
   - 列出标准速度值参考：
     - 玩家最大速度：400像素/秒
     - Boss最大速度：120像素/秒
     - Boss入场速度：50-150像素/秒

3. **更新[src/engine/README.md](src/engine/README.md)**
   - 添加velocity相关组件的单位标准
   - 强调Velocity、MoveIntent、SpeedStat、Knockback的单位

4. **代码注释最佳实践**：
   ```typescript
   /** X轴速度（像素/秒） */
   vx: number;
   ```

---

## 风险评估

### 潜在风险

1. **速度值调整的风险**
   - 删除转换后，速度可能变快1000倍或变慢1000倍
   - 需要仔细检查所有硬编码的速度值
   - 可能需要大量调优工作

2. **测试覆盖不足的风险**
   - 某些场景可能没有测试覆盖
   - 建议每次修改后都手动测试游戏

3. **遗漏转换点的风险**
   - 可能有其他地方也在做单位转换
   - 建议全面搜索velocity相关代码

### 缓解措施

1. 在分支上进行所有修改
2. 每个阶段完成后运行测试
3. 最后进行游戏实际测试
4. 确认无误后再合并到主分支

---

## 标准化规范

**单位标准**：
- 所有velocity相关字段：**像素/秒**
- dt参数：**毫秒**（在物理计算时转换为秒）

**注释格式**：
```typescript
/** X轴速度（像素/秒） */
vx: number;
```

**不包含在本次改动中的内容**：
- dt参数的单位（保持毫秒）
- 时间相关的组件（如DamageOverTime的remaining、interval）
- 这些时间相关的单位保持毫秒是合理的

---

## 实施检查清单

### 阶段1：文档和注释修正
- [ ] 更新[base.ts](src/engine/components/base.ts)中Velocity组件的注释
- [ ] 更新[movement.ts](src/engine/components/movement.ts)中Knockback组件的注释
- [ ] 更新[movement.ts](src/engine/components/movement.ts)中MoveIntent组件的注释
- [ ] 更新[MovementSystem.ts](src/engine/systems/MovementSystem.ts)中的注释

### 阶段2：核心转换逻辑修正
- [ ] 修改[MovementSystem.ts](src/engine/systems/MovementSystem.ts)删除*1000转换
- [ ] 修改[BossSystem.ts](src/engine/systems/BossSystem.ts)删除/1000转换
- [ ] 搜索并检查所有创建MoveIntent的地方
- [ ] 确保没有遗漏其他转换逻辑

### 阶段3：测试数据调整
- [ ] 检查并更新[BossSystem.test.ts](tests/systems/BossSystem.test.ts)
- [ ] 检查并更新[BossIntegration.test.ts](tests/integration/BossIntegration.test.ts)
- [ ] 检查并更新[BossEntrance.test.ts](tests/systems/BossEntrance.test.ts)
- [ ] 检查其他velocity相关测试

### 阶段4：验证和调优
- [ ] 运行`npm test`
- [ ] 修复所有失败的测试
- [ ] 启动游戏测试玩家移动
- [ ] 测试Boss入场速度
- [ ] 测试敌人和子弹速度
- [ ] 调整速度配置（如果需要）

### 阶段5：文档更新
- [ ] 更新[GAME_DESIGN.md](docs/designs/GAME_DESIGN.md)
- [ ] 更新[README.md](src/engine/README.md)
- [ ] 代码注释符合最佳实践

---

## 修改前后对比

### Velocity组件
```typescript
// 修改前
/** X轴速度, 单位像素/毫秒 */
vx: number;

// 修改后
/** X轴速度（像素/秒） */
vx: number;
```

### MoveIntent使用
```typescript
// 修改前
new MoveIntent({ dx: 0.5, dy: 0.3, type: 'velocity' }) // 0.5像素/毫秒 = 500像素/秒

// 修改后
new MoveIntent({ dx: 500, dy: 300, type: 'velocity' }) // 直接使用像素/秒
```

### MovementSystem转换逻辑
```typescript
// 修改前
vx = moveIntent.dx * 1000; // 像素/毫秒 → 像素/秒

// 修改后
vx = moveIntent.dx; // 直接使用像素/秒
```

---

## 记录

**创建日期**: 2026-01-28
**最后更新**: 2026-01-28
**状态**: 待实施

**变更历史**：
- 2026-01-28: 创建设计文档
