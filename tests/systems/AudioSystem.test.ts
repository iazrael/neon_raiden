/**
 * AudioSystem 单元测试
 */

import { AudioSystem} from '../../src/engine/systems/AudioSystem';
import type { World } from '../../src/engine/world';
import * as audioModule from '../../src/engine/audio';

describe('AudioSystem', () => {
    let mockWorld: World;

    beforeEach(() => {
        // Mock audioPlayer 的方法
        jest.spyOn(audioModule.audioPlayer, 'playHit').mockImplementation(() => {});
        jest.spyOn(audioModule.audioPlayer, 'playExplosion').mockImplementation(() => {});
        jest.spyOn(audioModule.audioPlayer, 'playPowerUp').mockImplementation(() => {});
        jest.spyOn(audioModule.audioPlayer, 'playShoot').mockImplementation(() => {});
        jest.spyOn(audioModule.audioPlayer, 'playShieldBreak').mockImplementation(() => {});

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
            bossState: {
                bossId: 100,
                currentPhase: 1,
                maxPhases: 3,
                phaseStartTime: 0,
            },
        } as unknown as World;
    });

    afterEach(() => {
        // 恢复所有 spy
        jest.restoreAllMocks();
    });

    describe('Hit 事件处理', () => {
        it('应该处理 Hit 事件并播放命中音效', () => {
            mockWorld.events = [
                { type: 'Hit', pos: { x: 400, y: 300 }, damage: 20, owner: 1, victim: 2 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect(audioModule.audioPlayer.playHit).toHaveBeenCalled();
        });

        it('应该处理高伤害 Hit 事件并播放命中音效', () => {
            mockWorld.events = [
                { type: 'Hit', pos: { x: 400, y: 300 }, damage: 40, owner: 1, victim: 2 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect(audioModule.audioPlayer.playHit).toHaveBeenCalled();
        });
    });

    describe('Kill 事件处理', () => {
        it('应该处理普通敌人 Kill 事件并播放小型爆炸音效', () => {
            mockWorld.events = [
                { type: 'Kill', pos: { x: 400, y: 300 }, victim: 2, killer: 1, score: 100 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect(audioModule.audioPlayer.playExplosion).toHaveBeenCalled();
        });

        it('应该处理玩家 Kill 事件并播放大型爆炸音效', () => {
            mockWorld.events = [
                { type: 'Kill', pos: { x: 400, y: 300 }, victim: 1, killer: 2, score: 0 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect(audioModule.audioPlayer.playExplosion).toHaveBeenCalled();
        });

        it('应该处理 Boss Kill 事件并播放大型爆炸音效', () => {
            mockWorld.events = [
                { type: 'Kill', pos: { x: 400, y: 300 }, victim: 100, killer: 1, score: 5000 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect(audioModule.audioPlayer.playExplosion).toHaveBeenCalled();
        });
    });

    describe('Pickup 事件处理', () => {
        it('应该处理 Pickup 事件并播放拾取音效', () => {
            mockWorld.events = [
                { type: 'Pickup', pos: { x: 400, y: 300 }, itemId: 'POWER', owner: 1 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect(audioModule.audioPlayer.playPowerUp).toHaveBeenCalled();
        });
    });

    describe('PlaySound 事件处理', () => {
        it('应该处理 PlaySound 事件（当前 playSound 函数未实现）', () => {
            mockWorld.events = [
                { type: 'PlaySound', name: 'shoot_player' }
            ];

            AudioSystem(mockWorld, 0.016);

            // playSound 函数当前被注释掉，不做任何事情
            // 所以不应该调用任何 audioPlayer 方法
            expect(audioModule.audioPlayer.playShoot).not.toHaveBeenCalled();
        });
    });

    describe('ShieldBroken 事件处理', () => {
        it('应该处理 ShieldBroken 事件并播放护盾破碎音效', () => {
            mockWorld.events = [
                { type: 'ShieldBroken', pos: { x: 400, y: 300 }, owner: 1 }
            ];

            AudioSystem(mockWorld, 0.016);

            expect(audioModule.audioPlayer.playShieldBreak).toHaveBeenCalled();
        });
    });

});
