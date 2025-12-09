// import { World } from '../types';
// import { InputSystem } from './InputSystem';
// import { DifficultySystem } from './DifficultySystem';
// import { SpawnSystem } from './SpawnSystem';
// import { BossPhaseSystem } from './BossPhaseSystem';
// import { BossSystem } from './BossSystem';
// import { EnemySystem } from './EnemySystem';
// import { AISteerSystem } from './AISteerSystem';
// import { BuffSystem } from './BuffSystem';
// import { WeaponSynergySystem } from './WeaponSynergySystem';
// import { WeaponSystem } from './WeaponSystem';
// import { MovementSystem } from './MovementSystem';
// import { CollisionSystem } from './CollisionSystem';
// import { PickupSystem } from './PickupSystem';
// import { DamageResolutionSystem } from './DamageResolutionSystem';
// import { LootSystem } from './LootSystem';
// import { ComboSystem } from './ComboSystem';
// import { CameraSystem } from './CameraSystem';
// import { EffectPlayer } from './EffectPlayer';
// import { AudioSystem } from './AudioSystem';
// import { RenderSystem } from './RenderSystem';
// import { LifetimeSystem } from './LifetimeSystem';
// import { CleanupSystem } from './CleanupSystem';

// /**
//  * 系统执行循环
//  * 按照严格的顺序执行所有系统
//  * 确保数据依赖关系正确
//  */
// export function gameLoop(world: World, dt: number, ctx: CanvasRenderingContext2D) {
//   // P1. 决策层 (输入与AI)
//   InputSystem(world, dt);                         // 1. 输入系统 - 读取键盘/手柄输入
//   DifficultySystem(world, dt);                    // 2. 难度系统 - 根据时间/击杀调整难度
//   SpawnSystem(world, dt);                         // 3. 生成系统 - 刷新敌人
//   BossPhaseSystem(world, dt);                     // 4. Boss阶段系统 - 控制Boss阶段转换
//   BossSystem(world, dt);                          // 5. Boss系统 - 控制Boss行为
//   // EnemySystem(world, dt);                      // 6. 敌人系统 - 控制敌人决策 (在旧系统中实现)
//   AISteerSystem(world, dt);                       // 7. AI转向系统 - 生成敌人移动意图

//   // P2. 状态层 (数值更新)
//   BuffSystem(world, dt);                          // 8. 增益系统 - 更新Buff效果
//   WeaponSynergySystem(world, dt);                 // 9. 武器协同系统 - 计算武器组合效果
//   WeaponSystem(world, dt);                        // 10. 武器系统 - 处理武器射击

//   // P3. 物理层 (位移)
//   MovementSystem(world, dt);                      // 11. 移动系统 - 更新实体位置

//   // P4. 交互层 (核心碰撞)
//   CollisionSystem(world, dt);                     // 12. 碰撞系统 - 检测碰撞并生成事件

//   // P5. 结算层 (事件处理)
//   PickupSystem(world, dt);                        // 13. 拾取系统 - 处理道具拾取
//   DamageResolutionSystem(world, dt);              // 14. 伤害结算系统 - 处理伤害和死亡
//   LootSystem(world);                              // 15. 掉落系统 - 处理敌人掉落
//   ComboSystem(world, dt);                         // 16. 连击系统 - 处理连击逻辑

//   // P6. 表现层 (视听反馈)
//   CameraSystem(world, dt);                        // 17. 相机系统 - 更新相机位置
//   EffectPlayer(world, dt);                        // 18. 效果播放系统 - 播放视觉效果
//   AudioSystem(world, dt);                         // 19. 音频系统 - 播放音效
//   RenderSystem(ctx, world);                       // 20. 渲染系统 - 绘制游戏画面

//   // P7. 清理层 (生命周期)
//   LifetimeSystem(world, dt);                      // 21. 生命周期系统 - 处理实体生命周期
//   CleanupSystem(world, dt);                       // 22. 清理系统 - 删除标记销毁的实体
// }