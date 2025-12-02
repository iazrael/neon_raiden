import { PowerupType, WeaponType } from '@/types';
import { EventBus } from '../engine/EventBus';
import { EventPayloads, CombatEventTypeBus } from '../engine/events';
import { PowerupEffects, WeaponConfig } from '../config';
import { Starfighter } from '../entities/Starfighter';

export class PowerupSystem {
  private bus: EventBus<EventPayloads>;
  constructor(bus: EventBus<EventPayloads>) {
    this.bus = bus;
  }

  apply(type: PowerupType, player: Starfighter) {
    const effects = PowerupEffects;
    if (type === PowerupType.POWER) {
      const currentMax = (WeaponConfig[player.weaponPrimary]?.maxLevel ?? effects.maxWeaponLevel);
      player.weaponLevel = Math.min(currentMax, player.weaponLevel + 1);
      return;
    }
    if (type === PowerupType.HP) {
      if (player.hp >= player.maxHp) {
        const overflowHp = effects.hpRestoreAmount;
        player.shield = Math.min(player.getShieldCap(), player.shield + overflowHp);
      } else {
        player.hp = Math.min(player.maxHp, player.hp + effects.hpRestoreAmount);
        const overflowHp = Math.max(0, player.hp + effects.hpRestoreAmount - player.maxHp);
        if (overflowHp > 0) player.shield = Math.min(player.getShieldCap(), player.shield + overflowHp);
      }
      this.bus.publish(CombatEventTypeBus.ShieldChanged, { value: player.shield, percent: player.getShieldPercent() });
      return;
    }
    if (type === PowerupType.BOMB) {
      if (player.bombs < effects.maxBombs) player.bombs++;
      return;
    }
    if (type === PowerupType.OPTION) {
      return;
    }
    if (type === PowerupType.INVINCIBILITY) {
      player.invulnerable = true;
      player.invulnerableTimer = 5000;
      return;
    }
    if (type === PowerupType.TIME_SLOW) {
      return;
    }
    const weaponType = effects.weaponTypeMap[type];
    if (weaponType !== undefined && weaponType !== null) {
      if (player.weaponPrimary === weaponType) {
        const currentMax = (WeaponConfig[player.weaponPrimary]?.maxLevel ?? effects.maxWeaponLevel);
        player.weaponLevel = Math.min(currentMax, player.weaponLevel + 1);
      } else {
        player.equipSecondary(null);
        player.equipPrimary(weaponType as WeaponType);
      }
    }
  }
}

