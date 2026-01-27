/**
 * 碰撞系统类型定义
 * 统一管理碰撞层和碰撞过滤逻辑
 */

/** 碰撞层枚举 */
export enum CollisionLayer {
    None = 0,
    Player = 1 << 0,       // 1 - 玩家
    Enemy = 1 << 1,        // 2 - 敌人
    PlayerBullet = 1 << 2, // 4 - 玩家子弹
    EnemyBullet = 1 << 3,  // 8 - 敌人子弹
    Pickup = 1 << 4,       // 16 - 拾取物品
}

/** 碰撞矩阵 - 定义哪些层之间需要检测碰撞 */
const CollisionMatrix: Record<CollisionLayer, CollisionLayer> = {
    [CollisionLayer.Player]: CollisionLayer.Enemy | CollisionLayer.EnemyBullet | CollisionLayer.Pickup,
    [CollisionLayer.Enemy]: CollisionLayer.Player | CollisionLayer.PlayerBullet,
    [CollisionLayer.PlayerBullet]: CollisionLayer.Enemy | CollisionLayer.EnemyBullet,
    [CollisionLayer.EnemyBullet]: CollisionLayer.Player,
    [CollisionLayer.Pickup]: CollisionLayer.Player,
    [CollisionLayer.None]: 0,
};

/**
 * 检查两个碰撞层是否需要检测碰撞
 */
export function shouldCheckCollision(layer1: CollisionLayer, layer2: CollisionLayer): boolean {
    return (CollisionMatrix[layer1] & layer2) !== 0;
}
