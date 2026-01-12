import { describe, it, expect, beforeEach } from '@jest/globals';
import { createWorld, createEntity, generateEntityId, World, CollisionType } from '@/game/types/world';
import { EntityType } from '@/types';

describe('ECS World', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld();
  });

  it('should create empty world', () => {
    expect(world.entities.size).toBe(0);
    expect(world.events.length).toBe(0);
  });

  it('should generate unique entity IDs', () => {
    const id1 = generateEntityId();
    const id2 = generateEntityId();
    expect(id1).not.toBe(id2);
  });

  it('should create entity', () => {
    const id = createEntity(world, EntityType.PLAYER);

    expect(world.entities.has(id)).toBe(true);
    expect(world.entities.get(id)?.type).toBe(EntityType.PLAYER);
  });

  it('should mark entity for deletion', () => {
    const id = createEntity(world, EntityType.PLAYER);

    world.entities.get(id)!.markedForDeletion = true;

    expect(world.entities.get(id)?.markedForDeletion).toBe(true);
  });

  it('should delete entity', () => {
    const id = createEntity(world, EntityType.PLAYER);

    world.components.positions.set(id, { x: 100, y: 100 });
    world.components.velocities.set(id, { vx: 1, vy: 1 });

    world.entities.delete(id);
    world.components.positions.delete(id);
    world.components.velocities.delete(id);

    expect(world.entities.has(id)).toBe(false);
    expect(world.components.positions.has(id)).toBe(false);
    expect(world.components.velocities.has(id)).toBe(false);
  });

  it('should store components', () => {
    const id = createEntity(world, EntityType.PLAYER);

    world.components.positions.set(id, { x: 100, y: 200 });
    world.components.velocities.set(id, { vx: 5, vy: -3 });

    const position = world.components.positions.get(id);
    const velocity = world.components.velocities.get(id);

    expect(position?.x).toBe(100);
    expect(position?.y).toBe(200);
    expect(velocity?.vx).toBe(5);
    expect(velocity?.vy).toBe(-3);
  });

  it('should emit and process events', () => {
    world.events.push({ type: 'collision', entityId: '1', otherId: '2' });
    world.events.push({ type: 'damage', entityId: '1', amount: 10 });

    expect(world.events.length).toBe(2);

    const events = world.events;
    world.events = [];

    expect(world.events.length).toBe(0);
  });

  it('should store player and boss references', () => {
    const playerId = createEntity(world, EntityType.PLAYER);
    const bossId = createEntity(world, EntityType.BOSS);

    world.player = playerId;
    world.boss = bossId;

    expect(world.player).toBe(playerId);
    expect(world.boss).toBe(bossId);
  });
});

describe('ECS Components', () => {
  let world: World;

  beforeEach(() => {
    world = createWorld();
  });

  it('should store position component', () => {
    const id = createEntity(world, EntityType.PLAYER);
    world.components.positions.set(id, { x: 150, y: 250, angle: Math.PI / 4 });

    const pos = world.components.positions.get(id);

    expect(pos?.x).toBe(150);
    expect(pos?.y).toBe(250);
    expect(pos?.angle).toBe(Math.PI / 4);
  });

  it('should store velocity component', () => {
    const id = createEntity(world, EntityType.PLAYER);
    world.components.velocities.set(id, { vx: 10, vy: -5, speed: 15 });

    const vel = world.components.velocities.get(id);

    expect(vel?.vx).toBe(10);
    expect(vel?.vy).toBe(-5);
    expect(vel?.speed).toBe(15);
  });

  it('should store render component', () => {
    const id = createEntity(world, EntityType.PLAYER);
    world.components.renders.set(id, {
      spriteKey: 'player',
      width: 40,
      height: 40,
      color: '#00ffff'
    });

    const render = world.components.renders.get(id);

    expect(render?.spriteKey).toBe('player');
    expect(render?.width).toBe(40);
    expect(render?.height).toBe(40);
    expect(render?.color).toBe('#00ffff');
  });

  it('should store collider component', () => {
    const id = createEntity(world, EntityType.PLAYER);
    world.components.colliders.set(id, {
      width: 40,
      height: 40,
      collisionType: CollisionType.PLAYER,
      hitboxShrink: 0.3,
      isElite: false
    });

    const collider = world.components.colliders.get(id);

    expect(collider?.width).toBe(40);
    expect(collider?.height).toBe(40);
    expect(collider?.collisionType).toBe(CollisionType.PLAYER);
    expect(collider?.hitboxShrink).toBe(0.3);
  });

  it('should store combat component', () => {
    const id = createEntity(world, EntityType.PLAYER);
    world.components.combats.set(id, {
      hp: 100,
      maxHp: 150,
      damage: 20,
      shield: 50,
      defensePct: 10
    });

    const combat = world.components.combats.get(id);

    expect(combat?.hp).toBe(100);
    expect(combat?.maxHp).toBe(150);
    expect(combat?.damage).toBe(20);
    expect(combat?.shield).toBe(50);
    expect(combat?.defensePct).toBe(10);
  });
});
