# Neon Raiden - AI 开发规范

> 本文件定义项目特有的约束，避免 AI 犯常见错误。

## 项目概述

浏览器弹幕射击游戏，基于 ECS 架构，使用 TypeScript + React + Canvas。

## 常用命令

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 生产构建
pnpm lint     # 类型检查
pnpm test     # 运行测试
```

## 验收标准

所有改动必须通过：`pnpm lint && pnpm test && pnpm build`

---

## 🚨 核心约束（必须遵守）

### 目录隔离

- **`./src/`** - 唯一合法的开发目录
- **`./game/`** - 废弃参考区，仅可阅读参考，**禁止修改**

> 原因：`./game/` 是旧版代码遗留，修改会导致不可预期的行为。

### ECS 架构规则

| 目录 | 约束 |
|------|------|
| `components/` | **仅数据结构**，禁止逻辑代码 |
| `systems/` | **纯函数**，输入组件数据，输出状态变更 |
| `events.ts` | 事件**必须在本帧内消费**，禁止跨帧传递 |

> 原因：ECS 模式的核心优势在于数据与逻辑分离，违反会导致难以追踪的 bug。

### 类型与单位

- **禁止 `any`** - 必须明确定义类型（历史教训：隐式 any 曾导致生产 bug）
- **时间单位**：统一使用**毫秒 (ms)**，变量名建议以 `ms` 结尾
- **速度单位**：统一使用 **像素/秒**，便于跨帧计算

---

## ⚠️ 常见陷阱

1. **事件跨帧传递** - 事件必须在生成帧内消费，否则会丢失或导致状态不一致
2. **在 Components 中写逻辑** - Components 应该只是数据接口定义
3. **修改 `./game/` 目录** - 这是只读参考区
4. **忘记写测试** - 新功能必须配套单元测试

---

## 📝 代码风格

### JSDoc 要求

Systems 和 Components 必须有注释说明职责：

```typescript
/**
 * 处理移动逻辑的系统
 * @param world 世界对象
 * @param deltaTimeMs 增量时间（毫秒）
 */
export function MovementSystem(world: World, deltaTimeMs: number) { ... }
```

### 测试

- 测试文件放 `./tests` 目录
- 新功能必须配套单元测试


