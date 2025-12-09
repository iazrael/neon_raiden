# Boss System Design & Implementation (Final)

> **Note**: This document merges and supersedes previous designs (`BOSS_DESIGN.md` and `BOSS_DESGIN2.md`). It serves as the single source of truth for the ECS-based Boss system.

## 1. Architecture Overview (ECS)

In our ECS architecture, we decompose the monolithic Boss configuration into **Behavior Logic (Configs/Systems)**, **Initial State (Blueprints)**, and **Runtime State (Components)**.

| Feature | Old Approaches | **New ECS Implementation** |
| :--- | :--- | :--- |
| **Kill Score** | `score: 5000` prop | **Component** `ScoreValue: { value: 5000 }` |
| **Initial Weapon** | `weapons: [...]` list | **Component** `Weapon` (Initial state from Blueprint) |
| **Movement Logic** | `movement: { pattern... }` | **System** `BossSystem` + **Strategy** `bossMovement.ts` |
| **Phase Config** | Hardcoded checks | **Config** `bossData.ts` (Phase thresholds & behaviors) |
| **State Flags** | `isTeleporting` bool | **Component** `TeleportState` (Add/Remove component) |

---

## 2. Core Components

### 2.1 Meta Components (`src/engine/components/meta.ts`)

```typescript
/** Kill Score - How many points this entity is worth */
export class ScoreValue extends Component {
    constructor(cfg: { value: number }) {
        super();
        this.value = cfg.value;
    }
    public value: number;
}

/** Boss State & AI Memory */
export class BossAI extends Component {
    constructor(cfg: { phase?: number; nextPatternTime?: number }) { 
        super(); 
        this.phase = cfg.phase ?? 1; // 1-based phase index
    }
    public phase: number;
    // Runtime internal timers can go here if strictly AI related
}

/** Boss Identity Tag */
export class BossTag extends Component { 
    constructor(public subType: string = '') { super(); }
}
```

### 2.2 State Components (`src/engine/components/combat.ts`)

**Pattern: "State as Component"**
Instead of flags like `isTeleporting`, we attach a component. If the component exists, the state is active.

```typescript
/** Teleporting State - Entity is invisible/invulnerable/relocating */
export class TeleportState extends Component {
    constructor(cfg: { 
        timer: number;       // Duration to stay in "void"
        targetX: number;     // Destination X
        targetY: number;     // Destination Y
    }) { 
        super(); 
        this.timer = cfg.timer;
        this.targetX = cfg.targetX;
        this.targetY = cfg.targetY;
    }
    public timer: number;
    public targetX: number;
    public targetY: number;
}
```

---

## 3. Data Models & Configuration

### 3.1 Types (`src/engine/types.ts`)

```typescript
export enum BossType {
    GUARDIAN = 'boss_guardian',
    DESTROYER = 'boss_destroyer',
    TITAN = 'boss_titan',
    APOCALYPSE = 'boss_apocalypse',
    // ... others
}

export enum BossMovementPattern {
    IDLE = 'idle',             // Stationary
    SINE = 'sine',             // Sinewave movement
    FIGURE_8 = 'figure_8',     // Figure-8 loop
    CIRCLE = 'circle',         // Circular path
    ZIGZAG = 'zigzag',         // Zigzag 
    SLOW_DESCENT = 'slow_descent',
    
    // Advanced / Phase-specific
    FOLLOW = 'follow',         // Smooth follow
    DASH = 'dash',             // Aim -> Dash -> Return
    RANDOM_TELEPORT = 'random_teleport',
    ADAPTIVE = 'adaptive',     // Mixed behavior
    AGGRESSIVE = 'aggressive'  // Close combat positioning
}
```

### 3.2 Boss Configuration (`src/engine/configs/bossData.ts`)

Defines the "Brain": Phases, thresholds, and behavior changes.

```typescript
export interface BossSpec {
    id: string;
    phases: BossPhaseSpec[];
}

export interface BossPhaseSpec {
    threshold: number; // HP % (0.0 - 1.0) to trigger this phase
    movePattern: BossMovementPattern;
    weaponId: string;  // Refers to WEAPON_SPECS
    modifiers: {
        moveSpeed?: number; // Multiplier
        fireRate?: number;  // Multiplier (Logic handled in System)
    };
    phaseColor?: string;    // Optimization: Visual cue for phase change
}

export const BOSS_DATA: Record<string, BossSpec> = {
    'boss_guardian': {
        id: 'boss_guardian',
        phases: [
            { // P1: 100% - Calm Sine Wave
                threshold: 1.0,
                movePattern: BossMovementPattern.SINE,
                weaponId: 'boss_guardian_radial',
                modifiers: { moveSpeed: 1.0 }
            },
            { // P2: 50% - Enraged Follow
                threshold: 0.5,
                movePattern: BossMovementPattern.FOLLOW,
                weaponId: 'boss_guardian_radial_enraged',
                modifiers: { moveSpeed: 1.5 },
                phaseColor: '#ffaa00'
            }
        ]
    },
    'boss_destroyer': {
        id: 'boss_destroyer',
        phases: [
            { threshold: 1.0, movePattern: BossMovementPattern.FIGURE_8, weaponId: 'boss_destroyer_main', modifiers: { moveSpeed: 1.0 } },
            { threshold: 0.7, movePattern: BossMovementPattern.DASH, weaponId: 'boss_destroyer_dash', modifiers: { moveSpeed: 1.5 } },
            { threshold: 0.4, movePattern: BossMovementPattern.FOLLOW, weaponId: 'boss_destroyer_berserk', modifiers: { moveSpeed: 2.0 } }
        ]
    },
    'boss_apocalypse': {
        id: 'boss_apocalypse',
        phases: [
            { threshold: 1.0, movePattern: BossMovementPattern.ADAPTIVE, weaponId: 'boss_apocalypse_mixed', modifiers: {} },
            { threshold: 0.75, movePattern: BossMovementPattern.IDLE, weaponId: 'boss_apocalypse_defense', modifiers: { moveSpeed: 0.0 } },
            { threshold: 0.5, movePattern: BossMovementPattern.RANDOM_TELEPORT, weaponId: 'boss_apocalypse_berserk', modifiers: {} },
            { threshold: 0.25, movePattern: BossMovementPattern.DASH, weaponId: 'boss_apocalypse_final', modifiers: { moveSpeed: 2.5 } }
        ]
    }
};
```

### 3.3 Weapon Configuration (`src/engine/configs/weapons.ts`)

```typescript
export const BOSS_WEAPONS: Record<string, WeaponSpec> = {
    'boss_guardian_radial': {
        baseCooldown: 1000,
        ammoType: 'orb_blue', // Defined in ammo.ts
        bulletCount: 6,
        spread: 360,
        pattern: 'radial'
    },
    'boss_guardian_radial_enraged': {
        baseCooldown: 600,
        ammoType: 'orb_red',
        bulletCount: 12, // Denser
        spread: 360,
        pattern: 'radial'
    },
    // ... define other boss weapons (lasers, homing missiles) here
};
```

---

## 4. System Implementation

### 4.1 Movement Strategy Pattern (`src/engine/systems/logic/bossMovement.ts`)

We decouple mathematical movement logic from the ECS system loop using the Strategy Pattern.

```typescript
export interface MovementContext {
    dt: number;
    time: number;
    self: Transform; // Mutable
    player: { x: number, y: number };
    bossAi: BossAI;
    components: Component[]; // For adding/removing state components
}

type MovementHandler = (ctx: MovementContext) => { dx: number, dy: number };

export const MOVEMENT_STRATEGIES: Record<BossMovementPattern, MovementHandler> = {
    [BossMovementPattern.SINE]: ({ time }) => ({
        dx: Math.sin(time * 2),
        dy: Math.cos(time) * 0.2
    }),
    
    [BossMovementPattern.FOLLOW]: ({ self, player }) => {
        const dist = player.x - self.x;
        return {
            dx: Math.sign(dist) * Math.min(Math.abs(dist) * 0.05, 1.0),
            dy: (200 - self.y) * 0.05
        };
    },

    [BossMovementPattern.RANDOM_TELEPORT]: ({ self, components }) => {
        // Logic: 
        // 1. Check if TeleportState exists. If yes, countdown and return (0,0).
        // 2. If no, small chance to Spawn TeleportState (with random target).
        // Details implemented in code...
        return { dx: 0, dy: 0 };
    },
    
    // ... Implement DITEM, CIRCLE, DASH, etc.
};
```

### 4.2 Boss System (`src/engine/systems/BossSystem.ts`)

The system becomes a lightweight dispatcher.

```typescript
export function BossSystem(world: World, dt: number) {
    // 1. Locate Player
    // ...

    // 2. Iterate Bosses
    for (const [id, [bossAi, tr, moveIntent]] of view(world, [BossAI, Transform, MoveIntent])) {
        const entity = world.entities.get(id)!;
        const bossTag = entity.find(c => c instanceof BossTag);
        if (!bossTag) continue;

        // 3. Resolve Config
        const bossSpec = BOSS_DATA[bossTag.subType];
        const phaseSpec = bossSpec?.phases[bossAi.phase - 1];
        const pattern = phaseSpec?.movePattern || BossMovementPattern.IDLE;
        
        // 4. Update Phase (Basic Logic)
        // Check health vs threshold, if lower, increment phase & switch weapon...
        
        // 5. Execute Movement Strategy
        const strategy = MOVEMENT_STRATEGIES[pattern];
        if (strategy) {
            const result = strategy({
                dt, time: world.time, self: tr, player: playerPos, 
                bossAi, components: entity
            });
            moveIntent.dx = result.dx * (phaseSpec.modifiers.moveSpeed || 1);
            moveIntent.dy = result.dy * (phaseSpec.modifiers.moveSpeed || 1);
        }
    }
}
```

---

## 5. Blueprint Assembly (`src/engine/blueprints/bosses.ts`)

Constructs the entity with all necessary components.

```typescript
import { BLUEPRINT_BOSS_GUARDIAN } from './bosses';

// Example Factory Helper
function createBossBlueprint(id: string, texture: string, hp: number, score: number) {
    const spec = BOSS_DATA[id];
    const initialWeapon = spec.phases[0].weaponId;
    
    return {
        BossTag: { subType: id },
        Transform: { x: 400, y: -200, rot: 180 },
        Health: { hp, max: hp },
        Sprite: { texture, ... },
        HitBox: { shape: 'circle', radius: 80 },
        ScoreValue: { value: score },         // New ECS Component
        Weapon: { id: initialWeapon, ... },   // Initial Weapon
        BossAI: { phase: 1 },
        MoveIntent: { dx: 0, dy: 0 }
    };
}
```

## 6. Interaction with Other Systems

1.  **RenderSystem**: Should check for `TeleportState`. If present, skip rendering (invisibility).
2.  **DamageResolutionSystem**: Should check for `TeleportState`. If present, ignore damage (invulnerability). Also handles `ScoreValue` on death.
3.  **WeaponSystem**: Standard logic works naturally since Bosses just use standard `Weapon` components.

---

**Next Steps**:
1. Implement `ScoreValue`, `BossTag`, `TeleportState` components.
2. Refactor `bossData.ts` and `weapons.ts` to match the schema.
3. Implement `bossMovement.ts` strategies.
4. Update `BossSystem` to use the Strategy Pattern.
