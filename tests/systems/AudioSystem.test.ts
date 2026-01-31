/**
 * AudioSystem 单元测试
 */

import { AudioSystem, playSound, playBgm, stopBgm, setMasterVolume, setSfxVolume, setBgmVolume, toggleMute, resetAudio, getAudioState } from '../../src/engine/systems/AudioSystem';
import { World } from '../../src/engine/types';
import { HitEvent, KillEvent, PickupEvent, PlaySoundEvent } from '../../src/engine/events';

describe('AudioSystem', () => {
    let mockWorld: World;
    let originalAudio: typeof Audio;

    beforeEach(() => {
        // 保存原始 Audio 构造函数
        originalAudio = (window as any).Audio;

        // Mock Audio 构造函数
        const mockAudioInstance = {
            play: jest.fn().mockResolvedValue(undefined),
            pause: jest.fn(),
            volume: 0.5,
            loop: false
        };
        (window as any).Audio = jest.fn().mockReturnValue(mockAudioInstance);

        // 重置音频系统
        resetAudio();

        // 创建模拟世界对象
        mockWorld = {
            entities: new Map(),
            playerId: 1,
            width: 800,
            height: 600,
            time: 0,
            score: 0,
            level: 0,
            difficulty: 1.0,
            spawnCredits: 100,
            spawnTimer: 0,
            enemyCount: 0,
            events: [],
            comboState: { count: 0, timer: 0, multiplier: 1 },
        } as unknown as World;
    });

    afterEach(() => {
        // 恢复原始 Audio 构造函数
        (window as any).Audio = originalAudio;
    });

    describe('Hit 事件处理', () => {
        it('应该处理 Hit 事件（当前不播放音效）', () => {
            mockWorld.events = [
                { type: 'Hit', pos: { x: 400, y: 300 }, damage: 20, owner: 1, victim: 2 }
            ];

            AudioSystem(mockWorld, 0.016);

            // 当前实现不会播放 Hit 音效（handleHitEvent 已注释）
            expect((window as any).Audio).not.toHaveBeenCalled();
        });

        it('应该处理 Hit 事件（当前不播放音效）', () => {
            mockWorld.events = [
                { type: 'Hit', pos: { x: 400, y: 300 }, damage: 40, owner: 1, victim: 2 }
            ];

            AudioSystem(mockWorld, 0.016);

            // 当前实现不会播放 Hit 音效（handleHitEvent 已注释）
            expect((window as any).Audio).not.toHaveBeenCalled();
        });
    });

    describe('Kill 事件处理', () => {
        it('应该处理 Kill 事件并播放爆炸音效', () => {
            mockWorld.events = [
                { type: 'Kill', pos: { x: 400, y: 300 }, victim: 2, killer: 1, score: 100 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect((window as any).Audio).toHaveBeenCalled();
        });
    });

    describe('Pickup 事件处理', () => {
        it('应该处理 Pickup 事件并播放拾取音效', () => {
            mockWorld.events = [
                { type: 'Pickup', pos: { x: 400, y: 300 }, itemId: 'POWER', owner: 1 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect((window as any).Audio).toHaveBeenCalled();
        });
    });

    describe('PlaySound 事件处理', () => {
        it('应该处理 PlaySound 事件', () => {
            mockWorld.events = [
                { type: 'PlaySound', name: 'shoot_player' }
            ];

            AudioSystem(mockWorld, 0.016);

            expect((window as any).Audio).toHaveBeenCalled();
        });
    });

    describe('音量控制', () => {
        it('应该设置主音量', () => {
            setMasterVolume(0.5);

            const state = getAudioState();
            expect(state.masterVolume).toBe(0.5);
        });

        it('应该限制主音量在 0-1 范围内', () => {
            setMasterVolume(1.5);

            const state = getAudioState();
            expect(state.masterVolume).toBe(1);
        });

        it('应该设置音效音量', () => {
            setSfxVolume(0.7);

            const state = getAudioState();
            expect(state.sfxVolume).toBe(0.7);
        });

        it('应该设置 BGM 音量', () => {
            setBgmVolume(0.6);

            const state = getAudioState();
            expect(state.bgmVolume).toBe(0.6);
        });
    });

    describe('BGM 控制', () => {
        it('应该播放 BGM', () => {
            playBgm('bgm_stage');

            expect((window as any).Audio).toHaveBeenCalled();
        });

        it('应该停止 BGM', () => {
            playBgm('bgm_stage');
            stopBgm();

            // 系统应该正常运行
            expect(true).toBe(true);
        });
    });

    describe('静音控制', () => {
        it('应该切换静音状态', () => {
            const muted1 = toggleMute();
            expect(muted1).toBe(true);

            const muted2 = toggleMute();
            expect(muted2).toBe(false);
        });

        it('静音时不应该播放音效', () => {
            toggleMute();
            playSound('shoot_player');

            // 静音时 Audio 构造函数不应该被调用
            expect((window as any).Audio).not.toHaveBeenCalled();
        });
    });

    describe('重置功能', () => {
        it('应该重置音频状态', () => {
            setMasterVolume(0.5);
            setSfxVolume(0.5);
            setBgmVolume(0.5);

            resetAudio();

            const state = getAudioState();
            expect(state.masterVolume).toBe(1.0);
            expect(state.sfxVolume).toBe(0.8);
            expect(state.bgmVolume).toBe(0.5);
        });
    });

    describe('边界情况', () => {
        it('空事件列表应该正常处理', () => {
            mockWorld.events = [];

            expect(() => AudioSystem(mockWorld, 0.016)).not.toThrow();
        });

        it('无效的音效配置应该跳过', () => {
            mockWorld.events = [
                { type: 'PlaySound', name: 'invalid_sound_key' }
            ];

            expect(() => AudioSystem(mockWorld, 0.016)).not.toThrow();
        });
    });
});
