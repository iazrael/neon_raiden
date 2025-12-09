// src/engine/systems/BossSystem.ts

import { World } from '@/engine/types';
import { BossAI, Transform, MoveIntent, PlayerTag, BossTag, SpeedStat } from '@/engine/components';
import { view } from '@/engine/world';
import { BOSS_DATA, BossMovementPattern } from '@/engine/configs/bossData';
import { MOVEMENT_STRATEGIES, MovementContext } from './logic/bossMovement'; // 导入策略

const STAGE_WIDTH = 800;
const BOSS_MARGIN_X = 100;

export function BossSystem(world: World, dt: number) {
  // 1. 获取玩家位置
  const playerComps = world.entities.get(world.playerId);
  // 安全检查：玩家可能死亡
  if (!playerComps) return;
  const playerTr = playerComps.find(Transform.check);
  if (!playerTr) return;

  // 2. 遍历 Boss
  for (const [id, [bossAi, trans, moveIntent, bossTag, speedStat]] of view(world, [BossAI, Transform, MoveIntent, BossTag, SpeedStat])) {
    const bossComps = world.entities.get(id)!;

    // 安全检查配置
    const bossSpec = BOSS_DATA[bossTag.id]; // 这里的 id 应该是字符串 'boss_guardian' 等
    if (!bossSpec) continue;

    const phaseIndex = Math.max(0, bossAi.phase - 1);
    const phaseSpec = bossSpec.phases[phaseIndex] || bossSpec.phases[0];

    const logicSpeedMult = phaseSpec.modifiers?.moveSpeed || 1.0;
    const pattern = phaseSpec.movePattern || BossMovementPattern.IDLE;

    // 3. 调用策略
    const strategy = MOVEMENT_STRATEGIES[pattern];

    if (strategy) {
      const ctx: MovementContext = {
        dtInSeconds: dt / 1000, // 转换为秒传给策略
        timeInSeconds: world.time / 1000, // 转换为秒
        trans,
        player: playerTr,
        bossAi,
        components: bossComps,
        moveSpeed: logicSpeedMult,
        speedStat
      };

      const result = strategy(ctx);

      // 【核心修改】正确设置意图类型
      moveIntent.dx = result.dx;
      moveIntent.dy = result.dy;
      moveIntent.type = result.type; // 'velocity' or 'offset'
    } else {
      // 默认不动
      moveIntent.dx = 0;
      moveIntent.dy = 0;
    }

    // 4. 边界限制 (仅针对 Velocity 模式，Offset 模式通常是精确控制)
    if (moveIntent.type === 'velocity') {
      if (trans.x < BOSS_MARGIN_X && moveIntent.dx < 0) moveIntent.dx = 0;
      if (trans.x > STAGE_WIDTH - BOSS_MARGIN_X && moveIntent.dx > 0) moveIntent.dx = 0;
    }
  }
}