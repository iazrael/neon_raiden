/**
 * 碰撞检测系统 (CollisionSystem)
 *
 * 职责：
 * - 检测玩家子弹与敌人的碰撞
 * - 检测敌人子弹与玩家的碰撞
 * - 检测玩家与敌人的碰撞
 * - 检测子弹与子弹的碰撞（玩家子弹和敌人子弹互击）
 * - 检测玩家与拾取物品的碰撞
 * - 生成 HitEvent、PickupEvent 和 BulletCollisionEvent
 *
 * 系统类型：交互层
 * 执行顺序：P4 - 在 MovementSystem 之后，DamageResolutionSystem 之前
 */

import { World, EntityId } from '../types';
import { Transform, HitBox, Bullet, PlayerTag, EnemyTag, PickupItem, InvulnerableState, DestroyTag } from '../components';
import { pushEvent } from '../world';
import { HitEvent, PickupEvent } from '../events';

/**
 * 碰撞检测系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function CollisionSystem(world: World, dt: number): void {
    // 清空上一帧的事件队列
    world.events.length = 0;

    // 收集所有碰撞对
    const collisions: CollisionPair[] = [];

    // 获取所有实体ID
    const entityIds = Array.from(world.entities.keys());

    // 两两检测碰撞
    for (let i = 0; i < entityIds.length; i++) {
        for (let j = i + 1; j < entityIds.length; j++) {
            const id1 = entityIds[i];
            const id2 = entityIds[j];

            const collisionType = checkCollisionType(world, id1, id2);
            if (collisionType) {
                collisions.push({ id1, id2, type: collisionType });
            }
        }
    }

    // 处理所有碰撞
    for (const collision of collisions) {
        handleCollision(world, collision);
    }
}

/**
 * 碰撞对
 */
interface CollisionPair {
    id1: EntityId;
    id2: EntityId;
    type: 'bullet_hit_enemy' | 'bullet_hit_player' | 'player_hit_enemy' | 'bullet_collision' | 'player_pickup';
}

/**
 * 检测两个实体之间的碰撞类型
 */
function checkCollisionType(world: World, id1: EntityId, id2: EntityId): CollisionPair['type'] | null {
    const comps1 = world.entities.get(id1);
    const comps2 = world.entities.get(id2);

    if (!comps1 || !comps2) return null;

    // 检查是否有碰撞盒
    const hitBox1 = comps1.find(HitBox.check) as HitBox | undefined;
    const hitBox2 = comps2.find(HitBox.check) as HitBox | undefined;

    if (!hitBox1 || !hitBox2) return null;

    // 检查是否有位置
    const transform1 = comps1.find(Transform.check) as Transform | undefined;
    const transform2 = comps2.find(Transform.check) as Transform | undefined;

    if (!transform1 || !transform2) return null;

    // 检测碰撞
    if (!isColliding(transform1, hitBox1, transform2, hitBox2)) {
        return null;
    }

    // 确定碰撞类型
    const bullet1 = comps1.find(Bullet.check);
    const bullet2 = comps2.find(Bullet.check);
    const player1 = comps1.find(PlayerTag.check);
    const player2 = comps2.find(PlayerTag.check);
    const enemy1 = comps1.find(EnemyTag.check);
    const enemy2 = comps2.find(EnemyTag.check);
    const pickup1 = comps1.find(PickupItem.check);
    const pickup2 = comps2.find(PickupItem.check);

    // 子弹击中敌人
    if (bullet1 && enemy2) return 'bullet_hit_enemy';
    if (bullet2 && enemy1) return 'bullet_hit_enemy';

    // 子弹击中玩家
    if (bullet1 && player2) return 'bullet_hit_player';
    if (bullet2 && player1) return 'bullet_hit_player';

    // 玩家撞到敌人（冲撞伤害）
    if (player1 && enemy2) return 'player_hit_enemy';
    if (player2 && enemy1) return 'player_hit_enemy';

    // 子弹互击（玩家子弹和敌人子弹）
    if (bullet1 && bullet2) {
        // 检查是否属于不同阵营
        const owner1 = world.entities.get(bullet1.owner);
        const owner2 = world.entities.get(bullet2.owner);

        if (owner1 && owner2) {
            const isOwner1Player = owner1.some(PlayerTag.check);
            const isOwner2Player = owner2.some(PlayerTag.check);

            // 一个是玩家子弹，一个是敌人子弹
            if (isOwner1Player !== isOwner2Player) {
                return 'bullet_collision';
            }
        }
    }

    // 玩家拾取道具
    if (player1 && pickup2) return 'player_pickup';
    if (player2 && pickup1) return 'player_pickup';

    return null;
}

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
        // 将胶囊简化为圆形进行检测
        const approxH1 = shape1 === 'capsule' ? { ...h1, shape: 'circle' as const, radius: h1.capRadius ?? 20 } : h1;
        const approxH2 = shape2 === 'capsule' ? { ...h2, shape: 'circle' as const, radius: h2.capRadius ?? 20 } : h2;
        return isColliding(t1, approxH1, t2, approxH2);
    }

    // 不支持的形状组合，返回 false（不碰撞）
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
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= (r1 + r2);
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
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= radius;
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

/**
 * 处理碰撞
 */
function handleCollision(world: World, collision: CollisionPair): void {
    const { id1, id2, type } = collision;
    const comps1 = world.entities.get(id1);
    const comps2 = world.entities.get(id2);

    if (!comps1 || !comps2) return;

    const transform1 = comps1.find(Transform.check) as Transform;
    const transform2 = comps2.find(Transform.check) as Transform;

    // 确定攻击者和受害者
    let attackerId: EntityId;
    let victimId: EntityId;
    let bullet: Bullet | undefined;
    let victimTransform: Transform;

    if (type === 'bullet_hit_enemy' || type === 'bullet_hit_player') {
        const bullet1 = comps1.find(Bullet.check) as Bullet | undefined;
        const bullet2 = comps2.find(Bullet.check) as Bullet | undefined;

        if (bullet1) {
            attackerId = bullet1.owner;
            victimId = id2;
            bullet = bullet1;
            victimTransform = transform2;
        } else {
            attackerId = bullet2!.owner;
            victimId = id1;
            bullet = bullet2;
            victimTransform = transform1;
        }

        // 检查受害者是否处于无敌状态
        const victimComps = world.entities.get(victimId);
        if (victimComps) {
            const invulnerable = victimComps.find(InvulnerableState.check);
            if (invulnerable) return; // 无敌状态，跳过伤害
        }

        // 从子弹组件获取伤害值，如果没有则使用默认值
        const damage = bullet?.damage ?? 10;

        // 确定飙血等级
        const bloodLevel: 1 | 2 | 3 = damage > 30 ? 3 : damage > 15 ? 2 : 1;

        // 生成 HitEvent
        const hitEvent: HitEvent = {
            type: 'Hit',
            pos: { x: victimTransform.x, y: victimTransform.y },
            damage,
            owner: attackerId,
            victim: victimId,
            bloodLevel
        };
        pushEvent(world, hitEvent);

        // 处理子弹穿透
        if (bullet && bullet.pierceLeft > 0) {
            bullet.pierceLeft--;
            if (bullet.pierceLeft === 0) { // 修复：从 < 0 改为 === 0
                // 穿透次数用完，标记子弹销毁
                const bulletComps = bullet === bullet1 ? comps1 : comps2;
                const hasDestroyTag = bulletComps.some(DestroyTag.check);
                if (!hasDestroyTag) {
                    bulletComps.push(new DestroyTag({ reason: 'consumed', reusePool: 'bullet' }));
                }
            }
        } else {
            // 子弹没有穿透，直接销毁
            const bulletComps = bullet === bullet1 ? comps1 : comps2;
            const hasDestroyTag = bulletComps.some(DestroyTag.check);
            if (!hasDestroyTag) {
                bulletComps.push(new DestroyTag({ reason: 'consumed', reusePool: 'bullet' }));
            }
        }
    } else if (type === 'player_hit_enemy') {
        // 处理玩家撞到敌人
        const player1 = comps1.find(PlayerTag.check);
        const enemy2 = comps2.find(EnemyTag.check);

        let playerId: EntityId;
        let enemyId: EntityId;
        let enemyTransform: Transform;

        if (player1 && enemy2) {
            playerId = id1;
            enemyId = id2;
            enemyTransform = transform2;
        } else {
            playerId = id2;
            enemyId = id1;
            enemyTransform = transform1;
        }

        // 检查玩家是否无敌
        const playerComps = world.entities.get(playerId);
        if (playerComps && playerComps.some(InvulnerableState.check)) {
            return; // 玩家无敌，不受到伤害
        }

        // 生成 HitEvent（冲撞伤害，固定为 20）
        const hitEvent: HitEvent = {
            type: 'Hit',
            pos: { x: enemyTransform.x, y: enemyTransform.y },
            damage: 20,
            owner: enemyId,
            victim: playerId,
            bloodLevel: 2
        };
        pushEvent(world, hitEvent);

        // 敌人也受到冲撞伤害
        const enemyComps = world.entities.get(enemyId);
        if (enemyComps) {
            const enemyHitEvent: HitEvent = {
                type: 'Hit',
                pos: { x: enemyTransform.x, y: enemyTransform.y },
                damage: 10,
                owner: playerId,
                victim: enemyId,
                bloodLevel: 1
            };
            pushEvent(world, enemyHitEvent);
        }
    } else if (type === 'bullet_collision') {
        // 处理子弹互击（双方都销毁）
        const bulletComps1 = comps1;
        const bulletComps2 = comps2;

        const hasDestroyTag1 = bulletComps1.some(DestroyTag.check);
        const hasDestroyTag2 = bulletComps2.some(DestroyTag.check);

        if (!hasDestroyTag1) {
            bulletComps1.push(new DestroyTag({ reason: 'consumed', reusePool: 'bullet' }));
        }
        if (!hasDestroyTag2) {
            bulletComps2.push(new DestroyTag({ reason: 'consumed', reusePool: 'bullet' }));
        }

        // 可选：生成子弹碰撞特效事件（如果需要的话）
    } else if (type === 'player_pickup') {
        // 确定玩家和道具
        const player1 = comps1.find(PlayerTag.check);
        const pickup1 = comps1.find(PickupItem.check);
        const pickup2 = comps2.find(PickupItem.check);

        let playerId: EntityId;
        let pickup: PickupItem;
        let pickupTransform: Transform;

        if (player1 && pickup2) {
            playerId = id1;
            pickup = pickup2;
            pickupTransform = transform2;
        } else {
            playerId = id2;
            pickup = pickup1!;
            pickupTransform = transform1;
        }

        // 生成 PickupEvent
        const pickupEvent: PickupEvent = {
            type: 'Pickup',
            pos: { x: pickupTransform.x, y: pickupTransform.y },
            itemId: pickup.blueprint,
            owner: playerId
        };
        pushEvent(world, pickupEvent);

        // 标记道具为已消耗
        const pickupComps = pickup === pickup1 ? comps1 : comps2;
        const hasDestroyTag = pickupComps.some(DestroyTag.check);
        if (!hasDestroyTag) {
            pickupComps.push(new DestroyTag({ reason: 'consumed', reusePool: 'pickup' }));
        }
    }
}
