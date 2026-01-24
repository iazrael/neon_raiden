/**
 * 输入系统 (InputSystem)
 *
 * 职责：
 * - 读取 InputManager 的输入状态
 * - 为玩家实体生成 MoveIntent（移动意图）
 * - 为玩家实体生成 FireIntent（开火意图）
 * - 为玩家实体生成 BombIntent（炸弹意图）
 *
 * 系统类型：决策层
 * 执行顺序：P1 - 第一个执行的系统
 */

import { World } from '../types';
import { PlayerTag, MoveIntent, FireIntent, BombIntent } from '../components';
import { inputManager } from '../input/InputManager';

/**
 * 输入系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function InputSystem(world: World, dt: number): void {
    // 获取键盘输入向量
    const keyboardVector = inputManager.getKeyboardVector();
    const pointerDelta = inputManager.consumePointerDelta();
    const isFiring = inputManager.isFiring();
    const isBombing = inputManager.isBombing();

    // 找到玩家实体
    for (const [playerId, comps] of world.entities) {
        const playerTag = comps.find(c => c instanceof PlayerTag);
        if (!playerTag) continue;

        // 处理移动输入
        const hasMoveInput = keyboardVector.x !== 0 || keyboardVector.y !== 0 || pointerDelta.x !== 0 || pointerDelta.y !== 0;

        if (hasMoveInput) {
            // 计算移动方向
            let dx = 0;
            let dy = 0;

            // 键盘输入（使用速度方向）
            if (keyboardVector.x !== 0 || keyboardVector.y !== 0) {
                dx = keyboardVector.x * 400; // 基础移动速度
                dy = keyboardVector.y * 400;
            }

            // 触摸/鼠标输入（直接位移）
            if (pointerDelta.x !== 0 || pointerDelta.y !== 0) {
                // 触摸输入使用 offset 模式，直接设置位移
                comps.push(new MoveIntent({
                    dx: pointerDelta.x,
                    dy: pointerDelta.y,
                    type: 'offset'
                }));
            } else if (dx !== 0 || dy !== 0) {
                // 键盘输入使用 velocity 模式
                comps.push(new MoveIntent({
                    dx,
                    dy,
                    type: 'velocity'
                }));
            }
        }

        // 处理开火输入
        if (isFiring) {
            // 检查是否已有开火意图（每帧只添加一次）
            const hasFireIntent = comps.some(c => c instanceof FireIntent);
            if (!hasFireIntent) {
                comps.push(new FireIntent({ firing: true }));
            }
        }

        // 处理炸弹输入
        if (isBombing) {
            // 检查是否已有炸弹意图（每帧只添加一次）
            const hasBombIntent = comps.some(c => c instanceof BombIntent);
            if (!hasBombIntent) {
                comps.push(new BombIntent());
            }
        }
    }
}
