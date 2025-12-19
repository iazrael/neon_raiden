import { World } from '../types';
import { view, addComponent } from '../world';
import { Health, Shield, DestroyTag, TeleportState, ScoreValue, DamageOverTime, InvulnerableState } from '../components';
import { pushEvent } from '../world';
import { KillEvent } from '../events';

/**
 * 伤害结算系统
 * 处理护盾吸收伤害、DOT效果、无敌帧逻辑
 * 为需要销毁的实体添加DestroyTag组件
 */
export function DamageResolutionSystem(world: World, dt: number) {
  // 处理无敌状态
  for (const [id, [invuln]] of view(world, [InvulnerableState])) {
    invuln.tick(dt);
    if (invuln.isFinished()) {
      const comps = world.entities.get(id);
      if (comps) {
        const idx = comps.indexOf(invuln);
        if (idx !== -1) comps.splice(idx, 1);
      }
    }
  }

  // 处理DOT效果
  for (const [id, [dot, health]] of view(world, [DamageOverTime, Health])) {
    // 检查无敌状态
    const comps = world.entities.get(id)!;
    if (comps.some(InvulnerableState.check) || comps.some(TeleportState.check)) continue;

    if (dot.tick(dt)) {
      // 本帧需要扣血
      health.hp -= dot.damagePerSecond * dot.interval;
    }

    // 检查DOT是否结束
    if (dot.isFinished()) {
      const idx = comps.indexOf(dot);
      if (idx !== -1) comps.splice(idx, 1);
    }
  }

  // 处理护盾吸收伤害和护盾恢复
  for (const [id, [health, shield]] of view(world, [Health, Shield])) {
    const comps = world.entities.get(id)!;

    // 检查无敌状态和瞬移状态
    if (comps.some(InvulnerableState.check) || comps.some(TeleportState.check)) continue;

    // 护盾每帧恢复
    if (shield.regen > 0 && shield.value < health.max * 0.5) { // 假设护盾最大值为生命值的一半
      shield.value += shield.regen * dt / 1000; // 转换为每秒恢复
      if (shield.value > health.max * 0.5) {
        shield.value = health.max * 0.5;
      }
    }
  }

  // 检查需要销毁的实体（HP<=0）
  for (const [id, [health]] of view(world, [Health])) {
    if (health.hp <= 0) {
      const comps = world.entities.get(id)!;

      // 检查是否有ScoreValue组件来确定是否需要生成击杀事件
      const scoreComp = comps.find(ScoreValue.check);
      if (scoreComp) {
        // 生成击杀事件
        pushEvent(world, {
          type: 'Kill',
          pos: { x: 0, y: 0 }, // 位置信息需要从Transform组件获取
          victim: id,
          killer: 0, // TODO: 需要确定击杀者
          score: scoreComp.value
        } as KillEvent);
      }

      // 为需要销毁的实体添加DestroyTag组件
      addComponent(world, id, new DestroyTag({ reason: 'killed' }));
    }
  }
}