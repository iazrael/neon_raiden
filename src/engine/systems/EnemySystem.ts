import { World, EnemyId } from '../types';
import { view, addComponent } from '../world';
import { EnemyTag, Transform, Velocity, MoveIntent, FireIntent, PlayerTag, SpeedStat } from '../components';

/**
 * 敌人AI系统 (ECS版)
 * 职责：
 * 1. 遍历所有 EnemyTag 实体
 * 2. 根据 EnemyId 执行特定的 AI 逻辑 (状态机)
 * 3. 输出 MoveIntent (移动) 和 FireIntent (攻击)
 */
export function EnemySystem(w: World, dt: number) {
    const playerEnt = w.entities.get(w.playerId);
    let playerX = 0;
    let playerY = 0;

    // 获取玩家位置用于 AI 决策
    if (playerEnt) {
        const pTrans = playerEnt.find(c => c instanceof Transform) as Transform;
        if (pTrans) {
            playerX = pTrans.x;
            playerY = pTrans.y;
        }
    }

    // 遍历所有活着的敌人
    for (const [id, [tag, trans, vel]] of view(w, [EnemyTag, Transform, Velocity])) {
        // 更新内部计时器
        tag.timer += dt;

        // 默认行为：重置 Intent (每帧重新决策)
        // 注意：MoveIntent 和 FireIntent 是瞬时的，通常由 MovementSystem 和 WeaponSystem 消费后忽略或移除
        // 但在这里我们是"添加/更新"组件。为了保持 ECS 纯度，我们需要确保每一帧都写入新的意图

        // ----------------------------------------------------
        // 1. 通用行为 (向下移动)
        // ----------------------------------------------------
        let moveDx = 0;
        let moveDy = 1; // 默认向下
        let shouldFire = false;
        let fireAngle: number | undefined = undefined;

        // ----------------------------------------------------
        // 2. 特殊 AI 逻辑
        // ----------------------------------------------------
        switch (tag.id) {
            case EnemyId.KAMIKAZE: {
                // 自杀式：冲向玩家
                const dx = playerX - trans.x;
                const dy = playerY - trans.y;
                // 归一化
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    moveDx = dx / dist;
                    moveDy = dy / dist;
                }
                break;
            }

            case EnemyId.LASER_INTERCEPTOR: {
                // 拦截机：进场 -> 悬停蓄力 -> 发射 -> 离场

                // 状态机
                // 0: 进场 (Fly down)
                // 1: 悬停 & 瞄准 (Hover & Charge)
                // 2: 离场 (Fly away)

                if (tag.state === 0) {
                    moveDy = 1;
                    if (trans.y > 150) {
                        tag.state = 1;
                        tag.timer = 0;
                    }
                } else if (tag.state === 1) { // Hover
                    moveDy = 0;
                    moveDx = Math.sin(w.time / 500) * 0.5; // Bobbing left/right

                    // 瞄准玩家
                    const dx = playerX - trans.x;
                    const dy = playerY - trans.y;
                    fireAngle = Math.atan2(dy, dx); // 始终瞄准

                    if (tag.timer > 2000) { // 蓄力 2秒
                        shouldFire = true;
                        tag.state = 2; // Fire once and leave
                        tag.timer = 0;
                    }
                } else if (tag.state === 2) {
                    moveDy = 2; // Fly away fast
                }
                break;
            }

            case EnemyId.ELITE_GUNBOAT: {
                // 炮艇：缓慢向下，定期瞄准射击
                moveDy = 0.2; // Very slow

                // 射击频率控制在 WeaponSystem 中 (cooldown)，这里只需一直按住扳机
                // 并提供瞄准角度
                shouldFire = true;
                const dx = playerX - trans.x;
                const dy = playerY - trans.y;
                fireAngle = Math.atan2(dy, dx);
                break;
            }

            case EnemyId.STALKER: {
                // 追踪者：向玩家移动，但不像 Kamikaze 那么快，试图保持射击距离
                const dx = playerX - trans.x;
                const dy = playerY - trans.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // 保持距离 300
                if (dist > 300) {
                    moveDx = dx / dist;
                    moveDy = dy / dist;
                } else {
                    moveDx = (dx / dist) * 0.1; // 减速
                    moveDy = (dy / dist) * 0.1;
                }

                shouldFire = true;
                fireAngle = Math.atan2(dy, dx);
                break;
            }

            case EnemyId.MINE_LAYER: {
                // 布雷机：只向下，向后(上)开火
                shouldFire = true;
                fireAngle = -Math.PI / 2; // Up
                break;
            }

            case EnemyId.BARRAGE: {
                // 弹幕机：缓慢移动，螺旋发射
                moveDy = 0.5;
                shouldFire = true;
                // 旋转发射角度 (每秒 90 度)
                fireAngle = (tag.timer / 1000) * (Math.PI / 2);
                break;
            }

            default: {
                // 其他所有杂兵：默认向下，默认尝试开火 (WeaponSystem 会控制 CD)
                // 部分敌人可能不需要每帧都尝试开火以节省性能，但 ECS 模式下逻辑统一更重要
                shouldFire = true;
                // 默认角度 undefined，由 WeaponSystem 决定 (通常是向下 +90度)
                break;
            }
        }

        // ----------------------------------------------------
        // 3. 输出意图 (Components)
        // ----------------------------------------------------

        // 写入移动意图
        // 既然 MoveIntent 是一次性的，我们需要每帧都添加/覆盖它
        // 注意：MovementSystem 需要 MoveIntent 配合 SpeedStat 工作
        // 我们确信 Entity 已经有了 SpeedStat (在 factory/blueprint 中添加了)
        ensureComponent(w, id, new MoveIntent({
            dx: moveDx,
            dy: moveDy,
            type: 'velocity'
        }));

        // 写入开火意图
        if (shouldFire) {
            ensureComponent(w, id, new FireIntent({
                firing: true,
                angle: fireAngle,
                targetId: w.playerId
            }));
        } else {
            // 如果不该开火，移除 FireIntent (或者设为 false)
            // 简单起见，覆盖为 false
            ensureComponent(w, id, new FireIntent({ firing: false }));
        }
    }
}

/** 辅助函数：确保组件存在，如果存在则更新，不存在则添加 */
function ensureComponent(w: World, id: number, newComp: any) {
    // 简单粗暴的实现：直接 addComponent (world.ts 的 addComponent 通常是 push，这里需要 replace 语义)

    // 获取实体组件列表
    const comps = w.entities.get(id);
    if (!comps) return;

    // 查找同类组件
    const idx = comps.findIndex(c => c.constructor === newComp.constructor);
    if (idx >= 0) {
        // 替换
        comps[idx] = newComp;
    } else {
        // 新增
        comps.push(newComp);
    }
}
