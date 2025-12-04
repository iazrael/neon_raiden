import { ComboState } from "@/game/systems/ComboSystem";
import { SynergyConfig } from "@/game/systems/WeaponSynergySystem";
import { GameState, WeaponType } from "@/types";
import { World } from './types';
import { Health, Transform, Weapon } from './components';



// ========== 游戏快照接口 ==========
export interface GameSnapshot {
    t: number;
    // state: GameState;
    // score: number;
    // level: number;
    // showLevelTransition: boolean;
    // levelTransitionTimer: number;
    // maxLevelReached: number;
    // showBossWarning: boolean;
    // comboState: ComboState;

    // player: {
    //     hp: number;
    //     maxHp: number;
    //     x: number;
    //     y: number;
    //     bombs: number;
    //     shieldPercent: number;
    //     weaponType: WeaponType;
    //     secondaryWeapon: WeaponType | null;
    //     weaponLevel: number;
    //     activeSynergies: SynergyConfig[];
    //     invulnerable: boolean;
    // };

    // bullets: Array<{ x: number, y: number, type: string }>;
    // enemies: Array<{ x: number, y: number, hp: number, maxHp: number, type: string }>;
}


export function buildSnapshot(world: World, t: number): GameSnapshot {
    const player = world.entities.get(world.playerId)!;
    const tr = player.find(Transform.check)!;
    const hl = player.find(Health.check)!;
    const wp = player.find(Weapon.check)!;
    return {
        t,
        // player: {
        //     hp: hl.hp,
        //     maxHp: hl.max,
        //     // ammo: wp.curCD === 0 ? 1 : 0, // 示例
        //     // maxAmmo: 1,
        //     // shield: player.find(Shield.check)?.value ?? 0,
        //     x: tr.x,
        //     y: tr.y,
        // },
        // bullets: [...view(world, [Bullet, Transform])].map(([, [b, t]) => ({ x: t.x, y: t.y })),
        // enemies: [...view(world, [Health, Transform])]
        //     .filter(([id]) => id !== world.playerId)
        //     .map(([, [h, t]) => ({ x: t.x, y: t.y, hp: h.hp })),
    };
}