import { WeaponSynergySystem, SynergyType, CombatEventType, SynergyEffectType } from '@/game/systems/WeaponSynergySystem';
import { WeaponType, Entity, EntityType } from '@/types';

const enemy: Entity = {
  x: 100, y: 100, width: 20, height: 20, vx: 0, vy: 0,
  hp: 100, maxHp: 100, type: EntityType.ENEMY, color: '#fff', markedForDeletion: false
};

const player: Entity = {
  x: 50, y: 50, width: 20, height: 20, vx: 0, vy: 0,
  hp: 100, maxHp: 100, type: EntityType.PLAYER, color: '#0ff', markedForDeletion: false
};

describe('MAGMA_SHURIKEN synergy - burn on hit', () => {
  test('triggers burn on SHURIKEN hit without requiring bounce', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.MAGMA, WeaponType.SHURIKEN]);

    const res = sys.tryTriggerSynergies({
      weaponType: WeaponType.SHURIKEN,
      bulletX: 0,
      bulletY: 0,
      targetEnemy: enemy,
      enemies: [enemy],
      player,
      eventType: CombatEventType.HIT,
      shurikenBounced: false
    });

    expect(res.some(r => r.type === SynergyType.MAGMA_SHURIKEN && r.effect === SynergyEffectType.BURN)).toBeTruthy();
    expect(res.find(r => r.type === SynergyType.MAGMA_SHURIKEN)?.value).toBe(5);
  });
});

