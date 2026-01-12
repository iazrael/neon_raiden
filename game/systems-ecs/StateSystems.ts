import { World } from '../types/world';
import { EntityType } from '@/types';

export function ComboSystem(world: World, dt: number): void {
  const deaths = world.events.filter(e => e.type === 'death');

  for (const event of deaths as any[]) {
    const entity = world.entities.get(event.entityId);
    if (!entity) continue;

    if (entity.type === EntityType.ENEMY) {
      incrementCombo(world);
    }
  }
}

function incrementCombo(world: World): void {
  let combo = (world as any).combo || 0;
  combo++;

  (world as any).combo = combo;
  (world as any).comboTimer = world.time + 5000;

  world.events.push({
    type: 'combo',
    count: combo,
    bonus: Math.floor(combo / 10) * 10
  });
}

export function updateComboTimer(world: World, dt: number): void {
  const comboTimer = (world as any).comboTimer;

  if (comboTimer && world.time > comboTimer) {
    (world as any).combo = 0;
    (world as any).comboTimer = 0;
  }
}

export function WeaponSynergySystem(world: World, dt: number): void {
  const playerId = world.player;
  if (!playerId) return;

  const weapon = world.components.weapons.get(playerId);
  if (!weapon) return;

  if (weapon.weaponType === 'tesla') {
    applyTeslaEffect(world, playerId);
  }
}

function applyTeslaEffect(world: World, playerId: string): void {
  const playerPosition = world.components.positions.get(playerId);
  if (!playerPosition) return;

  const enemies = Array.from(world.entities.entries())
    .filter(([_, entity]) => entity.type === EntityType.ENEMY && !entity.markedForDeletion)
    .map(([id]) => id);

  for (const enemyId of enemies) {
    const enemyPosition = world.components.positions.get(enemyId);
    if (!enemyPosition) continue;

    const dx = enemyPosition.x - playerPosition.x;
    const dy = enemyPosition.y - playerPosition.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 200) {
      world.events.push({
        type: 'damage',
        entityId: enemyId,
        amount: 5,
        source: playerId
      });
    }
  }
}

export function BuffSystem(world: World, dt: number): void {
  const now = world.time;

  for (const [id, buff] of world.components.buffs) {
    buff.buffs = buff.buffs.filter(b => b.endTime > now);
  }
}

export function LevelingSystem(world: World, dt: number): void {
  const deaths = world.events.filter(e => e.type === 'death');

  for (const event of deaths as any[]) {
    const entity = world.entities.get(event.entityId);
    if (!entity) continue;

    if (entity.type === EntityType.ENEMY) {
      addScore(world, 100);
    }
  }

  checkLevelUp(world);
}

function addScore(world: World, amount: number): void {
  let score = (world as any).score || 0;
  score += amount;
  (world as any).score = score;
}

function checkLevelUp(world: World): void {
  const score = (world as any).score || 0;
  const playerLevel = (world as any).playerLevel || 1;

  const nextLevelScore = playerLevel * 1000;

  if (score >= nextLevelScore) {
    (world as any).playerLevel = playerLevel + 1;

    const playerId = world.player;
    if (playerId) {
      world.events.push({
        type: 'player_level_up',
        entityId: playerId,
        newLevel: playerLevel + 1
      });
    }
  }
}

export function ShieldRegenSystem(world: World, dt: number): void {
  const playerId = world.player;
  if (!playerId) return;

  const combat = world.components.combats.get(playerId);
  if (!combat) return;

  if (combat.shield !== undefined && combat.shield < 100) {
    const regenTimer = (world as any).shieldRegenTimer || 0;

    (world as any).shieldRegenTimer = regenTimer + dt;

    if ((world as any).shieldRegenTimer > 5000) {
      combat.shield = Math.min(100, combat.shield + 1);
      (world as any).shieldRegenTimer = 0;
    }
  }
}

export function DifficultySystem(world: World, dt: number): void {
  const difficultyTimer = (world as any).difficultyTimer || 0;

  (world as any).difficultyTimer = difficultyTimer + dt;

  if ((world as any).difficultyTimer > 15000) {
    adjustDifficulty(world);
    (world as any).difficultyTimer = 0;
  }
}

function adjustDifficulty(world: World): void {
  const score = (world as any).score || 0;

  if (score < 1000) {
    (world as any).difficulty = 'easy';
  } else if (score < 5000) {
    (world as any).difficulty = 'normal';
  } else {
    (world as any).difficulty = 'hard';
  }
}
