import { ComboState, WeaponId, EnemyId, BossId } from "./types";
import { LevelTransitionComponent, BossExitComponent } from "./components/transition";
import {
    Health,
    Transform,
    Weapon,
    Shield,
    Bullet,
    InvulnerableState,
    EnemyTag,
    BossTag,
    Bomb,
} from "./components";
import { World, getComponents, getComponentsFromComps, getEntity, view } from "./world";

// ========== 游戏快照接口 ==========
export interface GameSnapshot {
    t: number;
    score: number;
    level: number;
    /** 关卡进度（0-120，允许小数） */
    progress: number;
    showLevelTransition: boolean;
    levelTransitionTimer: number;
    showBossWarning: boolean;
    comboState: ComboState | null;

    /** 游戏状态事件：失败或胜利 */
    gameStateEvent: 'defeat' | 'victory' | null;
    /** Boss 事件：出场、完成或击杀 */
    bossEvent: { type: 'entranceStart' | 'entranceComplete' | 'defeat'; bossId: BossId } | null;

    /** 关卡事件 */
    levelEvent: {
        type: 'stageOneIntro' | 'levelTransitionStart' | 'levelTransitionComplete' | 'bossExitStart' | 'victory';
        duration?: number;
        fromLevel?: number;
        toLevel?: number;
        finalLevel?: number;
        level?: number;
        bossId?: string;
    } | null;

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
            score: 0,
            level: world.levelState.currentLevel,
            progress: world.levelState.progress,
            showLevelTransition: false,
            levelTransitionTimer: 0,
            showBossWarning: false,
            comboState: null,
            gameStateEvent: null,
            bossEvent: null,
            levelEvent: null,
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
        shieldPercent: (shield.value / shield.max) * 100,
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
    let bossInfo = null;
    const boss = getEntity(world, world.bossState.bossId)
    if (boss) {
        const [t, h, tag] = getComponentsFromComps(boss, [
            Transform,
            Health,
            BossTag,
        ]);
        bossInfo = {
            hp: h.hp,
            maxHp: h.max,
            x: t.x,
            y: t.y,
            bossId: tag.id,
        };
    }

    // 收集游戏状态事件
    let gameStateEvent: 'defeat' | 'victory' | null = null;
    let bossEvent: { type: 'entranceStart' | 'entranceComplete' | 'defeat'; bossId: BossId } | null = null;
    let levelEvent = null as {
        type: 'stageOneIntro' | 'levelTransitionStart' | 'levelTransitionComplete' | 'bossExitStart' | 'victory';
        duration?: number;
        fromLevel?: number;
        toLevel?: number;
        finalLevel?: number;
        bossId?: string;
    } | null;

    for (const event of world.events) {
        if (event.type === 'Defeat') {
            gameStateEvent = 'defeat';
        } else if (event.type === 'Victory') {
            gameStateEvent = 'victory';
            levelEvent = {
                type: 'victory',
                finalLevel: event.finalLevel
            };
        } else if (event.type === 'StageOneIntro') {
            levelEvent = {
                type: 'stageOneIntro',
                duration: event.duration
            };
        } else if (event.type === 'LevelTransitionStart') {
            levelEvent = {
                type: 'levelTransitionStart',
                fromLevel: event.fromLevel,
                toLevel: event.toLevel
            };
        } else if (event.type === 'LevelTransitionComplete') {
            levelEvent = {
                type: 'levelTransitionComplete',
                toLevel: event.level
            };
        } else if (event.type === 'BossExitStart') {
            levelEvent = {
                type: 'bossExitStart',
                bossId: event.bossId,
            };
        } else if (event.type === 'BossEntranceStart') {
            bossEvent = { type: 'entranceStart', bossId: event.bossId };
        } else if (event.type === 'BossEntranceComplete') {
            bossEvent = { type: 'entranceComplete', bossId: event.bossId };
        } else if (event.type === 'BossDefeat') {
            bossEvent = { type: 'defeat', bossId: event.bossId };
        }
    }

    return {
        t,
        score: world.score || 0,
        level: world.levelState.currentLevel,
        progress: world.levelState.progress,
        showLevelTransition: false, // TODO: 从LevelingSystem获取
        levelTransitionTimer: 0,
        showBossWarning: false, // TODO: 从BossSystem获取
        comboState: world.comboState,
        gameStateEvent,
        bossEvent,
        levelEvent,
        player,
        boss:bossInfo,
        bullets,
        enemies,
    };
}
