/**
 * 碰撞检测系统 (CollisionSystem)
 *
 * 职责：
 * - 检测玩家子弹与敌人的碰撞
 * - 检测敌人子弹与玩家的碰撞
 * - 检测玩家与拾取物品的碰撞
 * - 生成 HitEvent 和 PickupEvent
 *
 * 系统类型：交互层
 * 执行顺序：P4 - 在 MovementSystem 之后，DamageResolutionSystem 之前
 */

import { World, EntityId } from '../types';
import { Transform, HitBox, Bullet, PlayerTag, EnemyTag, PickupItem, InvulnerableState } from '../components';
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
    type: 'bullet_hit_enemy' | 'bullet_hit_player' | 'player_pickup';
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
    const bullet1 = comps1.find(Bullet.check) as Bullet | undefined;
    const bullet2 = comps2.find(Bullet.check) as Bullet | undefined;
    const player1 = comps1.find(PlayerTag.check);
    const player2 = comps2.find(PlayerTag.check);
    const enemy1 = comps1.find(EnemyTag.check);
    const enemy2 = comps2.find(EnemyTag.check);
    const pickup1 = comps1.find(PickupItem.check) as PickupItem | undefined;
    const pickup2 = comps2.find(PickupItem.check) as PickupItem | undefined;

    // 子弹击中敌人
    if (bullet1 && enemy2) return 'bullet_hit_enemy';
    if (bullet2 && enemy1) return 'bullet_hit_enemy';

    // 子弹击中玩家
    if (bullet1 && player2) return 'bullet_hit_player';
    if (bullet2 && player1) return 'bullet_hit_player';

    // 玩家拾取道具
    if (player1 && pickup2) return 'player_pickup';
    if (player2 && pickup1) return 'player_pickup';

    return null;
}

/**
 * 检测两个碰撞盒是否重叠
 */
function isColliding(
    t1: Transform, h1: HitBox,
    t2: Transform, h2: HitBox
): boolean {
    // 目前只支持圆形碰撞
    if (h1.shape === 'circle' && h2.shape === 'circle') {
        const r1 = h1.radius ?? 20;
        const r2 = h2.radius ?? 20;
        const dx = t1.x - t2.x;
        const dy = t1.y - t2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (r1 + r2); // 边缘接触也算碰撞
    }

    // TODO: 支持矩形和胶囊碰撞
    return false;
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

        // 获取子弹伤害值（从配置表中获取，这里暂时使用固定值）
        const damage = 10; // TODO: 从 AmmoSpec 获取

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
            if (bullet.pierceLeft < 0) {
                // 穿透次数用完，标记子弹销毁
                const bulletComps = bullet === bullet1 ? comps1 : comps2;
                const hasDestroyTag = bulletComps.some(c => c.constructor.name === 'DestroyTag');
                if (!hasDestroyTag) {
                    bulletComps.push({ constructor: { name: 'DestroyTag' }, reason: 'consumed' });
                }
            }
        } else {
            // 子弹没有穿透，直接销毁
            const bulletComps = bullet === bullet1 ? comps1 : comps2;
            const hasDestroyTag = bulletComps.some(c => c.constructor.name === 'DestroyTag');
            if (!hasDestroyTag) {
                bulletComps.push({ constructor: { name: 'DestroyTag' }, reason: 'consumed' });
            }
        }
    } else if (type === 'player_pickup') {
        // 确定玩家和道具
        const player1 = comps1.find(PlayerTag.check);
        const pickup1 = comps1.find(PickupItem.check) as PickupItem | undefined;
        const pickup2 = comps2.find(PickupItem.check) as PickupItem | undefined;

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
        const hasDestroyTag = pickupComps.some(c => c.constructor.name === 'DestroyTag');
        if (!hasDestroyTag) {
            pickupComps.push({ constructor: { name: 'DestroyTag' }, reason: 'consumed' });
        }
    }
}
