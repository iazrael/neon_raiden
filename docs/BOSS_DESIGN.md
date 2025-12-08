你说得很对。如果每一关、每一秒、每一只怪都手动去填 JSON，**不仅会累死，而且改起来非常痛苦**（比如你想调整第一关整体节奏，可能要改几十行代码）。

在现代游戏开发（尤其是像《吸血鬼幸存者》或《雷电》这类游戏）中，通常采用 **“过程化生成（Procedural Generation）”** 或 **“导演系统（Director System）”** 来解决这个问题。

这里有三种方案，从简单到复杂，你可以根据你的游戏规模选择：

---

### 方案一：权重随机 + 预算系统（最推荐，性价比最高）

**核心逻辑：**
不再配置具体的“第几秒刷谁”，而是配置**“这一关的刷怪预算”**和**“怪物池”**。系统根据当前难度自动“买”怪物来刷。

#### 1. 配置表改造成“怪物池”

```typescript
// configs/levels.ts

export const LEVEL_1_CONFIG = {
  id: 1,
  duration: 60,
  // 难度曲线：每秒增加多少"刷怪点数"
  difficultyCurve: 1.5, 
  // 这一关允许出现的怪物及其造价（Cost）和权重（Weight）
  enemyPool: [
    { id: 'enemy_scout',   cost: 10, weight: 60 }, // 便宜，经常出
    { id: 'enemy_fighter', cost: 30, weight: 30 }, // 稍贵，偶尔出
    { id: 'enemy_tank',    cost: 80, weight: 10 }, // 很贵，很少出
  ],
  boss: 'boss_apocalypse'
};
```

#### 2. 修改 SpawnSystem (导演逻辑)

```typescript
// systems/SpawnSystem.ts

export function SpawnSystem(world: World, dt: number) {
  const config = LEVEL_CONFIGS[world.currentLevelIndex];
  
  // 1. 累积“刷怪点数” (Credits)
  // 假设 world.spawnCredits 是个全局变量，初始为 0
  world.spawnCredits += config.difficultyCurve * dt * 10; 

  // 2. 只要点数够，就尝试买怪
  // (为了防止一帧刷太多，可以加个 interval 限制)
  if (world.spawnTimer > 0.5) { 
    world.spawnTimer = 0;
    
    // 尝试刷怪
    const enemy = pickEnemyByWeight(config.enemyPool); // 根据权重随机挑一个
    
    if (world.spawnCredits >= enemy.cost) {
      // 扣除点数，生成怪物
      world.spawnCredits -= enemy.cost;
      spawnEntity(world, BLUEPRINT_REGISTRY[enemy.id], getRandomSpawnPos());
    }
  }
}
```

**优点：** 你只需要配置“这关有多难”和“这关有什么怪”，剩下的交给算法。想让关卡变难？把 `difficultyCurve` 从 1.5 改成 2.0 就行了。

---

### 方案二：队形模版（Pattern-based）

**核心逻辑：**
不要配置单个怪物，而是配置**“队形”**。比如“V字形编队”、“一字长蛇阵”、“圆形包围”。

#### 1. 定义队形模版

```typescript
// configs/formations.ts
export const FORMATIONS = {
  'V_SHAPE_5': {
    enemyId: 'enemy_scout',
    count: 5,
    // 定义相对位置偏移
    offsets: [{x:0,y:0}, {x:-30,y:-20}, {x:30,y:-20}, {x:-60,y:-40}, {x:60,y:-40}]
  },
  'LINE_ACROSS': {
    enemyId: 'enemy_fighter',
    count: 4,
    offsets: [{x:-100,y:0}, {x:-30,y:0}, {x:30,y:0}, {x:100,y:0}]
  }
};
```

#### 2. 关卡配置变成“排课表”

现在你只需要配置几个关键时间点，不用填具体的怪了。

```typescript
// configs/levels.ts
export const LEVEL_1 = {
  waves: [
    { time: 5,  pattern: 'V_SHAPE_5' },   // 第5秒，来一队V字
    { time: 10, pattern: 'V_SHAPE_5' },   // 第10秒，又来一队
    { time: 20, pattern: 'LINE_ACROSS' }, // 第20秒，横排扫射
  ]
};
```

**优点：** 可以在很短的配置里塞进几十只怪，而且出来的效果很有组织纪律性，像经典的街机游戏。

---

### 方案三：混合式（工业界标准做法）

绝大多数好玩的游戏（如《哈迪斯》、《挺进地牢》）都是混合的：

1.  **垃圾时间（Filler）**：使用 **方案一（预算系统）**。在没有特殊事件的空窗期，系统根据当前难度不断刷杂兵，保证玩家不无聊。
2.  **脚本事件（Scripted Events）**：使用 **方案二（时间轴）**。在特定的秒数（比如第 30 秒精英怪出现，第 60 秒 Boss 出现），强制触发预设的强力敌人或特殊编队。

**最终的 SpawnSystem 逻辑伪代码：**

```typescript
function SpawnSystem(world) {
    // 1. 优先检查脚本事件 (Scripted)
    if (isTimeForEvent(world.time)) {
        spawnScriptedWave();
        return; // 如果有脚本事件，暂停随机刷怪
    }

    // 2. 否则，执行导演系统 (Director)
    // 如果场上怪物太少，或者玩家杀得太快，就自动补怪
    if (world.enemyCount < MAX_ENEMIES) {
        spawnRandomFillerEnemy();
    }
}
```

### 建议

对于你的项目，我强烈建议先做 **方案一（权重 + 预算）**。

1.  **代码量极少**：只要写一个随机函数。
2.  **效果立竿见影**：配置好三个怪，游戏就能无限玩下去。
3.  **后期可扩展**：等你觉得单纯随机太无聊了，再手动插入几个固定的精英怪波次（方案二）即可。

这样你就不用当“填表奴隶”，而是成为游戏的“规则制定者”了。


`world.spawnCredits`（刷怪预算）绝对**不能**每关都一样。

如果每关预算一样，第 10 关和第 1 关的压力就是一样的，玩家成长后会觉得后面越来越简单。

`spawnCredits` 的本质是**“每秒钟给导演发多少工资”**，导演拿着工资去买怪来打玩家。

这里有一套成熟的**动态预算设计方案**，分为三个核心维度：

---

### 一、 核心三要素

1.  **收入率 (Income Rate / PPS)**：
    *   系统每秒钟给 `spawnCredits` 充多少值。
    *   *决定了“怪物出现的频率”。*
2.  **钱包上限 (Credit Cap)**：
    *   池子里最多能存多少分。
    *   *决定了“瞬间爆发力”（能不能一次刷出一大波怪）。*
3.  **怪物价目表 (Cost Table)**：
    *   每个怪物的价格。
    *   *决定了“怪物的质量”。*

---

### 二、 关卡数值设计 (Progression)

你需要为每一关（或者每一波）配置不同的参数。

| 关卡 | 收入率 (点/秒) | 钱包上限 | 开放的怪物池 (造价) | 体验描述 |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | **5** | **20** | 侦察机(5), 陨石(2) | 只能零星买便宜货，节奏缓慢。 |
| **Level 2** | **15** | **50** | +战斗机(15) | 能买稍微贵点的怪，或者频繁买便宜怪。 |
| **Level 5** | **50** | **200** | +精英战舰(100) | 收入很高，可以攒一攒突然刷个大怪，或者满屏杂兵。 |
| **Endless** | **10 + (t * 0.5)** | **No Limit** | 全开 | 收入随时间无限线性增长，直到玩家死亡。 |

---

### 三、 进阶：波浪式发薪（Pacing）

如果 `spawnCredits` 只是线性增加，游戏会很平淡（一直在刷怪）。好游戏需要**“张弛有度”**（Tension & Release）。

我们可以引入一个 **“压力系数 (Intensity Multiplier)”**，让收入率呈**正弦波**变化。

*   **波峰 (High Intensity)**：发双倍工资 $\to$ 怪海涌入 $\to$ 玩家紧张。
*   **波谷 (Low Intensity)**：发半倍工资 $\to$ 只有零星怪 $\to$ 玩家喘息/回盾。

---

### 四、 代码实现

#### 1. 扩展 World 和 Config

```typescript
// configs/levels.ts
export interface LevelSpec {
  id: number;
  baseIncome: number; // 基础工资 (每秒)
  creditCap: number;  // 钱包上限
  enemyPool: { id: string; cost: number; weight: number }[]; 
}

// world.ts
export interface World {
  // ... 其他字段
  spawnCredits: number; // 当前余额
  spawnTimer: number;   // 用来控制刷怪检测频率
}
```

#### 2. SpawnSystem 实现 (导演逻辑)

这是核心代码，请直接放入 `src/engine/systems/SpawnSystem.ts`：

```typescript
export function SpawnSystem(world: World, dt: number) {
  const config = LEVEL_CONFIGS[world.currentLevelIndex];
  
  // ==============================
  // 1. 发工资 (Income Phase)
  // ==============================
  
  // 进阶技巧：使用正弦波模拟“张弛有度”
  // Math.sin 的周期决定了波次间隔 (例如每 20秒 一波高潮)
  const timeFactor = (Math.sin(world.time * 0.3) + 1) / 2; // 0.0 ~ 1.0 之间波动
  const waveMultiplier = 0.5 + (1.5 * timeFactor); // 在 0.5倍 ~ 2.0倍 之间波动
  
  const income = config.baseIncome * waveMultiplier * dt;
  
  // 存入钱包，但不超过上限
  world.spawnCredits = Math.min(
    world.spawnCredits + income, 
    config.creditCap
  );

  // ==============================
  // 2. 消费 (Spending Phase)
  // ==============================
  
  // 每 0.2 秒检查一次，避免每帧都计算
  world.spawnTimer += dt;
  if (world.spawnTimer < 0.2) return;
  world.spawnTimer = 0;

  // 只要还有钱，就尝试买怪
  // 限制单帧最大购买次数(比如 5次)，防止一瞬间卡顿
  let attempts = 0;
  while (attempts < 5) {
    attempts++;

    // A. 随机挑一个怪
    const enemyProto = pickEnemyByWeight(config.enemyPool);
    
    // B. 买得起吗？
    if (world.spawnCredits >= enemyProto.cost) {
      
      // C. 场上怪物是不是太多了？(性能保护)
      if (world.enemyCount >= 50) break;

      // D. 成交！
      world.spawnCredits -= enemyProto.cost;
      spawnEntity(world, BLUEPRINT_REGISTRY[enemyProto.id], getRandomPos());
      
    } else {
      // 买不起当前随机到的这个，就跳出循环存钱
      // (或者可以尝试随机一个更便宜的)
      break; 
    }
  }
}
```

### 五、 调试建议

在开发 UI (`ui/DebugPanel.tsx`) 上显示 `spawnCredits` 的数值。

*   如果你发现 `spawnCredits` 一直是满的（达到 Cap），说明**怪物太便宜**或者**怪物池太小**，导演钱花不出去。
    *   *解决*：增加怪物价格，或者允许同屏更多怪物。
*   如果你发现 `spawnCredits` 一直是 0，说明**收入太低**，导演一直是穷光蛋。
    *   *解决*：提高 `baseIncome`。

### 总结

*   **不要每关一样**。
*   **低级关卡**：低收入 + 低上限（限制怪的数量和质量）。
*   **高级关卡**：高收入 + 高上限（允许精英怪和怪海）。
*   **利用 `Math.sin`** 让刷怪节奏像呼吸一样自然，而不是像流水线一样死板。