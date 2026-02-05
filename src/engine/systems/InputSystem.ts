import { removeTypes, removeTypesFromComps, World } from '../world';
import { Component } from '../types';
import { inputManager } from '../input/InputManager';
import { GAME_CONFIG } from '../configs/global';
import { MoveIntent, FireIntent, BombIntent, Velocity, Option, Transform } from '../components';
import { removeComponent, view } from '../world';

// === 常量定义 ===
const KEYBOARD_SPEED = 500;        // 键盘移动速度（像素/秒）
const POSITION_EPSILON = 0.1;      // 位置判断精度阈值

/**
 * 处理 follow 模式的玩家移动
 */
function handleFollowMode(
    playerComps: Component[],
    playerTransform: Transform | undefined,
    playerVel: Velocity | undefined
): void {
    const mousePos = inputManager.getPointerPosition();
    // 忽略未初始化的指针位置 (init 时 lastPointer 为 0,0 会导致负值)
    if (mousePos.x < 0 || mousePos.y < 0) {
        return;
    }
    if (!playerTransform) {
        if (playerVel) {
            playerVel.vx = 0;
            playerVel.vy = 0;
        }
        return;
    }

    const dx = mousePos.x - playerTransform.x;
    const dy = mousePos.y - playerTransform.y;

    if (Math.abs(dx) > POSITION_EPSILON || Math.abs(dy) > POSITION_EPSILON) {
        if (playerVel) {
            playerVel.vx = 0;
            playerVel.vy = 0;
        }
        playerComps.push(new MoveIntent({ dx, dy, type: 'offset' }));
    } else {
        if (playerVel) {
            playerVel.vx = 0;
            playerVel.vy = 0;
        }
    }
}

/**
 * 处理 drag 模式的玩家移动
 */
function handleDragMode(playerComps: Component[], playerVel: Velocity | undefined): void {
    const pointerDelta = inputManager.consumePointerDelta();

    if (Math.abs(pointerDelta.x) > POSITION_EPSILON || Math.abs(pointerDelta.y) > POSITION_EPSILON) {
        if (playerVel) {
            playerVel.vx = 0;
            playerVel.vy = 0;
        }
        playerComps.push(new MoveIntent({ dx: pointerDelta.x, dy: pointerDelta.y, type: 'offset' }));
    } else {
        const kbVec = inputManager.getKeyboardVector();
        if (kbVec.x !== 0 || kbVec.y !== 0) {
            playerComps.push(new MoveIntent({
                dx: kbVec.x * KEYBOARD_SPEED,
                dy: kbVec.y * KEYBOARD_SPEED,
                type: 'velocity'
            }));
        } else {
            if (playerVel) {
                playerVel.vx = 0;
                playerVel.vy = 0;
            }
        }
    }
}

/**
 * 处理玩家移动逻辑
 */
function handlePlayerMovement(
    playerComps: Component[],
    playerTransform: Transform,
    playerVel: Velocity | undefined
): void {
    removeTypesFromComps(playerComps, [MoveIntent]);

    if (GAME_CONFIG.mouseControlMode === 'follow') {
        handleFollowMode(playerComps, playerTransform, playerVel);
    } else {
        handleDragMode(playerComps, playerVel);
    }
}

/**
 * 处理玩家开火状态同步
 */
function handlePlayerFiring(world: World, playerComps: Component[]): void {
    const existingFire = playerComps.find(FireIntent.check);
    const isFiring = inputManager.isFiring();

    if (isFiring) {
        if (!existingFire) {
            playerComps.push(new FireIntent({
                firing: true,
                angle: -Math.PI / 2, // 玩家默认向上发射
            }));
        }
    } else {
        if (existingFire) {
            removeComponent(world, world.playerId, existingFire);
        }
    }
}

/**
 * 处理所有僚机的开火状态同步
 */
function handleOptionsFiring(world: World): void {
    const isFiring = inputManager.isFiring();

    for (const [id, [_option, _optionTransform], comps] of view(world, [Option, Transform])) {
        const existingFire = comps.find(FireIntent.check);
        if (isFiring) {
            if (!existingFire) comps.push(new FireIntent({
                firing: true,
                angle: -Math.PI / 2, // 玩家默认向上
            }));
        } else {
            if (existingFire) removeComponent(world, id, existingFire);
        }
    }
}

/**
 * 处理所有僚机的环绕移动
 */
function handleOptionsMovement(world: World, playerTransform: Transform | undefined): void {
    for (const [_id, [option, optionTransform], comps] of view(world, [Option, Transform])) {

        const angle = (world.time / 1000) * option.rotationSpeed + option.angle;
        const targetX = playerTransform.x + Math.cos(angle) * option.radius;
        const targetY = playerTransform.y + Math.sin(angle) * option.radius;

        comps.push(new MoveIntent({
            dx: (targetX - optionTransform.x) * option.lerpFactor,
            dy: (targetY - optionTransform.y) * option.lerpFactor,
            type: 'offset'
        }));
    }
}

/**
 * 处理炸弹意图
 */
function handleBomb(world: World, playerComps: Component[]): void {
    const existingBomb = playerComps.find(BombIntent.check);
    const isBombing = inputManager.isBombing();

    if (isBombing) {
        if (!existingBomb) {
            playerComps.push(new BombIntent());
        }
        inputManager.consumeBomb();
    } else {
        if (existingBomb) removeComponent(world, world.playerId, existingBomb);
    }
}

/**
 * 输入系统：处理所有玩家和僚机的输入意图
 * @param world 世界对象
 * @param _dt 增量时间（当前未使用，保留用于未来扩展）
 */
export function InputSystem(world: World, _dt: number) {
    const playerComps = world.entities.get(world.playerId);
    if (!playerComps) return;

    const playerTransform = playerComps.find(Transform.check);
    const playerVel = playerComps.find(Velocity.check);

    handlePlayerMovement(playerComps, playerTransform, playerVel);
    handlePlayerFiring(world, playerComps);
    // FIXME: 其实僚机不应该在这里处理, 敌人也会有僚机, 僚机的Option配置里有 owner, 应该增加个系统来统一处理环绕移动和开火意图
    handleOptionsFiring(world);
    handleOptionsMovement(world, playerTransform);
    handleBomb(world, playerComps);
}
