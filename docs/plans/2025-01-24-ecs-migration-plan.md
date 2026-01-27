# ECS 架构迁移计划

## 当前状态分析

### 新 ECS 架构 (`src/engine/`)
已完成 Phase 0-8：
- ✅ **核心系统**: World, Component, Entity, Event
- ✅ **P1 决策层**: InputSystem, DifficultySystem, SpawnSystem, BossPhaseSystem, BossSystem, EnemySystem, AISteerSystem
- ✅ **P2 状态层**: BuffSystem, WeaponSynergySystem, WeaponSystem, SpecialWeaponSystem (新增)
- ✅ **P3 物理层**: MovementSystem
- ✅ **P4 交互层**: CollisionSystem
- ✅ **P5 结算层**: PickupSystem, DamageResolutionSystem, LootSystem, ComboSystem
- ✅ **P7 表现层**: CameraSystem, EffectPlayer, AudioSystem, RenderSystem
- ✅ **P8 清理层**: LifetimeSystem, CleanupSystem

**总计**: 23 个系统，199 个测试全部通过

### 旧代码库 (`game/`)
仍被 App.tsx 使用：
- `GameEngine.ts` - 主游戏引擎类
- `AssetsLoader.ts` - 资源加载器
- `SpriteGenerator.ts` - 精灵生成器
- `systems/` - 旧的系统实现（与 ECS 系统功能重叠）
- `config/` - 游戏配置（武器、敌人、Boss、掉落等）
- `unlockedItems.ts` - 解锁状态管理

### React UI 层
- ✅ `App.tsx` - 已迁移使用 `ReactEngine`
- ✅ `GameUI.tsx` - 绑定到新引擎的回调
- `Gallery.tsx` - 依赖 `game/config` 和 `game/unlockedItems` (保留)

---

## 迁移策略

### 原则
1. **渐进式迁移** - 分阶段进行，每阶段保证功能完整可测试
2. **保留配置层** - `game/config/` 配置保持不变，新 ECS 系统适配现有配置
3. **最小侵入** - UI 组件改动最小化
4. **向后兼容** - 提供适配层确保过渡平滑

### 阶段划分

#### 阶段 0: 准备工作 ✅ (已完成)
- 创建 ECS 基础架构
- 实现所有核心系统
- 编写单元测试

#### 阶段 1: 创建 React 适配层 ✅ (已完成)
**目标**: 创建一个适配器，让 React 可以使用新的 ECS 引擎

**任务**:
1. ✅ 创建 `src/engine/ReactEngine.ts`
   - 包装 `Engine` 类
   - 提供 React 兼容的接口 (callbacks, state)
   - 管理游戏生命周期 (start/pause/resume/stop)

2. ✅ 创建 `src/engine/SpriteRenderer.ts`
   - 处理 SVG 精灵渲染
   - 适配现有的 SpriteGenerator

3. ✅ 更新类型定义
   - 确保 `src/engine/types/` 与 `types/` 兼容

**验收标准**:
- [x] ReactEngine 可以被 App.tsx 导入使用
- [x] 游戏可以启动、暂停、恢复、停止
- [x] 基本的玩家移动和射击功能正常

#### 阶段 2: UI 层适配 ✅ (已完成)
**目标**: 更新 App.tsx 和 GameUI.tsx 使用新引擎

**任务**:
1. ✅ 更新 `App.tsx`
   - 替换 `GameEngine` → `ReactEngine`
   - 更新导入路径
   - 调整回调接口

2. ✅ 更新 `GameUI.tsx`
   - 确保所有 props 与新引擎兼容
   - 测试所有 UI 状态同步

**验收标准**:
- [x] 所有 UI 功能正常显示
- [x] HUD 信息正确更新
- [x] 菜单导航正常工作
- [x] Gallery 可以正常打开/关闭

#### 阶段 3: 功能验证与补充 ✅ (已完成)
**目标**: 确保所有游戏功能在新架构下正常工作

**任务**:
1. ✅ 对比旧功能，补充缺失的系统
   - ✅ SpecialWeaponSystem (特殊武器效果: Tesla 链式、Missile 追踪)
   - ✅ InputManager 初始化修复
   - ✅ 武器蓝图类型兼容性修复

2. ✅ 完善渲染系统
   - ✅ 支持 SVG 精灵渲染
   - ✅ 改进纹理图像获取逻辑

3. ✅ 完善音频系统
   - ✅ 音频系统框架已完成
   - ⏳ 需要添加实际音频资源文件

**验收标准**:
- [x] 所有武器类型正常工作
- [x] 敌人 AI 行为正确
- [x] Boss 战斗流程完整
- [x] 特效系统正常 (音频资源待添加)

#### 阶段 4: 清理与优化
**目标**: 移除旧代码，优化性能

**任务**:
1. 删除旧的 `game/` 目录中已迁移的文件
2. 保留 `game/config/` 和必要的工具文件
3. 性能优化
4. 完善文档

**验收标准**:
- [ ] 代码库结构清晰
- [ ] 没有冗余代码
- [ ] 性能达到目标 (60fps)
- [ ] 文档完整

---

## 接口设计

### ReactEngine 接口草案
```typescript
export class ReactEngine {
    // 游戏状态
    state: GameState;
    score: number;
    level: number;
    
    // 回调函数
    onScoreChange: (score: number) => void;
    onLevelChange: (level: number) => void;
    onStateChange: (state: GameState) => void;
    onHpChange: (hp: number) => void;
    // ... 其他 UI 回调
    
    // 生命周期方法
    start(canvas: HTMLCanvasElement, blueprint: Blueprint): void;
    pause(): void;
    resume(): void;
    stop(): void;
    
    // 游戏操作
    triggerBomb(x?: number, y?: number): void;
    
    // 内部方法
    private loop(): void;
    private framePipeline(): void;
}
```

---

## 风险与依赖

### 高风险项
1. **渲染系统差异** - 新 ECS 使用简化渲染，需要适配现有的 SVG 精灵系统
2. **状态同步** - 确保 World 状态正确反映到 UI
3. **性能** - ECS 框架可能有性能开销，需要优化

### 依赖关系
- Gallery 组件依赖 `game/config` → 保留不变
- UI 组件依赖新引擎回调 → 阶段 2 处理
- 测试依赖 mock → 需要更新测试工具

---

## 时间线预估
- 阶段 1: 2-3 天
- 阶段 2: 1-2 天
- 阶段 3: 3-4 天
- 阶段 4: 1-2 天

**总计**: 约 1-2 周

