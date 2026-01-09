# Project Context

## Purpose
霓电战记 (Neon Raiden) 是一款赛博朋克风格的动作射击游戏，具有霓虹美学特色。项目采用 Web 技术栈构建，支持 PWA（渐进式 Web 应用），可在移动设备和桌面端运行。游戏核心玩法包括：弹幕射击、武器收集、Boss 战斗、连击系统和成长机制。

## Tech Stack
- **前端框架**: React 19.2.0 + TypeScript 5.8.2
- **构建工具**: Vite 6.2.0 + @vitejs/plugin-react
- **样式框架**: TailwindCSS 4.1.17 + @tailwindcss/vite
- **游戏引擎**: 自研 ECS (Entity Component System) 架构引擎
- **状态管理**: RxJS 7.8.2 (响应式编程)
- **渲染**: Canvas 2D API
- **音频**: Web Audio API
- **测试框架**: Jest 30.2.0 + ts-jest
- **PWA**: vite-plugin-pwa (支持离线访问)
- **包管理**: pnpm (项目使用 pnpm 作为包管理器)

## Project Conventions

### Code Style
- **语言**: 所有代码注释、文档和对话必须使用简体中文
- **模块系统**: 使用 ES Modules (`import/export`)，禁用 CommonJS (`require`)
- **TypeScript**: 严格类型检查，使用 `tsconfig.json` 配置
- **命名约定**: 
  - 组件类使用 PascalCase (如 `Transform`, `Health`)
  - 系统函数使用 PascalCase + System 后缀 (如 `InputSystem`, `RenderSystem`)
  - 变量和函数使用 camelCase
  - 常量使用 UPPER_SNAKE_CASE
- **文件组织**: 
  - `src/engine/` - 游戏引擎核心代码
  - `src/ui/` - React UI 组件
  - `src/engine/systems/` - ECS 系统逻辑
  - `src/engine/components/` - ECS 组件定义
  - `src/engine/configs/` - 游戏配置数据

### Architecture Patterns
- **ECS 架构**: 采用 Entity Component System 模式，实体仅作为 ID 容器，组件存储数据，系统处理逻辑
- **系统管道**: 游戏循环按 7 个阶段顺序执行 22 个系统，确保逻辑确定性
- **响应式编程**: 使用 RxJS BehaviorSubject 管理游戏状态快照
- **事件驱动**: 系统间通过事件队列解耦，避免直接依赖
- **配置驱动**: 游戏数值、武器属性、敌人配置等通过 JSON/TS 配置文件管理

### Testing Strategy
- **测试框架**: Jest + ts-jest，支持 TypeScript
- **测试环境**: jsdom (DOM 测试) + Node.js (引擎逻辑测试)
- **测试目录**: `tests/` 目录，使用 `@/` 路径别名
- **测试类型**: 
  - 单元测试：测试单个系统和组件
  - 集成测试：测试系统间交互
  - 快照测试：验证游戏状态序列化
- **脚本**: `npm test`, `npm run test:watch`, `npm run test:coverage`

### Git Workflow
- **分支策略**: Git Flow (main/develop/feature branches)
- **提交规范**: 约定式提交 (Conventional Commits)，使用中文描述
- **提交格式**: `feat(scope): 添加新功能`, `fix(scope): 修复问题`, `docs(scope): 更新文档`
- **代码审查**: 所有 PR 必须通过代码审查和测试检查

## Domain Context
### 游戏引擎概念
- **World**: 游戏世界容器，存储所有实体、事件和全局状态
- **Entity**: 游戏对象唯一标识符，通过 ID 引用
- **Component**: 数据容器，如 `Transform`(位置)、`Health`(生命值)、`Weapon`(武器)
- **System**: 逻辑处理器，按固定顺序执行，如 `MovementSystem`(移动)、`CollisionSystem`(碰撞)
- **Blueprint**: 实体创建模板，定义玩家、敌人、武器等初始配置

### 系统执行顺序
游戏循环分为 7 个阶段，共 22 个系统按严格顺序执行：
1. **P1 决策层**: 输入处理、AI 决策、敌人生成
2. **P2 状态层**: Buff 处理、武器协同、数值更新
3. **P3 物理层**: 位置更新和移动
4. **P4 交互层**: 碰撞检测和事件生成
5. **P5 结算层**: 伤害处理、掉落计算、连击系统
6. **P6 表现层**: 相机、特效、音频、渲染
7. **P7 清理层**: 生命周期管理和实体销毁

## Important Constraints
- **性能要求**: 目标 60FPS，单帧处理时间 < 16ms
- **内存限制**: 移动设备内存占用 < 100MB
- **兼容性**: 支持现代浏览器 (Chrome 90+, Safari 14+, Firefox 88+)
- **PWA 限制**: 离线模式功能受限，网络模式支持完整功能
- **Canvas 限制**: 使用 Canvas 2D API，暂不使用 WebGL
- **音频限制**: 使用 Web Audio API，需用户交互后才能播放

## External Dependencies
- **无外部 API**: 游戏完全离线运行，不依赖任何外部服务
- **资源管理**: 所有游戏资源内嵌，支持 PWA 缓存策略
- **构建工具**: 依赖 Vite 生态系统进行开发和构建
- **部署平台**: 支持静态网站托管 (Vercel, Netlify, GitHub Pages)
