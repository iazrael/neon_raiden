import { World } from '../types';
import { inputManager } from '../input/InputManager';
import { MoveIntent, FireIntent, BombIntent, Velocity, PlayerTag, Option, Transform } from '../components';
import { removeComponent, view } from '../world';

export function InputSystem(world: World, dt: number) {
    // 1. 获取输入源数据
    const kbVec = inputManager.getKeyboardVector();
    const pointerDelta = inputManager.consumePointerDelta(); // 注意：这会清空 Manager 里的积攒值
    const isFiring = inputManager.isFiring();
    const isBombing = inputManager.isBombing();

    // 2. 查找玩家
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    // === 处理移动 (优先处理触摸/鼠标拖拽，其次键盘) ===
    const playerVel = playerComps.find(Velocity.check);

    // 键盘速度配置（像素/秒）
    const KEYBOARD_SPEED = 400;

    // 先移除旧的 MoveIntent，确保只有一个
    const oldMoveIndex = playerComps.findIndex(MoveIntent.check);
    if (oldMoveIndex >= 0) {
        playerComps.splice(oldMoveIndex, 1);
    }

    // 逻辑：如果有指针位移，直接使用像素偏移 (Offset)
    if (Math.abs(pointerDelta.x) > 0.1 || Math.abs(pointerDelta.y) > 0.1) {
        // 清除键盘速度，防止残留
        if (playerVel) {
            playerVel.vx = 0;
            playerVel.vy = 0;
        }
        // 触摸是 1:1 跟随，直接作为 Offset
        playerComps.push(new MoveIntent({ dx: pointerDelta.x, dy: pointerDelta.y, type: 'offset' }));
    }
    // 逻辑：否则，使用键盘向量 (Velocity)
    else if (kbVec.x !== 0 || kbVec.y !== 0) {
        playerComps.push(new MoveIntent({
            dx: kbVec.x * KEYBOARD_SPEED,
            dy: kbVec.y * KEYBOARD_SPEED,
            type: 'velocity'
        }));
    }
    // 无输入：直接清零速度，让玩家立即停止
    else {
        if (playerVel) {
            playerVel.vx = 0;
            playerVel.vy = 0;
        }
    }

    // === 处理开火 ===
    const existingFire = playerComps.find(FireIntent.check);
    if (isFiring) {
        if (!existingFire) {
            playerComps.push(new FireIntent());
        }
    } else {
        if (existingFire) {
            removeComponent(world, world.playerId, existingFire);
        }
    }


    // === 同步僚机移动意图 ===
    // 僚机环绕配置
    const OPTION_RADIUS = 60;
    const ROTATION_SPEED = 2;
    const LERP_FACTOR = 0.2;

    // 获取玩家 Transform（用于计算僚机目标位置）
    const playerTransform = playerComps.find(Transform.check);


    // === 同步僚机开火意图 ===
    // 遍历所有实体，找到僚机并同步玩家的开火状态
    for (const [id, [option, optionTransform], comps] of view(world, [Option, Transform])) {
        // 这是一个僚机
        const optionFire = comps.find(FireIntent.check);
        if (isFiring) {
            if (!optionFire) comps.push(new FireIntent());
        } else {
            if (optionFire) removeComponent(world, id, optionFire);
        }
        if (playerTransform) {
            // 计算目标位置（环绕玩家旋转）
            const angle = (world.time / 1000) * ROTATION_SPEED + option.angle;
            const targetX = playerTransform.x + Math.cos(angle) * OPTION_RADIUS;
            const targetY = playerTransform.y + Math.sin(angle) * OPTION_RADIUS;

            // 生成移动意图（平滑移动）
            comps.push(new MoveIntent({
                dx: (targetX - optionTransform.x) * LERP_FACTOR,
                dy: (targetY - optionTransform.y) * LERP_FACTOR,
                type: 'offset'
            }));
        }
    }

    // === 处理炸弹 (B键) ===
    const existingBomb = playerComps.find(BombIntent.check);
    if (isBombing) {
        // 炸弹通常是一次性触发，这里持续按住会持续产生意图
        // 后续 SkillSystem 需要处理冷却或消耗
        if (!existingBomb) playerComps.push(new BombIntent());
    } else {
        if (existingBomb) removeComponent(world, world.playerId, existingBomb);
    }

}