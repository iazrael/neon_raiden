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

import { World } from '../world';
import { HitEvent, KillEvent, PickupEvent, WeaponFiredEvent, BossPhaseChangeEvent, PlaySoundEvent, ComboBreakEvent, ComboUpgradeEvent } from '../events';

/**
 * 音效类型
 */
type SoundType = 'shoot' | 'hit' | 'explosion' | 'pickup' | 'levelup' | 'boss_phase' | 'combo_upgrade' | 'combo_break' | 'ui' | 'bgm';

/**
 * 音效配置
 */
interface SoundConfig {
    /** 音效文件路径 */
    src: string;
    /** 音量 (0-1) */
    volume: number;
    /** 是否循环 */
    loop: boolean;
    /** 优先级 (0-10, 越高越优先) */
    priority: number;
}

/**
 * 音效配置表
 */
const SOUND_CONFIGS: Record<string, SoundConfig> = {
    // 武器音效
    shoot_player: { src: 'sfx/shoot_player.ogg', volume: 0.3, loop: false, priority: 5 },
    shoot_enemy: { src: 'sfx/shoot_enemy.ogg', volume: 0.2, loop: false, priority: 3 },

    // 命中音效
    hit_light: { src: 'sfx/hit_light.ogg', volume: 0.3, loop: false, priority: 4 },
    hit_medium: { src: 'sfx/hit_medium.ogg', volume: 0.4, loop: false, priority: 5 },
    hit_heavy: { src: 'sfx/hit_heavy.ogg', volume: 0.5, loop: false, priority: 6 },

    // 爆炸音效
    explosion_small: { src: 'sfx/explosion_small.ogg', volume: 0.4, loop: false, priority: 5 },
    explosion_medium: { src: 'sfx/explosion_medium.ogg', volume: 0.5, loop: false, priority: 6 },
    explosion_large: { src: 'sfx/explosion_large.ogg', volume: 0.6, loop: false, priority: 7 },

    // 拾取音效
    pickup_power: { src: 'sfx/pickup_power.ogg', volume: 0.5, loop: false, priority: 7 },
    pickup_weapon: { src: 'sfx/pickup_weapon.ogg', volume: 0.5, loop: false, priority: 7 },
    pickup_hp: { src: 'sfx/pickup_hp.ogg', volume: 0.5, loop: false, priority: 7 },

    // UI 音效
    ui_click: { src: 'sfx/ui_click.ogg', volume: 0.4, loop: false, priority: 8 },
    ui_hover: { src: 'sfx/ui_hover.ogg', volume: 0.2, loop: false, priority: 2 },

    // 游戏状态音效
    levelup: { src: 'sfx/levelup.ogg', volume: 0.6, loop: false, priority: 9 },
    boss_phase_change: { src: 'sfx/boss_phase.ogg', volume: 0.7, loop: false, priority: 9 },
    combo_upgrade: { src: 'sfx/combo_upgrade.ogg', volume: 0.5, loop: false, priority: 7 },
    combo_break: { src: 'sfx/combo_break.ogg', volume: 0.4, loop: false, priority: 8 },

    // BGM
    bgm_stage: { src: 'bgm/stage.ogg', volume: 0.4, loop: true, priority: 1 },
    bgm_boss: { src: 'bgm/boss.ogg', volume: 0.5, loop: true, priority: 1 },
    bgm_menu: { src: 'bgm/menu.ogg', volume: 0.3, loop: true, priority: 1 }
};

/**
 * 音频管理器状态
 */
interface AudioState {
    /** 主音量 */
    masterVolume: number;
    /** 音效音量 */
    sfxVolume: number;
    /** BGM 音量 */
    bgmVolume: number;
    /** 是否静音 */
    muted: boolean;
    /** 当前播放的 BGM */
    currentBgm: string | null;
    /** BGM 音频节点 */
    bgmNode: HTMLAudioElement | null;
}

/**
 * 全局音频状态
 */
const audioState: AudioState = {
    masterVolume: 1.0,
    sfxVolume: 0.8,
    bgmVolume: 0.5,
    muted: false,
    currentBgm: null,
    bgmNode: null
};

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
            case 'Hit':
                handleHitEvent(world, event as HitEvent);
                break;
            case 'Kill':
                handleKillEvent(world, event as KillEvent);
                break;
            case 'Pickup':
                handlePickupEvent(world, event as PickupEvent);
                break;
            case 'WeaponFired':
                handleWeaponFiredEvent(world, event as WeaponFiredEvent);
                break;
            case 'BossPhaseChange':
                handleBossPhaseChangeEvent(world, event as BossPhaseChangeEvent);
                break;
            case 'PlaySound':
                handlePlaySoundEvent(world, event as PlaySoundEvent);
                break;
            case 'ComboBreak':
                handleComboBreakEvent(world, event as ComboBreakEvent);
                break;
            case 'ComboUpgrade':
                handleComboUpgradeEvent(world, event as ComboUpgradeEvent);
                break;
        }
    }
}

/**
 * 处理命中事件
 */
function handleHitEvent(world: World, event: HitEvent): void {
    // 根据血量等级播放音效
    const soundKey = `hit_${event.bloodLevel === 1 ? 'light' : event.bloodLevel === 2 ? 'medium' : 'heavy'}`;
    playSound(soundKey);
}

/**
 * 处理击杀事件
 */
function handleKillEvent(world: World, event: KillEvent): void {
    // 根据得分判断敌人大小，播放对应爆炸音效
    let soundKey = 'explosion_small';
    if (event.score > 100) {
        soundKey = 'explosion_medium';
    }
    if (event.score > 500) {
        soundKey = 'explosion_large';
    }
    playSound(soundKey);
}

/**
 * 处理拾取事件
 */
function handlePickupEvent(world: World, event: PickupEvent): void {
    // 根据道具类型播放音效
    const itemId = event.itemId;
    let soundKey = 'pickup_power';

    if (itemId.includes('weapon') || itemId.includes('gun')) {
        soundKey = 'pickup_weapon';
    } else if (itemId.includes('hp') || itemId.includes('life')) {
        soundKey = 'pickup_hp';
    }

    playSound(soundKey);
}

/**
 * 处理武器发射事件
 */
function handleWeaponFiredEvent(world: World, event: WeaponFiredEvent): void {
    // 根据武器 ID 和发射者确定音效
    const isPlayer = event.owner === world.playerId;
    const soundKey = isPlayer ? 'shoot_player' : 'shoot_enemy';
    playSound(soundKey);
}

/**
 * 处理 Boss 阶段切换事件
 */
function handleBossPhaseChangeEvent(world: World, event: BossPhaseChangeEvent): void {
    playSound('boss_phase_change');
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
    playSound('combo_break');
}

/**
 * 处理连击升级事件
 */
function handleComboUpgradeEvent(world: World, event: ComboUpgradeEvent): void {
    playSound('combo_upgrade');
}

/**
 * 播放音效
 * @param soundKey 音效键名
 */
export function playSound(soundKey: string): void {
    if (audioState.muted) return;

    const config = SOUND_CONFIGS[soundKey];
    if (!config) {
        console.warn(`AudioSystem: No config found for sound '${soundKey}'`);
        return;
    }

    // 计算最终音量
    const volume = config.volume * audioState.masterVolume * audioState.sfxVolume;

    // 创建音频元素并播放
    const audio = new Audio(config.src);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(err => {
        // 忽略播放失败（通常是用户未交互导致）
        console.debug(`Audio play failed: ${err.message}`);
    });
}

/**
 * 播放 BGM
 * @param bgmKey BGM 键名
 */
export function playBgm(bgmKey: string): void {
    if (audioState.currentBgm === bgmKey) return;

    // 停止当前 BGM
    stopBgm();

    const config = SOUND_CONFIGS[bgmKey];
    if (!config || !config.loop) {
        console.warn(`AudioSystem: Invalid BGM '${bgmKey}'`);
        return;
    }

    // 计算最终音量
    const volume = config.volume * audioState.masterVolume * audioState.bgmVolume;

    // 创建音频元素
    const audio = new Audio(config.src);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.loop = true;
    audio.play().catch(err => {
        console.debug(`BGM play failed: ${err.message}`);
    });

    audioState.bgmNode = audio;
    audioState.currentBgm = bgmKey;
}

/**
 * 停止 BGM
 */
export function stopBgm(): void {
    if (audioState.bgmNode) {
        audioState.bgmNode.pause();
        audioState.bgmNode = null;
    }
    audioState.currentBgm = null;
}

/**
 * 设置主音量
 * @param volume 音量 (0-1)
 */
export function setMasterVolume(volume: number): void {
    audioState.masterVolume = Math.max(0, Math.min(1, volume));
    updateBgmVolume();
}

/**
 * 设置音效音量
 * @param volume 音量 (0-1)
 */
export function setSfxVolume(volume: number): void {
    audioState.sfxVolume = Math.max(0, Math.min(1, volume));
}

/**
 * 设置 BGM 音量
 * @param volume 音量 (0-1)
 */
export function setBgmVolume(volume: number): void {
    audioState.bgmVolume = Math.max(0, Math.min(1, volume));
    updateBgmVolume();
}

/**
 * 更新 BGM 音量
 */
function updateBgmVolume(): void {
    if (audioState.bgmNode && audioState.currentBgm) {
        const config = SOUND_CONFIGS[audioState.currentBgm];
        if (config) {
            const volume = config.volume * audioState.masterVolume * audioState.bgmVolume;
            audioState.bgmNode.volume = Math.max(0, Math.min(1, volume));
        }
    }
}

/**
 * 切换静音状态
 */
export function toggleMute(): boolean {
    audioState.muted = !audioState.muted;
    if (audioState.muted) {
        stopBgm();
    }
    return audioState.muted;
}

/**
 * 获取音频状态
 */
export function getAudioState(): AudioState {
    return { ...audioState };
}

/**
 * 重置音频系统
 */
export function resetAudio(): void {
    stopBgm();
    audioState.masterVolume = 1.0;
    audioState.sfxVolume = 0.8;
    audioState.bgmVolume = 0.5;
    audioState.muted = false;
}
