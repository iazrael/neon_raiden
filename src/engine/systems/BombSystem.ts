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

import { World } from '../types';
import { Bomb, BombIntent, Transform } from '../components';
import { removeComponent } from '../world';
import { pushEvent } from '../world';
import { BombExplodedEvent, PlaySoundEvent, CamShakeEvent, EventTags } from '../events';

/**
 * 炸弹使用冷却时间（毫秒）
 * 防止玩家一帧内消耗所有炸弹
 */
const BOMB_COOLDOWN = 500;

/**
 * 上次使用炸弹的时间戳
 */
let lastBombTime = 0;

/**
 * 炸弹系统主函数
 */
export function BombSystem(world: World, dt: number): void {
    // 获取玩家组件
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    // 检查是否有炸弹意图
    const bombIntent = playerComps.find(BombIntent.check);
    if (!bombIntent) return;

    // 检查是否有炸弹库存组件
    const bomb = playerComps.find(Bomb.check);
    if (!bomb || bomb.count <= 0) {
        // 没有炸弹，移除意图并播放"空弹"音效
        removeComponent(world, world.playerId, bombIntent);
        pushEvent(world, {
            type: 'PlaySound',
            name: 'bomb_empty'
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
    removeComponent(world, world.playerId, bombIntent);

    // === 触发爆炸 ===
    // 1. 发送炸弹爆炸事件
    const playerTransform = playerComps.find(Transform.check);
    pushEvent(world, {
        type: 'BombExploded',
        pos: playerTransform ? { x: playerTransform.x, y: playerTransform.y } : { x: 0, y: 0 },
        playerId: world.playerId
    } as BombExplodedEvent);

    // 2. 触发震屏
    pushEvent(world, {
        type: 'CamShake',
        intensity: 10,  // 10px 震动
        duration: 0.5   // 0.5秒
    } as CamShakeEvent);

    // 3. 播放爆炸音效
    pushEvent(world, {
        type: 'PlaySound',
        name: 'bomb_explode_large'
    } as PlaySoundEvent);
}
