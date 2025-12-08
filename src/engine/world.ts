import { World, EntityId, Component } from './types';
import { Event } from './events';

// ========== 世界与工具 ==========

export function createWorld(): World {
    return {
        time: 0,    // 当前时间
        entities: new Map(),
        events: [],
        score: 0,       // 当前分数
        level: 1,        // 关卡序号
        playerId: 0,    // 玩家ID
        playerLevel: 1,  // 战机等级
        difficulty: 1,    // 动态倍率
        spawnCredits: 0,  // 当前余额
        spawnTimer: 0,    // 用来控制刷怪检测频率
        enemyCount: 0     // 当前敌人数量
    };
}

// ========== ID 生成器 ==========

let nextId = 1;
const recycled: number[] = [];
export function generateId(): EntityId {
    return recycled.pop() ?? nextId++;
}
export function freeId(id: EntityId) {
    recycled.push(id);
}

// ========== 视图迭代器 ==========
// ==========================================
// 类型魔法区域
// ==========================================

// 1. 定义一个带泛型的构造函数类型，用于提取实例类型
//    注意：这里如果不重新定义一个带泛型的 Ctor，TS 很难推导出具体的 T
type Ctor<T = any> = new (...args: any[]) => T;

// 2. 核心映射类型：把构造函数元组 [C1, C2] 转换为实例元组 [I1, I2]
type InstanceTuple<T extends Ctor[]> = {
    [K in keyof T]: T[K] extends Ctor<infer U> ? U : never;
};

// ==========================================
// 视图函数
// ==========================================

/**
 * 视图迭代器
 * @param w World 对象
 * @param types 组件构造函数数组（元组）
 * 
 * 使用 [...T] 语法强制 TypeScript 将输入推导为元组，而不是数组。
 * 这样 [Transform, Velocity] 就会被识别为 [Transform, Velocity]，
 * 而不是 (Transform | Velocity)[]
 */
export function* view<T extends Ctor[]>(
    w: World, 
    types: [...T]
): Iterable<[EntityId, InstanceTuple<T>]> {
    
    // 缓存长度，减少循环内的访问
    const len = types.length;

    for (const [id, comps] of w.entities) {
        // 预分配数组，但在 JS 中 push 通常也够快
        const bucket: any[] = [];
        let hasAll = true;

        for (let i = 0; i < len; i++) {
            const Ctor = types[i];
            // 查找该实体是否有对应的组件
            const found = comps.find(c => c instanceof Ctor);
            
            if (!found) {
                hasAll = false;
                break;
            }
            bucket.push(found);
        }

        if (hasAll) {
            // 强制类型断言：我们确信 bucket 里按顺序装好了对应的组件实例
            yield [id, bucket as unknown as InstanceTuple<T>];
        }
    }
}
// ========== 添加组件 ==========
export function addComponent<T extends Component>(w: World, id: EntityId, comp: T) {
    if (!w.entities.has(id)) w.entities.set(id, []);
    w.entities.get(id)!.push(comp);
}

// ========== 删除实体 ==========
export function removeEntity(w: World, id: EntityId) {
    w.entities.delete(id);
}

// ========== 事件推送 ==========
export function pushEvent(w: World, event: Event) {
    w.events.push(event);
}

// ========== 对象池 ==========

// 与 world 同文件即可
export const pools: Record<string, Component[][]> = {
    bullet: [],
    enemy: [],
    pickup: [],
};

/** 把一整条组件数组回池（只清空引用，不删实体） */
export function returnToPool(pool: string, comps: Component[]) {
    comps.length = 0;                 // 清空引用，帮助 GC
    pools[pool].push(comps);          // 回池
}

/** 从池里拿一条空数组，无池则新建 */
export function getFromPool(pool: string): Component[] {
    return pools[pool].pop() ?? [];
}