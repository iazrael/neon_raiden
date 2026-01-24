import { ASSETS } from '@/engine/configs';
import { WeaponId } from '@/engine/types';
import { Blueprint } from './base';
import { WEAPON_TABLE } from './weapons';


/**
 * 玩家战机蓝图 - Neon战机
 * 定义了玩家战机的基础属性和初始配置
 */
export const BLUEPRINT_FIGHTER_NEON: Blueprint = {
    /** 变换组件 - 设置战机的初始位置和旋转角度 */
    Transform: { x: 0, y: 0, rot: 0 },

    /** 生命值组件 - 设置战机的当前生命值和最大生命值 */
    Health: { hp: 150, max: 200 },

    /** 护盾组件 - 设置战机的初始护盾值和再生速率 */
    Shield: { value: 100, regen: 0 },

    /** 速度状态组件 - 设置战机的最大线性速度和角速度 */
    SpeedStat: { maxLinear: 7 * 60, maxAngular: 5 },

    /** 碰撞盒组件 - 设置战机的碰撞检测区域 */
    HitBox: { shape: 'circle', radius: 24 * (1 - 0.2) },

    /** 精灵组件 - 设置战机的纹理信息 */
    Sprite: { texture: ASSETS.FIGHTERS.player, srcX: 0, srcY: 0, srcW: 48, srcH: 48, scale: 1, pivotX: 0.5, pivotY: 0.5 },

    /** 玩家标签组件 - 标识此实体为玩家 */
    PlayerTag: {},

    /** 武器组件 - 设置战机的初始武器 */
    Weapon: WEAPON_TABLE[WeaponId.VULCAN],
};