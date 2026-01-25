# 渲染系统验证计划

## 目标
系统化地解决 ECS 渲染系统问题，确保所有实体正确显示。

## 当前状态

### 已完成的修复
- [x] 相机固定在 (0, 0)，不再跟随玩家
- [x] 背景星空效果
- [x] 玩家护盾渲染
- [x] 玩家无敌状态视觉
- [x] Boss 血条显示

### 已知问题
1. **子弹可能不显示** - 需要验证 Sprite 组件是否正确添加
2. **敌人可能不显示** - 需要验证敌人蓝图的 Sprite 配置
3. **玩家可能不显示** - 需要验证玩家蓝图的 Sprite 配置
4. **纹理加载问题** - SpriteRenderer 的 key 映射可能不完整

---

## 验证步骤

### 第 1 步：创建最小测试场景

创建一个独立的测试文件，只渲染最基础的元素：

```typescript
// src/engine/debug/RenderTest.ts
import { World } from '../types';
import { Transform, Sprite, PlayerTag } from '../components';
import { setRenderContext, RenderSystem } from '../systems/RenderSystem';

export function runRenderTest() {
    // 1. 创建最小 World
    const world: World = {
        time: 0,
        entities: new Map(),
        events: [],
        score: 0,
        level: 1,
        playerId: 1,
        playerLevel: 1,
        difficulty: 1,
        spawnCredits: 0,
        spawnTimer: 0,
        enemyCount: 0,
        width: 800,
        height: 600
    };

    // 2. 创建测试实体（玩家）
    world.entities.set(1, [
        new Transform({ x: 400, y: 500, rot: 0 }),
        new Sprite({
            texture: './assets/sprites/fighters/player.svg',
            srcX: 0, srcY: 0, srcW: 64, srcH: 64,
            scale: 1, pivotX: 0.5, pivotY: 0.5
        }),
        new PlayerTag()
    ]);

    // 3. 设置渲染上下文
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    setRenderContext({
        canvas,
        context: canvas.getContext('2d')!,
        width: 800,
        height: 600
    });

    // 4. 运行渲染
    function loop() {
        RenderSystem(world, 16);
        requestAnimationFrame(loop);
    }
    loop();
}
```

### 第 2 步：验证列表

按顺序验证以下内容，每项通过后打勾：

#### 基础渲染
- [ ] **画布清空** - 背景是否是黑色
- [ ] **星空背景** - 是否看到星星滚动
- [ ] **单个矩形** - 用 Sprite.color 绘制白色矩形是否显示
- [ ] **单个图片** - 用 Sprite.texture 绘制图片是否显示

#### 玩家渲染
- [ ] **玩家实体存在** - world.entities.get(world.playerId) 是否有值
- [ ] **玩家有 Transform** - Transform.x/y 是否正确
- [ ] **玩家有 Sprite** - Sprite.texture 是否有值
- [ ] **玩家图片加载** - SpriteRenderer.getImage('player') 是否返回图片
- [ ] **玩家显示** - 画面中是否看到玩家

#### 子弹渲染
- [ ] **子弹实体存在** - 检查带 Bullet 组件的实体数量
- [ ] **子弹有 Sprite** - 每个子弹实体是否有 Sprite 组件
- [ ] **子弹图片加载** - 对应的 bullet_xxx 图片是否存在
- [ ] **子弹显示** - 画面中是否看到子弹

#### 敌人渲染
- [ ] **敌人实体存在** - 检查带 EnemyTag 的实体数量
- [ ] **敌人有 Sprite** - 每个敌人实体是否有 Sprite 组件
- [ ] **敌人图片加载** - enemy_xxx 图片是否存在
- [ ] **敌人显示** - 画面中是否看到敌人

---

## 调试方法

### 1. 添加调试日志

在关键位置添加 console.log：

```typescript
// RenderSystem.ts 开头
export function RenderSystem(world: World, dt: number, renderCtx?: RenderContext): void {
    console.log('[RenderSystem] === Frame Start ===');
    console.log('[RenderSystem] Entity count:', world.entities.size);
    console.log('[RenderSystem] Player ID:', world.playerId);

    // 检查玩家
    const playerComps = world.entities.get(world.playerId);
    if (playerComps) {
        console.log('[RenderSystem] Player components:', playerComps.map(c => c.constructor.name));
        const transform = playerComps.find(Transform.check);
        const sprite = playerComps.find(c => c instanceof Sprite);
        console.log('[RenderSystem] Player Transform:', transform);
        console.log('[RenderSystem] Player Sprite:', sprite);
    }
    // ...
}
```

### 2. 检查 SpriteRenderer

```typescript
// 在浏览器控制台执行
console.log('Images in SpriteRenderer:', {
    player: SpriteRenderer.getImage('player'),
    bullet_vulcan: SpriteRenderer.getImage('bullet_vulcan'),
    enemy_normal: SpriteRenderer.getImage('enemy_normal'),
});
```

### 3. 可视化调试

在 RenderSystem 中添加边框绘制：

```typescript
// 在 drawSprite 函数中
ctx.save();
ctx.strokeStyle = 'red';
ctx.lineWidth = 2;
ctx.strokeRect(-pivotX, -pivotY, width, height);
ctx.restore();
```

---

## 屏蔽其他功能的方法

### 1. 在 engine.ts 中注释掉不需要的系统

```typescript
// src/engine/engine.ts
private framePipeline(world: World, dt: number) {
    // 只保留渲染相关的系统
    // InputSystem(world, dt);           // 禁用
    // DifficultySystem(world, dt);      // 禁用
    // SpawnSystem(world, dt);           // 禁用 - 需要手动生成敌人
    // ...

    // 只保留渲染
    RenderSystem(world, dt);
}
```

### 2. 创建手动测试场景

```typescript
// 在 ReactEngine.start() 中添加测试代码
setTimeout(() => {
    // 手动创建测试实体
    const testEntity = this.world.createEntity();
    testEntity.add(new Transform({ x: 400, y: 300 }));
    testEntity.add(new Sprite({
        color: '#ff0000',
        srcX: 0, srcY: 0, srcW: 50, srcH: 50
    }));
}, 1000);
```

### 3. 使用浏览器开发者工具

- Elements 标签：检查 canvas 元素
- Console 标签：查看调试日志
- Network 标签：检查图片是否加载成功

---

## 问题排查清单

### 如果实体不显示：

1. **检查实体是否创建**
   ```javascript
   console.log(world.entities.size);  // 应该 > 0
   ```

2. **检查组件是否存在**
   ```javascript
   const comps = world.entities.get(id);
   console.log(comps?.map(c => c.constructor.name));  // 应包含 Transform 和 Sprite
   ```

3. **检查图片是否加载**
   ```javascript
   const img = SpriteRenderer.getImage('player');
   console.log(img?.complete, img?.naturalWidth);  // 应该是 true 和 > 0
   ```

4. **检查渲染位置**
   ```javascript
   // 坐标应该在画布范围内
   console.log(transform.x, transform.y);  // 应该在 0-800, 0-600 范围内
   ```

---

## 验证完成标准

当以下所有项目都通过时，渲染系统验证完成：

- [ ] 黑色背景显示
- [ ] 星空滚动效果正常
- [ ] 玩家飞机在正确位置显示
- [ ] 子弹从玩家位置发射并向上移动
- [ ] 敌人从屏幕上方出现并向下移动
- [ ] 所有精灵都有正确的纹理（不是白色方块）
- [ ] 护盾效果显示（如果有护盾）
- [ ] Boss 血条显示（如果有 Boss）

---

## 下一步

完成验证后，按优先级恢复其他功能：

1. **高优先级**：武器系统、碰撞系统
2. **中优先级**：伤害结算、拾取系统
3. **低优先级**：UI、特效、音效
