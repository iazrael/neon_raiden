/**
 * 碰撞检测系统 (CollisionSystem)
 *
 * 职责：
 * - 检测玩家子弹与敌人的碰撞
 * - 检测敌人子弹与玩家的碰撞
 * - 检测玩家与敌人的碰撞
 * - 检测子弹与子弹的碰撞（玩家子弹和敌人子弹互击）
 * - 检测玩家与拾取物品的碰撞
 * - 生成 HitEvent、PickupEvent
 *
 * 系统类型：交互层
 * 执行顺序：P4 - 在 MovementSystem 之后，DamageResolutionSystem 之前
 *
 * 优化策略：
 * - 空间哈希网格：将复杂度从 O(N²) 降至 O(N·K)
 * - 碰撞层过滤：使用位掩码预过滤不需要检测的实体对
 * - 组件缓存：减少重复的 find 操作
 */

import { EntityId, Component } from '../types';
import { Transform, HitBox, Bullet, PlayerTag, EnemyTag, PickupItem, InvulnerableState, DestroyTag } from '../components';
import { CollisionLayer, shouldCheckCollision } from '../types/collision';
import { pushEvent, World } from '../world';
import { HitEvent, PickupEvent } from '../events';

// ==================== 空间哈希网格 ====================

/**
 * 空间网格结构
 * 用于优化碰撞检测性能
 */
interface SpatialGrid {
    /** 网格单元大小（像素） */
    cellSize: number;
    /** 网格单元 -> 实体ID列表 */
    cells: Map<string, EntityId[]>;
    /** 实体 -> 所在网格单元列表（用于跨网格实体） */
    entityCells: Map<EntityId, string[]>;
}

/**
 * 创建空间网格
 */
function createSpatialGrid(cellSize: number = 128): SpatialGrid {
    return {
        cellSize,
        cells: new Map(),
        entityCells: new Map(),
    };
}

/**
 * 清空网格
 */
function clearGrid(grid: SpatialGrid): void {
    grid.cells.clear();
    grid.entityCells.clear();
}


/**
 * 获取实体占据的所有网格单元
 */
function getOccupiedCells(hitBox: HitBox, transform: Transform, cellSize: number): string[] {
    const cells: string[] = [];

    // 根据形状计算边界
    let minX: number, maxX: number, minY: number, maxY: number;

    if (hitBox.shape === 'circle' || hitBox.shape === 'capsule') {
        const radius = hitBox.radius ?? hitBox.capRadius ?? 20;
        minX = Math.floor((transform.x - radius) / cellSize);
        maxX = Math.floor((transform.x + radius) / cellSize);
        minY = Math.floor((transform.y - radius) / cellSize);
        maxY = Math.floor((transform.y + radius) / cellSize);
    } else { // rect
        const hw = hitBox.halfWidth ?? 20;
        const hh = hitBox.halfHeight ?? 20;
        minX = Math.floor((transform.x - hw) / cellSize);
        maxX = Math.floor((transform.x + hw) / cellSize);
        minY = Math.floor((transform.y - hh) / cellSize);
        maxY = Math.floor((transform.y + hh) / cellSize);
    }

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            cells.push(`${x},${y}`);
        }
    }
    return cells;
}

/**
 * 获取相邻网格单元的键（3x3 区域）
 */
function getNeighborKeys(key: string): string[] {
    const [cx, cy] = key.split(',').map(Number);
    const neighbors: string[] = [];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            neighbors.push(`${cx + dx},${cy + dy}`);
        }
    }
    return neighbors;
}

// ==================== 组件缓存 ====================

/**
 * 碰撞检测用的组件缓存
 * 减少重复的 find 操作
 */
interface CollisionCache {
    hitBox: HitBox;
    transform: Transform;
    layer: CollisionLayer;
    entityList: Component[];
}

// 全局缓存（每帧重建）
const collisionCache = new Map<EntityId, CollisionCache>();

/**
 * 构建组件缓存
 * 现在直接从 HitBox.layer 读取碰撞层，无需推断
 */
function buildCollisionCache(world: World): Map<EntityId, CollisionCache> {
    collisionCache.clear();

    for (const [id, comps] of world.entities) {
        const hitBox = comps.find(HitBox.check) as HitBox | undefined;
        const transform = comps.find(Transform.check) as Transform | undefined;

        if (!hitBox || !transform) continue;

        // 直接从 HitBox 读取碰撞层
        const layer = hitBox.layer;

        collisionCache.set(id, { hitBox, transform, layer, entityList: comps });
    }

    return collisionCache;
}

// ==================== 碰撞对 ====================

/**
 * 碰撞对
 */
interface CollisionPair {
    id1: EntityId;
    id2: EntityId;
    type: 'bullet_hit_enemy' | 'bullet_hit_player' | 'player_hit_enemy' | 'bullet_collision' | 'player_pickup';
}

/**
 * 复用的碰撞对数组，避免每帧分配
 */
const collisionPairsPool: CollisionPair[] = [];
let collisionCount = 0;

// ==================== 主系统 ====================

/**
 * 空间网格实例
 */
const spatialGrid = createSpatialGrid(128);

/**
 * 碰撞检测系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function CollisionSystem(world: World, _dt: number): void {
    // 清空上一帧的事件队列（保持原有行为）
    world.events.length = 0;

    // 1. 构建组件缓存
    const cache = buildCollisionCache(world);

    // 2. 重建空间网格
    rebuildSpatialGrid(cache);

    // 3. 收集碰撞对
    collisionCount = 0;
    collectCollisions(cache);

    // 4. 处理所有碰撞
    for (let i = 0; i < collisionCount; i++) {
        handleCollision(world, collisionPairsPool[i]);
    }
}

/**
 * 重建空间网格
 */
function rebuildSpatialGrid(cache: Map<EntityId, CollisionCache>): void {
    clearGrid(spatialGrid);

    for (const [id, { hitBox, transform }] of cache) {
        const cells = getOccupiedCells(hitBox, transform, spatialGrid.cellSize);
        spatialGrid.entityCells.set(id, cells);

        for (const cell of cells) {
            let entities = spatialGrid.cells.get(cell);
            if (!entities) {
                entities = [];
                spatialGrid.cells.set(cell, entities);
            }
            entities.push(id);
        }
    }
}

/**
 * 收集碰撞对
 */
function collectCollisions(cache: Map<EntityId, CollisionCache>): void {
    // 用于避免重复检测的集合（只存较小的 ID）
    const checked = new Set<string>();

    for (const [id1, cache1] of cache) {
        const cells = spatialGrid.entityCells.get(id1);
        if (!cells) continue;

        // 获取所有相邻网格
        for (const cellKey of cells) {
            const neighbors = getNeighborKeys(cellKey);

            for (const neighborKey of neighbors) {
                const cellEntities = spatialGrid.cells.get(neighborKey);
                if (!cellEntities) continue;

                for (const id2 of cellEntities) {
                    // 跳过自己
                    if (id1 === id2) continue;

                    // 确保只检测一次（id1 < id2）
                    if (id1 > id2) continue;

                    // 检查是否已检测过
                    const pairKey = `${id1},${id2}`;
                    if (checked.has(pairKey)) continue;
                    checked.add(pairKey);

                    const cache2 = cache.get(id2);
                    if (!cache2) continue;

                    // 碰撞层过滤
                    if (!shouldCheckCollision(cache1.layer, cache2.layer)) continue;

                    // 检测碰撞
                    if (!isColliding(cache1.transform, cache1.hitBox, cache2.transform, cache2.hitBox)) {
                        continue;
                    }

                    // 确定碰撞类型
                    const type = determineCollisionType(cache1.layer, cache2.layer);
                    if (type) {
                        // 扩展池
                        if (collisionCount >= collisionPairsPool.length) {
                            collisionPairsPool.push({ id1: 0, id2: 0, type: 'bullet_hit_enemy' });
                        }
                        collisionPairsPool[collisionCount++] = { id1, id2, type };
                    }
                }
            }
        }
    }
}

/**
 * 确定碰撞类型
 */
function determineCollisionType(
    layer1: CollisionLayer,
    layer2: CollisionLayer
): CollisionPair['type'] | null {
    // 基于碰撞层快速判断
    const l1 = layer1;
    const l2 = layer2;

    // 子弹击中敌人
    if ((l1 === CollisionLayer.PlayerBullet && l2 === CollisionLayer.Enemy) ||
        (l2 === CollisionLayer.PlayerBullet && l1 === CollisionLayer.Enemy)) {
        return 'bullet_hit_enemy';
    }

    // 子弹击中玩家
    if ((l1 === CollisionLayer.EnemyBullet && l2 === CollisionLayer.Player) ||
        (l2 === CollisionLayer.EnemyBullet && l1 === CollisionLayer.Player)) {
        return 'bullet_hit_player';
    }

    // 玩家撞到敌人
    if ((l1 === CollisionLayer.Player && l2 === CollisionLayer.Enemy) ||
        (l2 === CollisionLayer.Player && l1 === CollisionLayer.Enemy)) {
        return 'player_hit_enemy';
    }

    // 子弹互击
    if ((l1 === CollisionLayer.PlayerBullet && l2 === CollisionLayer.EnemyBullet) ||
        (l2 === CollisionLayer.PlayerBullet && l1 === CollisionLayer.EnemyBullet)) {
        return 'bullet_collision';
    }

    // 玩家拾取道具
    if ((l1 === CollisionLayer.Player && l2 === CollisionLayer.Pickup) ||
        (l2 === CollisionLayer.Player && l1 === CollisionLayer.Pickup)) {
        return 'player_pickup';
    }

    return null;
}

// ==================== 形状碰撞检测 ====================

/**
 * 检测两个碰撞盒是否重叠
 * 支持：circle-circle, circle-rect, rect-rect
 * 注意：capsule 暂时用其包围圆近似处理
 */
function isColliding(
    t1: Transform, h1: HitBox,
    t2: Transform, h2: HitBox
): boolean {
    const shape1 = h1.shape;
    const shape2 = h2.shape;

    // 圆形 vs 圆形
    if (shape1 === 'circle' && shape2 === 'circle') {
        return circleVsCircle(t1, h1, t2, h2);
    }

    // 圆形 vs 矩形
    if (shape1 === 'circle' && shape2 === 'rect') {
        return circleVsRect(t1, h1, t2, h2);
    }
    if (shape1 === 'rect' && shape2 === 'circle') {
        return circleVsRect(t2, h2, t1, h1);
    }

    // 矩形 vs 矩形
    if (shape1 === 'rect' && shape2 === 'rect') {
        return rectVsRect(t1, h1, t2, h2);
    }

    // 胶囊暂时用包围圆近似（使用 capRadius 作为半径）
    if (shape1 === 'capsule' || shape2 === 'capsule') {
        const approxH1 = shape1 === 'capsule' ? { ...h1, shape: 'circle' as const, radius: h1.capRadius ?? 20 } : h1;
        const approxH2 = shape2 === 'capsule' ? { ...h2, shape: 'circle' as const, radius: h2.capRadius ?? 20 } : h2;
        return isColliding(t1, approxH1, t2, approxH2);
    }

    return false;
}

/**
 * 圆形 vs 圆形碰撞
 */
function circleVsCircle(t1: Transform, h1: HitBox, t2: Transform, h2: HitBox): boolean {
    const r1 = h1.radius ?? 20;
    const r2 = h2.radius ?? 20;
    const dx = t1.x - t2.x;
    const dy = t1.y - t2.y;
    const distanceSq = dx * dx + dy * dy;
    const radiusSum = r1 + r2;
    return distanceSq <= radiusSum * radiusSum;
}

/**
 * 圆形 vs 矩形碰撞
 */
function circleVsRect(tCircle: Transform, hCircle: HitBox, tRect: Transform, hRect: HitBox): boolean {
    const radius = hCircle.radius ?? 20;
    const halfWidth = hRect.halfWidth ?? 20;
    const halfHeight = hRect.halfHeight ?? 20;

    // 找到矩形上距离圆心最近的点
    const closestX = Math.max(tRect.x - halfWidth, Math.min(tCircle.x, tRect.x + halfWidth));
    const closestY = Math.max(tRect.y - halfHeight, Math.min(tCircle.y, tRect.y + halfHeight));

    // 计算圆心到最近点的距离
    const dx = tCircle.x - closestX;
    const dy = tCircle.y - closestY;
    const distanceSq = dx * dx + dy * dy;

    return distanceSq <= radius * radius;
}

/**
 * 矩形 vs 矩形碰撞（AABB）
 */
function rectVsRect(t1: Transform, h1: HitBox, t2: Transform, h2: HitBox): boolean {
    const halfWidth1 = h1.halfWidth ?? 20;
    const halfHeight1 = h1.halfHeight ?? 20;
    const halfWidth2 = h2.halfWidth ?? 20;
    const halfHeight2 = h2.halfHeight ?? 20;

    // AABB 检测
    return (
        t1.x - halfWidth1 <= t2.x + halfWidth2 &&
        t1.x + halfWidth1 >= t2.x - halfWidth2 &&
        t1.y - halfHeight1 <= t2.y + halfHeight2 &&
        t1.y + halfHeight1 >= t2.y - halfHeight2
    );
}

// ==================== 碰撞处理 ====================

/**
 * 处理碰撞
 */
function handleCollision(world: World, collision: CollisionPair): void {
    const { id1, id2, type } = collision;
    const comps1 = world.entities.get(id1);
    const comps2 = world.entities.get(id2);

    if (!comps1 || !comps2) return;

    if (type === 'bullet_hit_enemy' || type === 'bullet_hit_player') {
        handleBulletHit(world, id1, id2, comps1, comps2);
    } else if (type === 'player_hit_enemy') {
        handlePlayerHitEnemy(world, id1, id2, comps1, comps2);
    } else if (type === 'bullet_collision') {
        handleBulletCollision(world, comps1, comps2);
    } else if (type === 'player_pickup') {
        handlePlayerPickup(world, id1, id2, comps1, comps2);
    }
}

/**
 * 处理子弹击中
 */
function handleBulletHit(
    world: World,
    id1: EntityId,
    id2: EntityId,
    comps1: Component[],
    comps2: Component[]
): void {
    const bullet1 = comps1.find(Bullet.check) as Bullet | undefined;
    const bullet2 = comps2.find(Bullet.check) as Bullet | undefined;

    let attackerId: EntityId;
    let victimId: EntityId;
    let bullet: Bullet | undefined;
    let victimComps: Component[];
    let bulletComps: Component[];

    if (bullet1) {
        attackerId = bullet1.owner;
        victimId = id2;
        bullet = bullet1;
        victimComps = comps2;
        bulletComps = comps1;
    } else {
        attackerId = bullet2!.owner;
        victimId = id1;
        bullet = bullet2;
        victimComps = comps1;
        bulletComps = comps2;
    }

    // 检查受害者是否处于无敌状态
    if (victimComps.some(InvulnerableState.check)) {
        return; // 无敌状态，跳过伤害
    }

    // 从子弹组件获取伤害值
    const damage = bullet?.damage ?? 10;

    // 获取受害者位置
    const victimTransform = victimComps.find(Transform.check) as Transform;
    if (!victimTransform) return;

    // 生成 HitEvent（bloodLevel 由 DamageResolutionSystem 根据伤害值计算）
    const hitEvent: HitEvent = {
        type: 'Hit',
        pos: { x: victimTransform.x, y: victimTransform.y },
        damage,
        owner: attackerId,
        victim: victimId
    };
    pushEvent(world, hitEvent);

    // 处理子弹穿透和销毁
    consumeBullet(bulletComps, bullet);
}

/**
 * 消耗子弹（处理穿透和销毁）
 */
function consumeBullet(bulletComps: Component[], bullet: Bullet | undefined): void {
    if (!bullet) {
        markForDestroy(bulletComps, 'consumed', 'bullet');
        return;
    }

    if (bullet.pierceLeft > 0) {
        bullet.pierceLeft--;
        if (bullet.pierceLeft === 0) {
            markForDestroy(bulletComps, 'consumed', 'bullet');
        }
    } else {
        markForDestroy(bulletComps, 'consumed', 'bullet');
    }
}

/**
 * 标记实体销毁
 */
function markForDestroy(entityComps: Component[], reason: string, pool?: string): void {
    if (!entityComps.some(DestroyTag.check)) {
        entityComps.push(new DestroyTag({
            reason: reason as 'timeout' | 'killed' | 'consumed' | 'offscreen',
            reusePool: pool as 'bullet' | 'enemy' | 'pickup'
        }));
    }
}

/**
 * 处理玩家撞到敌人
 */
function handlePlayerHitEnemy(
    world: World,
    id1: EntityId,
    id2: EntityId,
    comps1: Component[],
    comps2: Component[]
): void {
    const player1 = comps1.find(PlayerTag.check);
    const enemy2 = comps2.find(EnemyTag.check);

    let playerId: EntityId;
    let enemyId: EntityId;
    let playerComps: Component[];
    let enemyComps: Component[];

    if (player1 && enemy2) {
        playerId = id1;
        enemyId = id2;
        playerComps = comps1;
        enemyComps = comps2;
    } else {
        playerId = id2;
        enemyId = id1;
        playerComps = comps2;
        enemyComps = comps1;
    }

    // 检查玩家是否无敌
    if (playerComps.some(InvulnerableState.check)) {
        return; // 玩家无敌，不受到伤害
    }

    // 获取敌人位置
    const enemyTransform = enemyComps.find(Transform.check);
    if (!enemyTransform) return;

    // 生成 HitEvent（玩家受到冲撞伤害，bloodLevel 由 DamageResolutionSystem 根据伤害值计算）
    const hitEvent: HitEvent = {
        type: 'Hit',
        pos: { x: enemyTransform.x, y: enemyTransform.y },
        damage: 20, // FIXME: 冲撞伤害值可配置
        owner: enemyId,
        victim: playerId
    };
    pushEvent(world, hitEvent);

    // 敌人也受到冲撞伤害
    const enemyHitEvent: HitEvent = {
        type: 'Hit',
        pos: { x: enemyTransform.x, y: enemyTransform.y },
        damage: 10, // FIXME: 冲撞伤害值可配置
        owner: playerId,
        victim: enemyId
    };
    pushEvent(world, enemyHitEvent);
}

/**
 * 处理子弹互击
 */
function handleBulletCollision(
    _world: World,
    comps1: Component[],
    comps2: Component[]
): void {
    markForDestroy(comps1, 'consumed', 'bullet');
    markForDestroy(comps2, 'consumed', 'bullet');
}

/**
 * 处理玩家拾取道具
 */
function handlePlayerPickup(
    world: World,
    id1: EntityId,
    id2: EntityId,
    comps1: Component[],
    comps2: Component[]
): void {
    const player1 = comps1.find(PlayerTag.check);
    const pickup1 = comps1.find(PickupItem.check);
    const pickup2 = comps2.find(PickupItem.check);

    let playerId: EntityId;
    let pickup: PickupItem;
    let pickupTransform: Transform;
    let pickupComps: Component[];

    if (player1 && pickup2) {
        playerId = id1;
        pickup = pickup2;
        pickupTransform = comps2.find(Transform.check) as Transform;
        pickupComps = comps2;
    } else {
        playerId = id2;
        pickup = pickup1!;
        pickupTransform = comps1.find(Transform.check) as Transform;
        pickupComps = comps1;
    }

    if (!pickupTransform) return;

    // 生成 PickupEvent
    const pickupEvent: PickupEvent = {
        type: 'Pickup',
        pos: { x: pickupTransform.x, y: pickupTransform.y },
        itemId: pickup.blueprint,
        owner: playerId
    };
    pushEvent(world, pickupEvent);

    // 标记道具为已消耗
    markForDestroy(pickupComps, 'consumed', 'pickup');
}
