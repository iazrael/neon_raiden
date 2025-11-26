## 📋 项目描述

**霓电战记** 是一款基于 React + TypeScript + Vite 构建的高性能网页飞行射击游戏。游戏采用组件化架构，包含 10 个关卡、精彩的 Boss 战、8 种多样武器系统、程序化音效生成和强大的粒子特效。

### 核心特性

- 🎯 **10 个关卡设计**：难度逐级提升，最终 Boss 战
- 🎨 **8 种独特武器**：Vulcan、Laser、Missile、Wave、Plasma、Tesla、Magma、Shuriken
- 🔊 **程序化音效**：动态生成游戏音效，无需外部音频资源
- ✨ **粒子特效系统**：爆炸、冲击波、能量效果
- 📱 **响应式设计**：完美支持 PC 和移动端
- ⚡ **高性能引擎**：基于 Canvas 的优化渲染系统
- 🎮 **多输入支持**：鼠标/触摸控制、键盘操作
- 🛡️ **防护系统**：护盾、护甲、血量管理
- 💣 **强力技能**：炸弹大招系统
- 🌐 **PWA 支持**：离线可用，可安装到主屏

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.x
- **npm** >= 8.x

### 安装步骤

1. **克隆或下载项目**
   ```bash
   cd neon_raiden
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 Gemini API（可选）**
   ```bash
   # 创建 .env.local 文件
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

4. **启动开发服务**
   ```bash
   npm run dev
   ```
   
   然后在浏览器中打开 `http://localhost:5173`

### 构建和部署

**开发环境**
```bash
npm run dev
```

**生产构建**
```bash
npm run build
```

**预览生产构建**
```bash
npm run preview
```

---

## 📁 项目结构

```
neon_raiden/
├── components/           # React UI 组件
│   └── GameUI.tsx       # 游戏界面组件
├── game/                # 游戏核心逻辑
│   ├── systems/         # 游戏系统
│   │   ├── BossSystem.ts        # Boss 管理系统
│   │   ├── EnemySystem.ts       # 敌人生成和管理
│   │   ├── InputSystem.ts       # 输入处理系统
│   │   ├── RenderSystem.ts      # 渲染系统
│   │   └── WeaponSystem.ts      # 武器系统
│   ├── AudioSystem.ts   # 音效系统（程序化生成）
│   ├── GameEngine.ts    # 游戏引擎核心
│   ├── SpriteGenerator.ts # 精灵生成器
│   └── config.ts        # 游戏配置参数
├── public/              # 静态资源
│   ├── manifest.json    # PWA 清单
│   ├── service-worker.js # Service Worker
│   └── splash-screen.html # 启动屏
├── App.tsx              # 应用主入口
├── index.tsx            # React 渲染入口
├── index.html           # HTML 入口
├── types.ts             # TypeScript 类型定义
├── vite.config.ts       # Vite 构建配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目依赖配置
```

---

## 🎮 游戏玩法

### 基本操作

- **移动**：鼠标移动或触摸拖拽（移动端）
- **射击**：自动连续射击
- **炸弹**：空格键或触摸屏幕上方（可重复使用，最多 6 个）
- **开始游戏**：点击或触摸屏幕开始

### 游戏机制

1. **武器升级**：击杀敌人获得分数，达到阈值自动升级武器
2. **Boss 战**：每个关卡结尾战斗一个强力 Boss，击败后进入下一关
3. **能量道具**：击杀敌人掉落武器升级、护盾、炸弹等道具
4. **动态难度**：关卡越高，敌人更多、更强、速度更快
5. **特殊效果**：精英敌人、流星陨石、各种 Boss 攻击模式

### 武器系统

| 武器名称 | 特点 | 升级效果 |
|---------|------|--------|
| **Vulcan** | 平衡型，中等伤害 | 伤害+3、射速加快 |
| **Laser** | 高速激光束，持续伤害 | 伤害+3、范围扩大 |
| **Missile** | 强力导弹，高伤害 | 伤害+6、射速加快 |
| **Wave** | 能量波，宽范围攻击 | 伤害+6、频率提高 |
| **Plasma** | 超强球体，爆炸伤害 | 伤害+25、释放加快 |
| **Tesla** | 电击武器，跳跃伤害 | 伤害+4、射速加快 |
| **Magma** | 岩浆弹，持续落地 | 伤害+2、密度增加 |
| **Shuriken** | 飞镖投掷，多发攻击 | 伤害+3、数量增多 |

---

## 🛠 技术栈

| 类型 | 技术 | 版本 |
|------|------|------|
| **前端框架** | React | ^19.2.0 |
| **语言** | TypeScript | ~5.8.2 |
| **构建工具** | Vite | ^6.2.0 |
| **运行环境** | Node.js | >= 16.x |
| **编辑器插件** | @vitejs/plugin-react | ^5.0.0 |

---

## 🎨 游戏配置参数

关键配置位于 `game/config.ts`：

```typescript
// 玩家配置
PlayerConfig {
  speed: 7,              // 移动速度
  width: 48,             // 玩家宽度
  height: 48,            // 玩家高度
  initialHp: 100,        // 初始血量
  maxHp: 100,            // 最大血量
  initialBombs: 3,       // 初始炸弹数
  maxBombs: 6            // 最大炸弹数
}

// 敌人配置
EnemyConfig {
  baseSpawnRate: 1500,   // 基础生成速率(ms)
  minSpawnRate: 300,     // 最小生成速率
  eliteChance: 0.15      // 精英敌人概率(15%)
}

// Boss 配置
BossConfig[1-10] {       // 10 个 Boss，难度递增
  hp: 1500-15000,        // Boss 血量
  speed: 1.0-2.8,        // Boss 移动速度
  bulletCount: 8-35,     // 子弹数量
  fireRate: 0.03-0.08    // 射击频率
}
```

---

## 🏗 架构设计

### 游戏引擎（GameEngine）

核心游戏循环，管理所有游戏对象和系统：
- **实体管理**：玩家、敌人、子弹、特效
- **系统调度**：输入、渲染、武器、敌人、Boss
- **状态管理**：菜单、游戏进行、游戏结束、胜利
- **物理碰撞**：敌我碰撞检测和伤害计算

### 游戏系统

- **InputSystem**：处理鼠标、触摸和键盘输入
- **RenderSystem**：Canvas 2D 渲染，精灵绘制
- **AudioSystem**：程序化音效生成
- **WeaponSystem**：武器逻辑和子弹生成
- **EnemySystem**：敌人生成、AI 和移动
- **BossSystem**：Boss 逻辑、攻击模式

---

## 📦 PWA 功能

项目已配置为 PWA，支持：
- 📱 安装到主屏幕
- 🔌 离线使用
- ⚡ 缓存资源加速
- 🎭 离线启动屏

配置文件：
- `public/manifest.json` - PWA 清单
- `public/service-worker.js` - 服务工作者
- `vite.config.ts` - PWA 插件配置

---

## 🐛 调试模式

在 `game/config.ts` 中修改：

```typescript
export const GameConfig = {
    debug: true  // 启用调试信息
};
```

启用后会显示：
- FPS 计数
- 实体计数
- 碰撞框
- 游戏参数

---

## 📝 许可证

MIT License

---

## 🤝 贡献

欢迎 Fork 和提交 Pull Request！

## 📧 联系方式

如有问题或建议，欢迎提出 Issue。

---

**祝你游戏愉快！🎮✨**