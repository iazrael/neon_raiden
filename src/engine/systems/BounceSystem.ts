/**
 * 反弹系统 (BounceSystem)
 *
 * 职责：
 * - 处理带有 Bounce 组件的子弹的屏幕边界反弹
 * - 反转速度并减少剩余反弹次数
 * - 触发反弹事件（用于协同效果）
 *
 * 系统类型：物理层
 * 执行顺序：P4 - 在 VelocitySystem 之后
 */

import { World, removeComponent, view } from '../world';
import { Transform, Velocity, Bounce, Bullet } from '../components';
import { pushEvent } from '../world';
import { BulletBouncedEvent } from '../events';

/**
 * 反弹系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function BounceSystem(world: World, _dt: number): void {
    const screenWidth = world.width;
    const screenHeight = world.height;

    for (const [id, [transform, velocity, bounce]] of view(world, [Transform, Velocity, Bounce])) {
        let bounced = false;

        // 检测左右边界
        if (bounce.bounds.bounceX !== false) {
            if (transform.x < 0) {
                transform.x = 0;
                velocity.vx *= -1;
                bounced = true;
            } else if (transform.x > screenWidth) {
                transform.x = screenWidth;
                velocity.vx *= -1;
                bounced = true;
            }
        }

        // 检测顶部边界
        if (bounce.bounds.bounceTop !== false && transform.y < 0) {
            transform.y = 0;
            velocity.vy *= -1;
            bounced = true;
        }

        // 检测底部边界
        if (bounce.bounds.bounceBottom === true && transform.y > screenHeight) {
            transform.y = screenHeight;
            velocity.vy *= -1;
            bounced = true;
        }

        // 如果发生了反弹
        if (bounced) {
            bounce.hasBounced = true;
            bounce.bouncesLeft--;

            // 生成反弹事件（用于协同效果）
            const bouncedEvent: BulletBouncedEvent = {
                type: 'BulletBounced',
                pos: { x: transform.x, y: transform.y },
                entityId: id,
            };
            pushEvent(world, bouncedEvent);

            // 如果反弹次数用完，移除 Bounce 组件
            if (bounce.bouncesLeft <= 0) {
                removeComponent(world, id, bounce);
            }
        }
    }
}
