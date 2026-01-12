# 项目上下文 (Project Context)

## 项目目的
**霓电战记 (Neon Raiden)** - 一款基于 React + TypeScript + Vite 构建的高性能网页飞行射击游戏。游戏包含10个关卡、Boss战、8种多样化武器系统、程序化音效生成和粒子特效。游戏采用赛博朋克美学风格，以霓虹视觉效果为主题。

### 核心特性
- 🎯 **10个关卡设计**：难度逐级提升，最终Boss战
- 🎨 **8种独特武器**：Vulcan（散弹枪）、Laser（激光炮）、Missile（追踪导弹）、Wave（波动炮）、Plasma（等离子炮）、Tesla（电磁炮）、Magma（熔岩弹）、Shuriken（手里剑）
- 🔊 **程序化音效**：动态生成游戏音效，无需外部音频资源
- ✨ **粒子特效系统**：爆炸、冲击波、能量效果
- 📱 **响应式设计**：完美支持PC和移动端，竖屏优先
- ⚡ **高性能引擎**：基于Canvas的优化渲染系统，目标60FPS
- 🎮 **多输入支持**：鼠标/触摸控制、键盘操作
- 🛡️ **防护系统**：护盾、护甲、血量管理
- 💣 **强力技能**：炸弹大招系统
- 🌐 **PWA支持**：离线可用，可安装到主屏

## 技术栈
### 前端框架
- **React 19.2.0**：UI框架，组件化开发
- **TypeScript 5.8.2**：严格类型检查，目标ES2022
- **Vite 6.2.0**：现代化构建工具，快速热更新

### 样式系统
- **TailwindCSS 4.1.17**：实用优先的CSS框架
- **@tailwindcss/vite**：Vite插件集成

### 渲染与音频
- **HTML5 Canvas**：游戏主渲染引擎
- **程序化音频生成**：Web Audio API，零外部音频文件
- **SpriteGenerator**：程序化生成游戏精灵图

### 状态管理
- **RxJS 7.8.1**：响应式事件流处理
- **EventBus**：自定义事件总线系统

### 测试工具
- **Jest 30.2.0**：单元测试框架
- **ts-jest 29.4.5**：TypeScript预处理器
- **jsdom**：DOM环境模拟

### PWA支持
- **vite-plugin-pwa 1.2.0**：离线支持、安装提示
- **Service Worker**：资源缓存与离线运行

### 构建与开发工具
- **Vite dev server**：开发服务器，端口3000
- **vite-plugin-checker**：构建时TypeScript类型检查
- **Sharp**：图片处理工具，用于生成应用图标
- **canvas**：Node.js Canvas实现，用于工具脚本

## 项目约定

### 代码风格
- **严格TypeScript**：
  - 禁止使用`any`类型
  - 启用严格模式检查（`strict: true`）
  - 所有代码必须通过类型检查
- **高内聚低耦合**：
  - 模块化架构，零冗余
  - 每个系统职责单一明确
- **中文文档**：
  - 游戏设计文档使用中文
  - 游戏相关注释使用中文
  - 技术文档（README等）可使用中英双语
- **文件组织**：
  - `/game/` - 核心游戏引擎和系统
    - `/game/engine/` - 引擎核心（EntityManager、CollisionSystem等）
    - `/game/systems/` - 游戏系统（武器、敌人、渲染等）
    - `/game/entities/` - 游戏实体定义
    - `/game/config/` - 游戏配置文件
    - `/game/utils/` - 工具函数
  - `/types/` - TypeScript类型定义
  - `/tests/` - 单元测试
  - `/docs/` - 游戏设计文档
  - `/src/` - React前端组件
- **命名规范**：
  - 类名：PascalCase（如`GameEngine`、`AudioSystem`）
  - 变量/函数：camelCase（如`playerHp`、`spawnEnemy`）
  - 文件名：kebab-case（如`weapon-system.ts`）
  - 常量：UPPER_SNAKE_CASE（如`MAX_WEAPON_LEVEL`）

### 架构模式
- **实体-组件-系统（ECS）**：
  - 基于组件的游戏实体架构
  - 分离数据（组件）与逻辑（系统）
  - 高效的实体管理器
- **系统化设计**：
  - `AudioSystem`：音效生成与播放
  - `InputSystem`：输入处理（触摸、键盘、鼠标）
  - `RenderSystem`：Canvas渲染
  - `WeaponSystem`：武器发射与升级
  - `EnemySystem`：敌人生成与行为
  - `BossSystem`：Boss逻辑
  - `ComboSystem`：连击系统
  - `WeaponSynergySystem`：武器协同
  - `BossPhaseSystem`：Boss阶段管理
  - `DifficultySystem`：动态难度
  - `EliteAISystem`：精英敌人AI
- **事件驱动**：
  - RxJS用于响应式事件处理
  - EventBus用于跨系统通信
  - 游戏状态变化通过回调通知
- **模块化引擎**：
  - `GameEngine`类作为主协调器
  - 各系统独立初始化与更新
  - 清晰的依赖注入模式
- **配置驱动**：
  - 游戏数值集中在`/game/config/`
  - 分模块管理配置（武器、敌人、Boss、道具）
  - 便于平衡调整和版本控制

### 测试策略
- **单元测试**：
  - Jest + ts-jest覆盖所有游戏系统
  - `/tests/unit/systems/` - 系统测试
  - `/tests/unit/entities/` - 实体测试
- **Mock工厂**：
  - `entityFactory` - 创建测试实体
  - `audioMock` - 模拟音频系统
  - 确保测试隔离性
- **测试覆盖**：
  - 核心游戏系统必须有测试
  - 新功能必须包含对应测试
- **测试命令**：
  - `npm test` - 运行所有测试
  - `npm run test:watch` - 监视模式
  - `npm run test:coverage` - 生成覆盖率报告

### Git工作流
- **特性分支**：
  - 主要功能使用独立分支
  - 命名规范：`feature/功能描述`
- **提交约定**：
  - 使用中文提交信息
  - 清晰描述游戏性/系统变更
  - 格式：`功能/系统: 具体描述`
- **文档更新**：
  - 数值变更需更新`GAME_BALANCE_DESIGN.md`
  - 新增功能需更新相关文档
- **测试要求**：
  - 新功能必须包含单元测试
  - 确保所有测试通过后合并

## 领域上下文

### 游戏类型
- **类型**：纵向卷轴射击游戏（STG）
- **视角**：竖屏垂直卷轴
- **控制**：鼠标/触摸跟随，键盘方向键

### 玩家系统
- **生命值（HP）**：基础120，最高140
- **护盾值（Shield）**：基础70，随连击提升上限
- **移动速度**：7像素/帧
- **炸弹储量**：初始3，最高9
- **武器槽位**：最多5种不同武器
- **武器等级**：每个武器最高9级
- **战机等级**：基于得分升级，最高20级

### 武器系统
- **基础武器**：
  - Vulcan（散弹枪）：扇形覆盖，高射速
  - Laser（激光炮）：穿透，长射程
  - Missile（追踪导弹）：自动追踪目标
- **进阶武器**：
  - Wave（波动炮）：宽幅穿透
  - Plasma（等离子炮）：范围爆炸伤害
  - Tesla（电磁炮）：连锁攻击
  - Magma（熔岩弹）：持续灼烧
  - Shuriken（手里剑）：反弹弹道
- **武器升级**：通过道具提升，每级增加伤害和射速
- **武器协同**：特定武器组合触发额外效果

### 敌人系统
- **普通敌人**：11种类型（无人机、飞翼、坦克等）
- **精英敌人**：普通敌人的强化版本，基础概率10%
- **Boss系统**：10个关卡各有独立Boss
- **Boss阶段**：部分Boss根据血量进入不同阶段
- **动态难度**：每15秒评估玩家表现并调整参数

### 游戏进程
- **战机升级**：基于得分升级，每级提升属性
- **武器升级**：收集道具提升武器等级
- **连击系统**：击杀积累连击数，提供伤害和得分加成
- **关卡进度**：完成10个关卡通关
- **解锁系统**：击败敌人/Boss解锁图鉴

### 战斗机制
- **连击系统**：
  - 击杀增加计数，5秒未击杀重置
  - 连击阶梯提供不同奖励
  - 100连击触发"狂暴"状态
- **武器协同**：
  - 合成弹模式：主武器融合副武器特性
  - 轮发模式：ABAB切换射击
  - 7种协同效果（电磁折射、能量共鸣等）
- **血盾转换**：先扣护盾，护盾耗尽后扣血量
- **护盾回复**：特定协同和道具可回复护盾

### 功能优先级（P0-P3）
- **P0（核心）**：基础游戏循环、武器系统、敌人系统、Boss系统
- **P1（优化）**：性能优化、数值平衡、UI改进
- **P2（进阶）**：连击系统、武器协同、Boss阶段系统
- **P3（实验性）**：动态难度、精英AI、环境机制

## 重要约束
- **性能目标**：移动端和桌面端均达到60FPS
- **移动端优先**：
  - 触摸控制优化
  - 响应式布局
  - 竖屏方向锁定
- **无外部资源**：
  - 所有精灵图程序化生成
  - 所有音效程序化合成
  - 零网络依赖
- **浏览器兼容性**：
  - 支持现代浏览器
  - Canvas 2D支持
  - Web Audio API支持
- **PWA要求**：
  - 离线功能完整
  - 可安装到主屏
  - 包大小<10MB
- **类型安全**：
  - 零`any`类型
  - 严格TypeScript合规
  - 构建时类型检查

## 外部依赖
- **无外部游戏资源**：所有精灵图和音频在代码中生成
- **CDN依赖**：无 - 所有依赖本地打包
- **浏览器API**：
  - Canvas 2D - 渲染
  - Web Audio API - 音频
  - Touch Events - 触摸输入
  - Service Worker - PWA缓存
  - localStorage - 存档
- **构建工具**：
  - Vite dev server - 开发服务器
  - Vite PWA - PWA支持
  - Sharp - 图标生成
  - TypeScript编译器 - 类型检查

## 项目结构

### 目录树
```
neon-raiden/
├── game/                      # 游戏引擎核心
│   ├── engine/               # 引擎系统
│   │   ├── EntityManager.ts  # 实体管理器
│   │   ├── CollisionSystem.ts # 碰撞检测
│   │   ├── EventBus.ts       # 事件总线
│   │   ├── FighterFactory.ts # 战机工厂
│   │   └── LevelManager.ts   # 关卡管理
│   ├── systems/              # 游戏系统
│   │   ├── AudioSystem.ts    # 音频系统
│   │   ├── InputSystem.ts    # 输入系统
│   │   ├── RenderSystem.ts   # 渲染系统
│   │   ├── WeaponSystem.ts   # 武器系统
│   │   ├── EnemySystem.ts    # 敌人系统
│   │   ├── BossSystem.ts     # Boss系统
│   │   ├── ComboSystem.ts    # 连击系统
│   │   ├── WeaponSynergySystem.ts # 武器协同
│   │   ├── BossPhaseSystem.ts # Boss阶段
│   │   ├── DifficultySystem.ts # 动态难度
│   │   └── EliteAISystem.ts  # 精英AI
│   ├── entities/             # 游戏实体
│   │   └── Starfighter.ts    # 玩家实体
│   ├── config/               # 配置文件
│   │   ├── game.ts           # 游戏全局配置
│   │   ├── player.ts         # 玩家配置
│   │   ├── weapons/          # 武器配置
│   │   ├── enemies/          # 敌人配置
│   │   ├── bosses/           # Boss配置
│   │   └── powerups/         # 道具配置
│   ├── utils/                # 工具函数
│   │   ├── CombatTag.ts      # 战斗标签
│   │   ├── numbers.ts        # 数值工具
│   │   └── dpsCalculator.ts  # DPS计算
│   ├── GameEngine.ts         # 主游戏引擎
│   ├── SpriteGenerator.ts    # 精灵图生成器
│   ├── AssetsLoader.ts       # 资源加载器
│   ├── version.ts            # 版本管理
│   └── unlockedItems.ts      # 解锁系统
├── src/                       # React前端
│   ├── engine/               # 引擎组件
│   └── [React组件]
├── tests/                     # 测试文件
│   ├── setup.ts              # 测试配置
│   ├── unit/                 # 单元测试
│   │   ├── systems/          # 系统测试
│   │   ├── entities/         # 实体测试
│   │   └── mocks/            # Mock工厂
│   └── [测试结果]
├── docs/                      # 文档
│   ├── GAME_BALANCE_DESIGN.md # 游戏数值设计
│   └── [其他文档]
├── openspec/                  # OpenSpec配置
│   ├── AGENTS.md             # Agent指令
│   └── project.md            # 本文件
├── tools/                     # 工具脚本
│   ├── build-icons.js        # 图标生成
│   └── generate-splash-screens.js
├── types/                     # 类型定义
│   └── [类型文件]
├── vite.config.ts            # Vite配置
├── tsconfig.json             # TypeScript配置
├── jest.config.js            # Jest配置
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 开发命令

### 开发环境
```bash
npm run dev           # 启动开发服务器（端口3000）
npm run build         # 构建生产版本
npm run preview       # 预览生产构建
```

### 测试
```bash
npm test              # 运行所有测试
npm run test:watch    # 监视模式
npm run test:coverage # 生成覆盖率报告
```

### 资源生成
```bash
npm run icons         # 生成应用图标
npm run splash        # 生成启动画面
```

## TypeScript配置要点

### 编译器选项
- **目标**：ES2022
- **模块**：ESNext
- **模块解析**：bundler
- **严格模式**：启用
- **实验性装饰器**：启用
- **路径别名**：`@/*`映射到项目根目录
- **JSX**：react-jsx

### 类型检查规则
- `strict: true` - 严格模式
- `noImplicitAny: true` - 禁止隐式any
- `strictNullChecks: true` - 严格空值检查
- 构建时强制类型检查（vite-plugin-checker）

## 游戏配置层次

### 配置文件组织
1. **game.ts** - 全局游戏配置
   - 最大关卡数
   - 调试模式开关
   - 版本信息

2. **player.ts** - 玩家基础属性
   - 生命值、护盾、速度
   - 升级曲线
   - 等级加成

3. **weapons/** - 武器配置
   - 基础属性（伤害、射速、弹速）
   - 升级配置
   - 子弹配置
   - 视觉效果

4. **enemies/** - 敌人配置
   - 普通敌人属性
   - 生成权重
   - 精英加成

5. **bosses/** - Boss配置
   - Boss属性
   - 生成配置
   - 武器配置
   - 移动模式

6. **powerups/** - 道具配置
   - 道具类型
   - 掉落权重
   - 效果数值
   - 视觉配置

## 关键系统交互流程

### 游戏主循环
```
GameEngine.update(dt)
├── 处理输入
├── 处理时间减缓
├── 更新护盾定时器
├── 更新连击系统
├── 更新玩家移动
├── 处理射击
├── 更新子弹
├── 更新敌人
├── 更新Boss
├── 碰撞检测
├── 粒子更新
└── 清理
```

### 武器协同触发流程
```
子弹命中敌人
├── 计算伤害（含连击加成）
├── 触发协同上下文
├── WeaponSynergySystem尝试触发协同
├── 应用协同效果
│   ├── 连锁闪电
│   ├── 伤害加成
│   ├── 灼烧DOT
│   ├── 护盾回复
│   ├── 无敌
│   ├── 减速场
│   └── 移速提升
└── 执行伤害与击杀判定
```

### 动态难度系统
```
每15秒评估
├── 计算玩家评分
│   ├── HP剩余比例
│   ├── 武器等级
│   └── 连击数
├── 调整难度状态
│   ├── EASY - 降低难度
│   ├── NORMAL - 标准难度
│   └── HARD - 提高难度
├── 应用难度加成
│   ├── 敌人生成间隔
│   ├── 敌人血量/速度
│   ├── 精英概率
│   └── 道具/得分
└── 保底掉落检查
```

## 版本管理

### 版本号规则
- 格式：`major.minor.patch`
- **major**：主版本号（手动维护）
- **minor**：距离2025-01-01的天数
- **patch**：东八区时分（HHMM）

### 版本环境变量
- `__APP_VERSION__` - 完整版本号
- `__APP_VERSION_MAJOR__` - 主版本
- `__APP_VERSION_MINOR__` - 次版本
- `__APP_VERSION_PATCH__` - 补丁版本

### 存档系统
- `neon_raiden_max_level` - 最大到达关卡
- `neon_raiden_unlocked_weapons` - 解锁的武器
- `neon_raiden_unlocked_enemies` - 解锁的敌人
- `neon_raiden_unlocked_bosses` - 解锁的Boss

## 性能优化策略

### 渲染优化
- 精灵图预生成与缓存
- 粒子系统对象池
- 屏幕外渲染（待实现）

### 计算优化
- 碰撞检测空间划分
- 实体过滤（标记删除）
- 时间步长标准化

### 内存优化
- 对象池复用
- 及时清理无效实体
- 配置数据共享引用

## 安全与隐私

### 无用户数据收集
- 不追踪用户行为
- 不上传游戏数据
- 不使用第三方分析

### 本地存储
- 仅使用localStorage
- 无敏感信息
- 清晰的数据结构
