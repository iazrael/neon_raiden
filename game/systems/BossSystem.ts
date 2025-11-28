import { Entity, SpriteMap, WeaponType, BossWeaponType, BossSpawnPosition, EntityType } from '@/types';
import { getBossConfigByLevel } from '@/game/config';
import { AudioSystem } from '@/game/systems/AudioSystem';

export class BossSystem {
    audio: AudioSystem;
    width: number = 0;
    height: number = 0;
    laserTimer: number = 0;
    movementTimer: number = 0;

    constructor(audio: AudioSystem, width: number, height: number) {
        this.audio = audio;
        this.width = width;
        this.height = height;
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    spawn(level: number, sprites: SpriteMap): Entity {
        const config = getBossConfigByLevel(level);
        if (!config) {
            throw new Error(`Boss config not found for level ${level}`);
        }

        const hp = config.hp;
        const sprite = sprites[`boss_${level}`];
        // console.log(`sprite width: ${sprite?.width}, height: ${sprite?.height}`);
        const width = config.size.width || (sprite ? sprite.width : 150);
        const height = config.size.height || (sprite ? sprite.height : 150);

        // Determine spawn X position based on config
        let spawnX: number;
        if (config.movement.spawnX === BossSpawnPosition.CENTER) {
            spawnX = this.width / 2;
        } else if (config.movement.spawnX === BossSpawnPosition.LEFT) {
            spawnX = this.width * 0.3;
        } else if (config.movement.spawnX === BossSpawnPosition.RIGHT) {
            spawnX = this.width * 0.7;
        } else { // 'random'
            spawnX = this.width * (0.25 + Math.random() * 0.5);
        }

        this.audio.playPowerUp(); // Alarm sound
        this.laserTimer = 0;
        this.movementTimer = 0;

        // Apply hitbox scaling for more precise collision detection
        const hitboxScale = config.hitboxScale || 1.0;
        console.log(`Boss size: ${width}x${height}`);
        return {
            x: spawnX,
            y: -150,
            width: width * hitboxScale,
            height: height * hitboxScale,
            vx: 0,
            vy: config.speed,
            hp: hp,
            maxHp: hp,
            type: EntityType.BOSS,
            color: '#ffffff',
            markedForDeletion: false,
            angle: 0,
            spriteKey: config.sprite,
            state: 0, // 0: entering, 1: fighting
            invulnerable: true, // Boss starts invulnerable when spawned
            invulnerableTimer: 3000, // 3 seconds invulnerability
            // P1 Boss special mechanics timers
            timer: 0, // General purpose timer for special mechanics
            // GUARDIAN: shield regeneration timer
            // INTERCEPTOR: dash cooldown timer
            // DESTROYER: armor parts tracking (using custom fields if needed)
        };
    }

    spawnWingmen(level: number, boss: Entity, sprites: SpriteMap): Entity[] {
        const config = getBossConfigByLevel(level);
        if (!config || !config.wingmen) return [];
        const wingmen: Entity[] = [];

        for (let i = 0; i < config.wingmen.count; i++) {
            const offsetX = (i === 0 ? -1 : 1) * 120;
            const wingman: Entity = {
                x: boss.x + offsetX,
                y: boss.y + 80,
                width: 50,
                height: 50,
                vx: 0,
                vy: 0,
                hp: 300,
                maxHp: 300,
                type: EntityType.ENEMY,
                subType: config.wingmen.type,
                color: '#ff00ff',
                markedForDeletion: false,
                angle: 0,
                spriteKey: `enemy_${config.wingmen.type}`,
                isElite: true,
                state: 0,
                timer: 0
            };
            wingmen.push(wingman);
        }

        return wingmen;
    }

    update(boss: Entity, dt: number, timeScale: number, player: Entity, enemyBullets: Entity[], level: number) {
        const config = getBossConfigByLevel(level);
        if (!config) return;

        // Update invulnerability timer
        if (boss.invulnerable && boss.invulnerableTimer !== undefined) {
            boss.invulnerableTimer -= dt;
            if (boss.invulnerableTimer <= 0) {
                boss.invulnerable = false;
                boss.invulnerableTimer = 0;
            }
        }

        // Entry phase
        if (boss.state === 0) {
            if (boss.y < 150) {
                boss.y += config.speed * timeScale;
            } else {
                boss.state = 1;
                boss.vy = 0;
            }
            return;
        }

        // Movement patterns
        this.movementTimer += dt;
        const t = this.movementTimer / 1000;

        // P1 Boss Special Mechanics
        this.updateBossSpecialMechanics(boss, dt, level, player, enemyBullets);

        switch (config.movement.pattern) {
            case 'sine':
                boss.x += Math.cos(t * 2) * 2 * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                break;

            case 'figure8':
                boss.x = this.width / 2 + Math.sin(t) * 150;
                boss.y = 150 + Math.sin(t * 2) * 50;
                break;

            case 'tracking':
                const dx = player.x - boss.x;
                boss.x += Math.sign(dx) * Math.min(Math.abs(dx), config.speed * 1.5) * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                boss.y = 150 + Math.sin(t * 3) * 30;
                break;

            case 'aggressive':
                const targetX = player.x;
                const diffX = targetX - boss.x;
                boss.x += Math.sign(diffX) * Math.min(Math.abs(diffX) * 0.02, config.speed * 2) * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));

                // Occasional dive
                if (Math.floor(t) % 8 === 0 && t % 1 < 0.5) {
                    boss.y = Math.min(boss.y + 2 * timeScale, 250);
                } else {
                    boss.y = Math.max(boss.y - 1 * timeScale, 100);
                }
                break;

            // P3 New Movement Patterns
            case 'zigzag':
                // 之字形移动：在水平方向上快速左右摆动
                const zigzagSpeed = 4;
                const zigzagFrequency = 1.5;
                boss.x += Math.sin(t * zigzagFrequency) * zigzagSpeed * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                // 垂直轻微摆动
                boss.y = 150 + Math.sin(t * 0.8) * 25;
                break;

            case 'random_teleport':
                // 随机瞬移：每3秒随机传送到新位置
                if (!boss.teleportTimer) boss.teleportTimer = 0;
                boss.teleportTimer += dt;
                
                if (boss.teleportTimer >= 3000) {
                    // 传送到随机位置
                    const newX = 100 + Math.random() * (this.width - 200);
                    const newY = 100 + Math.random() * 100;
                    boss.x = newX;
                    boss.y = newY;
                    boss.teleportTimer = 0;
                } else {
                    // 在当前位置轻微漂浮
                    boss.x += Math.sin(t * 2) * 0.5 * timeScale;
                    boss.y += Math.cos(t * 2) * 0.5 * timeScale;
                }
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                boss.y = Math.max(80, Math.min(300, boss.y));
                break;

            case 'circle':
                // 圆形轨迹：绕中心点做圆周运动
                const centerX = this.width / 2;
                const centerY = 180;
                const radius = 120;
                const angularSpeed = 0.8;
                boss.x = centerX + Math.cos(t * angularSpeed) * radius;
                boss.y = centerY + Math.sin(t * angularSpeed) * radius * 0.5; // 椭圆形
                break;

            case 'slow_descent':
                // 缓慢下沉：缓慢向下移动同时横向飘动
                const descentSpeed = 0.3;
                boss.y += descentSpeed * timeScale;
                // 限制下沉范围
                boss.y = Math.min(boss.y, 250);
                // 横向正弦波动
                boss.x += Math.cos(t * 1.2) * 1.5 * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                break;

            case 'adaptive':
                // 自适应追踪：根据玩家距离调整追踪强度
                const adaptiveDx = player.x - boss.x;
                const adaptiveDy = player.y - boss.y;
                const distance = Math.sqrt(adaptiveDx * adaptiveDx + adaptiveDy * adaptiveDy);
                
                // 距离越近，追踪越强
                const trackingStrength = Math.max(0.01, Math.min(0.05, 1 / (distance / 100)));
                boss.x += Math.sign(adaptiveDx) * Math.min(Math.abs(adaptiveDx) * trackingStrength, config.speed * 2.5) * timeScale;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x));
                
                // 垂直方向也有轻微追踪，但保持在上半区域
                const targetY = Math.min(player.y - 200, 200);
                const dyToTarget = targetY - boss.y;
                boss.y += Math.sign(dyToTarget) * Math.min(Math.abs(dyToTarget) * 0.01, 1) * timeScale;
                boss.y = Math.max(80, Math.min(250, boss.y));
                break;
        }

        // Weapon firing
        if (Math.random() < config.weaponConfigs.fireRate * timeScale) {
            this.fire(boss, enemyBullets, level, player);
        }

        // Laser attacks
        if (config.laser && config.laser.type !== 'none') {
            this.laserTimer += dt;
            if (this.laserTimer > config.laser.cooldown) {
                this.fireLaser(boss, enemyBullets, level, player, config.laser.type);
                this.laserTimer = 0;
            }
        }
    }

    fire(boss: Entity, enemyBullets: Entity[], level: number, player: Entity) {
        const config = getBossConfigByLevel(level);
        if (!config) return;

        // Use currentBulletCount if available (for Boss armor mechanics), otherwise use config
        const bulletCount = boss.currentBulletCount ?? config.weaponConfigs.bulletCount;

        // Radial Burst
        if (config.weapons.includes(BossWeaponType.RADIAL)) {
            for (let i = 0; i < bulletCount; i++) {
                const angle = (i / bulletCount) * Math.PI * 2 + (Date.now() / 1000);
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y + boss.height / 4,
                    width: 16,
                    height: 16,
                    vx: Math.cos(angle) * config.weaponConfigs.bulletSpeed,
                    vy: Math.sin(angle) * config.weaponConfigs.bulletSpeed,
                    hp: 1,
                    maxHp: 1,
                    type: EntityType.BULLET,
                    color: '#ff0055',
                    markedForDeletion: false,
                    spriteKey: 'bullet_enemy_orb'
                });
            }
        }

        // Targeted Shot - aims at player position at firing time, then flies straight
        if (config.weapons.includes(BossWeaponType.TARGETED) && config.weaponConfigs.targetedShotSpeed > 0) {
            // Calculate direction to player at firing time
            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Bullet flies straight in this direction, no tracking
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.height / 4,
                width: 20,
                height: 20,
                vx: (dx / dist) * config.weaponConfigs.targetedShotSpeed,
                vy: (dy / dist) * config.weaponConfigs.targetedShotSpeed,
                hp: 1,
                maxHp: 1,
                type: EntityType.BULLET,
                color: '#ffffff',
                markedForDeletion: false,
                spriteKey: 'bullet_enemy_orb'
            });
        }

        // Spread Shot
        if (config.weapons.includes(BossWeaponType.SPREAD)) {
            for (let i = -2; i <= 2; i++) {
                const angle = Math.PI / 2 + (i * Math.PI / 12);
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y + boss.height / 4,
                    width: 14,
                    height: 14,
                    vx: Math.cos(angle) * config.weaponConfigs.bulletSpeed * 0.8,
                    vy: Math.sin(angle) * config.weaponConfigs.bulletSpeed * 0.8,
                    hp: 1,
                    maxHp: 1,
                    type: EntityType.BULLET,
                    color: '#ff9900',
                    markedForDeletion: false,
                    spriteKey: 'bullet_enemy_orb'
                });
            }
        }

        // Homing Missiles - special tracking bullets
        if (config.weapons.includes(BossWeaponType.HOMING)) {
            for (let i = 0; i < 2; i++) {
                const offsetX = (i === 0 ? -1 : 1) * 30;
                // Initial direction towards player
                const dx = player.x - (boss.x + offsetX);
                const dy = player.y - (boss.y + boss.height / 4);
                const dist = Math.sqrt(dx * dx + dy * dy);
                const initialSpeed = 3;

                enemyBullets.push({
                    x: boss.x + offsetX,
                    y: boss.y + boss.height / 4,
                    width: 18,
                    height: 24,
                    vx: (dx / dist) * initialSpeed,
                    vy: (dy / dist) * initialSpeed,
                    hp: 1,
                    maxHp: 1,
                    type: EntityType.BULLET,
                    color: '#ff00ff',
                    markedForDeletion: false,
                    spriteKey: 'bullet_enemy_orb',
                    isHoming: true // Enable homing behavior
                });
            }
        }
    }

    fireLaser(boss: Entity, enemyBullets: Entity[], level: number, player: Entity, laserType: string) {
        const config = getBossConfigByLevel(level);
        if (!config || !config.laser) return;
        this.audio.playShoot(WeaponType.LASER);

        if (laserType === 'continuous') {
            // Continuous beam - single long-lasting laser
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.height / 2,
                width: 12,
                height: 800,
                vx: 0,
                vy: 15,
                hp: 999,
                maxHp: 999,
                type: EntityType.BULLET,
                color: '#ff00ff',
                markedForDeletion: false,
                spriteKey: 'bullet_laser',
                damage: config.laser.damage,
                timer: 1500 // Laser duration in ms
            });
        } else if (laserType === 'pulsed') {
            // Pulsed shots - multiple short laser bursts
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const dx = player.x - boss.x;
                    const dy = player.y - boss.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    enemyBullets.push({
                        x: boss.x,
                        y: boss.y + boss.height / 2,
                        width: 10,
                        height: 40,
                        vx: (dx / dist) * 12,
                        vy: (dy / dist) * 12,
                        hp: 1,
                        maxHp: 1,
                        type: EntityType.BULLET,
                        color: '#00ffff',
                        markedForDeletion: false,
                        spriteKey: 'bullet_laser',
                        damage: config.laser!.damage / 2
                    });
                }, i * 150);
            }
        }
    }

    /**
     * P1 Boss Special Mechanics Implementation
     * - GUARDIAN (Lv1): Shield Regeneration - recovers 500 HP every 20 seconds
     * - INTERCEPTOR (Lv2): Flash Dash - teleports and fires spread shot every 15 seconds
     * - DESTROYER (Lv3): Armor Sections - (simplified: reduce bullet count when HP < 66%)
     */
    updateBossSpecialMechanics(boss: Entity, dt: number, level: number, player: Entity, enemyBullets: Entity[]) {
        const config = getBossConfigByLevel(level);
        if (!config) return;

        // Initialize timer if undefined
        if (boss.timer === undefined) {
            boss.timer = 0;
        }

        boss.timer += dt;

        // GUARDIAN (Level 1): Shield Regeneration
        if (level === 1) {
            const REGEN_INTERVAL = 20000; // 20 seconds
            const REGEN_AMOUNT = 500;
            
            if (boss.timer >= REGEN_INTERVAL) {
                // Regenerate HP, but don't exceed max HP
                const healAmount = Math.min(REGEN_AMOUNT, boss.maxHp - boss.hp);
                if (healAmount > 0) {
                    boss.hp += healAmount;
                    // Visual feedback could be added here (particle effect, flash, etc.)
                }
                boss.timer = 0; // Reset timer
            }
        }

        // INTERCEPTOR (Level 2): Flash Dash
        if (level === 2) {
            const DASH_INTERVAL = 15000; // 15 seconds
            
            if (boss.timer >= DASH_INTERVAL) {
                // Teleport to a random position
                const oldX = boss.x;
                const dashDistance = 100 + Math.random() * 100;
                const direction = Math.random() < 0.5 ? -1 : 1;
                boss.x = Math.max(100, Math.min(this.width - 100, boss.x + dashDistance * direction));
                
                // Fire spread shot after dash
                for (let i = -3; i <= 3; i++) {
                    const angle = Math.PI / 2 + (i * Math.PI / 8);
                    enemyBullets.push({
                        x: boss.x,
                        y: boss.y + boss.height / 4,
                        width: 16,
                        height: 16,
                        vx: Math.cos(angle) * 5,
                        vy: Math.sin(angle) * 5,
                        hp: 1,
                        maxHp: 1,
                        type: EntityType.BULLET,
                        color: '#ff00aa',
                        markedForDeletion: false,
                        spriteKey: 'bullet_enemy_orb'
                    });
                }
                
                boss.timer = 0; // Reset timer
            }
        }

        // DESTROYER (Level 3): Armor Sections (Simplified)
        // When HP drops below 66%, reduce bullet count (simulating armor break)
        if (level === 3) {
            const hpPercent = boss.hp / boss.maxHp;
            
            // Store original bullet count if not already stored (for armor break mechanic)
            if (boss.state === 1 && !boss.originalBulletCount) {
                boss.originalBulletCount = config.weaponConfigs.bulletCount;
            }
            
            // Calculate effective bullet count based on armor phase, store in boss entity
            // Phase 1 (100%-66%): Full armor, normal bullet count
            // Phase 2 (66%-33%): Left wing destroyed, reduce bullets by 25%
            // Phase 3 (<33%): Both wings destroyed, reduce bullets by 50%
            const originalCount = boss.originalBulletCount ?? config.weaponConfigs.bulletCount;
            let effectiveBulletCount = originalCount;
            
            if (hpPercent < 0.33) {
                // Both wings destroyed - 50% reduction
                effectiveBulletCount = Math.floor(originalCount * 0.5);
            } else if (hpPercent < 0.66) {
                // Left wing destroyed - 25% reduction
                effectiveBulletCount = Math.floor(originalCount * 0.75);
            }
            
            // Store effective bullet count in boss entity instead of modifying config
            boss.currentBulletCount = effectiveBulletCount;
        }
    }
}
