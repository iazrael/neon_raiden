在 ECS 架构中，处理输入的最佳实践是将 **“事件监听（DOM/硬件层）”** 与 **“逻辑处理（ECS 系统层）”** 分离。

你不应该在 `InputSystem`（每帧运行 60 次的函数）里写 `addEventListener`。

这里是一套完整的 **InputManager + InputSystem** 设计方案，支持键盘和触摸（虚拟摇杆）。

---

### 一、设计思路

1.  **InputManager (单例服务)**：
    *   负责 `window.addEventListener`。
    *   负责维护当前按键状态 (`keys`)。
    *   负责维护虚拟摇杆状态 (`joystick`)。
    *   提供一个统一的接口 `getAxis()` 和 `isFiring()`，**屏蔽键盘和触摸的区别**。
2.  **InputSystem (ECS 系统)**：
    *   **只读** `InputManager` 的状态。
    *   **只写** 玩家实体的 `MoveIntent` 和 `FireIntent` 组件。
3.  **TouchControls (UI 层)**：
    *   在 React 层捕获触摸事件，将数据喂给 `InputManager`。

---

### 二、代码实现

#### 1. InputManager (硬件抽象层)

新建 `src/engine/input/InputManager.ts`。这个类负责“脏活累活”（监听 DOM）。

```typescript
// src/engine/input/InputManager.ts

export class InputManager {
  // 单例模式
  private static instance: InputManager;
  public static getInstance(): InputManager {
    if (!this.instance) {
      this.instance = new InputManager();
    }
    return this.instance;
  }

  // 内部状态
  private keys: Set<string> = new Set();
  private joystick = { x: 0, y: 0 }; // 虚拟摇杆向量 (-1 ~ 1)
  private isTouchingFire = false;    // 触摸射击按钮

  private constructor() {
    this.initKeyboardListeners();
  }

  /** 初始化键盘监听 (在 main.ts 或 App.tsx 启动时调用一次即可，或者构造时自动调用) */
  private initKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    
    // 防止失去焦点时按键卡死
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.joystick = { x: 0, y: 0 };
      this.isTouchingFire = false;
    });
  }

  // ========== 对外接口：供 React UI 调用 ==========

  /** 设置虚拟摇杆向量 */
  public setJoystick(x: number, y: number) {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  /** 设置触摸开火状态 */
  public setTouchFire(firing: boolean) {
    this.isTouchingFire = firing;
  }

  // ========== 对外接口：供 ECS System 调用 ==========

  /** 获取归一化的移动向量 */
  public getMoveVector(): { x: number, y: number } {
    let dx = 0;
    let dy = 0;

    // 1. 键盘输入
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy += 1;

    // 2. 叠加虚拟摇杆输入
    if (dx === 0 && dy === 0) {
      dx = this.joystick.x;
      dy = this.joystick.y;
    }

    // 3. 归一化 (防止斜向移动变快)
    // 只有当纯键盘输入时才需要归一化，摇杆通常已经归一化了
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }

    return { x: dx, y: dy };
  }

  /** 是否正在开火 */
  public isFiring(): boolean {
    return this.keys.has('Space') || this.keys.has('Enter') || this.isTouchingFire;
  }
}

// 导出单例
export const inputManager = InputManager.getInstance();
```

#### 2. InputSystem (逻辑层)

修改 `src/engine/systems/InputSystem.ts`。现在它非常干净，只负责“读状态 -> 写组件”。

**优化点**：为了减少 GC（垃圾回收）压力，我们尽量**复用**已有的 Intent 组件，而不是每帧 `splice` 删掉再 `new`。

```typescript
// src/engine/systems/InputSystem.ts

import { World } from '../types';
import { inputManager } from '../input/InputManager'; // 引入上面的单例
import { MoveIntent, FireIntent } from '../components';

export function InputSystem(w: World) {
  // 获取玩家组件列表
  const playerComps = w.entities.get(w.playerId);
  if (!playerComps) return;

  // 1. 获取输入状态
  const moveVec = inputManager.getMoveVector();
  const isFiring = inputManager.isFiring();

  // 2. 处理移动意图 (MoveIntent)
  // 查找现有的 MoveIntent
  const moveIntent = playerComps.find(c => c instanceof MoveIntent) as MoveIntent;

  if (moveVec.x !== 0 || moveVec.y !== 0) {
    if (moveIntent) {
      // 如果已有，直接修改值 (0 GC)
      moveIntent.dx = moveVec.x;
      moveIntent.dy = moveVec.y;
    } else {
      // 如果没有，创建新的
      playerComps.push(new MoveIntent({ dx: moveVec.x, dy: moveVec.y }));
    }
  } else {
    // 如果没有输入，且存在意图，需要移除意图
    // (或者你可以保留意图但设为0，取决于 MovementSystem 怎么写。通常移除更安全)
    if (moveIntent) {
      const idx = playerComps.indexOf(moveIntent);
      playerComps.splice(idx, 1);
    }
  }

  // 3. 处理开火意图 (FireIntent)
  const fireIntent = playerComps.find(c => c instanceof FireIntent);
  
  if (isFiring) {
    if (!fireIntent) {
      playerComps.push(new FireIntent());
    }
  } else {
    if (fireIntent) {
      const idx = playerComps.indexOf(fireIntent);
      playerComps.splice(idx, 1);
    }
  }
}
```

#### 3. React UI 层集成 (触摸支持)

在 React UI 中实现一个虚拟摇杆，将数据喂给 `InputManager`。

`src/ui/VirtualJoystick.tsx` (伪代码/简化版):

```tsx
import React, { useRef, useState } from 'react';
import { inputManager } from '@/engine/input/InputManager';

export const VirtualJoystick = () => {
  // ... 这里实现你的摇杆逻辑 (比如用 nipple.js 或者手写 touch 事件) ...
  // 核心是将触摸坐标转换为 -1 到 1 的向量

  const handleTouchMove = (e: React.TouchEvent) => {
    // 假设算出了向量 x, y
    const x = /* ... */; 
    const y = /* ... */;
    
    // 喂给 InputManager
    inputManager.setJoystick(x, y);
  };

  const handleTouchEnd = () => {
    inputManager.setJoystick(0, 0);
  };

  return (
    <div 
      className="joystick-area" 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
    >
      {/* 摇杆 UI */}
    </div>
  );
};

export const FireButton = () => {
  return (
    <button
      className="fire-btn"
      onTouchStart={() => inputManager.setTouchFire(true)}
      onTouchEnd={() => inputManager.setTouchFire(false)}
      // 同时也支持鼠标按下
      onMouseDown={() => inputManager.setTouchFire(true)}
      onMouseUp={() => inputManager.setTouchFire(false)}
    >
      FIRE
    </button>
  );
};
```

---

### 三、 总结

1.  **监听写在哪里？**
    *   **键盘**：写在 `InputManager` 的构造函数或 `init` 方法中，绑定到 `window`。
    *   **触摸**：写在 React 组件 (`VirtualJoystick`) 的 `onTouch` 事件中，或者在 `InputManager` 里绑定到 `canvas` 元素（如果不想做 React UI 摇杆）。

2.  **数据流向**：
    `DOM Event` -> `InputManager (State)` -> `InputSystem (Read State)` -> `Entity Components (MoveIntent)`

3.  **优势**：
    *   `InputSystem` 代码极其简洁，不包含任何 `e.keyCode` 这种脏代码。
    *   支持多输入源合并（左手键盘、右手鼠标、触摸屏同时操作都不会冲突）。
    *   **性能优化**：我们修改后的 `InputSystem` 优先复用组件，极大减少了 `new` 操作带来的内存抖动。

    这是一个非常关键的重构步骤。你旧版的 `InputSystem` 是典型的 **OOP + 回调设计**（混合了事件监听、逻辑判断和直接回调），而新的 ECS 架构要求 **数据驱动 + 轮询设计**。

为了合并旧版的功能（特别是**鼠标跟随/滑动计算**和**炸弹B键**），我们需要扩充 `InputManager` 的能力，并在 `InputSystem` 中将这些原始数据转化为 Intent 组件。

以下是合并后的设计方案：

### 核心设计变化

1.  **统一指针（Pointer）**：将“鼠标移动”和“触摸滑动”统一抽象为 **`pointerDelta` (指针位移增量)**。这样无论是用鼠标拖拽还是手指滑动，逻辑是一样的。
2.  **移除回调 (`onAction`)**：ECS 不用回调。按下 B 键不再触发 `onAction('bomb')`，而是设置 `InputManager.isBombing = true`，然后由 System 生成 `BombIntent` 组件。
3.  **Canvas 依赖**：`InputManager` 需要初始化方法来绑定 Canvas 事件。

---

### 1. 升级版 InputManager (硬件抽象层)

这个类负责监听所有 DOM 事件，并计算“这一帧手指/鼠标动了多少像素”。

```typescript
// src/engine/input/InputManager.ts

export class InputManager {
  private static instance: InputManager;
  public static getInstance(): InputManager {
    if (!this.instance) this.instance = new InputManager();
    return this.instance;
  }

  // 状态存储
  private keys: Set<string> = new Set();
  
  // 指针状态 (鼠标 + 触摸)
  private pointerDelta = { x: 0, y: 0 }; // 本帧位移增量
  private lastPointer = { x: 0, y: 0 };  // 上一次坐标
  private isPointerDown = false;
  
  // 动作状态
  private _isFiring = false;
  private _isBombing = false;

  private canvas: HTMLCanvasElement | null = null;

  private constructor() {}

  /** 
   * 初始化：必须传入 Canvas 以计算正确的坐标 
   * 在 main.ts 或 React useEffect 中调用
   */
  public init(canvas: HTMLCanvasElement) {
    if (this.canvas) return; // 防止重复绑定
    this.canvas = canvas;

    // --- 键盘监听 ---
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.resetState());

    // --- 触摸监听 (Touch) ---
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // 防止滚动
      const t = e.touches[0];
      this.startPointer(t.clientX, t.clientY);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.isPointerDown) return;
      const t = e.touches[0];
      this.movePointer(t.clientX, t.clientY);
    }, { passive: false });

    canvas.addEventListener('touchend', () => this.endPointer());

    // --- 鼠标监听 (Mouse) ---
    // 将鼠标按下视为触摸开始，模拟拖拽操作
    canvas.addEventListener('mousedown', (e) => {
      this.startPointer(e.clientX, e.clientY);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isPointerDown) return;
      this.movePointer(e.clientX, e.clientY);
    });

    canvas.addEventListener('mouseup', () => this.endPointer());
    canvas.addEventListener('mouseleave', () => this.endPointer());
  }

  // --- 内部辅助逻辑 ---

  private startPointer(x: number, y: number) {
    this.isPointerDown = true;
    this.lastPointer.x = x;
    this.lastPointer.y = y;
    this._isFiring = true; // 触摸/点击屏幕通常意味着开火
  }

  private movePointer(x: number, y: number) {
    const dx = x - this.lastPointer.x;
    const dy = y - this.lastPointer.y;
    
    // 累加位移 (因为一帧内可能触发多次 move 事件)
    this.pointerDelta.x += dx;
    this.pointerDelta.y += dy;

    this.lastPointer.x = x;
    this.lastPointer.y = y;
  }

  private endPointer() {
    this.isPointerDown = false;
    this._isFiring = false;
  }

  private resetState() {
    this.keys.clear();
    this.pointerDelta = { x: 0, y: 0 };
    this.isPointerDown = false;
    this._isFiring = false;
  }

  // ========== 对外接口 (供 InputSystem 使用) ==========

  /** 获取并重置指针位移 (由 System 每帧调用一次) */
  public consumePointerDelta() {
    const delta = { ...this.pointerDelta };
    this.pointerDelta = { x: 0, y: 0 }; // 消费后归零
    return delta;
  }

  /** 获取键盘方向向量 (归一化) */
  public getKeyboardVector() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy += 1;
    return { x: dx, y: dy };
  }

  public isFiring() {
    return this.keys.has('Space') || this._isFiring;
  }

  public isBombing() {
    return this.keys.has('KeyB');
  }
}

export const inputManager = InputManager.getInstance();
```

---

### 2. 升级版 InputSystem (逻辑层)

这个系统负责融合 **键盘的逻辑移动** 和 **触摸的绝对移动**。

这里涉及到一个关键的物理问题：
*   **键盘**给的是**速度意图**（需要乘 `speed * dt`）。
*   **触摸/鼠标拖拽**给的是**位移意图**（已经是像素值了，不需要乘 dt）。

我们需要修改 `MoveIntent` 组件来支持这两种模式，或者在 `InputSystem` 里统一算好。为了简单起见，我们**统一算成位移**传递给 `MoveIntent`。

#### 修改组件定义 (src/engine/components/movement.ts)

```typescript
export class MoveIntent extends Component {
    constructor(cfg: { 
        dx: number;   // X轴位移量
        dy: number;   // Y轴位移量
        type: 'velocity' | 'offset'; // 区分是 速度方向 还是 绝对位移
    }) { 
        super(); 
        this.dx = cfg.dx;
        this.dy = cfg.dy;
        this.type = cfg.type;
    }
    public dx = 0;
    public dy = 0;
    public type: 'velocity' | 'offset';
}

// 新增炸弹意图
export class BombIntent extends Component {}
```

#### 修改系统 (src/engine/systems/InputSystem.ts)

```typescript
import { World } from '../types';
import { inputManager } from '../input/InputManager';
import { MoveIntent, FireIntent, BombIntent, PlayerTag, SpeedStat } from '../components';
import { view } from '../world';

export function InputSystem(w: World, dt: number) {
  // 1. 获取输入源数据
  const kbVec = inputManager.getKeyboardVector();
  const pointerDelta = inputManager.consumePointerDelta(); // 注意：这会清空 Manager 里的积攒值
  const isFiring = inputManager.isFiring();
  const isBombing = inputManager.isBombing();

  // 2. 查找玩家
  // 使用 view 迭代器可以更高效地找到 Player
  for (const [id, [_, speedStat]] of view(w, [PlayerTag, SpeedStat])) {
    const playerComps = w.entities.get(id)!;

    // === 处理移动 (优先处理触摸/鼠标拖拽，其次键盘) ===
    const existingMove = playerComps.find(c => c instanceof MoveIntent) as MoveIntent;
    
    // 逻辑：如果有指针位移，直接使用像素偏移 (Offset)
    if (Math.abs(pointerDelta.x) > 0.1 || Math.abs(pointerDelta.y) > 0.1) {
       // 触摸是 1:1 跟随，直接作为 Offset
       if (existingMove) {
         existingMove.dx = pointerDelta.x;
         existingMove.dy = pointerDelta.y;
         existingMove.type = 'offset';
       } else {
         playerComps.push(new MoveIntent({ dx: pointerDelta.x, dy: pointerDelta.y, type: 'offset' }));
       }
    } 
    // 逻辑：否则，使用键盘向量 (Velocity)
    else if (kbVec.x !== 0 || kbVec.y !== 0) {
       // 键盘需要后续乘速度
       if (existingMove) {
         existingMove.dx = kbVec.x;
         existingMove.dy = kbVec.y;
         existingMove.type = 'velocity';
       } else {
         playerComps.push(new MoveIntent({ dx: kbVec.x, dy: kbVec.y, type: 'velocity' }));
       }
    } 
    // 无输入：清理意图
    else {
      if (existingMove) {
        const idx = playerComps.indexOf(existingMove);
        playerComps.splice(idx, 1);
      }
    }

    // === 处理开火 ===
    const existingFire = playerComps.find(c => c instanceof FireIntent);
    if (isFiring) {
      if (!existingFire) playerComps.push(new FireIntent());
    } else {
      if (existingFire) playerComps.splice(playerComps.indexOf(existingFire), 1);
    }

    // === 处理炸弹 (B键) ===
    const existingBomb = playerComps.find(c => c instanceof BombIntent);
    if (isBombing) {
      // 炸弹通常是一次性触发，这里持续按住会持续产生意图
      // 后续 SkillSystem 需要处理冷却或消耗
      if (!existingBomb) playerComps.push(new BombIntent());
    } else {
      if (existingBomb) playerComps.splice(playerComps.indexOf(existingBomb), 1);
    }
    
    // 只要处理一个玩家即可退出
    break;
  }
}
```

---

### 3. 配套修改 MovementSystem

因为我们修改了 `MoveIntent` 的结构，消费者 `MovementSystem` 也需要适配。

```typescript
// src/engine/systems/MovementSystem.ts

export function MovementSystem(w: World, dt: number) {
  // 遍历所有有移动意图和位置的实体
  // 注意：还需要读取 SpeedStat 来计算键盘移动速度
  for (const [id, [tr, intent, speed]] of view(w, [Transform, MoveIntent, SpeedStat])) {
    
    if (intent.type === 'offset') {
      // 1. 偏移模式 (触摸/鼠标)：意图里的 dx/dy 就是像素值
      // 不需要乘 dt，因为 delta 已经是这一帧的物理位移了
      tr.x += intent.dx;
      tr.y += intent.dy;
    } else {
      // 2. 速度模式 (键盘)：意图里的 dx/dy 是方向 (-1 ~ 1)
      // 需要乘 速度 * dt
      // speed.maxLinear 是每秒像素速度
      // 对角线移动归一化在 InputManager 做过了，这里不再做
      tr.x += intent.dx * speed.maxLinear * dt;
      tr.y += intent.dy * speed.maxLinear * dt;
    }

    // 可选：在这里处理边界限制 (Clamp to Screen)
    // if (tr.x < 0) tr.x = 0; ...
  }
}
```

### 4. 初始化入口

在你的 React `App.tsx` 或游戏初始化入口 `main.ts` 中，不要忘记初始化 Manager。

```typescript
// ui/App.tsx 或 main.ts

useEffect(() => {
  const canvas = canvasRef.current;
  if (canvas) {
    // 绑定事件
    inputManager.init(canvas);
  }
}, []);
```

### 总结

这个重构方案完美合并了你旧版代码的需求：
1.  **Canvas 绑定**：通过 `inputManager.init(canvas)` 解决。
2.  **Touch/Mouse 统一**：通过 `pointerDelta` 解决，支持拖拽移动。
3.  **KeyB 炸弹**：通过 `BombIntent` 解决。
4.  **架构纯洁性**：DOM 事件依然留在 Manager 里，ECS System 只处理纯数据 (`Intent`)。


在使用 `SpeedStat` 时，我们需要将它加入到 `view` 的查询列表中，用它来替换掉硬编码的 `speed = 300`。

同时，结合之前我们设计的 **InputSystem**（区分了 `'velocity'` 键盘模式和 `'offset'` 触摸模式），`MovementSystem` 需要分别处理这两种移动逻辑。

以下是修改后的 `MovementSystem.ts`：

### 代码修改

```typescript
// src/engine/systems/MovementSystem.ts

import { Transform, Velocity, MoveIntent, SpeedStat, PlayerTag } from '../components';
import { World } from '../types';
import { view } from '../world';
import { STAGE_WIDTH, STAGE_HEIGHT, STAGE_PADDING } from '../configs/global'; // 假设你有全局配置

/**
 * 移动系统
 * 1. 消费 MoveIntent：根据 SpeedStat 计算目标速度 或 直接应用位移
 * 2. 应用物理：根据 Velocity 更新 Transform
 * 3. 边界限制：防止玩家跑出屏幕
 */
export function MovementSystem(w: World, dt: number) {
  // dt 通常是毫秒，转换为秒用于物理计算
  const dtSeconds = dt / 1000;

  // ==========================================
  // 1. 处理 "速度模式" (键盘/手柄)
  // 依赖: Velocity (存速度), MoveIntent (存意图), SpeedStat (存数值)
  // ==========================================
  for (const [id, [vel, intent, stat]] of view(w, [Velocity, MoveIntent, SpeedStat])) {
    
    // 只处理速度类型的意图
    if (intent.type === 'velocity') {
      let dx = intent.dx;
      let dy = intent.dy;
      
      // 归一化向量 (解决对角线移动比直线快的问题)
      // 如果长度 > 1 (例如两个键同时按)，则除以长度
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }

      // 【关键点】应用 SpeedStat.maxLinear
      // 目标速度 = 方向 * 最大速度
      vel.vx = dx * stat.maxLinear;
      vel.vy = dy * stat.maxLinear;
      
      // 处理角速度 (如果有旋转逻辑)
      // vel.vrot = ...
    }
  }

  // ==========================================
  // 2. 处理 "位移模式" (触摸/鼠标拖拽)
  // 依赖: Transform (改坐标), MoveIntent (存位移)
  // 这里的意图是 "绝对像素偏移"，不依赖 SpeedStat 和 dt
  // ==========================================
  for (const [id, [tr, intent]] of view(w, [Transform, MoveIntent])) {
    
    if (intent.type === 'offset') {
      // 直接应用 InputSystem 计算好的像素增量
      tr.x += intent.dx;
      tr.y += intent.dy;

      // 如果有速度组件，在触摸移动时应将速度归零，防止切回键盘时有惯性残留
      const vel = w.entities.get(id)?.find(c => c instanceof Velocity) as Velocity;
      if (vel) {
        vel.vx = 0;
        vel.vy = 0;
      }
    }
  }

  // ==========================================
  // 3. 物理积分 (位置 += 速度 * 时间)
  // 依赖: Transform, Velocity
  // ==========================================
  for (const [id, [tr, vel]] of view(w, [Transform, Velocity])) {
    tr.x += vel.vx * dtSeconds;
    tr.y += vel.vy * dtSeconds;

    // ==========================================
    // 4. 边界限制 (仅针对玩家)
    // ==========================================
    // 检查是否有 PlayerTag
    const isPlayer = w.entities.get(id)?.some(c => c instanceof PlayerTag);
    
    if (isPlayer) {
      // 假设飞船半径大概 24，留一点边距
      const margin = 24; 
      
      // 左右边界
      if (tr.x < margin) tr.x = margin;
      if (tr.x > 800 - margin) tr.x = 800 - margin; // 假设屏幕宽 800

      // 上下边界
      if (tr.y < margin) tr.y = margin;
      if (tr.y > 600 - margin) tr.y = 600 - margin; // 假设屏幕高 600
    }
  }
}
```

### 核心改动点解释

1.  **引入 `SpeedStat`**：
    *   在第一个循环的 `view` 中加入了 `SpeedStat`。
    *   使用 `stat.maxLinear` 替换了原来的硬编码 `const speed = 300`。
    *   这样，如果你在 `fighters.ts` 里把 `maxLinear` 改成 `10 * 60`，飞船就会变快，且无需修改系统代码。

2.  **区分意图类型 (`intent.type`)**：
    *   **`velocity` (键盘)**：根据 `SpeedStat` 计算 `vx/vy`，然后在第 3 步物理积分时更新位置。
    *   **`offset` (触摸)**：直接修改 `Transform` 的 `x/y`。因为触摸通常是 1:1 跟随手指，不需要物理积分（乘以 `dt`），否则会有延迟感或瞬移。

3.  **向量归一化 (Normalization)**：
    *   旧代码：`vx *= 0.7071` 是硬编码。
    *   新代码：`Math.sqrt(dx*dx + dy*dy)` 计算模长。这兼容了键盘（模长可能为 $\sqrt{2}$）和摇杆（模长可能为 0.5）。只有当模长 > 1 时才归一化，支持模拟摇杆的“轻推慢走”操作。

4.  **时间步长 (`dt`)**：
    *   统一将 `dt` (毫秒) 转换为 `dtSeconds` (秒)。因为 `SpeedStat` 中的速度单位通常是 **像素/秒**。