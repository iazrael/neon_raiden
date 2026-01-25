import { World, GameState, ComboState } from './types';
import { Health, Transform, Weapon, Shield, Bullet, InvulnerableState, PlayerTag, EnemyTag, BossTag } from './components';
import { view } from './world';
import { SynergyConfig } from '@/game/systems/WeaponSynergySystem';



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
    comboState: ComboState | null;

    player: {
        hp: number;
        maxHp: number;
        x: number;
        y: number;
        bombs: number;
        shieldPercent: number;
        weaponType: string;
        secondaryWeapon: string | null;
        weaponLevel: number;
        activeSynergies: SynergyConfig[];
        invulnerable: boolean;
    };

    bullets: Array<{ x: number, y: number, type: string }>;
    enemies: Array<{ x: number, y: number, hp: number, maxHp: number, type: string }>;
}


export function buildSnapshot(world: World, t: number): GameSnapshot {
    // 安全检查：如果玩家不存在或 ID 无效，返回默认快照
    const player = (world.playerId ?? 0) > 0 ? world.entities.get(world.playerId!) : undefined;
    if (!player) {
        return {
            t,
            state: GameState.MENU,
            score: 0,
            level: 1,
            showLevelTransition: false,
            levelTransitionTimer: 0,
            maxLevelReached: 1,
            showBossWarning: false,
            comboState: null,
            player: {
                hp: 100,
                maxHp: 100,
                x: 0,
                y: 0,
                bombs: 0,
                shieldPercent: 0,
                weaponType: 'VULCAN',
                secondaryWeapon: null,
                weaponLevel: 1,
                activeSynergies: [],
                invulnerable: false
            },
            bullets: [],
            enemies: []
        };
    }

    const tr = player.find(Transform.check)!;
    const hl = player.find(Health.check)!;
    const wp = player.find(Weapon.check)!;
    const shield = player.find(Shield.check);
    const invuln = player.find(InvulnerableState.check);

    // 获取子弹数据
    const bullets = [...view(world, [Bullet, Transform])].map(([, [b, t]]) => ({
        x: t.x,
        y: t.y,
        type: b.ammoType
    }));

    // 获取敌人数据
    const enemies = [...view(world, [Health, Transform, EnemyTag])]
        .map(([, [h, t]]) => ({
            x: t.x,
            y: t.y,
            hp: h.hp,
            maxHp: h.max,
            type: 'enemy' // TODO: 从EnemyTag中获取具体类型
        }));

    return {
        t,
        state: world.state || GameState.PLAYING,
        score: world.score || 0,
        level: world.level || 1,
        showLevelTransition: false, // TODO: 从LevelingSystem获取
        levelTransitionTimer: 0,
        maxLevelReached: world.maxLevelReached || 1,
        showBossWarning: false, // TODO: 从BossSystem获取
        comboState: world.comboState || { count: 0, timer: 0, level: 0, maxCombo: 0, hasBerserk: false },

        player: {
            hp: hl.hp,
            maxHp: hl.max,
            x: tr.x,
            y: tr.y,
            bombs: 0, // TODO: 从Bomb组件获取
            shieldPercent: shield ? (shield.value / (hl.max * 0.5)) * 100 : 0, // 假设护盾最大值为生命值的一半
            weaponType: wp.id,
            secondaryWeapon: null, // TODO: 从SecondaryWeapon组件获取
            weaponLevel: wp.level,
            activeSynergies: [], // TODO: 从WeaponSynergySystem获取
            invulnerable: !!invuln
        },

        bullets,
        enemies
    };
}