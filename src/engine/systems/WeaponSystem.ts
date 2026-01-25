/**
 * 武器系统 (WeaponSystem)
 *
 * 职责：
 * - 处理 FireIntent 组件，发射子弹
 * - 玩家的 FireIntent 由 InputSystem 根据武器冷却自动生成
 * - 敌人的 FireIntent 由 AI 系统生成
 * - 根据武器配置生成子弹实体
 * - 处理武器冷却重置
 * - 支持不同的弹幕模式（SPREAD、AIMED、RADIAL、SPIRAL等）
 *
 * 系统类型：状态层
 * 执行顺序：P2 - 在决策层之后，物理层之前
 */

import { World } from '../types';
import { Transform, Weapon, FireIntent, PlayerTag } from '../components';
import { spawnBullet } from '../factory';
import { AMMO_TABLE } from '../blueprints/ammo';
import { Blueprint } from '../blueprints';
import { pushEvent } from '../world';
import { WeaponFiredEvent } from '../events';
import { AmmoType } from '../types';
import { ASSETS } from '../configs';

/**
 * 弹药类型到纹理的映射
 */
const AMMO_SPRITE_MAP: Partial<Record<AmmoType, string>> = {
    [AmmoType.VULCAN_SPREAD]: ASSETS.BULLETS.vulcan,
    [AmmoType.LASER_BEAM]: ASSETS.BULLETS.laser,
    [AmmoType.MISSILE_HOMING]: ASSETS.BULLETS.missile,
    [AmmoType.WAVE_PULSE]: ASSETS.BULLETS.wave,
    [AmmoType.PLASMA_ORB]: ASSETS.BULLETS.plasma,
    [AmmoType.TESLA_CHAIN]: ASSETS.BULLETS.tesla,
    [AmmoType.MAGMA_POOL]: ASSETS.BULLETS.magma,
    [AmmoType.SHURIKEN_BOUNCE]: ASSETS.BULLETS.shuriken,
    // 敌人弹药
    [AmmoType.ENEMY_ORB_RED]: ASSETS.ENEMIE_BULLETS.orb,
    [AmmoType.ENEMY_ORB_BLUE]: ASSETS.ENEMIE_BULLETS.orb,
    [AmmoType.ENEMY_ORB_GREEN]: ASSETS.ENEMIE_BULLETS.orb,
    [AmmoType.ENEMY_BEAM_THIN]: ASSETS.ENEMIE_BULLETS.beam,
    [AmmoType.ENEMY_BEAM_THICK]: ASSETS.ENEMIE_BULLETS.beam,
    [AmmoType.ENEMY_RAPID]: ASSETS.ENEMIE_BULLETS.rapid,
    [AmmoType.ENEMY_HEAVY]: ASSETS.ENEMIE_BULLETS.heavy,
    [AmmoType.ENEMY_HOMING]: ASSETS.ENEMIE_BULLETS.homing,
    [AmmoType.ENEMY_SPIRAL]: ASSETS.ENEMIE_BULLETS.spiral,
    [AmmoType.ENEMY_MISSILE]: ASSETS.ENEMIE_BULLETS.homing,
    [AmmoType.ENEMY_PULSE]: ASSETS.ENEMIE_BULLETS.orb,
    [AmmoType.ENEMY_VOID_ORB]: ASSETS.ENEMIE_BULLETS.orb,
};

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
        const transform = comps.find(Transform.check) as Transform | undefined;
        const weapon = comps.find(c => c instanceof Weapon) as Weapon | undefined;
        const intent = comps.find(c => c instanceof FireIntent) as FireIntent | undefined;
        const playerTag = comps.find(c => c instanceof PlayerTag);

        if (!transform || !weapon) continue;

        // 检查是否有开火意图
        if (!intent || !intent.firing) continue;

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
        intent?: FireIntent;
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
        fireRadial(world, transform, weapon, id, bulletCount, ammoSpec.speed);
    } else if (weapon.pattern === 'spiral') {
        // 螺旋发射
        fireSpiral(world, transform, weapon, id, bulletCount, spread, baseAngle, ammoSpec.speed);
    } else if (weapon.pattern === 'random') {
        // 随机发射
        fireRandom(world, transform, weapon, id, bulletCount, spread, baseAngle, ammoSpec.speed);
    } else {
        // 默认扇形发射（SPREAD/AIMED）
        fireSpread(world, transform, weapon, id, bulletCount, spread, baseAngle, ammoSpec.speed);
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
    ownerId: number,
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

        createBullet(world, transform, weapon, ownerId, angle, speed);
    }
}

/**
 * 径向发射
 */
function fireRadial(
    world: World,
    transform: Transform,
    weapon: Weapon,
    ownerId: number,
    count: number,
    speed: number
): void {
    for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        createBullet(world, transform, weapon, ownerId, angle, speed);
    }
}

/**
 * 螺旋发射
 */
function fireSpiral(
    world: World,
    transform: Transform,
    weapon: Weapon,
    ownerId: number,
    count: number,
    spread: number,
    baseAngle: number,
    speed: number
): void {
    for (let i = 0; i < count; i++) {
        const angle = baseAngle + (spread * i * Math.PI / 180);
        createBullet(world, transform, weapon, ownerId, angle, speed);
    }
}

/**
 * 随机发射
 */
function fireRandom(
    world: World,
    transform: Transform,
    weapon: Weapon,
    ownerId: number,
    count: number,
    spread: number,
    baseAngle: number,
    speed: number
): void {
    for (let i = 0; i < count; i++) {
        const randomOffset = (Math.random() - 0.5) * 2 * spread * Math.PI / 180;
        const angle = baseAngle + randomOffset;
        createBullet(world, transform, weapon, ownerId, angle, speed);
    }
}

/**
 * 创建子弹实体
 */
function createBullet(
    world: World,
    transform: Transform,
    weapon: Weapon,
    ownerId: number,
    angle: number,
    speed: number
): void {


    // 计算速度向量 - speed 是像素/秒，需要转换为像素/毫秒
    const vx = Math.cos(angle) * speed / 1000;
    const vy = Math.sin(angle) * speed / 1000;

    // 获取子弹纹理
    const bulletTexture = AMMO_SPRITE_MAP[weapon.ammoType] || ASSETS.BULLETS.vulcan;

    // 创建子弹蓝图
    const bulletBlueprint: Blueprint = {
        Transform: { x: transform.x, y: transform.y, rot: angle },
        Velocity: { vx, vy },
        Sprite: { texture: bulletTexture, srcX: 0, srcY: 0, srcW: 16, srcH: 16, scale: 1, pivotX: 0.5, pivotY: 0.5 },
        Bullet: {
            owner: ownerId, // 使用实际的拥有者 ID
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

    // 调试日志
    console.log('[WeaponSystem] Bullet spawned:', { x: transform.x, y: transform.y, texture: bulletTexture });
}
