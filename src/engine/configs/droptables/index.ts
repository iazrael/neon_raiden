import { Blueprint } from '../../blueprints';
import { PickupId } from '../../types';
import * as WP from '../../blueprints/pickups/weaponPickups'; // 武器蓝图文件
import * as BP from '../../blueprints/pickups/buffPickups';   // Buff蓝图文件

export * from './common'; // 从 './common' 导出所有内容


// 注册表：ID -> 蓝图对象
export const PICKUP_REGISTRY: Record<string, Blueprint> = {
    [PickupId.VULCAN]: WP.BLUEPRINT_POWERUP_VULCAN,
    [PickupId.LASER]: WP.BLUEPRINT_POWERUP_LASER,
    [PickupId.MISSILE]: WP.BLUEPRINT_POWERUP_MISSILE,
    [PickupId.SHURIKEN]: WP.BLUEPRINT_POWERUP_SHURIKEN,
    [PickupId.TESLA]: WP.BLUEPRINT_POWERUP_TESLA,
    [PickupId.MAGMA]: WP.BLUEPRINT_POWERUP_MAGMA,
    [PickupId.WAVE]: WP.BLUEPRINT_POWERUP_WAVE,
    [PickupId.PLASMA]: WP.BLUEPRINT_POWERUP_PLASMA,

    [PickupId.POWER]: BP.BLUEPRINT_POWERUP_POWER,
    [PickupId.HP]: BP.BLUEPRINT_POWERUP_HP,
    [PickupId.BOMB]: BP.BLUEPRINT_POWERUP_BOMB,
    [PickupId.OPTION]: BP.BLUEPRINT_POWERUP_OPTION,
    [PickupId.INVINCIBILITY]: BP.BLUEPRINT_POWERUP_INVINCIBILITY,
    [PickupId.TIME_SLOW]: BP.BLUEPRINT_POWERUP_TIME_SLOW,
};