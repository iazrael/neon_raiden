import { ComboState } from '@/game/systems/ComboSystem';
import { SynergyConfig } from '@/game/systems/WeaponSynergySystem';
import { GameState, WeaponType } from '@/types';

// ========== 基础类型 ==========
/** 实体ID类型 */
export type EntityId = number;
/** 组件类型 */
export type ComponentType = new (...args: any[]) => Component;

// ========== 空基类（可选，方便 instanceof） ==========
/** 组件基类 */
export abstract class Component { }

export * from './sprite'

// ========== Blueprint 类型 ==========
/** 蓝图类型 - 组件映射 */
export type Blueprint = Record<string, Component>;

// ========== 世界接口 ==========
/** 世界接口 */
export interface World {
    /** 实体集合 */
    entities: Map<EntityId, Component[]>;
    /** 玩家ID */
    playerId: EntityId;
}

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
