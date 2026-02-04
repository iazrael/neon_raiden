# 关卡UI动画表现分析

> 基于旧版代码（`game/` 和 `components/`）的UI动画完整分析
> 分析日期：2026-02-04

---

## 📋 目录

1. [动画系统架构](#动画系统架构)
2. [关卡开始动画](#关卡开始动画)
3. [关卡过渡动画](#关卡过渡动画)
4. [Boss警告动画](#boss警告动画)
5. [Boss击败动画](#boss击败动画)
6. [玩家状态动画](#玩家状态动画)
7. [Boss状态动画](#boss状态动画)
8. [特效动画汇总](#特效动画汇总)
9. [动画触发流程图](#动画触发流程图)

---

## 🎨 动画系统架构

### 渲染层次

```
┌─────────────────────────────────────────┐
│  React UI层 (components/GameUI.tsx)    │  ← HTML/CSS动画
│  - HUD、覆盖层、菜单                      │
├─────────────────────────────────────────┤
│  Canvas渲染层 (RenderSystem.ts)        │  ← Canvas绘制动画
│  - 游戏实体、粒子、特效                    │
├─────────────────────────────────────────┤
│  游戏逻辑层 (GameEngine.ts)             │  ← 状态管理
│  - 动画计时器、标志位、触发条件             │
└─────────────────────────────────────────┘
```

### 状态传递流程

```
GameEngine (状态源)
    ↓ 回调函数
React 组件 (props)
    ↓ CSS/Canvas
用户看到的动画
```

**关键状态标志**：
- `showLevelTransition` - 关卡过渡显示
- `levelTransitionTimer` - 过渡动画计时器
- `isBossWarningActive` - Boss警告激活
- `showBossDefeatAnimation` - Boss击败动画
- `bossDefeatTimer` - 击败动画倒计时

---

## 🚀 关卡开始动画

### 第一关初始化流程

**触发位置**：`GameEngine.startGame()`

```typescript
// game/GameEngine.ts:218-282
startGame() {
    this.player = this.createPlayer();
    this.state = GameState.PLAYING;
    this.level = 1;
    this.score = 0;
    this.weaponLevel = 1;

    // 重置所有动画标志
    this.showLevelTransition = false;
    this.isBossWarningActive = false;
    this.showBossDefeatAnimation = false;
    this.bossDefeatTimer = 0;

    // 通知UI
    this.onStateChange(this.state);
    this.onScoreChange(this.score);
    this.onLevelChange(this.level);
}
```

**特点**：
- ❌ **无特殊动画**：第一关开始时没有专门的动画效果
- ✅ **HUD直接显示**：分数、关卡、血条直接出现
- ⚠️ **潜在改进点**：可添加"STAGE I"淡入动画增强体验

---

## 🔄 关卡过渡动画

### 动画触发

**触发时机**：Boss击败后3秒，进入下一关时

```typescript
// game/GameEngine.ts:934-936
// 显示关卡过渡UI
this.showLevelTransition = true;
this.levelTransitionTimer = 0;
this.isLevelTransitioning = false;
```

### UI层渲染 (React)

**位置**：`components/GameUI.tsx:502-518`

```tsx
{/* Level Transition Overlay - Top Left */}
{showLevelTransition && (
  <div
    className="absolute top-8 left-4 pointer-events-none z-50"
    style={{
      opacity:
        levelTransitionTimer < 300
          ? levelTransitionTimer / 300          // 淡入 (0-300ms)
          : levelTransitionTimer > 1200
            ? (1500 - levelTransitionTimer) / 300  // 淡出 (1200-1500ms)
            : 1,                                 // 完全显示 (300-1200ms)
    }}
  >
    <div className="text-2xl font-bold text-cyan-400 tracking-wider
                drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
      STAGE {intToRoman(level)}
    </div>
  </div>
)}
```

### 动画时间线

```
0ms      - showLevelTransition = true
          关卡数字 "STAGE II" 出现在左上角
          opacity = 0 (完全透明)

0-300ms  ━━━━━━━━━━━━━━━━━━━━ 淡入阶段
          opacity: 0 → 1

300-1200ms ━━━━━━━━━━━━━━━━━━━ 完全显示
          opacity: 1 (稳定)

1200-1500ms ━━━━━━━━━━━━━━━━━ 淡出阶段
          opacity: 1 → 0

1500ms   - showLevelTransition = false
          动画结束，UI层隐藏
```

**总时长**：1.5秒

**视觉样式**：
- **位置**：左上角 (`top-8 left-4`)
- **颜色**：青色 (`text-cyan-400`)
- **字体**：粗体、等宽、宽字距 (`font-bold tracking-wider`)
- **特效**：发光阴影 (`drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]`)
- **罗马数字**：使用 `intToRoman(level)` 转换 (I, II, III, ...)

### Canvas层逻辑

**位置**：`GameEngine.ts:394-400`

```typescript
// Level transition UI
if (this.showLevelTransition) {
    this.levelTransitionTimer += dt;
    if (this.levelTransitionTimer > 1500) { // 1500ms后关闭
        this.showLevelTransition = false;
        this.levelTransitionTimer = 0;
    }
}
```

---

## ⚠️ Boss警告动画

### 动画触发

**触发时机**：Boss刷新条件满足时（进度≥90% 且 时间≥60秒）

```typescript
// game/GameEngine.ts:535-542
if (this.levelProgress >= minProgress && levelDuration >= minDuration
    && !this.isLevelTransitioning) {
    if (!this.isBossWarningActive) {
        this.isBossWarningActive = true;
        this.bossWarningTimer = 3000;  // 警告持续3秒
        this.onBossWarning(true);
        this.audio.playWarning();
        // 立即生成Boss（警告是并行的）
        this.spawnBoss();
    }
}
```

**特点**：
- ⚡ **警告与生成并行**：Boss在警告显示的同时开始进入
- 🔊 **音频提示**：播放警告音效 `playWarning()`
- 📢 **UI回调**：通过 `onBossWarning(true)` 通知React层

### UI层渲染 (React)

**位置**：`components/GameUI.tsx:520-540`

```tsx
{/* Boss Warning Overlay */}
{showBossWarning && state === GameState.PLAYING && (
  <div
    className="absolute inset-0 pointer-events-none z-50
               flex items-center justify-center"
    style={{
      animation: 'bossWarningFlash 0.5s ease-in-out infinite'
    }}
  >
    {/* CSS动画定义 */}
    <style>{`
      @keyframes bossWarningFlash {
        0%, 100% { background-color: rgba(220, 38, 38, 0); }
        50% { background-color: rgba(220, 38, 38, 0.3); }
      }
    `}</style>

    <div className="text-center">
      <div className="text-6xl md:text-8xl font-black text-red-500
                  tracking-widest
                  drop-shadow-[0_0_30px_rgba(220,38,38,1)]
                  animate-pulse">
        ⚠️ <br />
        WARNING
      </div>
    </div>
  </div>
)}
```

### 动画效果

#### 1. 全屏红色闪烁 (bossWarningFlash)

```
0ms      - background-color: rgba(220, 38, 38, 0)  透明
250ms    - background-color: rgba(220, 38, 38, 0.3) 30%红色
500ms    - background-color: rgba(220, 38, 38, 0)  透明
循环 - 每0.5秒闪烁一次
```

#### 2. WARNING文字脉冲 (animate-pulse)

```
使用Tailwind的animate-pulse类
opacity在1和0.5之间循环变化
```

#### 3. 阴影发光

```
drop-shadow-[0_0_30px_rgba(220,38,38,1)]
- 30px的红色发光阴影
- 增强视觉冲击力
```

### 动画时间线

```
T=0ms        - Boss刷新条件满足
              isBossWarningActive = true
              showBossWarning = true
              playWarning() 音效
              spawnBoss() Boss开始进入

T=0-3000ms   ━━━━━━━━━━━━━━━━━━━━━━ 警告显示
              全屏红色闪烁 (0.5s周期)
              WARNING文字脉冲
              Boss从屏幕上方进入 (y: -150 → 150)

T=3000ms     - bossWarningTimer = 0
              isBossWarningActive = false
              showBossWarning = false
              Boss到达战斗位置，开始战斗
```

**总时长**：3秒

### Canvas层逻辑

**位置**：`GameEngine.ts:570-576`

```typescript
// Handle boss warning timer countdown
if (this.isBossWarningActive) {
    this.bossWarningTimer -= dt;
    if (this.bossWarningTimer <= 0) {
        this.isBossWarningActive = false;
        this.onBossWarning(false);
    }
}
```

---

## 💥 Boss击败动画

### 动画触发

**触发时机**：Boss血量≤0时

```typescript
// game/GameEngine.ts:871-943
killBoss() {
    // 1. 视觉效果
    this.createExplosion(bx, by, ExplosionSize.LARGE, '#ffffff');
    this.addShockwave(bx, by);
    this.screenShake = 30;  // 强烈震动

    // 2. 连环爆炸（15次，每次间隔100ms）
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            this.createExplosion(
                bx + (Math.random() - 0.5) * 150,
                by + (Math.random() - 0.5) * 150,
                ExplosionSize.LARGE, '#fff'
            );
        }, i * 100);
    }

    // 3. 音效
    this.audio.playExplosion(ExplosionSize.LARGE);
    this.audio.playBossDefeat();  // 胜利号角

    // 4. UI动画标志
    this.showBossDefeatAnimation = true;
    this.bossDefeatTimer = 3000;  // 显示3秒
}
```

### Canvas层渲染 (DEFEATED文字)

**位置**：`RenderSystem.ts:384-404`

```typescript
// Draw Boss Defeat Animation
if (showBossDefeatAnimation) {
    this.ctx.save();

    // 淡出效果：根据剩余时间计算透明度
    const alpha = Math.min(1, bossDefeatTimer / 1000);
    this.ctx.globalAlpha = alpha;

    // 文字样式
    this.ctx.fillStyle = '#ffd700'; // 金色
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = '#ffaa00';
    this.ctx.shadowBlur = 20;

    // 缩放效果
    const scale = 1 + Math.sin(Date.now() / 200) * 0.1;  // ±10%缩放
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(scale, scale);

    this.ctx.fillText('DEFEATED', 0, 0);
    this.ctx.restore();
}
```

### 动画效果

#### 1. DEFEATED文字缩放

```
scale = 1 + Math.sin(Date.now() / 200) * 0.1

0ms    - scale = 1.0
100ms  - scale = 1.1 (放大)
200ms  - scale = 1.0 (恢复)
300ms  - scale = 0.9 (缩小)
400ms  - scale = 1.0 (恢复)
循环 - 每200ms一个周期
```

#### 2. 透明度渐变

```
3000ms → alpha = 1.0 (完全显示)
2000ms → alpha = 1.0
1000ms → alpha = 1.0
0ms    → alpha = 0.0 (完全消失)
```

### 连环爆炸效果

```
T=0ms      - 中心爆炸 (最大爆炸)
            生成30个粒子，向外扩散
            Shockwave扩撒圈

T=100ms    - 第1次随机爆炸
            位置：Boss中心 ±75px 范围内随机

T=200ms    - 第2次随机爆炸
            位置：Boss中心 ±75px 范围内随机

...持续到 1500ms，共15次爆炸

T=3000ms   - 关卡切换到下一关
            showLevelTransition = true
```

### 屏幕震动

```typescript
// RenderSystem.ts:95-99
if (screenShake > 0) {
    const sx = (Math.random() - 0.5) * screenShake;
    const sy = (Math.random() - 0.5) * screenShake;
    this.ctx.translate(sx, sy);
}
```

**震动参数**：
- `screenShake = 30`：最大30px的随机偏移
- 每帧衰减：`screenShake *= 0.9`
- 持续约1-2秒

### 动画时间线

```
T=0ms        - Boss.hp <= 0
              killBoss() 执行

T=0ms        - 中心爆炸 + 震动
              playBossDefeat() 音效
              showBossDefeatAnimation = true
              bossDefeatTimer = 3000

T=0-1500ms   ━━━━━━━━━━━━━━━━━━━ 连环爆炸
              每100ms一次，共15次

T=0-3000ms   ━━━━━━━━━━━━━━━━━━━ DEFEATED文字
              金色缩放文字居中显示
              2秒后开始淡出

T=3000ms     - setTimeout触发
              level++
              showLevelTransition = true
              恢复玩家HP
              3秒后Boss警告动画开始
```

---

## 👤 玩家状态动画

### 1. 受击闪烁 (hitFlash)

**触发时机**：玩家受伤时

```typescript
// game/GameEngine.ts:1096
this.player.hitFlashUntil = Date.now() + 150;
```

**Canvas渲染**：`RenderSystem.ts:532-540`

```typescript
if (e.hitFlashUntil && e.hitFlashUntil > Date.now()) {
    const radius = Math.max(e.width, e.height) / 2;
    this.ctx.globalCompositeOperation = 'overlay';
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; // 红色半透明
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalCompositeOperation = 'source-over';
}
```

**效果**：
- 玩家战机覆盖红色半透明蒙版
- 持续150ms
- 使用 `overlay` 混合模式增强对比

### 2. 无敌金光 (invulnerable)

**触发时机**：拾取INVINCIBILITY道具或Boss阶段切换

```typescript
// game/GameEngine.ts:1465-1468
case PowerupType.INVINCIBILITY:
    this.player.invulnerable = true;
    this.player.invulnerableTimer = 5000; // 5秒
    break;
```

**Canvas渲染**：`RenderSystem.ts:216-255`

```typescript
// Draw Invulnerability Visual (Golden Shield)
if (player.invulnerable) {
    this.ctx.save();
    this.ctx.translate(player.x, player.y);

    const t = Date.now() / 100;
    const alpha = 0.6 + Math.sin(t) * 0.4; // 脉冲透明度

    // 金色护盾圆环
    this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#ffd700';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
    this.ctx.stroke();

    // 粒子效果（5个旋转粒子）
    for (let i = 0; i < 5; i++) {
        const angle = (t + i * Math.PI * 2 / 5) % (Math.PI * 2);
        const radius = 45 + Math.sin(t * 2 + i) * 5;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;

        this.ctx.beginPath();
        this.ctx.arc(px, py, 3 + Math.sin(t * 3 + i) * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.7})`;
        this.ctx.fill();
    }

    this.ctx.restore();

    // 屏幕边缘金光
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.5})`;
    this.ctx.lineWidth = 10;
    this.ctx.shadowBlur = 30;
    this.ctx.shadowColor = '#ffd700';
    this.ctx.strokeRect(0, 0, this.width, this.height);
    this.ctx.restore();
}
```

**效果**：
- **金色护盾**：40px半径圆环，脉冲透明度
- **旋转粒子**：5个粒子围绕护盾旋转
- **屏幕边缘**：金色边框，随护盾同步脉冲
- **持续时间**：5秒

### 3. 护盾再生脉冲 (shieldRegenTimer)

**触发时机**：护盾自动再生时

**Canvas渲染**：`RenderSystem.ts:184-200`

```typescript
// Check if shield regen effect is active
if (shieldRegenTimer && shieldRegenTimer > 0) {
    // 脉冲效果
    const pulse = Math.sin(Date.now() / 100) * 0.2 + 1;
    this.ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(1, shield / 50)})`;
    this.ctx.lineWidth = 3 + pulse; // 脉冲线宽
    this.ctx.shadowBlur = 15 + pulse * 5; // 脉冲阴影

    // 绘制3层同心圆
    for (let i = 0; i < 3; i++) {
        const radius = 40 + i * 3;
        const alpha = Math.min(1, shield / 50) * (1 - i * 0.3);
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}
```

**效果**：
- **3层同心圆**：半径40、43、46
- **脉冲线宽**：3 ± 0.2
- **脉冲阴影**：15 ± 1
- **颜色**：青色 (cyan)

### 4. 速度加成拖尾 (playerSpeedBoostTimer)

**触发时机**：SHURIKEN反弹协同效果

**Canvas渲染**：`RenderSystem.ts:543-584`

```typescript
// SPEED_BOOST effect: Add light trail and glow
if (playerSpeedBoostTimer && playerSpeedBoostTimer > 0) {
    // 运动模糊效果
    this.ctx.save();
    this.ctx.globalAlpha = Math.min(0.5, playerSpeedBoostTimer / 1000);
    this.ctx.globalCompositeOperation = 'lighter';

    // 绘制3个拖尾副本
    for (let i = 0; i < 3; i++) {
        const offset = i * 3;
        this.ctx.globalAlpha = Math.min(0.3, playerSpeedBoostTimer / 1000) * (1 - i * 0.3);
        this.ctx.translate(-offset, 0);

        // 绘制玩家战机副本
        // ... sprite绘制代码 ...
    }
    this.ctx.restore();

    // 发光效果
    this.ctx.save();
    this.ctx.globalAlpha = Math.min(0.4, playerSpeedBoostTimer / 1000);
    this.ctx.globalCompositeOperation = 'screen';
    const radius = Math.max(e.width, e.height) / 2;
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
}
```

**效果**：
- **3层拖尾**：向左偏移3、6、9px
- **透明度递减**：0.3、0.21、0.15
- **青色发光**：80px半径径向渐变
- **持续时间**：由 `playerSpeedBoostTimer` 控制

---

## 👹 Boss状态动画

### 1. Boss阶段切换发光 (phaseGlow)

**触发时机**：Boss进入新阶段时

```typescript
// game/systems/BossPhaseSystem.ts:430-433
if (newPhase !== BossPhase.PHASE_1 && newConfig?.color) {
    boss.phaseGlowColor = newConfig.color;  // 阶段颜色
    boss.phaseGlowUntil = Date.now() + 1000; // 持续1秒
}
```

**Canvas渲染**：`RenderSystem.ts:703-718`

```typescript
if (e.phaseGlowUntil && e.phaseGlowUntil > Date.now()) {
    const alpha = 0.4;
    const glowColor = e.phaseGlowColor || '#ffd700';
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 25;
    this.ctx.strokeStyle = `${glowColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    this.ctx.lineWidth = 4;
    const padding = 14;
    this.ctx.strokeRect(
        -e.width / 2 - padding,
        -e.height / 2 - padding,
        e.width + padding * 2,
        e.height + padding * 2
    );
    this.ctx.shadowBlur = 0;
}
```

**阶段颜色映射**：

```typescript
export const BossPhaseColors = {
    [BossPhase.PHASE_1]: '#ffffff', // 普通 - 白色
    [BossPhase.PHASE_2]: '#ffd700', // 警告 - 金黄色
    [BossPhase.PHASE_3]: '#ff4500', // 危险 - 橙红色
    [BossPhase.PHASE_4]: '#8b0000'  // 致命 - 深红色
};
```

**效果**：
- **发光边框**：Boss外围14px边框
- **颜色变化**：根据阶段危险程度变化
- **持续时间**：1秒
- **阴影增强**：25px模糊发光

### 2. Boss无敌状态 (invulnerable)

**触发时机**：
- Boss进入阶段 (`flashEffect = true`)
- Boss进入场时 (`state = 0`)

**Canvas渲染**：`RenderSystem.ts:676-701`

```typescript
// Boss Invulnerability Visual Indicator
if (e.invulnerable) {
    const t = Date.now() / 200;
    const alpha = 0.5 + Math.sin(t) * 0.3; // 脉冲透明度

    // 外发光
    this.ctx.shadowColor = '#ffd700'; // 金色
    this.ctx.shadowBlur = 20 + Math.sin(t) * 10;

    // 金色边框
    this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
    this.ctx.lineWidth = 3;
    const borderPadding = 10;
    this.ctx.strokeRect(
        -e.width / 2 - borderPadding,
        -e.height / 2 - borderPadding,
        e.width + borderPadding * 2,
        e.height + borderPadding * 2
    );

    // Reset shadow
    this.ctx.shadowBlur = 0;
}
```

**效果**：
- **金色边框**：外围10px
- **脉冲透明度**：0.2 ~ 0.8
- **脉冲阴影**：10 ~ 30px
- **脉冲周期**：200ms

### 3. Boss血条颜色

**位置**：`RenderSystem.ts:656-673`

```typescript
// Determine bar color based on health percentage
const hpPercent = e.hp / e.maxHp;
let barColor;
if (hpPercent > 0.6) {
    barColor = '#00ff00'; // 绿色
} else if (hpPercent > 0.3) {
    barColor = '#ffff00'; // 黄色
} else {
    barColor = '#ff0000'; // 红色
}
```

**颜色阈值**：
- **60%+**：绿色（安全）
- **30%-60%**：黄色（警告）
- **<30%**：红色（危险）

---

## ✨ 特效动画汇总

### 1. 爆炸粒子 (Explosion)

**位置**：`GameEngine.ts:1551-1567`

```typescript
createExplosion(x: number, y: number, size: ExplosionSize, color: string) {
    const count = size === ExplosionSize.SMALL ? 8 : 30;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (size === ExplosionSize.SMALL ? 4 : 10);
        this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: size === ExplosionSize.SMALL ? 300 : 800,
            maxLife: size === ExplosionSize.SMALL ? 300 : 800,
            color: color,
            size: Math.random() * 4 + 2,
            type: 'spark'
        });
    }
}
```

**参数**：
- **小爆炸**：8个粒子，300ms寿命，速度4
- **大爆炸**：30个粒子，800ms寿命，速度10

**渲染**：`RenderSystem.ts:359-366`

```typescript
particles.forEach(p => {
    this.ctx.globalAlpha = p.life / p.maxLife; // 渐隐
    this.ctx.fillStyle = p.color;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
});
```

### 2. 冲击波 (Shockwave)

**位置**：`GameEngine.ts:1569-1579`

```typescript
addShockwave(x: number, y: number, color: string = '#ffffff',
             maxRadius: number = 150, width: number = 5) {
    this.shockwaves.push({
        x, y,
        radius: 10,
        maxRadius,
        color,
        life: 1.0,
        width
    });
}
```

**渲染**：`RenderSystem.ts:369-378`

```typescript
shockwaves.forEach(s => {
    this.ctx.globalAlpha = s.life;
    this.ctx.lineWidth = s.width || 5;
    this.ctx.strokeStyle = s.color;
    this.ctx.beginPath();
    this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    this.ctx.stroke();
});
```

**更新**：`GameEngine.ts:660-664`

```typescript
this.shockwaves.forEach(s => {
    s.radius += (s.maxRadius - s.radius) * 0.1 * timeScale; // 缓动扩撒
    s.life -= 0.02 * timeScale; // 生命衰减
});
```

**效果**：
- **半径缓动**：10px → maxRadius（缓动系数0.1）
- **生命衰减**：1.0 → 0.0
- **颜色**：可自定义（默认白色）

### 3. 时间减缓效果 (Time Slow)

**触发时机**：拾取TIME_SLOW道具

**Canvas渲染**：`RenderSystem.ts:139-171`

```typescript
if (timeSlowActive) {
    this.ctx.save();

    // 屏幕色调
    this.ctx.fillStyle = 'rgba(200, 230, 255, 0.1)'; // 淡蓝
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 下落线条
    if (this.timeSlowLines.length < 20) {
        this.timeSlowLines.push({
            x: Math.random() * this.width,
            y: -50,
            length: Math.random() * 100 + 50,
            speed: Math.random() * 5 + 2,
            alpha: Math.random() * 0.5 + 0.2
        });
    }

    this.timeSlowLines.forEach(line => {
        line.y += line.speed;
        this.ctx.strokeStyle = `rgba(173, 216, 230, ${line.alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(line.x, line.y);
        this.ctx.lineTo(line.x, line.y + line.length);
        this.ctx.stroke();
    });

    this.ctx.restore();
}
```

**效果**：
- **淡蓝蒙版**：10%透明度淡蓝
- **下落线条**：最多20条，长度50-150px，速度2-7
- **持续时间**：3秒

### 4. 慢速场 (Slow Fields)

**触发时机**：协同效果触发

**Canvas渲染**：`RenderSystem.ts:270-294`

```typescript
if (slowFields && slowFields.length > 0) {
    slowFields.forEach(field => {
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(1, field.life / 1000);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;

        // 脉冲圆
        const t = Date.now() / 200;
        const pulse = Math.sin(t) * 0.1 + 1;
        this.ctx.setLineDash([5, 5]); // 虚线
        this.ctx.beginPath();
        this.ctx.arc(field.x, field.y, field.range * pulse, 0, Math.PI * 2);
        this.ctx.stroke();

        // 内圆
        this.ctx.setLineDash([]);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(field.x, field.y, field.range * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
    });
}
```

**效果**：
- **虚线圆**：120px半径，脉冲±10%
- **内圆**：70%半径，实线
- **颜色**：青色
- **持续时间**：1200ms

### 5. 等离子爆炸圈 (Plasma Explosions)

**触发时机**：PLASMA子弹击中

**Canvas渲染**：`RenderSystem.ts:297-349`

```typescript
if (plasmaExplosions && plasmaExplosions.length > 0) {
    plasmaExplosions.forEach(explosion => {
        this.ctx.save();
        this.ctx.globalAlpha = Math.min(1, explosion.life / 1200);

        // 外环脉冲
        const t = Date.now() / 200;
        const pulse = Math.sin(t) * 0.2 + 1;
        this.ctx.strokeStyle = 'rgba(237, 100, 166, 0.7)'; // 粉色
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]); // 虚线
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.range * pulse, 0, Math.PI * 2);
        this.ctx.stroke();

        // 内部螺旋
        this.ctx.setLineDash([]);
        this.ctx.strokeStyle = 'rgba(237, 100, 166, 0.3)';
        this.ctx.lineWidth = 2;

        const segments = 20;
        const rotation = t * 2; // 旋转
        this.ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 4 + rotation;
            const radius = (i / segments) * explosion.range * 0.8;
            const x = explosion.x + Math.cos(angle) * radius;
            const y = explosion.y + Math.sin(angle) * radius;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();

        // 能量粒子（8个旋转粒子）
        for (let i = 0; i < 8; i++) {
            const angle = (t + i * Math.PI * 2 / 8) % (Math.PI * 2);
            const radius = explosion.range * 0.6;
            const px = explosion.x + Math.cos(angle) * radius;
            const py = explosion.y + Math.sin(angle) * radius;

            this.ctx.beginPath();
            this.ctx.arc(px, py, 4 + Math.sin(t * 3 + i) * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(237, 100, 166, ${0.6 + Math.sin(t * 2 + i) * 0.4})`;
            this.ctx.fill();
        }

        this.ctx.restore();
    });
}
```

**效果**：
- **外环**：虚线，脉冲±20%，粉色
- **螺旋**：2圈螺旋，旋转
- **粒子**：8个粒子旋转，大小脉冲
- **持续时间**：1200ms

---

## 🔄 动画触发流程图

### 关卡开始（第一关）

```
[startGame() 调用]
    ↓
初始化游戏状态
    level = 1
    showLevelTransition = false
    isBossWarningActive = false
    showBossDefeatAnimation = false
    ↓
触发回调
    onStateChange(PLAYING)
    onScoreChange(0)
    onLevelChange(1)
    onHpChange(100)
    ↓
[UI层更新]
    HUD直接显示（无动画）
    分数、关卡、血条、武器状态
```

### Boss警告

```
[LevelManager.trySpawnBoss()]
    ↓
满足条件？
    progress >= 0.9
    AND duration >= 60s
    AND !isLevelTransitioning
    ↓ Yes
[EventBus发布]
    LevelEventType.BossWarning({ show: true })
    LevelEventType.BossSpawned({ level })
    ↓
[ReactEngine监听]
    showBossWarning = true
    onBossWarning(true)
    ↓
[UI层渲染]
    全屏红色闪烁 (0.5s周期)
    WARNING文字脉冲
    Boss进入动画 (Canvas层)
    ↓
[3秒后]
    bossWarningTimer = 0
    EventBus发布 BossWarning({ show: false })
    showBossWarning = false
```

### Boss击败

```
[GameEngine.killBoss()]
    ↓
Canvas特效
    createExplosion(中心)
    addShockwave(冲击波)
    screenShake = 30
    ↓
连环爆炸
    for (i = 0; i < 15; i++)
        setTimeout(100ms * i)
        createExplosion(随机位置)
    ↓
音效
    playExplosion()
    playBossDefeat()
    ↓
UI动画标志
    showBossDefeatAnimation = true
    bossDefeatTimer = 3000
    ↓
[Canvas层渲染]
    DEFEATED文字缩放
    透明度渐变 (3000ms → 0)
    ↓
[3000ms后]
    setTimeout触发
    level++
    showLevelTransition = true
    player.hp恢复
    ↓
[UI层渲染]
    STAGE {level} 淡入淡出
    (1500ms)
```

### 关卡过渡

```
[Boss击败后 3000ms]
    ↓
showLevelTransition = true
    levelTransitionTimer = 0
    ↓
[UI层渲染]
    <div style={{
        opacity: timer < 300 ? timer/300
               : timer > 1200 ? (1500-timer)/300
               : 1
    }}>
      STAGE {intToRoman(level)}
    </div>
    ↓
[动画时间线]
    0-300ms:    淡入 (opacity: 0 → 1)
    300-1200ms: 完全显示 (opacity: 1)
    1200-1500ms: 淡出 (opacity: 1 → 0)
    ↓
[1500ms后]
    showLevelTransition = false
    isLevelTransitioning = false
    继续游戏循环
```

---

## 📊 动画参数汇总表

| 动画名称 | 触发条件 | 持续时间 | 主要颜色 | 渲染层 | 位置 |
|---------|---------|---------|---------|--------|------|
| **关卡过渡** | Boss击败后 | 1500ms | 青色 #0ff | React | 左上角 |
| **Boss警告** | Boss刷新 | 3000ms | 红色 #f00 | React | 全屏 |
| **Boss击败** | Boss死亡 | 3000ms | 金色 #fd0 | Canvas | 居中 |
| **受击闪烁** | 玩家受伤 | 150ms | 红色 #f00 | Canvas | 玩家 |
| **无敌金光** | 无敌道具 | 5000ms | 金色 #fd0 | Canvas | 玩家+边缘 |
| **护盾再生** | 护盾恢复 | 1000ms | 青色 #0ff | Canvas | 玩家 |
| **速度拖尾** | 协同效果 | 计时器 | 青色 #0ff | Canvas | 玩家 |
| **Boss阶段切换** | 血量阈值 | 1000ms | 阶段色 | Canvas | Boss |
| **Boss无敌** | 进入/阶段 | 无限期 | 金色 #fd0 | Canvas | Boss |
| **爆炸粒子** | 击杀/击中 | 300-800ms | 多色 | Canvas | 位置 |
| **冲击波** | 爆炸 | ~5s | 白色 #fff | Canvas | 位置 |
| **时间减缓** | 道具 | 3000ms | 淡蓝 #e6f7ff | Canvas | 全屏 |
| **慢速场** | 协同 | 1200ms | 青色 #0ff | Canvas | 位置 |
| **等离子圈** | PLASMA击中 | 1200ms | 粉色 #ed64a6 | Canvas | 位置 |

---

## 🎯 关键发现与设计特点

### ✅ 优点

1. **分层清晰**
   - React层：UI覆盖层、HUD
   - Canvas层：游戏实体、特效
   - 职责分明，互不干扰

2. **时间精确**
   - 使用 `dt` (delta time) 驱动动画
   - 使用 `Date.now()` 管理倒计时
   - 保证帧率无关性

3. **视觉反馈丰富**
   - 屏幕震动、闪烁、脉冲
   - 多层次效果（粒子+冲击波+发光）
   - 颜色语义化（红=危险、绿=安全）

4. **性能优化**
   - `pointer-events-none` 避免干扰交互
   - `globalAlpha` 渐隐减少重绘
   - 条件渲染避免不必要的绘制

### ⚠️ 潜在问题

1. **硬编码时长**
   - 动画持续时间散布在代码各处
   - 缺少统一的配置管理

2. **状态分散**
   - 动画标志在 GameEngine 和 ReactEngine 重复
   - 容易出现不同步

3. **无缓动函数库**
   - 简单线性插值
   - 缺少easing曲线（ease-in-out、bounce等）

4. **CSS动画与Canvas分离**
   - Boss警告用CSS keyframes
   - 其他动画用Canvas绘制
   - 难以统一管理

5. **缺少第一关开始动画**
   - 直接显示HUD
   - 可添加淡入或缩放效果

---

## 💡 新引擎改进建议

基于以上分析，建议新引擎（ECS）进行以下改进：

1. **统一动画系统**
   ```typescript
   // 建议结构
   interface AnimationConfig {
       duration: number;
       easing: (t: number) => number;
       onUpdate: (progress: number) => void;
       onComplete?: () => void;
   }
   ```

2. **动画组件化**
   - `AnimationComponent`：统一管理动画状态
   - `TransitionComponent`：关卡过渡专用
   - `WarningComponent`：Boss警告专用

3. **时间系统统一**
   - 所有动画使用 World Time
   - 避免混用 `Date.now()` 和 `dt`

4. **配置化参数**
   ```typescript
   export const ANIMATION_CONFIG = {
       levelTransition: { duration: 1500, fadeIn: 300, fadeOut: 300 },
       bossWarning: { duration: 3000, flashInterval: 500 },
       bossDefeat: { duration: 3000, explosionCount: 15 },
       // ...
   };
   ```

5. **事件驱动**
   - 动画通过事件触发
   - 解耦逻辑和表现

6. **添加第一关动画**
   - "STAGE I" 淡入
   - HUD逐个显示
   - 玩家战机入场效果

---

## 📚 参考资料

- [GameUI.tsx](../components/GameUI.tsx) - React UI组件
- [RenderSystem.ts](../game/systems/RenderSystem.ts) - Canvas渲染系统
- [GameEngine.ts](../game/GameEngine.ts) - 游戏引擎
- [BossPhaseSystem.ts](../game/systems/BossPhaseSystem.ts) - Boss阶段系统

---

*文档版本：1.0*
*分析时间：2026-02-04*
*分析者：Claude Code*
