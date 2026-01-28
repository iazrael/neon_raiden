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

import { World } from '../../types';
import { Transform, BossEntrance, MoveIntent, SpeedModifier } from '../../components';
import { view, addComponent, removeComponentByType, removeComponentIfExists } from '../../world';
import { BOSS_ARENA } from '../bossConstants';

/**
 * Boss入场系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BossEntranceSystem(world: World, dt: number): void {
    // 只查询有 BossEntrance 组件的Boss
    for (const [id,] of view(world, [BossEntrance])) {
        // 获取实体的所有组件（不只是查询的组件）
        const allComps = world.entities.get(id);
        if (!allComps) continue;

        const transform = allComps.find(Transform.check);
        if (!transform) continue;

        const entrance = allComps.find(BossEntrance.check) as BossEntrance;

        // 使用浮点数安全比较
        if (transform.y < entrance.targetY - BOSS_ARENA.POSITION_EPSILON) {
            // === 入场阶段：产生向下移动意图 ===

            // 确保有速度修正器（临时提高速度上限）
            if (!allComps.some(SpeedModifier.check)) {
                addComponent(world, id, new SpeedModifier({
                    maxLinearOverride: entrance.entranceSpeed
                }));
            }

            // 查找或创建 MoveIntent
            let moveIntent = allComps.find(MoveIntent.check) as MoveIntent | undefined;
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

            // 使用新的 removeComponentByType API
            removeComponentByType(world, id, BossEntrance);
            removeComponentByType(world, id, SpeedModifier);
            // 注意：InvulnerableState的移除是可选的，因为它可能不存在
        }
    }
}
