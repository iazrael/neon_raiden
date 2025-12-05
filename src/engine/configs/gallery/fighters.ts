import { FighterId } from "../../types";
import { GalleryEntry } from "../types";


export const GALLERY_FIGHTERS: Record<FighterId, GalleryEntry> = {
    [FighterId.NEON]: {
        id: FighterId.NEON,
        name: 'Neon Raiden',
        chineseName: '光辉·VII',
        description: '第七代量子战机原型,搭载神经同步武器矩阵与相位能量护盾,以超光速机动性和次元防御技术成为银河防线的终极守护者。通过意识直连系统实现人机合一,展现超越极限的战斗美学。',
        rarity: 'legendary',
        unlock: 'level',
        unlockParam: 0,
    }
}
