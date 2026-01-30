/**
 * Boss入场系统
 *
 * 职责：
 * - 处理Boss从屏幕外移动到目标位置
 * - 创建MoveIntent组件供MovementSystem使用
 * - 管理入场期间的临时速度修正
 * - 入场完成后清理相关组件
 *
 * 系统类型：决策层
 * 执行顺序：P1.5 - 在InputSystem之后，MovementSystem之前
 *
 * 依赖组件：
 * - Input: BossTag, BossEntrance, Transform
 * - Output: MoveIntent, SpeedModifier
 *
 * 与其他系统的关系：
 * - BossMovementSystem: 通过BossEntrance组件的存在性互斥
 * - MovementSystem: 消费MoveIntent，应用实际位移
 */

import { Transform, BossEntrance, MoveIntent, SpeedModifier, InvulnerableState } from '../../components';
import { view, addComponent, removeTypes, World } from '../../world';
import { BOSS_ARENA } from '../../configs/bossConstants';

/**
 * Boss入场系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossEntranceSystem(world: World, dt: number): void {
    // 只查询有 BossEntrance 组件的Boss
    for (const [id, [entrance, transform], comps] of view(world, [BossEntrance, Transform])) {

        // 使用浮点数安全比较
        if (transform.y < entrance.targetY - BOSS_ARENA.POSITION_EPSILON) {
            // === 入场阶段：产生向下移动意图 ===
            // 确保有速度修正器（临时提高速度上限）
            if (!comps.some(SpeedModifier.check)) {
                addComponent(world, id, new SpeedModifier({
                    maxLinearOverride: entrance.entranceSpeed
                }));
            }

            // 查找或创建 MoveIntent
            let moveIntent = comps.find(MoveIntent.check);
            if (moveIntent) {
                // 更新现有MoveIntent
                moveIntent.dx = 0;
                moveIntent.dy = entrance.entranceSpeed;
                moveIntent.type = 'velocity';
            } else {
                // 创建新MoveIntent
                addComponent(world, id, new MoveIntent({
                    dx: 0,
                    dy: entrance.entranceSpeed,
                    type: 'velocity'
                }));
            }
        } else {
            // === 入场完成 ===

            removeTypes(world, id, [BossEntrance, SpeedModifier, InvulnerableState]);
        }
    }
}
