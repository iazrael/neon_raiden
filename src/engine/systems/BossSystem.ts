// src/engine/systems/BossSystem.ts

import { World } from '@/engine/types';
import { BossAI, Transform, MoveIntent, PlayerTag, BossTag } from '@/engine/components';
import { view } from '@/engine/world';
import { BossMovementPattern } from '@/engine/types';
import { BOSS_DATA } from '@/engine/configs/bossData';
import { MOVEMENT_STRATEGIES, MovementContext } from './logic/bossMovement'; // 导入策略

const STAGE_WIDTH = 800;
const BOSS_MARGIN_X = 100;

export function BossSystem(world: World, dt: number) {
  // 1. 获取玩家位置
  let playerPos = { x: STAGE_WIDTH / 2, y: 500 };
  for (const [_, [tr]] of view(world, [PlayerTag, Transform])) {
    playerPos = { x: tr.x, y: tr.y };
    break;
  }

  // 2. 遍历 Boss
  for (const [id, [bossAi, tr, moveIntent, bossTag]] of view(world, [BossAI, Transform, MoveIntent, BossTag])) {
    // 获取配置 (实际项目中建议缓存 BossType 到组件)
    const bossComps = world.entities.get(id)!;

    // 假设 BossTag 里存了 subType (如 'boss_guardian')
    // 如果你的 BossTag 是空的，你需要从 factory 生成时把它记在 Entity 上或扩展 BossTag
    // 这里假设我们能获取到 type，例如通过 id 查表或者扩展组件
    const bossType = bossTag.subType || 'boss_guardian';

    const bossSpec = BOSS_DATA[bossType];
    const phaseSpec = bossSpec?.phases[bossAi.phase - 1];

    const pattern = phaseSpec?.movePattern || BossMovementPattern.IDLE;
    const speedMod = phaseSpec?.modifiers?.moveSpeed || 1.0;

    // 3. 【核心修改】调用策略函数
    const strategy = MOVEMENT_STRATEGIES[pattern];

    if (strategy) {
      const ctx: MovementContext = {
        dt,
        time: world.time,
        self: tr,
        player: playerPos,
        bossAi: bossAi,
        components: bossComps // <--- 【关键】传入组件列表引用
      };

      const result = strategy(ctx);

      // 应用结果
      moveIntent.dx = result.dx;
      moveIntent.dy = result.dy;
    }

    // 4. 边界限制 (通用逻辑)
    if (tr.x < BOSS_MARGIN_X && moveIntent.dx < 0) moveIntent.dx = 0;
    if (tr.x > STAGE_WIDTH - BOSS_MARGIN_X && moveIntent.dx > 0) moveIntent.dx = 0;
  }
}