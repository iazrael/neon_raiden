import { World } from '../types';
import { view } from '../world';
import { Weapon, Transform, FireIntent } from '../components';
import { AMMO_TABLE } from '../blueprints/ammo';
import { spawnBullet } from '../factory';
import { Blueprint } from '../blueprints';

/**
 * 武器系统
 * 处理武器冷却和发射逻辑
 * 根据FireIntent组件决定是否发射子弹
 */
export function WeaponSystem(w: World, dt: number) {
  // 遍历所有拥有武器和变换组件的实体
  for (const [id, [weapon, transform]] of view(w, [Weapon, Transform])) {
    // 更新武器冷却时间
    if (weapon.curCD > 0) {
      weapon.curCD -= dt;
    }

    // 检查是否有开火意图
    // 注意：FireIntent 可能由 InputSystem (玩家) 或 EnemySystem (敌人) 添加
    const entity = w.entities.get(id) || [];
    const intent = entity.find(c => c instanceof FireIntent) as FireIntent;

    // 如果有开火意图且武器已冷却，则发射子弹
    if (intent && intent.firing && weapon.curCD <= 0) {
      // 1. 查找武器配置 (先找玩家武器表，找不到再找敌人武器表)

      // 2. 查找弹药配置
      const ammoSpec = AMMO_TABLE[weapon.ammoType];
      if (!ammoSpec) continue;

      // 重置冷却时间
      weapon.curCD = weapon.cooldown;

      // 3. 计算发射参数
      const bulletSpeed = ammoSpec.speed;
      const damage = ammoSpec.damage * (1 + 0.1 * (weapon.level - 1));

      const isEnemyWeapon = id !== w.playerId;
      // 基础发射位置
      const originX = transform.x;
      const originY = transform.y + (isEnemyWeapon ? 0 : -20); // 敌人从中心发，玩家从头上发

      // 基础角度 (玩家默认向上 -90度，敌人默认向下 +90度)
      let baseAngle = isEnemyWeapon ? Math.PI / 2 : -Math.PI / 2;

      // 如果 Intent 指定了角度（例如瞄准玩家），优先使用
      if (intent.angle !== undefined) {
        baseAngle = intent.angle;
      }

      // 4. 根据 Pattern 发射子弹
      // 处理多发子弹 (spread / shotgun)
      const count = weapon.bulletCount || 1;
      const spread = weapon.spread || 0; // 总扩散角 (度)

      for (let i = 0; i < count; i++) {
        // 计算当前子弹的偏移角度
        let angleOffset = 0;
        if (count > 1) {
          // Special handling for 360 spread to avoid overlapping start/end
          if (spread >= 360) {
            const step = (Math.PI * 2) / count;
            angleOffset = i * step; // Start from 0, distribute evenly
          } else {
            // evenly distribute across spread
            // e.g. spread=30, count=3 => -15, 0, +15
            const start = -spread / 2;
            const step = spread / (count - 1);
            angleOffset = (start + i * step) * (Math.PI / 180);
          }
        }

        const finalAngle = baseAngle + angleOffset;
        const vx = Math.cos(finalAngle) * bulletSpeed;
        const vy = Math.sin(finalAngle) * bulletSpeed;

        // spawnBullet(w, originX, originY, vx, vy, damage, ammoSpec, id);
        const bp: Blueprint = {
          Transform: { x: originX, y: originY, rot: Math.atan2(vy, vx) },
          Bullet: { owner: id, ammoType: ammoSpec.id, pierceLeft: ammoSpec.pierce, bouncesLeft: ammoSpec.bounces },
          Velocity: { vx, vy },
          Lifetime: { timer: 10000 }
        };

        const bulletId = spawnBullet(w, bp);
      }
    }
  }
}
