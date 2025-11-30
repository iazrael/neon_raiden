import { WeaponSynergySystem, SynergyType } from '@/game/systems/WeaponSynergySystem';
import { WeaponType, Entity, EntityType, CombatEventType, SynergyEffectType } from '@/types';

const enemy: Entity = {
  x: 100, y: 100, width: 20, height: 20, vx: 0, vy: 0,
  hp: 100, maxHp: 100, type: EntityType.ENEMY, color: '#fff', markedForDeletion: false
};

const player: Entity = {
  x: 50, y: 50, width: 20, height: 20, vx: 0, vy: 0,
  hp: 100, maxHp: 100, type: EntityType.PLAYER, color: '#0ff', markedForDeletion: false
};

describe('WeaponSynergySystem - Basic Synergy Activation', () => {
  test('WAVE+PLASMA returns damage_boost on hit', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.WAVE, WeaponType.PLASMA]);
    const res = sys.tryTriggerSynergies({
      weaponType: WeaponType.WAVE,
      bulletX: 0,
      bulletY: 0,
      targetEnemy: enemy,
      enemies: [enemy],
      player,
      eventType: CombatEventType.HIT
    });
    expect(res.some(r => r.type === SynergyType.WAVE_PLASMA && r.effect === SynergyEffectType.DAMAGE_BOOST)).toBeTruthy();
    expect(res.find(r => r.type === SynergyType.WAVE_PLASMA)?.multiplier).toBe(1.5);
  });

  test('TESLA+PLASMA returns defense effects on explode', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.TESLA, WeaponType.PLASMA]);
    const res = sys.tryTriggerSynergies({
      weaponType: WeaponType.PLASMA,
      bulletX: 0,
      bulletY: 0,
      targetEnemy: enemy,
      enemies: [enemy],
      player,
      eventType: CombatEventType.EXPLODE
    });
    expect(res.some(r => r.effect === SynergyEffectType.SHIELD_REGEN)).toBeTruthy();
    expect(res.some(r => r.effect === SynergyEffectType.INVULNERABLE)).toBeTruthy();
    expect(res.find(r => r.effect === SynergyEffectType.SHIELD_REGEN)?.value).toBe(6);
    expect(res.find(r => r.effect === SynergyEffectType.INVULNERABLE)?.value).toBe(200);
  });

  test('LASER+TESLA triggers chain lightning with 15% probability', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.LASER, WeaponType.TESLA]);

    // Run multiple times to test probability
    let triggered = 0;
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      const res = sys.tryTriggerSynergies({
        weaponType: WeaponType.LASER,
        bulletX: 0,
        bulletY: 0,
        targetEnemy: enemy,
        enemies: [enemy],
        player,
        eventType: CombatEventType.HIT
      });
      if (res.some(r => r.type === SynergyType.LASER_TESLA && r.effect === SynergyEffectType.CHAIN_LIGHTNING)) {
        triggered++;
      }
    }

    // Should trigger roughly 15% of the time (allow 10-20% range for randomness)
    const triggerRate = triggered / iterations;
    expect(triggerRate).toBeGreaterThan(0.10);
    expect(triggerRate).toBeLessThan(0.20);
  });

  test('MISSILE+VULCAN triggers damage boost when target has vulcan tag', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.MISSILE, WeaponType.VULCAN]);

    const taggedEnemy = {
      ...enemy,
      tags: { hitByVulcan: Date.now() + 1000 }
    };

    const res = sys.tryTriggerSynergies({
      weaponType: WeaponType.MISSILE,
      bulletX: 0,
      bulletY: 0,
      targetEnemy: taggedEnemy,
      enemies: [taggedEnemy],
      player,
      eventType: CombatEventType.HIT
    });

    expect(res.some(r => r.type === SynergyType.MISSILE_VULCAN && r.effect === SynergyEffectType.DAMAGE_BOOST)).toBeTruthy();
    expect(res.find(r => r.type === SynergyType.MISSILE_VULCAN)?.multiplier).toBe(1.3);
  });

  test('MISSILE+VULCAN does not trigger without vulcan tag', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.MISSILE, WeaponType.VULCAN]);

    const res = sys.tryTriggerSynergies({
      weaponType: WeaponType.MISSILE,
      bulletX: 0,
      bulletY: 0,
      targetEnemy: enemy,
      enemies: [enemy],
      player,
      eventType: CombatEventType.HIT
    });

    expect(res.some(r => r.type === SynergyType.MISSILE_VULCAN)).toBeFalsy();
  });

  test('MAGMA+SHURIKEN triggers burn effect on bounce', () => {
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
      shurikenBounced: true
    });

    expect(res.some(r => r.type === SynergyType.MAGMA_SHURIKEN && r.effect === SynergyEffectType.BURN)).toBeTruthy();
    expect(res.find(r => r.type === SynergyType.MAGMA_SHURIKEN)?.value).toBe(5);
  });

  test('MAGMA+SHURIKEN does not trigger without bounce', () => {
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

    expect(res.some(r => r.type === SynergyType.MAGMA_SHURIKEN)).toBeFalsy();
  });
});

describe('WeaponSynergySystem - canCombine Tests', () => {
  test('canCombine returns true for valid synergy pairs', () => {
    const sys = new WeaponSynergySystem();

    expect(sys.canCombine(WeaponType.LASER, WeaponType.TESLA)).toBeTruthy();
    expect(sys.canCombine(WeaponType.TESLA, WeaponType.LASER)).toBeTruthy();
    expect(sys.canCombine(WeaponType.WAVE, WeaponType.PLASMA)).toBeTruthy();
    expect(sys.canCombine(WeaponType.PLASMA, WeaponType.WAVE)).toBeTruthy();
    expect(sys.canCombine(WeaponType.MISSILE, WeaponType.VULCAN)).toBeTruthy();
    expect(sys.canCombine(WeaponType.VULCAN, WeaponType.MISSILE)).toBeTruthy();
    expect(sys.canCombine(WeaponType.MAGMA, WeaponType.SHURIKEN)).toBeTruthy();
    expect(sys.canCombine(WeaponType.SHURIKEN, WeaponType.MAGMA)).toBeTruthy();
    expect(sys.canCombine(WeaponType.TESLA, WeaponType.PLASMA)).toBeTruthy();
    expect(sys.canCombine(WeaponType.PLASMA, WeaponType.TESLA)).toBeTruthy();
  });

  test('canCombine returns false for invalid pairs', () => {
    const sys = new WeaponSynergySystem();

    expect(sys.canCombine(WeaponType.LASER, WeaponType.WAVE)).toBeFalsy();
    expect(sys.canCombine(WeaponType.MISSILE, WeaponType.PLASMA)).toBeFalsy();
    expect(sys.canCombine(WeaponType.VULCAN, WeaponType.MAGMA)).toBeFalsy();
    expect(sys.canCombine(WeaponType.SHURIKEN, WeaponType.TESLA)).toBeFalsy();
  });

  test('canCombine returns false for same weapon', () => {
    const sys = new WeaponSynergySystem();

    expect(sys.canCombine(WeaponType.LASER, WeaponType.LASER)).toBeFalsy();
    expect(sys.canCombine(WeaponType.PLASMA, WeaponType.PLASMA)).toBeFalsy();
  });

  test('canCombine returns false for null/undefined', () => {
    const sys = new WeaponSynergySystem();

    expect(sys.canCombine(null as any, WeaponType.LASER)).toBeFalsy();
    expect(sys.canCombine(WeaponType.LASER, null as any)).toBeFalsy();
    expect(sys.canCombine(undefined as any, undefined as any)).toBeFalsy();
  });
});

describe('WeaponSynergySystem - getPotentialSynergyColors Tests', () => {
  test('returns synergy info when weapon can combine with equipped weapon', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.LASER]);

    const result = sys.getPotentialSynergyColors(WeaponType.TESLA);
    expect(result).not.toBeNull();
    expect(result?.synergyType).toBe(SynergyType.LASER_TESLA);
    expect(result?.colors).toHaveLength(1);
  });

  test('returns null when weapon cannot combine with equipped weapons', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.LASER]);

    const result = sys.getPotentialSynergyColors(WeaponType.WAVE);
    expect(result).toBeNull();
  });

  test('returns null when no weapons are equipped', () => {
    const sys = new WeaponSynergySystem();

    const result = sys.getPotentialSynergyColors(WeaponType.TESLA);
    expect(result).toBeNull();
  });

  test('returns synergy info for multiple equipped weapons', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.LASER, WeaponType.WAVE]);

    // TESLA can combine with LASER
    const result1 = sys.getPotentialSynergyColors(WeaponType.TESLA);
    expect(result1).not.toBeNull();
    expect(result1?.synergyType).toBe(SynergyType.LASER_TESLA);

    // PLASMA can combine with WAVE
    const result2 = sys.getPotentialSynergyColors(WeaponType.PLASMA);
    expect(result2).not.toBeNull();
    // Could be either WAVE_PLASMA or TESLA_PLASMA depending on order
    expect([SynergyType.WAVE_PLASMA, SynergyType.TESLA_PLASMA]).toContain(result2?.synergyType);
  });
});

describe('WeaponSynergySystem - Synergy Activation Tests', () => {
  test('synergy activates when both weapons are equipped', () => {
    const sys = new WeaponSynergySystem();

    expect(sys.isSynergyActive(SynergyType.LASER_TESLA)).toBeFalsy();

    sys.updateEquippedWeapons([WeaponType.LASER, WeaponType.TESLA]);

    expect(sys.isSynergyActive(SynergyType.LASER_TESLA)).toBeTruthy();
  });

  test('synergy deactivates when weapons are changed', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.LASER, WeaponType.TESLA]);

    expect(sys.isSynergyActive(SynergyType.LASER_TESLA)).toBeTruthy();

    sys.updateEquippedWeapons([WeaponType.WAVE, WeaponType.PLASMA]);

    expect(sys.isSynergyActive(SynergyType.LASER_TESLA)).toBeFalsy();
    expect(sys.isSynergyActive(SynergyType.WAVE_PLASMA)).toBeTruthy();
  });

  test('getActiveSynergies returns all active synergies', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.LASER, WeaponType.TESLA]);

    const active = sys.getActiveSynergies();
    expect(active).toHaveLength(1);
    expect(active[0].type).toBe(SynergyType.LASER_TESLA);
  });
});

describe('WeaponSynergySystem - Plasma Storm Tests', () => {
  test('triggerPlasmaStorm returns enemies in range', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.TESLA, WeaponType.PLASMA]);

    const nearEnemy = { ...enemy, x: 50, y: 50 };
    const farEnemy = { ...enemy, x: 500, y: 500 };

    const targets = sys.triggerPlasmaStorm(100, 100, 100, [nearEnemy, farEnemy]);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toBe(nearEnemy);
  });

  test('triggerPlasmaStorm returns empty array when synergy not active', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.LASER]);

    const targets = sys.triggerPlasmaStorm(100, 100, 100, [enemy]);

    expect(targets).toHaveLength(0);
  });

  test('triggerPlasmaStorm returns max 3 targets', () => {
    const sys = new WeaponSynergySystem();
    sys.updateEquippedWeapons([WeaponType.TESLA, WeaponType.PLASMA]);

    const enemies = [
      { ...enemy, x: 100, y: 100 },
      { ...enemy, x: 110, y: 110 },
      { ...enemy, x: 120, y: 120 },
      { ...enemy, x: 130, y: 130 },
      { ...enemy, x: 140, y: 140 }
    ];

    const targets = sys.triggerPlasmaStorm(100, 100, 200, enemies);

    expect(targets.length).toBeLessThanOrEqual(3);
  });
});
