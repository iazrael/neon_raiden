import { World } from '../types/world';
import { EntityType } from '@/types';

export function BossSystem(world: World, dt: number): void {
  const bossId = world.boss;
  if (!bossId) return;

  const bossAi = world.components.ais.get(bossId);
  const bossBoss = world.components.bosses.get(bossId);
  const position = world.components.positions.get(bossId);
  const velocity = world.components.velocities.get(bossId);

  if (!bossAi || !bossBoss || !position || !velocity) return;

  bossBoss.phaseTimer -= dt;

  if (bossBoss.phaseTimer <= 0) {
    bossBoss.phase = (bossBoss.phase + 1) % 3;
    bossBoss.phaseTimer = 10000;

    world.events.push({
      type: 'boss_phase_change',
      entityId: bossId,
      newPhase: bossBoss.phase
    });
  }

  bossAi.timer -= dt;

  if (bossAi.timer <= 0) {
    updateBossAI(world, bossId, bossBoss.phase);
    bossAi.timer = 1000;
  }
}

function updateBossAI(world: World, bossId: string, phase: number): void {
  const position = world.components.positions.get(bossId);
  const velocity = world.components.velocities.get(bossId);

  if (!position || !velocity) return;

  switch (phase) {
    case 0:
      velocity.vx = Math.sin(Date.now() / 1000) * 3;
      velocity.vy = 1;
      break;

    case 1:
      velocity.vx = Math.cos(Date.now() / 500) * 4;
      velocity.vy = Math.sin(Date.now() / 500) * 2;
      break;

    case 2:
      velocity.vx = (Math.random() - 0.5) * 6;
      velocity.vy = 2;
      break;
  }

  position.x += velocity.vx;
  position.y += velocity.vy;

  if (position.x < 50) position.x = 50;
  if (position.x > world.width - 50) position.x = world.width - 50;
  if (position.y < 50) position.y = 50;
  if (position.y > world.height / 3) position.y = world.height / 3;
}

export function BossPhaseSystem(world: World, dt: number): void {
  const bossId = world.boss;
  if (!bossId) return;

  const bossBoss = world.components.bosses.get(bossId);
  const render = world.components.renders.get(bossId);

  if (!bossBoss || !render) return;

  if (world.events.some(e =>
    e.type === 'boss_phase_change' && e.entityId === bossId
  )) {
    render.phaseGlowColor = '#ff00ff';
    render.phaseGlowUntil = world.time + 1000;
  }

  if (render.phaseGlowUntil && world.time > render.phaseGlowUntil) {
    render.phaseGlowColor = undefined;
  }
}
