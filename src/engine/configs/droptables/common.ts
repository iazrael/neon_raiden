import { PickupId } from "@/engine/types";

// 掉落项结构定义（为了类型安全）
export interface DropItemSpec {
    item: string;
    weight: number;
    min?: number; // 默认 1
    max?: number; // 默认 1
}



// 1. 杂兵掉落表 (90% 什么都不掉，8% 加分/回血，2% 武器)
export const DROPTABLE_COMMON: DropItemSpec[] = [
    { item: PickupId.NONE, weight: 900 },
    { item: PickupId.POWER, weight: 80 },
    { item: PickupId.HP, weight: 10 },
    { item: PickupId.BOMB, weight: 5 },
    { item: PickupId.VULCAN, weight: 5 }, // 偶尔掉个基础武器
];

// 2. 精英掉落表 (30% 不掉，50% Buff，20% 武器)
export const DROPTABLE_ELITE: DropItemSpec[] = [
    { item: PickupId.NONE, weight: 30 },
    { item: PickupId.POWER, weight: 30 },
    { item: PickupId.HP, weight: 10 },
    { item: PickupId.OPTION, weight: 10 },
    { item: PickupId.LASER, weight: 10 },
    { item: PickupId.MISSILE, weight: 10 },
];

// 3. Boss 掉落表 (100% 掉好东西)
export const DROPTABLE_BOSS: DropItemSpec[] = [
    { item: PickupId.TESLA, weight: 1 },
    { item: PickupId.MAGMA, weight: 1 },
    { item: PickupId.WAVE, weight: 1 },
    { item: PickupId.PLASMA, weight: 1 },
];