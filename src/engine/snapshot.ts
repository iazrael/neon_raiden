import { GameState, ComboState, WeaponId, EnemyId, BossId } from "./types";
import {
    Health,
    Transform,
    Weapon,
    Shield,
    Bullet,
    InvulnerableState,
    PlayerTag,
    EnemyTag,
    BossTag,
    Bomb,
} from "./components";
import { World, getComponents, getEntity, view } from "./world";

// ========== 游戏快照接口 ==========
export interface GameSnapshot {
    t: number;
    state: GameState;
    score: number;
    level: number;
    showLevelTransition: boolean;
    levelTransitionTimer: number;
    showBossWarning: boolean;
    comboState: ComboState | null;

    player: {
        hp: number;
        maxHp: number;
        x: number;
        y: number;
        bombs: number;
        shieldPercent: number;
        weaponId: WeaponId;
        secondaryWeapon: WeaponId | null;
        weaponLevel: number;
        invulnerable: boolean;
    };
    boss: {
        hp: number;
        maxHp: number;
        x: number;
        y: number;
        bossId: BossId;
    } | null;
    bullets: Array<{ x: number; y: number; type: string }>;
    enemies: Array<{
        x: number;
        y: number;
        hp: number;
        maxHp: number;
        enemyId: EnemyId;
    }>;
}

export function buildSnapshot(world: World, t: number): GameSnapshot {
    // 安全检查：如果玩家不存在或 ID 无效，返回默认快照
    const playerComps = getEntity(world, world.playerId);
    if (!playerComps) {
        return {
            t,
            state: GameState.GAME_OVER,
            score: 0,
            level: 1,
            showLevelTransition: false,
            levelTransitionTimer: 0,
            showBossWarning: false,
            comboState: null,
            player: {
                hp: 100,
                maxHp: 100,
                x: 0,
                y: 0,
                bombs: 0,
                shieldPercent: 0,
                weaponId: WeaponId.VULCAN,
                secondaryWeapon: null,
                weaponLevel: 1,
                invulnerable: false,
            },
            boss: null,
            bullets: [],
            enemies: [],
        };
    }

    const [tr, hl, wp, shield, invuln, bombs] = getComponents(
        world,
        world.playerId,
        [Transform, Health, Weapon, Shield, InvulnerableState, Bomb],
    );
    const player = {
        hp: hl.hp,
        maxHp: hl.max,
        x: tr.x,
        y: tr.y,
        bombs: bombs?.count || 0,
        shieldPercent: (shield.value / (hl.max * 0.5)) * 100,
        weaponId: wp.id as WeaponId,
        secondaryWeapon: null, // TODO: 从SecondaryWeapon组件获取
        weaponLevel: wp.level,
        invulnerable: !!invuln,
    };

    // 获取子弹数据
    const bullets = [...view(world, [Bullet, Transform])].map(([, [b, t]]) => ({
        x: t.x,
        y: t.y,
        type: b.ammoType,
    }));

    // 获取敌人数据
    const enemies = [...view(world, [Health, Transform, EnemyTag])].map(
        ([, [h, t, tag]]) => ({
            x: t.x,
            y: t.y,
            hp: h.hp,
            maxHp: h.max,
            enemyId: tag.id,
        }),
    );

    // 获取boss数据
    let boss = null;
    if (world.bossState.bossId > 0) {
        const [t, h, tag] = getComponents(world, world.bossState.bossId, [
            Transform,
            Health,
            BossTag,
        ]);
        boss = {
            hp: h.hp,
            maxHp: h.max,
            x: t.x,
            y: t.y,
            bossId: tag.id,
        };
    }

    return {
        t,
        state: GameState.PLAYING,
        score: world.score || 0,
        level: world.level || 1,
        showLevelTransition: false, // TODO: 从LevelingSystem获取
        levelTransitionTimer: 0,
        showBossWarning: false, // TODO: 从BossSystem获取
        comboState: world.comboState,
        player,
        boss,
        bullets,
        enemies,
    };
}
