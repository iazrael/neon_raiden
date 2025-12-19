import { World } from '../types';
import { view, addComponent } from '../world';
import { PickupItem, Transform, Weapon, DestroyTag } from '../components';
import { WEAPON_TABLE } from '../blueprints/weapons';
import { pushEvent } from '../world';
import { PickupEvent } from '../events';

/**
 * 拾取系统
 * 检测玩家与PickupItem实体的碰撞
 * 根据物品类型应用相应效果
 */
export function PickupSystem(w: World, dt: number) {
  // 查找玩家位置和武器组件
  let playerTransform: Transform | null = null;
  let playerWeapon: Weapon | null = null;
  let playerId: number | null = null;

  if (w.playerId) {
    const playerComps = w.entities.get(w.playerId) || [];
    playerTransform = playerComps.find(c => c instanceof Transform) as Transform || null;
    playerWeapon = playerComps.find(c => c instanceof Weapon) as Weapon || null;
    playerId = w.playerId;
  }

  if (!playerTransform || !playerId) return;

  // 检测玩家与PickupItem实体的碰撞
  for (const [id, [pickupItem, transform]] of view(w, [PickupItem, Transform])) {
    // 简单的距离检测
    const dx = playerTransform.x - transform.x;
    const dy = playerTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 如果距离小于一定值，认为发生碰撞
    if (distance < 30) { // 假设碰撞半径为30像素
      // 生成拾取事件
      pushEvent(w, {
        type: 'Pickup',
        pos: { x: transform.x, y: transform.y },
        itemId: pickupItem.blueprint,
        owner: playerId
      } as PickupEvent);

      // 根据物品类型应用相应效果
      switch (pickupItem.kind) {
        case 'weapon':
          // 拾取武器的逻辑
          handleWeaponPickup(w, playerId, playerWeapon, pickupItem.blueprint);
          break;
        case 'buff':
          // 拾取增益效果的逻辑
          console.log(`Picked up buff: ${pickupItem.blueprint}`);
          break;
        case 'coin':
          // 拾取金币的逻辑
          console.log(`Picked up coin: ${pickupItem.blueprint}`);
          break;
      }

      // 添加销毁标记
      addComponent(w, id, new DestroyTag({ reason: 'consumed' }));
    }
  }
}

/**
 * 处理武器拾取逻辑
 * @param world 世界对象
 * @param playerId 玩家ID
 * @param playerWeapon 玩家当前武器组件
 * @param weaponBlueprint 武器蓝图名称
 */
function handleWeaponPickup(world: World, playerId: number, playerWeapon: Weapon | null, weaponBlueprint: string) {
  // 查找武器配置
  const weaponSpec = Object.values(WEAPON_TABLE).find(spec => spec.id === weaponBlueprint);
  if (!weaponSpec) {
    console.warn(`Weapon spec not found for blueprint: ${weaponBlueprint}`);
    return;
  }

  // 如果玩家已经有武器
  if (playerWeapon) {
    // 如果是同一类型武器，升级武器等级
    if (playerWeapon.id === weaponSpec.id) {
      // 升级武器等级（不超过最大等级）
      if (weaponSpec.maxLevel && playerWeapon.level < weaponSpec.maxLevel) {
        playerWeapon.level += 1;
      }
    } else {
      // 切换到新武器
      // 移除旧武器组件
      const playerComps = world.entities.get(playerId) || [];
      const weaponIndex = playerComps.indexOf(playerWeapon);
      if (weaponIndex !== -1) {
        playerComps.splice(weaponIndex, 1);
      }

      // 添加新武器组件
      const newWeapon = new Weapon({
        id: weaponSpec.id,
        ammoType: weaponSpec.ammoType,
        cooldown: weaponSpec.cooldown,
        level: 1,
        bulletCount: weaponSpec.bulletCount,
        spread: weaponSpec.spread,
        pattern: weaponSpec.pattern,
        damageMultiplier: weaponSpec.damageMultiplier,
        fireRateMultiplier: weaponSpec.fireRateMultiplier,
        pierce: weaponSpec.pierce,
        bounces: weaponSpec.bounces
      });

      playerComps.push(newWeapon);
    }
  } else {
    // 玩家没有武器，添加新武器
    const playerComps = world.entities.get(playerId) || [];
    const newWeapon = new Weapon({
      id: weaponSpec.id,
      ammoType: weaponSpec.ammoType,
      cooldown: weaponSpec.cooldown,
      level: 1,
      bulletCount: weaponSpec.bulletCount,
      spread: weaponSpec.spread,
      pattern: weaponSpec.pattern,
      damageMultiplier: weaponSpec.damageMultiplier,
      fireRateMultiplier: weaponSpec.fireRateMultiplier,
      pierce: weaponSpec.pierce,
      bounces: weaponSpec.bounces
    });

    playerComps.push(newWeapon);
  }
}