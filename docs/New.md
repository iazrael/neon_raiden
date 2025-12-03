前端 2D 太空射击游戏引擎设计文档（React + TypeScript）
目标：在浏览器里用 React 做 UI，用 TypeScript 写一套可配置、可回放、可测试的 2D 太空射击游戏引擎，并保证游戏循环与 React 生命周期完全解耦。
1. 整体架构
复制
┌-------------------------┐
│      React 渲染层        │  ← 只订阅快照，纯函数渲染
│  HUD / Menu / GameOver  │
└----------┬--------------┘
           │ 不可变快照流 (BehaviorSubject)
           ▼
┌-------------------------┐
│     引擎调度器            │  ← requestAnimationFrame 每帧调用
│  按顺序执行各 System      │
└----------┬--------------┘
           │ 读/写 World
           ▼
┌-------------------------┐
│   World（全局数据容器）    │  ← 实体 = 组件数组，可变
└----------┬--------------┘
           │ 配置化创建
           ▼
┌-------------------------┐
│   Blueprint + Factory    │  ← 不同战机、不同武器
└-------------------------┘
2. 目录结构
复制
src/
├─ engine/
│  ├─ index.ts              # 引擎入口：startEngine
│  ├─ store.ts              # snapshot$ 全局流
│  ├─ types.ts              # 所有组件、实体、快照类型
│  ├─ world.ts              # createWorld / addComponent / view 等工具
│  ├─ systems/
│  │  ├─ InputSystem.ts
│  │  ├─ MovementSystem.ts
│  │  ├─ WeaponSystem.ts
│  │  ├─ CollisionSystem.ts
│  │  └─ RenderSystem.ts     # 可选：canvas 直接画精灵
│  ├─ blueprints.ts          # 战机/敌人/子弹配置
│  └─ factory.ts             # spawnPlayer / spawnEnemy
├─ ui/
│  ├─ App.tsx
│  ├─ HUD.tsx
│  ├─ GameCanvas.tsx
│  └─ hooks/
│     └─ useEngine.ts
├─ index.tsx
└─ ...
3. 数据层设计
3.1 组件（纯数据）
TypeScript
复制
export interface Transform {
  x: number;
  y: number;
  rot: number;
}
export interface Velocity {
  vx: number;
  vy: number;
}
export interface Health {
  hp: number;
  max: number;
}
export interface Weapon {
  damage: number;
  cooldown: number; // ms
  curCD: number;    // ms
}
export interface Bullet {
  owner: EntityId;  // 谁射的
  speed: number;
}
export interface Sprite {
  texture: string;
}
export interface Shield {
  value: number;
  regen: number;    // 每秒回复量
}
3.2 实体与 World
TypeScript
复制
export type EntityId = number;
export interface World {
  entities: Map<EntityId, Component[]>;
  playerId: EntityId;
}
工具函数（保证 O(1) 查表）：
TypeScript
复制
export function createWorld(): World {
  return { entities: new Map(), playerId: 0 };
}
export function addComponent<T>(w: World, id: EntityId, comp: T) {
  if (!w.entities.has(id)) w.entities.set(id, []);
  w.entities.get(id)!.push(comp);
}
export function* view(w: World, types: any[]) {
  for (const [id, comps] of w.entities) {
    const bucket = types.map(t => comps.find(c => t.check(c))).filter(Boolean);
    if (bucket.length === types.length) yield [id, bucket] as const;
  }
}
3.3 不可变快照
TypeScript
复制
export interface GameSnapshot {
  t: number;
  player: {
    hp: number;
    maxHp: number;
    ammo: number;
    maxAmmo: number;
    shield: number;
    x: number;
    y: number;
  };
  bullets: Array<{ x: number; y: number }>;
  enemies: Array<{ x: number; y: number; hp: number }>;
}
生成函数（只读，不污染 World）：
TypeScript
复制
export function snapshot(world: World, t: number): GameSnapshot {
  const player = world.entities.get(world.playerId)!;
  const tr = player.find(Transform.check)!;
  const hl = player.find(Health.check)!;
  const wp = player.find(Weapon.check)!;
  return {
    t,
    player: {
      hp: hl.hp,
      maxHp: hl.max,
      ammo: wp.curCD === 0 ? 1 : 0, // 示例
      maxAmmo: 1,
      shield: player.find(Shield.check)?.value ?? 0,
      x: tr.x,
      y: tr.y,
    },
    bullets: [...view(world, [Bullet, Transform])].map(([, [b, t]) => ({ x: t.x, y: t.y })),
    enemies: [...view(world, [Health, Transform])]
      .filter(([id]) => id !== world.playerId)
      .map(([, [h, t]) => ({ x: t.x, y: t.y, hp: h.hp })),
  };
}
4. 引擎调度器
TypeScript
复制
import { snapshot$ } from './store';
import { World, snapshot } from './world';

let world: World = createWorld(); // 全局单例，可被外部替换用于回滚

export function startEngine(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let last = performance.now();

  function loop(t: number) {
    const dt = t - last;
    last = t;

    // 1. 各系统按顺序运行
    InputSystem(world, dt);
    WeaponSystem(world, dt);
    MovementSystem(world, dt);
    CollisionSystem(world, dt);

    // 2. 生成快照并广播
    snapshot$.next(snapshot(world, t));

    // 3. 可选：canvas 直接画
    RenderSystem(ctx, world);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
5. Systems（函数式，无内部状态）
5.1 MovementSystem
TypeScript
复制
export function MovementSystem(w: World, dt: number) {
  for (const [, [tr, vl]] of view(w, [Transform, Velocity])) {
    tr.x += vl.vx * dt;
    tr.y += vl.vy * dt;
  }
}
5.2 WeaponSystem（发射冷却 & 生成子弹）
TypeScript
复制
export function WeaponSystem(w: World, dt: number) {
  for (const [id, [wp, tr]] of view(w, [Weapon, Transform])) {
    if (wp.curCD > 0) wp.curCD -= dt;
    if (keys.Space && wp.curCD <= 0 && id === w.playerId) {
      wp.curCD = wp.cooldown;
      spawnBullet(w, tr.x, tr.y, wp.damage, id);
    }
  }
}
5.3 CollisionSystem（受伤 & 销毁）
TypeScript
复制
export function CollisionSystem(w: World, dt: number) {
  for (const [bid, [bl, bt]] of view(w, [Bullet, Transform])) {
    for (const [eid, [hl, et]] of view(w, [Health, Transform])) {
      if (hl.hp <= 0) continue;
      if (distance(bt, et) < HIT_RADIUS) {
        hl.hp -= bl.damage;
        destroyEntity(w, bid); // 子弹消失
        if (hl.hp <= 0) destroyEntity(w, eid);
      }
    }
  }
}
6. 配置化创建（Blueprint & Factory）
blueprints.ts
TypeScript
复制
import { Transform, Health, Weapon, Shield, Sprite } from './types';

export const FIGHTER_LIGHT = {
  [Transform]: { x: 0, y: 0, rot: 0 },
  [Health]: { hp: 80, max: 80 },
  [Weapon]: { damage: 10, cooldown: 200, curCD: 0 },
  [Sprite]: { texture: 'fighter_light.png' },
};

export const BOMBER_HEAVY = {
  [Transform]: { x: 0, y: 0, rot: 0 },
  [Health]: { hp: 250, max: 250 },
  [Weapon]: { damage: 40, cooldown: 600, curCD: 0 },
  [Shield]: { value: 100, regen: 20 },
  [Sprite]: { texture: 'bomber.png' },
};
factory.ts
TypeScript
复制
import { world, addComponent, generateId } from './world';

export function spawnPlayer(bp: any): EntityId {
  const id = generateId();
  for (const [Comp, data] of Object.entries(bp)) {
    addComponent(world, id, data);
  }
  world.playerId = id;
  return id;
}
入口调用
TypeScript
复制
const bp = new URLSearchParams(location.search).get('ship') === 'heavy'
  ? BOMBER_HEAVY : FIGHTER_LIGHT;
spawnPlayer(bp);
startEngine(canvas);
7. React 层（只订阅快照）
useEngine.ts
TypeScript
复制
import { useEffect, useState } from 'react';
import { snapshot$ } from '../engine/store';

export function useEngine() {
  const [snap, setSnap] = useState(snapshot$.value);
  useEffect(() => {
    const sub = snapshot$.subscribe(setSnap);
    return () => sub.unsubscribe();
  }, []);
  return snap;
}
App.tsx
TypeScript
复制
export default function App() {
  const snap = useEngine();
  if (!snap) return <Loading />;

  return (
    <div className="game">
      <GameCanvas />
      <HUD player={snap.player} />
    </div>
  );
}
HUD.tsx
TypeScript
复制
export function HUD({ player }: { player: GameSnapshot['player'] }) {
  return (
    <div className="hud">
      <Bar label="HP" cur={player.hp} max={player.maxHp} color="#f66" />
      <Bar label="Shield" cur={player.shield} max={100} color="#0af" />
    </div>
  );
}
8. 性能与扩展
表格
复制
需求	方案
回放	把每帧 snapshot(world, t) 压入环形数组；拖动时间轴直接 world = history[tick]
预测 & 回滚	复制 World → 做客户端预测 → 收到服务器权威帧再覆盖
多线程	把 World 拆成 SOA 块，System 在 Worker 里跑，主线程只拿快照
画布性能	使用 OffscreenCanvas + WebWorker；React 端只画 HUD
状态节流	snapshot$.pipe(auditTime(50)) 或 distinctUntilChanged(keyOf('player.shield'))
9. 常见坑
把实体当 React state → 每帧 setState 卡爆。
在组件里 requestAnimationFrame → 生命周期反复挂载导致掉帧。
用 useRef 存最新快照但 UI 不刷新 → 需 useSyncExternalStore 或强制渲染。
把 canvas 精灵也用 JSX 画 → 性能差且难维护；画布层保持原生 API 或 Pixi/Three。
10. 一句话总结
React 不是游戏引擎，它最适合做仪表盘。
把「世界」做成快照流，React 只订阅 → 映射 → 纯函数渲染，即可在保持函数式、可测试、可配置的前提下，让「战机配置」「武器装配」「受伤判定」全部自然落地，并随时扩展回放、预测、多线程等高级功能。