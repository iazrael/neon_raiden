/**
 * 炸弹系统 (BombSystem)
 *
 * 职责：
 * - 监听玩家的 BombIntent 组件
 * - 检查是否有足够的炸弹库存
 * - 触发炸弹爆炸效果和伤害
 * - 管理炸弹冷却时间（防止连发）
 *
 * 系统类型：交互层
 * 执行顺序：P4 - 在 CollisionSystem 之后
 */

import { World } from "../world";
import {
    Bomb,
    BombIntent,
    Bullet,
    DestroyTag,
    EnemyTag,
    Health,
    PlayerTag,
    Transform,
} from "../components";
import { removeComponent, view } from "../world";
import { pushEvent } from "../world";
import {
    BombExplodedEvent,
    PlaySoundEvent,
    CamShakeEvent,
    EventTags,
    HitEvent,
} from "../events";

/**
 * 炸弹使用冷却时间（毫秒）
 * 防止玩家一帧内消耗所有炸弹
 */
const BOMB_COOLDOWN = 3000;

/**
 * 上次使用炸弹的时间戳
 */
let lastBombTime = 0;

/**
 * 炸弹系统主函数
 */
export function BombSystem(world: World, dt: number): void {
    for (const [playerId, [playerTag, bombIntent, bomb], playerComps] of view(
        world,
        [PlayerTag, BombIntent, Bomb],
    )) {
        // 检查是否有炸弹库存组件
        if (bomb.count <= 0) {
            // 没有炸弹，移除意图并播放"空弹"音效
            removeComponent(world, playerId, bombIntent);
            pushEvent(world, {
                type: "PlaySound",
                name: "bomb_empty",
            } as PlaySoundEvent);
            return;
        }

        // 检查冷却时间
        const now = world.time;
        if (now - lastBombTime < BOMB_COOLDOWN) {
            return; // 冷却中，不响应
        }

        // === 消耗炸弹 ===
        bomb.count--;
        lastBombTime = now;

        // 移除意图（单次触发）
        removeComponent(world, playerId, bombIntent);

        // === 触发爆炸 ===
        // 1. 发送炸弹爆炸事件
        const playerTransform = playerComps.find(Transform.check);
        pushEvent(world, {
            type: "BombExploded",
            pos: playerTransform
                ? { x: playerTransform.x, y: playerTransform.y }
                : { x: 0, y: 0 },
            playerId: world.playerId,
        } as BombExplodedEvent);

        // 2. 触发震屏
        pushEvent(world, {
            type: "CamShake",
            intensity: 10, // 10px 震动
            duration: 500, // 0.5秒
        } as CamShakeEvent);

        // 3. 播放爆炸音效
        pushEvent(world, {
            type: "PlaySound",
            name: "bomb_explode_large",
        } as PlaySoundEvent);

        // 4. 对所有敌人造成致命伤害
        handleBombExplosion(world);
    }
}

/**
 * 处理炸弹爆炸 - 对所有敌人造成致命伤害
 * 
 * 注意：此函数直接发送 HitEvent 而不是依赖 BombExplodedEvent
 */
function handleBombExplosion(world: World): void {
    // 遍历所有实体，找到敌人
    for (const [enemyId, [tag, health, transform]] of view(world, [
        EnemyTag,
        Health,
        Transform,
    ])) {
        // 获取敌人的生命值组件
        // 造成致命伤害（直接扣完所有血量）
        const maxHp = health.max || 100;
        const hitEvent: HitEvent = {
            type: "Hit",
            pos: { x: transform.x, y: transform.y },
            damage: maxHp * 2, // 造成200%最大生命值的伤害，确保击杀
            owner: world.playerId,
            victim: enemyId,
        };
        world.events.push(hitEvent);
    }
    // 所有的子弹也销毁
    for (const [bulletId, [bullet], comps] of view(world, [Bullet])) {
        // 检查是否已销毁（避免重复销毁）
        const hasDestroyTag = comps.some(DestroyTag.check);
        if (hasDestroyTag) continue; // 已销毁，跳过
        if (bullet.owner !== world.playerId) {
            comps.push(new DestroyTag({ reason: "consumed" }));
        }
    }
}
