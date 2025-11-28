import {
    FighterType,
    FighterEntity,
} from '@/types';

// ==================== 玩家配置 ====================
export const PlayerConfig: FighterEntity = {
    type: FighterType.PLAYER,
    id: 'player',
    name: 'Neon Raiden',
    chineseName: '霓虹雷电',
    describe: '第七代量子战机原型,搭载神经同步武器矩阵与相位能量护盾,以超光速机动性和次元防御技术成为银河防线的终极守护者。通过意识直连系统实现人机合一,展现超越极限的战斗美学。',
    color: '#00ffff',
    sprite: 'player',
    size: {
        width: 48,
        height: 48
    },
    speed: 7,
    initialHp: 100,
    maxHp: 120,
    initialBombs: 3,
    maxBombs: 9,
    maxShield: 50,
    hitboxShrink: 0
};