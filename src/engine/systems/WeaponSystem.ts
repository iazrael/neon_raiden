/**
 * 武器系统 (WeaponSystem)
 *
 * 职责：
 * - 处理 FireIntent 组件
 * - 根据武器配置生成子弹实体
 * - 处理武器冷却
 * - 支持不同的弹幕模式（SPREAD、AIMED、RADIAL、SPIRAL等）
 *
 * 系统类型：状态层
 * 执行顺序：P2 - 在决策层之后，物理层之前
 */

import { World } from '../types';
import { Transform, Weapon, FireIntent, Bullet, PlayerTag, EnemyTag, Velocity } from '../components';
import { spawnBullet } from '../factory';
import { AMMO_TABLE } from '../blueprints/ammo';
import { Blueprint } from '../blueprints';
import { pushEvent } from '../world';
import { WeaponFiredEvent } from '../events';

/**
 * 武器系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function WeaponSystem(world: World, dt: number): void {
    // 收集所有有开火意图的实体
    const firingEntities: Array<{
        id: number;
        transform: Transform;
        weapon: Weapon;
        intent: FireIntent;
        isPlayer: boolean;
    }> = [];

    for (const [id, comps] of world.entities) {
        const transform = comps.find(c => c instanceof Transform) as Transform | undefined;
        const weapon = comps.find(c => c instanceof Weapon) as Weapon | undefined;
        const intent = comps.find(c => c instanceof FireIntent) as FireIntent | undefined;

        if (!transform || !weapon) continue;

        // 检查是否有开火意图
        const hasFireIntent = intent?.firing === true;
        if (!hasFireIntent) continue;

        // 检查是否在冷却中
        if (weapon.curCD > 0) {
            weapon.curCD -= dt * 1000;
            continue;
        }

        const playerTag = comps.find(c => c instanceof PlayerTag);
        const enemyTag = comps.find(c => c instanceof EnemyTag);
        const isPlayer = !!playerTag;

        firingEntities.push({
            id,
            transform,
            weapon,
            intent,
            isPlayer
        });

        // 移除开火意图（一帧一用）
        const idx = comps.indexOf(intent);
        if (idx !== -1) comps.splice(idx, 1);
    }

    // 为每个实体发射子弹
    for (const entity of firingEntities) {
        fireWeapon(world, entity);
    }
}

/**
 * 发射武器
 */
function fireWeapon(
    world: World,
    entity: {
        id: number;
        transform: Transform;
        weapon: Weapon;
        intent: FireIntent;
        isPlayer: boolean;
    }
): void {
    const { id, transform, weapon, intent } = entity;

    // 获取弹药配置
    const ammoSpec = AMMO_TABLE[weapon.ammoType];
    if (!ammoSpec) return;

    // 计算发射角度
    let baseAngle = intent.angle ?? -Math.PI / 2; // 默认向上
    if (entity.isPlayer && intent.angle === undefined) {
        baseAngle = -Math.PI / 2; // 玩家默认向上
    } else if (!entity.isPlayer && intent.angle === undefined) {
        baseAngle = Math.PI / 2; // 敌人默认向下
    }

    // 根据弹幕模式生成子弹
    const bulletCount = weapon.bulletCount || 1;
    const spread = weapon.spread || 0;

    if (weapon.pattern === 'radial') {
        // 径向发射 - 360度均匀分布
        fireRadial(world, transform, weapon, bulletCount, ammoSpec.speed);
    } else if (weapon.pattern === 'spiral') {
        // 螺旋发射
        fireSpiral(world, transform, weapon, bulletCount, spread, baseAngle, ammoSpec.speed);
    } else if (weapon.pattern === 'random') {
        // 随机发射
        fireRandom(world, transform, weapon, bulletCount, spread, baseAngle, ammoSpec.speed);
    } else {
        // 默认扇形发射（SPREAD/AIMED）
        fireSpread(world, transform, weapon, bulletCount, spread, baseAngle, ammoSpec.speed);
    }

    // 重置冷却
    weapon.curCD = weapon.cooldown / (weapon.fireRateMultiplier || 1);

    // 生成武器发射事件
    const firedEvent: WeaponFiredEvent = {
        type: 'WeaponFired',
        pos: { x: transform.x, y: transform.y },
        weaponId: weapon.id,
        owner: id
    };
    pushEvent(world, firedEvent);
}

/**
 * 扇形发射
 */
function fireSpread(
    world: World,
    transform: Transform,
    weapon: Weapon,
    count: number,
    spread: number,
    baseAngle: number,
    speed: number
): void {
    for (let i = 0; i < count; i++) {
        // 计算每发子弹的角度
        const angleOffset = spread !== 0
            ? (spread * (i / (count - 1) - 0.5)) * (Math.PI / 180)
            : 0;
        const angle = baseAngle + angleOffset;

        createBullet(world, transform, weapon, angle, speed);
    }
}

/**
 * 径向发射
 */
function fireRadial(
    world: World,
    transform: Transform,
    weapon: Weapon,
    count: number,
    speed: number
): void {
    for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        createBullet(world, transform, weapon, angle, speed);
    }
}

/**
 * 螺旋发射
 */
function fireSpiral(
    world: World,
    transform: Transform,
    weapon: Weapon,
    count: number,
    spread: number,
    baseAngle: number,
    speed: number
): void {
    for (let i = 0; i < count; i++) {
        const angle = baseAngle + (spread * i * Math.PI / 180);
        createBullet(world, transform, weapon, angle, speed);
    }
}

/**
 * 随机发射
 */
function fireRandom(
    world: World,
    transform: Transform,
    weapon: Weapon,
    count: number,
    spread: number,
    baseAngle: number,
    speed: number
): void {
    for (let i = 0; i < count; i++) {
        const randomOffset = (Math.random() - 0.5) * 2 * spread * Math.PI / 180;
        const angle = baseAngle + randomOffset;
        createBullet(world, transform, weapon, angle, speed);
    }
}

/**
 * 创建子弹实体
 */
function createBullet(
    world: World,
    transform: Transform,
    weapon: Weapon,
    angle: number,
    speed: number
): void {
    // 计算速度向量
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // 创建子弹蓝图
    const bulletBlueprint: Blueprint = {
        Transform: { x: transform.x, y: transform.y, rot: angle },
        Velocity: { vx, vy },
        Bullet: {
            owner: world.playerId, // 默认玩家发射
            ammoType: weapon.ammoType,
            pierceLeft: weapon.pierce || 0,
            bouncesLeft: weapon.bounces || 0
        },
        HitBox: {
            shape: 'circle',
            radius: AMMO_TABLE[weapon.ammoType]?.radius || 6
        },
        Lifetime: {
            timer: 3 // 3秒后销毁
        }
    };

    spawnBullet(world, bulletBlueprint, transform.x, transform.y, angle);
}
