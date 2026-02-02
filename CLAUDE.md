# 🎮 游戏引擎开发规范 (ECS 架构)

本文件是项目的核心治理准则，AI 在进行代码生成、重构或修复时必须严格遵守。

## 🏗 核心架构：ECS 模式

所有逻辑必须解耦，严格按照以下目录结构组织代码：

| 模块 | 路径 | 职责描述 |
| --- | --- | --- |
| **Blueprints** | `src/engine/blueprints` | **蓝图**: 定义实体的初始配置与组件组合。 |
| **Components** | `src/engine/components` | **组件**: 仅存放数据结构（Interfaces/Types），禁止包含逻辑。 |
| **Systems** | `src/engine/systems` | **系统**: **纯函数**，负责处理逻辑与状态变更，输入通常为组件数据。 |
| **Configs** | `src/engine/configs` | **配置**: 存放游戏数值、常量与静态配置表。 |
| **World/Utils** | `src/engine/world.ts` | **世界/工具**: 包含 `view` 函数、实体查询及其他公共工具方法。 |


## 🛠 开发与质量约束

### 1. 目录隔离

* **【新代码区】**：`./src/` 是当前唯一合法的开发目录。
* **【废弃参考区】**：`./game/` 为旧版代码（如旧 `RenderSystem`），仅用于逻辑参考，**禁止**修改或在此增加功能。

### 2. 类型与单位规范

* **类型安全**：全项目禁止使用 `any`。必须明确定义类型，优先使用可组合的 Interface。
* **时间单位**：所有时间相关的变量、参数与计算统一使用 **毫秒 (ms)**。变量名建议以 `ms` 结尾（如 `durationMs`）。

### 3. 注释规范 (JSDoc)

所有新编写的代码必须包含清晰的注释：

* **Systems**: 每个系统函数必须说明其负责处理的组件类型、逻辑目的及任何副作用。
* **Components**: 说明每个字段的含义及数值范围。
* **示例**:
```typescript
/**
 * 处理移动逻辑的系统
 * @param world 世界对象, 持有状态数据和Components和Events
 * @param deltaTimeMs - 增量时间（毫秒）
 */
export function MovementSystem(world: World, deltaTimeMs: number) { ... }

```


### 4. 测试要求

* **测试目录**：所有测试用例统一存放于 `./tests` 目录。
* **强制通过**：需求完成后，必须执行并确保 `pnpm test` **全部通过**。若引入新功能，需在 `./tests` 下增加相应的单元测试。

