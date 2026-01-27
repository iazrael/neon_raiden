import { World } from '../types';
import { inputManager } from '../input/InputManager';
import { MoveIntent, FireIntent, BombIntent, Velocity } from '../components';
import { removeComponent } from '../world';

export function InputSystem(w: World, dt: number) {
    // 1. 获取输入源数据
    const kbVec = inputManager.getKeyboardVector();
    const pointerDelta = inputManager.consumePointerDelta(); // 注意：这会清空 Manager 里的积攒值
    const isFiring = inputManager.isFiring();
    const isBombing = inputManager.isBombing();

    // 2. 查找玩家
    const playerComps = w.entities.get(w.playerId);
    if (!playerComps) return;

    // === 处理移动 (优先处理触摸/鼠标拖拽，其次键盘) ===
    const playerVel = playerComps.find(Velocity.check);

    // 键盘速度配置（像素/毫秒）
    const KEYBOARD_SPEED = 1;

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
        if (!existingFire) playerComps.push(new FireIntent());
    } else {
        if (existingFire) removeComponent(w, w.playerId, existingFire);
    }

    // === 处理炸弹 (B键) ===
    const existingBomb = playerComps.find(BombIntent.check);
    if (isBombing) {
        // 炸弹通常是一次性触发，这里持续按住会持续产生意图
        // 后续 SkillSystem 需要处理冷却或消耗
        if (!existingBomb) playerComps.push(new BombIntent());
    } else {
        if (existingBomb) removeComponent(w, w.playerId, existingBomb);
    }

}