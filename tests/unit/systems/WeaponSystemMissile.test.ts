import { WeaponSystem } from '@/game/systems/WeaponSystem';
import { WeaponType, Entity } from '@/types';
import { AudioMock } from '../mocks/audioMock';
import { createPlayer } from '../mocks/entityFactory';

describe('WeaponSystem Missile Spread', () => {
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

    const getAngles = (bullets: Entity[]) => {
        return bullets.map(b => {
            // Calculate angle from velocity
            // Standard angle: 0 is right, -90 is up
            // We want deviation from -90 (up)
            // angle = atan2(vy, vx)
            // deviation = angle - (-PI/2)
            const angle = Math.atan2(b.vy, b.vx);
            const deviation = (angle + Math.PI / 2) * (180 / Math.PI);
            return Math.round(deviation); // Round to nearest degree
        }).sort((a, b) => a - b);
    };

    it('should fire 1 missile straight up', () => {
        weaponSystem.firePlayerWeapon(player, WeaponType.MISSILE, 1, options, bullets, enemies);
        expect(bullets.length).toBe(1);
        const angles = getAngles(bullets);
        expect(angles).toEqual([0]);
    });

    it('should fire 2 missiles at +/- 15 degrees', () => {
        weaponSystem.firePlayerWeapon(player, WeaponType.MISSILE, 2, options, bullets, enemies);
        expect(bullets.length).toBe(2);
        const angles = getAngles(bullets);
        expect(angles).toEqual([-15, 15]);
    });

    it('should fire 3 missiles at -15, 0, 15 degrees', () => {
        weaponSystem.firePlayerWeapon(player, WeaponType.MISSILE, 3, options, bullets, enemies);
        expect(bullets.length).toBe(3);
        const angles = getAngles(bullets);
        expect(angles).toEqual([-15, 0, 15]);
    });

    it('should fire 4 missiles at -30, -15, 15, 30 degrees', () => {
        weaponSystem.firePlayerWeapon(player, WeaponType.MISSILE, 4, options, bullets, enemies);
        expect(bullets.length).toBe(4);
        const angles = getAngles(bullets);
        expect(angles).toEqual([-30, -15, 15, 30]);
    });

    it('should fire 5 missiles at -30, -15, 0, 15, 30 degrees', () => {
        weaponSystem.firePlayerWeapon(player, WeaponType.MISSILE, 5, options, bullets, enemies);
        expect(bullets.length).toBe(5);
        const angles = getAngles(bullets);
        expect(angles).toEqual([-30, -15, 0, 15, 30]);
    });
});
