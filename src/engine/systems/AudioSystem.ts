/**
 * 音频系统 (AudioSystem)
 *
 * 职责：
 * - 监听游戏事件并播放对应的音效
 * - 支持 BGM 和音效的播放控制
 * - 管理音量和音效优先级
 *
 * 系统类型：表现层
 * 执行顺序：P7 - 在 EffectPlayer 之后
 */

import { World } from "../world";
import {
    HitEvent,
    KillEvent,
    PickupEvent,
    WeaponFiredEvent,
    BossPhaseChangeEvent,
    PlaySoundEvent,
    ComboBreakEvent,
    ComboUpgradeEvent,
    BombExplodedEvent,
    ShieldBrokenEvent,
} from "../events";
import { audioPlayer } from "../audio";
import { ExplosionSize } from "../audio/AudioEngine";

/**
 * 音频系统主函数
 * @param world 世界对象
 * @param dt 时间增量（毫秒）
 */
export function AudioSystem(world: World, dt: number): void {
    // 收集本帧的所有事件
    const events = world.events;

    // 处理每种事件类型
    for (const event of events) {
        switch (event.type) {
            case "Hit":
                handleHitEvent(world, event as HitEvent);
                break;
            case "Kill":
                handleKillEvent(world, event as KillEvent);
                break;
            case "Pickup":
                handlePickupEvent(world, event as PickupEvent);
                break;
            case "WeaponFired":
                handleWeaponFiredEvent(world, event as WeaponFiredEvent);
                break;
            case "BossPhaseChange":
                handleBossPhaseChangeEvent(
                    world,
                    event as BossPhaseChangeEvent,
                );
                break;
            case "PlaySound":
                handlePlaySoundEvent(world, event as PlaySoundEvent);
                break;
            case "ComboBreak":
                handleComboBreakEvent(world, event as ComboBreakEvent);
                break;
            case "ComboUpgrade":
                handleComboUpgradeEvent(world, event as ComboUpgradeEvent);
                break;
            case "BombExploded":
                handleBombExplosionEvent(world, event as BombExplodedEvent);
                break;
            case "ShieldBroken":
                handleShieldBrokenEvent(world, event as ShieldBrokenEvent);
                break;
        }
    }
}

/**
 * 处理命中事件
 */
function handleHitEvent(world: World, event: HitEvent): void {
    // 播放撞击音效(目前子弹击中, 与敌机相撞等, 所有碰撞都会想)
    audioPlayer.playHit();
}

/**
 * 处理击杀事件
 */
function handleKillEvent(world: World, event: KillEvent): void {
    if(event.victim === world.playerId) {
        // 玩家被击杀, 播放死亡音效
        audioPlayer.playExplosion(ExplosionSize.LARGE)
    }else if(event.victim === world.bossState.bossId) {
        // 敌人或boss
        audioPlayer.playExplosion(ExplosionSize.LARGE)
    }else{
        // 普通敌人
        audioPlayer.playExplosion(ExplosionSize.SMALL)
    }
}

/**
 * 处理拾取事件
 */
function handlePickupEvent(world: World, event: PickupEvent): void {
    // 根据道具类型播放音效
    audioPlayer.playPowerUp()
    // const itemId = event.itemId;
    // let soundKey = "pickup_power";

    // if (itemId.includes("weapon") || itemId.includes("gun")) {
    //     soundKey = "pickup_weapon";
    // } else if (itemId.includes("hp") || itemId.includes("life")) {
    //     soundKey = "pickup_hp";
    // }

    // playSound(soundKey);
}

/**
 * 处理武器发射事件
 */
function handleWeaponFiredEvent(world: World, event: WeaponFiredEvent): void {
    // 根据武器 ID 和发射者确定音效
    const isPlayer = event.owner === world.playerId;
    if (isPlayer) {
        // FIXME: 太吵了, 先注释掉测试其他音效
        // audioPlayer.playShoot(event.weaponId as WeaponId)
    }
}

/**
 * 处理 Boss 阶段切换事件
 */
function handleBossPhaseChangeEvent(
    world: World,
    event: BossPhaseChangeEvent,
): void {
    playSound("boss_phase_change");
}

/**
 * 处理播放音效事件
 */
function handlePlaySoundEvent(world: World, event: PlaySoundEvent): void {
    playSound(event.name);
}

/**
 * 处理连击中断事件
 */
function handleComboBreakEvent(world: World, event: ComboBreakEvent): void {
    playSound("combo_break");
}

/**
 * 处理连击升级事件
 */
function handleComboUpgradeEvent(world: World, event: ComboUpgradeEvent): void {
    playSound("combo_upgrade");
}

/**
 * 处理炸弹爆炸事件
 */
function handleBombExplosionEvent(world: World, event: BombExplodedEvent): void {
    audioPlayer.playBomb()
}

/**
 * 处理护盾破碎事件
 */
function handleShieldBrokenEvent(world: World, event: ShieldBrokenEvent): void {
    audioPlayer.playShieldBreak()
}



/**
 * 播放音效
 * @param soundKey 音效键名
 */
export function playSound(soundKey: string): void {
    // if (audioState.muted) return;

    // const config = SOUND_CONFIGS[soundKey];
    // if (!config) {
    //     console.warn(`AudioSystem: No config found for sound '${soundKey}'`);
    //     return;
    // }

    // // 计算最终音量
    // const volume =
    //     config.volume * audioState.masterVolume * audioState.sfxVolume;

    // // 创建音频元素并播放
    // const audio = new Audio(config.src);
    // audio.volume = Math.max(0, Math.min(1, volume));
    // audio.play().catch((err) => {
    //     // 忽略播放失败（通常是用户未交互导致）
    //     console.debug(`Audio play failed: ${err.message}`);
    // });
}


