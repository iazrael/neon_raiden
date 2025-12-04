import { ComboState } from "@/game/systems/ComboSystem";
import { SynergyConfig } from "@/game/systems/WeaponSynergySystem";
import { GameState, WeaponType } from "@/types";

// ========== 游戏快照接口 ==========
export interface GameSnapshot {
    t: number;
    state: GameState;
    score: number;
    level: number;
    showLevelTransition: boolean;
    levelTransitionTimer: number;
    maxLevelReached: number;
    showBossWarning: boolean;
    comboState: ComboState;

    player: {
        hp: number;
        maxHp: number;
        x: number;
        y: number;
        bombs: number;
        shieldPercent: number;
        weaponType: WeaponType;
        secondaryWeapon: WeaponType | null;
        weaponLevel: number;
        activeSynergies: SynergyConfig[];
        invulnerable: boolean;
    };

    bullets: Array<{ x: number, y: number, type: string }>;
    enemies: Array<{ x: number, y: number, hp: number, maxHp: number, type: string }>;
}
