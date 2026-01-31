import { EntityId, Component, GameStatus, ComboState } from './types';
import { Event as GameEvent } from './events';
import { BOSS_SPAWN_TIME } from './configs';


/** 相机状态 */
export interface CameraState {
    x: number;
    y: number;
    shakeX: number;
    shakeY: number;
    zoom: number;
    /** 震屏剩余时间（毫秒） */
    shakeTimer: number;
    /** 震屏强度 */
    shakeIntensity: number;
}

/** 渲染状态 */
export interface RenderState {
    camera: CameraState;
}

/** Boss 刷怪状态 */
export interface BossSpawnState {
    /** Boss 出现时间（毫秒），默认 60000 (60秒) */
    timer: number;
    /** Boss 是否已刷出 */
    spawned: boolean;
}

// 世界接口
export interface World {
    // 实体集合
    entities: Map<EntityId, Component[]>;
    // 玩家ID
    playerId: EntityId;
    // 视觉特效实体 ID
    visualEffectId: EntityId;
    // 事件队列
    events: GameEvent[];
    // 游戏时间
    time: number;
    // 全局进度
    score: number;
    // 关卡序号
    level: number;
    // 战机等级
    playerLevel: number;
    // 动态倍率
    difficulty: number;
    // 当前余额
    spawnCredits: number;
    // 刷怪检测频率
    spawnTimer: number;
    // 当前敌人数量
    enemyCount: number;
    // 画布宽
    width: number;
    // 画布高
    height: number;
    // 刷怪系统是否已初始化（用于赠送初始点数）
    spawnInitialized: boolean;

    // 时间缩放（用于 TIME_SLOW 等效果，1.0 = 正常速度）
    timeScale: number;

    // UI状态字段
    status?: GameStatus;
    maxLevelReached?: number;
    comboState?: ComboState;

    // 渲染状态（由 CameraSystem/RenderSystem 共享）
    renderState: RenderState;

    // Boss 刷怪状态
    bossState: BossSpawnState;
}


// ========== 世界与工具 ==========

export function createWorld(): World {
    return {
        time: 0,
        entities: new Map(),
        events: [],
        score: 0,
        level: 1,
        playerId: 0,
        visualEffectId: 0,
        playerLevel: 1,
        difficulty: 1,
        spawnCredits: 0,
        spawnTimer: 0,
        enemyCount: 0,
        timeScale: 1,
        width: 0,
        height: 0,
        spawnInitialized: false,
        renderState: {
            camera: {
                x: 0,
                y: 0,
                shakeX: 0,
                shakeY: 0,
                zoom: 1.0,
                shakeTimer: 0,
                shakeIntensity: 0,
            },
        },
        bossState: {
            timer: BOSS_SPAWN_TIME,
            spawned: false,
        },
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
 * @example
 * ```ts
 * // 使用 view 查询 TimeSlow 实体
 * const timeSlowEntities = [...view(world, [TimeSlow])];
 * ```
 * ```ts
 * for (const [_id, [particle, lifetime], comps] of view(world, [Particle, Lifetime])) {
 *      // ...
 * }
 * ```
 * 
 */
export function* view<T extends Ctor[]>(
    w: World,
    types: [...T]
): Iterable<[EntityId, InstanceTuple<T>, Component[]]> {
    
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
            yield [id, bucket as unknown as InstanceTuple<T>, comps];
        }
    }
}
// ========== 添加组件 ==========
export function addComponent<T extends Component>(w: World, id: EntityId, comp: T) {
    if (!w.entities.has(id)) w.entities.set(id, []);
    w.entities.get(id)!.push(comp);
}

// ========== 移除组件 ==========
export function removeComponent<T extends Component>(w: World, id: EntityId, comp: T) {
    const comps = w.entities.get(id);
    if (comps) {
        const index = comps.indexOf(comp);
        if (index !== -1) {
            comps.splice(index, 1);
        }
    }
}

// ======= 判断是否存在指定组件 =======
export function hasComponent<T extends Component>(w: World, id: EntityId, compCtor: Ctor<T>): boolean {
    const comps = w.entities.get(id);
    if (comps) {
        return comps.some(c => c instanceof compCtor);
    }
    return false;
}


/**
 * 一次性获取实体的多个组件（类型安全）
 *
 * @param w World 对象
 * @param id 实体ID
 * @param types 组件构造函数数组
 * @returns 组件元组（未找到的组件位置为 undefined）
 *
 * @example
 * ```ts
 * // 一次性获取
 * const [entrance, speedStat, moveIntent] = getComponents(
 *     world,
 *     bossId,
 *     [BossEntrance, SpeedStat, MoveIntent]
 * );
 * // entrance: BossEntrance | undefined
 * // speedStat: SpeedStat | undefined
 * // moveIntent: MoveIntent | undefined
 * ```
 */
export function getComponents<T extends Ctor[]>(
    w: World,
    id: EntityId,
    types: [...T]
): { [K in keyof T]: T[K] extends Ctor<infer U> ? U | undefined : undefined } {
    const comps = w.entities.get(id);
    if (!comps) {
        // 实体不存在，返回全undefined数组
        return new Array(types.length).fill(undefined) as any;
    }

    const result: any[] = [];
    for (const Ctor of types) {
        const found = comps.find(c => c instanceof Ctor);
        result.push(found ?? undefined);
    }

    return result as any;
}

/**
 * 按类型移除组件（类型安全）
 *
 * @param w World 对象
 * @param id 实体ID
 * @param types 组件构造函数数组
 * @returns 每个组件类型是否成功移除
 *
 * @example
 * ```ts
 * // 移除单个组件
 * const [removed] = removeTypes(world, bossId, [BossEntrance]);
 *
 * // 批量移除多个组件
 * const results = removeTypes(
 *     world,
 *     bossId,
 *     [BossEntrance, SpeedStat, MoveIntent]
 * );
 * // results: [boolean, boolean, boolean]
 * ```
 */
export function removeTypes<T extends Ctor[]>(
    w: World,
    id: EntityId,
    types: [...T]
): { [K in keyof T]: boolean } {
    const comps = w.entities.get(id);
    if (!comps) {
        // 实体不存在，返回全false数组
        return new Array(types.length).fill(false) as any;
    }

    const result: boolean[] = [];

    for (const Ctor of types) {
        const index = comps.findIndex(c => c instanceof Ctor);
        if (index !== -1) {
            comps.splice(index, 1);
            result.push(true);
        } else {
            result.push(false);
        }
    }

    return result as any;
}


// ========== 获取指定实体 ==========
export function getEntity(w: World, id: EntityId): Component[] | null {
    return w.entities.get(id) || null;
}

// ========== 删除实体 ==========
export function removeEntity(w: World, id: EntityId) {
    w.entities.delete(id);
}

// ========== 事件推送 ==========
export function pushEvent(w: World, event: GameEvent) {
    w.events.push(event);
}

/**
 * 获取指定类型的事件（类型安全）
 * @param w World 对象
 * @param eventType 事件类型（使用 EventTags，如 EventTags.Hit）
 * @returns 匹配的事件数组
 *
 * @example
 * ```ts
 * // 旧方式（需要硬编码字符串）
 * const hitEvents = world.events.filter((e): e is HitEvent => e.type === 'Hit');
 *
 * // 新方式（类型安全）
 * const hitEvents = getEvents(world, EventTags.Hit); // 类型自动推断为 HitEvent[]
 * ```
 */
export function getEvents<T extends GameEvent>(
    w: World,
    eventType: T['type']
): T[] {
    return w.events.filter((e): e is T => e.type === eventType);
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