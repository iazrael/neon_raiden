/**
 * 武器协同系统 (WeaponSynergySystem)
 *
 * 职责：
 * - 检测武器组合效果
 * - 当玩家同时装备特定武器组合时，触发额外效果
 * - 例如：火神炮+激光=暴击加成，导弹+波动=范围爆炸
 *
 * 系统类型：状态层
 * 执行顺序：P2 - 在 WeaponSystem 之前
 */

import { World } from '../types';
import { Weapon, PlayerTag } from '../components';
import { WeaponId, EnemyWeaponId } from '../types';
import { AMMO_TABLE } from '../blueprints/ammo';

/**
 * 检查武器 ID 是否为玩家武器
 */
function isPlayerWeapon(id: WeaponId | EnemyWeaponId): id is WeaponId {
    return Object.values(WeaponId).includes(id as WeaponId);
}

/**
 * 武器协同效果配置
 */
interface SynergyEffect {
    weapons: WeaponId[];      // 需要的武器组合
    bonusDamage: number;       // 伤害加成（百分比）
    bonusFireRate: number;     // 射速加成（百分比）
    bonusPierce: number;       // 穿透加成
    special: string;           // 特殊效果描述
}

/**
 * 武器协同效果表
 */
const SYNERGY_TABLE: SynergyEffect[] = [
    {
        weapons: [WeaponId.VULCAN, WeaponId.LASER],
        bonusDamage: 0.2,
        bonusFireRate: 0,
        bonusPierce: 0,
        special: 'precision_strike' // 精准打击 - 暴击加成
    },
    {
        weapons: [WeaponId.MISSILE, WeaponId.WAVE],
        bonusDamage: 0.3,
        bonusFireRate: 0,
        bonusPierce: 0,
        special: 'blast_radius' // 爆炸半径 - 范围伤害
    },
    {
        weapons: [WeaponId.TESLA, WeaponId.SHURIKEN],
        bonusDamage: 0.15,
        bonusFireRate: 0.2,
        bonusPierce: 2,
        special: 'chain_lightning' // 连锁闪电 - 增加穿透
    },
    {
        weapons: [WeaponId.PLASMA, WeaponId.MAGMA],
        bonusDamage: 0.5,
        bonusFireRate: -0.1,
        bonusPierce: 0,
        special: 'meltdown' // 熔毁 - 高伤害低射速
    },
    {
        weapons: [WeaponId.VULCAN, WeaponId.MISSILE],
        bonusDamage: 0.1,
        bonusFireRate: 0.1,
        bonusPierce: 0,
        special: 'rapid_assault' // 快速突击 - 均衡加成
    }
];

/**
 * 武器协同系统主函数
 * @param world 世界对象
 * @param dt 时间增量（秒）
 */
export function WeaponSynergySystem(world: World, dt: number): void {
    // 收集玩家所有武器（只处理玩家武器类型）
    const playerWeapons: WeaponId[] = [];

    for (const [id, comps] of world.entities) {
        const playerTag = comps.find(PlayerTag.check);
        if (!playerTag) continue;

        const weapons = comps.filter(Weapon.check) as Weapon[];
        for (const weapon of weapons) {
            // 只处理玩家武器类型
            if (isPlayerWeapon(weapon.id)) {
                playerWeapons.push(weapon.id);
            }
        }
    }

    // 检查激活的协同效果
    const activeSynergies: SynergyEffect[] = [];

    for (const synergy of SYNERGY_TABLE) {
        // 检查是否拥有所需的所有武器
        const hasAllWeapons = synergy.weapons.every(w => playerWeapons.includes(w));

        if (hasAllWeapons) {
            activeSynergies.push(synergy);
        }
    }

    // 应用协同效果到玩家的武器组件
    for (const [id, comps] of world.entities) {
        const playerTag = comps.find(PlayerTag.check);
        if (!playerTag) continue;

        const weapons = comps.filter(Weapon.check) as Weapon[];

        for (const weapon of weapons) {
            // 只处理玩家武器
            if (!isPlayerWeapon(weapon.id)) continue;

            // 重置加成
            weapon.damageMultiplier = 1.0;
            weapon.fireRateMultiplier = 1.0;
            weapon.pierce = (AMMO_TABLE[weapon.ammoType]?.pierce || 0);

            // 应用所有激活的协同效果
            for (const synergy of activeSynergies) {
                if (synergy.weapons.includes(weapon.id)) {
                    weapon.damageMultiplier += synergy.bonusDamage;
                    weapon.fireRateMultiplier += synergy.bonusFireRate;
                    weapon.pierce += synergy.bonusPierce;
                }
            }
        }
    }
}
