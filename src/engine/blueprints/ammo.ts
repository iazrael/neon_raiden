//
// 子弹类型配置文件
//

import { AmmoSpec } from './base';
import { AmmoType } from '../types';


// =============================================================================
// 弹药规格总览表
//
// | 弹药类型        | 伤害 | 半径 | 速度  | 穿透 | 反弹 | 特殊效果     | 说明                         |
// | --------------- | ---- | ---- | ----- | ---- | ---- | ------------ | ---------------------------- |
// | VULCAN_SPREAD   | 12   | 6    | 800   | 0    | 0    | 无           | 标准子弹，散弹扇形           |
// | LASER_BEAM      | 6    | 4    | 1200  | 99   | 0    | 无           | 高速光束，高穿透             |
// | MISSILE_HOMING  | 35   | 8    | 400   | 0    | 0    | 无           | 追踪导弹                     |
// | WAVE_PULSE      | 18   | 30   | 600   | 0    | 0    | 无           | 宽幅能量波，范围攻击         |
// | PLASMA_ORB      | 45   | 16   | 300   | 0    | 0    | 爆炸         | 高威力等离子球               |
// | TESLA_CHAIN     | 15   | 8    | 1200  | 5    | 0    | 无           | 连锁闪电，可跳跃5个目标      |
// | MAGMA_POOL      | 15   | 12   | 500   | 0    | 0    | 持续伤害     | 熔岩弹，造成持续伤害         |
// | SHURIKEN_BOUNCE | 15   | 12   | 700   | 0    | 3    | 无           | 反弹飞镖，可反弹3次          |
// =============================================================================

// 以 AMMO_TABLE 表格的形式导出
export const AMMO_TABLE: Record<AmmoType, AmmoSpec> = {
    [AmmoType.VULCAN_SPREAD]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.VULCAN_SPREAD,
        /** 每发子弹的基础伤害值 */
        damage: 12,
        /** 碰撞盒半径（像素） */
        radius: 6,
        /** 子弹飞行速度（像素/秒） */
        speed: 800,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 0,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 0,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: [],
    },
    [AmmoType.LASER_BEAM]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.LASER_BEAM,
        /** 每发子弹的基础伤害值 */
        damage: 6,
        /** 碰撞盒半径（像素） */
        radius: 4,
        /** 子弹飞行速度（像素/秒） */
        speed: 1200,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 99,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 0,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: [],
    },
    [AmmoType.MISSILE_HOMING]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.MISSILE_HOMING,
        /** 每发子弹的基础伤害值 */
        damage: 35,
        /** 碰撞盒半径（像素） */
        radius: 8,
        /** 子弹飞行速度（像素/秒） */
        speed: 400,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 0,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 0,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: [],
    },
    [AmmoType.WAVE_PULSE]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.WAVE_PULSE,
        /** 每发子弹的基础伤害值 */
        damage: 18,
        /** 碰撞盒半径（像素） */
        radius: 30,
        /** 子弹飞行速度（像素/秒） */
        speed: 600,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 0,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 0,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: [],
    },
    [AmmoType.PLASMA_ORB]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.PLASMA_ORB,
        /** 每发子弹的基础伤害值 */
        damage: 45,
        /** 碰撞盒半径（像素） */
        radius: 16,
        /** 子弹飞行速度（像素/秒） */
        speed: 300,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 0,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 0,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: ['explosion'],
    },
    [AmmoType.TESLA_CHAIN]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.TESLA_CHAIN,
        /** 每发子弹的基础伤害值 */
        damage: 15,
        /** 碰撞盒半径（像素） */
        radius: 8,
        /** 子弹飞行速度（像素/秒） */
        speed: 1200,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 5,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 0,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: [],
    },
    [AmmoType.MAGMA_POOL]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.MAGMA_POOL,
        /** 每发子弹的基础伤害值 */
        damage: 15,
        /** 碰撞盒半径（像素） */
        radius: 12,
        /** 子弹飞行速度（像素/秒） */
        speed: 500,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 0,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 0,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: ['dot'],
    },
    [AmmoType.SHURIKEN_BOUNCE]: {
        /** 弹种唯一键（与 WeaponSpec.ammoType 对应） */
        id: AmmoType.SHURIKEN_BOUNCE,
        /** 每发子弹的基础伤害值 */
        damage: 15,
        /** 碰撞盒半径（像素） */
        radius: 12,
        /** 子弹飞行速度（像素/秒） */
        speed: 700,
        /** 可穿透敌人数（0 = 不穿透） */
        pierce: 0,
        /** 可反弹次数（0 = 不反弹） */
        bounces: 3,
        /** 命中时触发的效果 ID 列表（字符串引用） */
        onHit: [],
    },
    // ==================== 敌人弹药 ====================
    [AmmoType.ENEMY_ORB_RED]: {
        id: AmmoType.ENEMY_ORB_RED,
        damage: 10, radius: 6, speed: 300, pierce: 0, bounces: 0, onHit: [],
    },
    [AmmoType.ENEMY_ORB_BLUE]: {
        id: AmmoType.ENEMY_ORB_BLUE,
        damage: 15, radius: 8, speed: 250, pierce: 0, bounces: 0, onHit: [],
    },
    [AmmoType.ENEMY_ORB_GREEN]: {
        id: AmmoType.ENEMY_ORB_GREEN,
        damage: 12, radius: 7, speed: 280, pierce: 0, bounces: 0, onHit: [],
    },
    [AmmoType.ENEMY_BEAM_THIN]: {
        id: AmmoType.ENEMY_BEAM_THIN,
        damage: 20, radius: 4, speed: 800, pierce: 99, bounces: 0, onHit: [],
    },
    [AmmoType.ENEMY_BEAM_THICK]: {
        id: AmmoType.ENEMY_BEAM_THICK,
        damage: 40, radius: 12, speed: 600, pierce: 99, bounces: 0, onHit: [],
    },
    // 速射弹：伤害低，但在屏幕上飞得很快，通常用于加特林或突击单位
    [AmmoType.ENEMY_RAPID]: {
        id: AmmoType.ENEMY_RAPID,
        damage: 5,               // 伤害较低
        radius: 4,               // 碰撞箱小
        speed: 700,              // 速度快 (700px/s)
        pierce: 0,
        bounces: 0,
        onHit: [],
        // visuals: {
        //     texture: 'bullet_rapid_needle', // 建议用细长的针状贴图
        //     color: '#ffff00' // 黄色预警
        // }
    },

    // 重炮弹：像陨石一样砸过来，速度慢但判定大、伤害高，甚至可能带小范围爆炸
    [AmmoType.ENEMY_HEAVY]: {
        id: AmmoType.ENEMY_HEAVY,
        damage: 40,              // 伤害极高
        radius: 18,              // 判定范围很大
        speed: 200,              // 速度慢
        pierce: 0,
        bounces: 0,
        onHit: ['explosion_small'], // 击中后可能产生一个小爆炸特效
        // visuals: {
        //     texture: 'bullet_heavy_shell', // 建议用大圆球或炮弹贴图
        //     color: '#ff6600' // 橙红色
        // }
    },

    // 追踪弹：速度适中，配合 Weapon 的 homing 逻辑使用
    [AmmoType.ENEMY_HOMING]: {
        id: AmmoType.ENEMY_HOMING,
        damage: 15,
        radius: 8,
        speed: 350,              // 速度适中，给玩家躲避空间
        pierce: 0,
        bounces: 0,
        onHit: [],
        // visuals: {
        //     texture: 'bullet_homing_arrow', // 建议用箭头或三角形，方便看朝向
        //     color: '#aa00ff' // 紫色
        // }
    },

    // 螺旋弹：通常用于弹幕机，颜色鲜艳，速度规律，适合铺满屏幕
    [AmmoType.ENEMY_SPIRAL]: {
        id: AmmoType.ENEMY_SPIRAL,
        damage: 10,
        radius: 7,
        speed: 300,
        pierce: 0,
        bounces: 0,
        onHit: [],
        // visuals: {
        //     texture: 'bullet_spiral_star', // 建议用星星或菱形
        //     color: '#00ffff' // 青色/霓虹色
        // }
    },
    [AmmoType.ENEMY_MISSILE]: {
        id: AmmoType.ENEMY_MISSILE,
        damage: 25, radius: 10, speed: 350, pierce: 0, bounces: 0, onHit: ['explosion_small'],
    },
    [AmmoType.ENEMY_PULSE]: {
        id: AmmoType.ENEMY_PULSE,
        damage: 8, radius: 5, speed: 500, pierce: 0, bounces: 0, onHit: [],
    },
    [AmmoType.ENEMY_VOID_ORB]: {
        id: AmmoType.ENEMY_VOID_ORB,
        damage: 50, radius: 20, speed: 200, pierce: 99, bounces: 0, onHit: ['void_zone'],
    },
};