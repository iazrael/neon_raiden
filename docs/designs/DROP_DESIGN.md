这是一个非常完整的掉落系统设计。我们需要解决三个问题：**唯一标识符映射**、**掉落表配置**、以及**系统如何消费这些配置**。

下面是详细的实施方案：

### 1. 核心设计思路

1.  **ID 映射**：我们需要用字符串（如 `'pickup_vulcan'`）来代表蓝图对象。
2.  **权重算法**：掉落表使用“相对权重”而非百分比。例如 `{ item: 'none', weight: 90 }, { item: 'gold', weight: 10 }`，总权重 100，金币掉率为 10%。
3.  **空掉落**：在表中显式加入 `none` 或 `empty` 项，用来处理“什么都不掉”的情况。

---

### 2. 目录结构

建议在 `src/engine/configs/` 下整理结构：

```text
src/engine/
├─ configs/
│   ├─ ids.ts               # [新增] 所有物品的 String ID 定义
│   ├─ droptables/          # [新增] 掉落表配置
│   │   ├─ common.ts        # 普通怪
│   │   ├─ elite.ts         # 精英怪
│   │   ├─ boss.ts          # Boss
│   │   └─ index.ts         # 统一导出
│   └─ ...
├─ blueprints/
│   ├─ index.ts             # [修改] 注册 ID 到 蓝图 的映射
│   └─ ...
└─ systems/
    └─ LootSystem.ts        # [新增] 掉落逻辑系统
```

---

### 3. 第一步：定义 ID 和 注册蓝图 (Glue Code)

为了让字符串能找到具体的 Blueprint 对象，我们需要一个注册表。

**`src/engine/configs/ids.ts`** (定义常量防止手滑写错)
```typescript
export const PICKUP_ID = {
    // 武器
    VULCAN: 'pickup_weapon_vulcan',
    LASER: 'pickup_weapon_laser',
    MISSILE: 'pickup_weapon_missile',
    SHURIKEN: 'pickup_weapon_shuriken',
    TESLA: 'pickup_weapon_tesla',
    MAGMA: 'pickup_weapon_magma',
    WAVE: 'pickup_weapon_wave',
    PLASMA: 'pickup_weapon_plasma',

    // Buff
    POWER: 'pickup_buff_power',
    HP: 'pickup_buff_hp',
    BOMB: 'pickup_buff_bomb',
    OPTION: 'pickup_buff_option',
    INVINCIBILITY: 'pickup_buff_invincibility',
    TIME_SLOW: 'pickup_buff_time_slow',
    
    // 特殊
    NONE: 'none', // 什么都不掉
};
```

**`src/engine/blueprints/index.ts`** (建立映射)
```typescript
import { Blueprint } from './types';
import { PICKUP_ID } from '../configs/ids';
import * as WP from './pickups/weaponPickups'; // 你提供的武器蓝图文件
import * as BP from './pickups/buffPickups';   // 你提供的Buff蓝图文件

// 注册表：ID -> 蓝图对象
export const PICKUP_REGISTRY: Record<string, Blueprint> = {
    [PICKUP_ID.VULCAN]: WP.BLUEPRINT_POWERUP_VULCAN,
    [PICKUP_ID.LASER]: WP.BLUEPRINT_POWERUP_LASER,
    [PICKUP_ID.MISSILE]: WP.BLUEPRINT_POWERUP_MISSILE,
    [PICKUP_ID.SHURIKEN]: WP.BLUEPRINT_POWERUP_SHURIKEN,
    [PICKUP_ID.TESLA]: WP.BLUEPRINT_POWERUP_TESLA,
    [PICKUP_ID.MAGMA]: WP.BLUEPRINT_POWERUP_MAGMA,
    [PICKUP_ID.WAVE]: WP.BLUEPRINT_POWERUP_WAVE,
    [PICKUP_ID.PLASMA]: WP.BLUEPRINT_POWERUP_PLASMA,

    [PICKUP_ID.POWER]: BP.BLUEPRINT_POWERUP_POWER,
    [PICKUP_ID.HP]: BP.BLUEPRINT_POWERUP_HP,
    [PICKUP_ID.BOMB]: BP.BLUEPRINT_POWERUP_BOMB,
    [PICKUP_ID.OPTION]: BP.BLUEPRINT_POWERUP_OPTION,
    [PICKUP_ID.INVINCIBILITY]: BP.BLUEPRINT_POWERUP_INVINCIBILITY,
    [PICKUP_ID.TIME_SLOW]: BP.BLUEPRINT_POWERUP_TIME_SLOW,
};
```

---

### 4. 第二步：配置掉落表 (Configs)

这里配置掉落概率。

**`src/engine/configs/droptables/common.ts`**
```typescript
import { PICKUP_ID } from '../ids';

// 掉落项结构定义（为了类型安全）
export interface DropItemSpec {
    item: string;
    weight: number;
    min?: number; // 默认 1
    max?: number; // 默认 1
}

// 1. 杂兵掉落表 (90% 什么都不掉，8% 加分/回血，2% 武器)
export const DROPTABLE_COMMON: DropItemSpec[] = [
    { item: PICKUP_ID.NONE, weight: 900 }, 
    { item: PICKUP_ID.POWER, weight: 80 },
    { item: PICKUP_ID.HP, weight: 10 },
    { item: PICKUP_ID.BOMB, weight: 5 },
    { item: PICKUP_ID.VULCAN, weight: 5 }, // 偶尔掉个基础武器
];

// 2. 精英掉落表 (30% 不掉，50% Buff，20% 武器)
export const DROPTABLE_ELITE: DropItemSpec[] = [
    { item: PICKUP_ID.NONE, weight: 30 },
    { item: PICKUP_ID.POWER, weight: 30 },
    { item: PICKUP_ID.HP, weight: 10 },
    { item: PICKUP_ID.OPTION, weight: 10 },
    { item: PICKUP_ID.LASER, weight: 10 },
    { item: PICKUP_ID.MISSILE, weight: 10 },
];

// 3. Boss 掉落表 (100% 掉好东西)
export const DROPTABLE_BOSS: DropItemSpec[] = [
    { item: PICKUP_ID.TESLA, weight: 1 },
    { item: PICKUP_ID.MAGMA, weight: 1 },
    { item: PICKUP_ID.WAVE, weight: 1 },
    { item: PICKUP_ID.PLASMA, weight: 1 },
];
```

---

### 5. 第三步：在敌人蓝图中使用 (Usage)

在定义敌人时，挂载 `DropTable` 组件，并引用上面的配置。

```typescript
// src/engine/blueprints/enemies.ts
import { DROPTABLE_COMMON, DROPTABLE_ELITE } from '@/engine/configs/droptables/common';

export const BLUEPRINT_ENEMY_SCOUT: Blueprint = {
    Transform: { x: 0, y: 0, rot: 180 },
    Sprite: { texture: 'enemy_scout', ... },
    Health: { hp: 30, max: 30 },
    // 挂载掉落表组件，直接引用配置数组
    DropTable: { table: DROPTABLE_COMMON } 
};

export const BLUEPRINT_ENEMY_ELITE: Blueprint = {
    // ...
    DropTable: { table: DROPTABLE_ELITE }
};
```

---

### 6. 第四步：编写 LootSystem (Logic)

这是处理逻辑的地方：监听死亡事件 -> 查表 -> 随机 -> 生成道具。

**`src/engine/systems/LootSystem.ts`**

```typescript
import { World } from '@/engine/types';
import { DropTable, Transform } from '@/engine/components';
import { PICKUP_REGISTRY } from '@/engine/blueprints';
import { PICKUP_ID } from '@/engine/configs/ids';
import { spawnPickup } from '@/engine/factory';

export function LootSystem(world: World) {
    // 遍历本帧所有事件
    for (const event of world.events) {
        // 只处理死亡事件
        if (event.type !== 'DEATH') continue;

        const entityId = event.entityId;
        const entityComp = world.entities.get(entityId);
        if (!entityComp) continue;

        // 1. 查找该实体是否有 DropTable 组件
        // 注意：这里假设你有一个 helper 或者直接遍历查找
        const dropTableComp = entityComp.find(c => c instanceof DropTable) as DropTable;
        const transformComp = entityComp.find(Transform.check) as Transform;

        if (dropTableComp && transformComp) {
            rollAndSpawnLoot(world, dropTableComp.table, transformComp.x, transformComp.y);
        }
    }
}

/** 核心掉落算法 */
function rollAndSpawnLoot(
    world: World, 
    table: Array<{ item: string; weight: number; min?: number; max?: number }>, 
    x: number, 
    y: number
) {
    if (!table || table.length === 0) return;

    // 1. 计算总权重
    let totalWeight = 0;
    for (const entry of table) {
        totalWeight += entry.weight;
    }

    // 2. 随机取值
    let random = Math.random() * totalWeight;

    // 3. 查找命中项
    let selectedItem = null;
    for (const entry of table) {
        random -= entry.weight;
        if (random <= 0) {
            selectedItem = entry;
            break;
        }
    }

    // 4. 处理生成
    if (selectedItem && selectedItem.item !== PICKUP_ID.NONE) {
        const blueprint = PICKUP_REGISTRY[selectedItem.item];
        
        if (blueprint) {
            // 计算掉落数量 (默认为 1)
            const min = selectedItem.min ?? 1;
            const max = selectedItem.max ?? 1;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;

            for (let i = 0; i < count; i++) {
                // 如果掉落多个，稍微打散一下位置
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 20;
                
                spawnPickup(world, blueprint, x + offsetX, y + offsetY);
            }
        } else {
            console.warn(`LootSystem: No blueprint found for ID '${selectedItem.item}'`);
        }
    }
}
```

### 总结

1.  **定义 ID (`ids.ts`)**：让代码不依赖魔术字符串。
2.  **注册蓝图 (`blueprints/index.ts`)**：连接 ID 和 你的 `BLUEPRINT_POWERUP_XXX`。
3.  **配置表 (`droptables/common.ts`)**：用权重控制概率，记得加上 `weight: 90, item: 'none'` 这种项来控制掉落率。
4.  **敌人蓝图**：挂上 `DropTable` 组件。
5.  **LootSystem**：死的时候算权重，通过 `spawnPickup` 生成实体。