import { WeaponSystem } from '@/game/systems/WeaponSystem';
import { WeaponType, Entity } from '@/types';
import { AudioMock } from '../mocks/audioMock';
import { createPlayer, createBullet } from '../mocks/entityFactory';

describe('WeaponSystem', () => {
  let weaponSystem: WeaponSystem;
  let audioMock: AudioMock;
  let player: Entity;
  let bullets: Entity[];
  let enemies: Entity[];
  let options: Entity[];

  beforeEach(() => {
    audioMock = new AudioMock();
    weaponSystem = new WeaponSystem(audioMock as any);
    player = createPlayer();
    bullets = [];
    enemies = [];
    options = [];
  });

  describe('firePlayerWeapon', () => {
    it('should create bullets when firing vulcan weapon', () => {
      weaponSystem.firePlayerWeapon(player, WeaponType.VULCAN, 1, options, bullets, enemies);
      
      expect(bullets.length).toBeGreaterThan(0);
      expect(bullets[0].weaponType).toBe(WeaponType.VULCAN);
      expect(audioMock.playShoot).toHaveBeenCalledWith(WeaponType.VULCAN);
    });

    it('should create multiple bullets for upgraded vulcan weapon', () => {
      const initialBulletCount = bullets.length;
      weaponSystem.firePlayerWeapon(player, WeaponType.VULCAN, 3, options, bullets, enemies);
      
      expect(bullets.length).toBeGreaterThan(initialBulletCount);
      // Check that multiple bullets were created (exact number depends on config)
      expect(bullets.length).toBe(initialBulletCount + 3); // Based on WeaponUpgradeConfig
    });

    it('should create bullets with correct properties for laser weapon', () => {
      weaponSystem.firePlayerWeapon(player, WeaponType.LASER, 1, options, bullets, enemies);
      
      expect(bullets.length).toBeGreaterThan(0);
      expect(bullets[0].weaponType).toBe(WeaponType.LASER);
      expect(bullets[0].hp).toBe(999); // Lasers have high HP
    });

    it('should create homing bullets for tesla weapon', () => {
      weaponSystem.firePlayerWeapon(player, WeaponType.TESLA, 1, options, bullets, enemies);
      
      expect(bullets.length).toBeGreaterThan(0);
      expect(bullets[0].weaponType).toBe(WeaponType.TESLA);
      expect(bullets[0]).toHaveProperty('chainCount');
      expect(bullets[0]).toHaveProperty('chainRange');
    });
  });

  describe('getFireRate', () => {
    it('should return correct fire rate for vulcan weapon', () => {
      const fireRate = weaponSystem.getFireRate(WeaponType.VULCAN, 1);
      expect(fireRate).toBeGreaterThan(0);
    });

    it('should return faster fire rate for upgraded weapons', () => {
      const fireRateLevel1 = weaponSystem.getFireRate(WeaponType.VULCAN, 1);
      const fireRateLevel3 = weaponSystem.getFireRate(WeaponType.VULCAN, 3);
      
      // Higher level should have faster fire rate (lower number)
      expect(fireRateLevel3).toBeLessThan(fireRateLevel1);
    });

    it('should have minimum fire rate cap', () => {
      const fireRate = weaponSystem.getFireRate(WeaponType.VULCAN, 10);
      expect(fireRate).toBeGreaterThanOrEqual(30); // Minimum cap from implementation
    });
  });

  describe('playShootSound', () => {
    it('should call audio system to play shoot sound', () => {
      weaponSystem.playShootSound(WeaponType.VULCAN);
      expect(audioMock.playShoot).toHaveBeenCalledWith(WeaponType.VULCAN);
    });
  });
});