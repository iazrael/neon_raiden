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
import { CollisionLayer } from '../types/collision';
import { AMMO_TABLE } from '../blueprints/ammo';
import { ALL_WEAPONS_TABLE } from '../blueprints/weapons';
import { Blueprint, WeaponSpec, AmmoSpec } from '../blueprints';
import { pushEvent, removeComponent, view } from '../world';
import { WeaponFiredEvent } from '../events';
import { BULLET_SPRITE_CONFIG } from '../configs/sprites/bullets';
import { getWeaponUpgrade } from '../configs/weapon-upgrades';
import { BulletSpriteSpec } from '../configs/sprites/bullets';

/**
 * 武器系统主函数
 */
export function WeaponSystem(world: World, dt: number): void {

    for (const [id, [transform, weapon]] of view(world, [Transform, Weapon])) {
        // 第一步：更新所有武器的冷却时间
        if (weapon.curCD > 0) {
            weapon.curCD -= dt;
        }
        // 检查冷却是否完成
        if (weapon.curCD > 0) {
            continue;
        }
        // 第二步：获取有开火意图且冷却完成的武器
        const entity = world.entities.get(id) || [];
        const intent = entity.find(FireIntent.check);
        if (!intent || !intent.firing) {
            continue; // 没有开火意图，跳过
        }
        // 消费掉开火意图（传入实例而非类）
        removeComponent(world, id, intent);

        // 第三步：发射武器
        const isPlayer = !!entity.find(PlayerTag.check);
        // console.log(`Entity ${id} firing weapon ${weapon.id}`);
        fireWeapon(world, {
            id,
            transform,
            weapon,
            intent,
            isPlayer
        });
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

    // 获取配置
    const ammoSpec = AMMO_TABLE[weapon.ammoType];
    if (!ammoSpec) return;

    const weaponSpec = ALL_WEAPONS_TABLE[weapon.id];
    if (!weaponSpec) return;

    const spriteSpec = BULLET_SPRITE_CONFIG[weapon.ammoType];
    if (!spriteSpec) return;

    // 获取升级配置（敌人使用 weapon 自身的倍率）
    // 玩家优先使用实例上的倍率，否则使用升级表
    // FIXME: 后续记得玩家升级后, 要先修改 Weapon 组件的倍率字段
    const upgradeSpec = entity.isPlayer
        ? {
            damageMultiplier: weapon.damageMultiplier ?? getWeaponUpgrade(weapon.id as any, weapon.level || 1).damageMultiplier,
            fireRateMultiplier: weapon.fireRateMultiplier ?? getWeaponUpgrade(weapon.id as any, weapon.level || 1).fireRateMultiplier
        }
        : {
            damageMultiplier: weapon.damageMultiplier || 1.0,
            fireRateMultiplier: weapon.fireRateMultiplier || 1.0
        };

    // 计算发射角度
    let baseAngle = intent.angle ?? -Math.PI / 2; // 默认向上
    if (entity.isPlayer && intent.angle === undefined) {
        baseAngle = -Math.PI / 2; // 玩家默认向上
    } else if (!entity.isPlayer && intent.angle === undefined) {
        baseAngle = Math.PI / 2; // 敌人默认向下
    }

    // 根据弹幕模式生成子弹
    const bulletCount = weaponSpec.bulletCount || 1;
    const spread = weaponSpec.spread || 0;

    const fireContext = {
        world,
        transform,
        weapon,
        weaponSpec,
        ammoSpec,
        spriteSpec,
        upgradeSpec,
        ownerId: id,
        isPlayer: entity.isPlayer,
    };

    if (weaponSpec.pattern === 'radial') {
        // 径向发射 - 360度均匀分布
        fireRadial(fireContext, bulletCount);
    } else if (weaponSpec.pattern === 'spiral') {
        // 螺旋发射
        fireSpiral(fireContext, bulletCount, spread, baseAngle);
    } else if (weaponSpec.pattern === 'random') {
        // 随机发射
        fireRandom(fireContext, bulletCount, spread, baseAngle);
    } else {
        // 默认扇形发射（SPREAD/AIMED）
        fireSpread(fireContext, bulletCount, spread, baseAngle);
    }

    // 重置冷却：实际冷却 = 武器冷却 / 射速倍率
    weapon.curCD = weapon.cooldown / upgradeSpec.fireRateMultiplier;

    // 生成武器发射事件
    const firedEvent: WeaponFiredEvent = {
        type: 'WeaponFired',
        pos: { x: transform.x, y: transform.y },
        weaponId: weapon.id,
        owner: id
    };
    pushEvent(world, firedEvent);
}

interface FireContext {
    world: World;
    transform: Transform;
    weapon: Weapon;
    weaponSpec: WeaponSpec;
    ammoSpec: AmmoSpec;
    spriteSpec: BulletSpriteSpec;
    upgradeSpec: { damageMultiplier: number; fireRateMultiplier: number };
    ownerId: number;
    isPlayer: boolean;
}

/**
 * 扇形发射
 */
function fireSpread(ctx: FireContext, count: number, spread: number, baseAngle: number): void {
    for (let i = 0; i < count; i++) {
        const angleOffset = spread !== 0
            ? (spread * (i / (count - 1) - 0.5)) * (Math.PI / 180)
            : 0;
        const angle = baseAngle + angleOffset;
        createBullet(ctx, angle);
    }
}

/**
 * 径向发射（360度均匀分布，不使用 baseAngle）
 */
function fireRadial(ctx: FireContext, count: number): void {
    for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI * i) / count;
        createBullet(ctx, angle);
    }
}

/**
 * 螺旋发射
 */
function fireSpiral(ctx: FireContext, count: number, spread: number, baseAngle: number): void {
    for (let i = 0; i < count; i++) {
        const angle = baseAngle + (spread * i * Math.PI / 180);
        createBullet(ctx, angle);
    }
}

/**
 * 随机发射
 */
function fireRandom(ctx: FireContext, count: number, spread: number, baseAngle: number): void {
    for (let i = 0; i < count; i++) {
        const randomOffset = (Math.random() - 0.5) * 2 * spread * Math.PI / 180;
        const angle = baseAngle + randomOffset;
        createBullet(ctx, angle);
    }
}

/**
 * 创建子弹实体
 *
 * 子弹属性计算公式：
 * - 最终伤害 = 弹药基础伤害 × 升级伤害倍率
 * - 最终穿透 = 弹药基础穿透 + 武器穿透加成
 * - 最终反弹 = 弹药基础反弹 + 武器反弹加成
 */
function createBullet(ctx: FireContext, angle: number): void {
    const { world, transform, weapon, weaponSpec, ammoSpec, spriteSpec, upgradeSpec, ownerId } = ctx;

    // 计算最终属性
    const finalDamage = ammoSpec.damage * upgradeSpec.damageMultiplier;
    const finalPierce = ammoSpec.pierce + (weaponSpec.pierceBonus ?? 0);
    const finalBounces = ammoSpec.bounces + (weaponSpec.bouncesBonus ?? 0);

    // 计算速度向量 - speed 是像素/秒，需要转换为像素/毫秒
    const vx = Math.cos(angle) * ammoSpec.speed / 1000;
    const vy = Math.sin(angle) * ammoSpec.speed / 1000;

    // 创建子弹蓝图
    const bulletBlueprint: Blueprint = {
        Transform: { x: transform.x, y: transform.y, rot: angle },
        Velocity: { vx, vy },
        Sprite: {
            spriteKey: spriteSpec.spriteKey,
            color: spriteSpec.color,
            scale: 1
        },
        Bullet: {
            owner: ownerId,
            ammoType: weapon.ammoType,
            damage: finalDamage,
            pierceLeft: finalPierce,
            bouncesLeft: finalBounces
        },
        HitBox: {
            shape: 'circle',
            radius: ammoSpec.radius,
            layer: ctx.isPlayer ? CollisionLayer.PlayerBullet : CollisionLayer.EnemyBullet
        },
        Lifetime: {
            timer: 3 // 3秒后销毁
        }
    };

    spawnBullet(world, bulletBlueprint, transform.x, transform.y, angle);
}
