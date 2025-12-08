import { World } from '../types';
import { view, addComponent, generateId } from '../world';
import { keys } from './InputSystem';
import { Weapon, Transform, FireIntent, Bullet } from '../components';
import { WEAPON_SPECS } from '../configs/weapons';
import { AMMO_SPECS } from '../configs/ammo';

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
    const hasFireIntent = [...(w.entities.get(id) || [])].some(c => c instanceof FireIntent);
    
    // 如果有开火意图且武器已冷却，则发射子弹
    if (hasFireIntent && weapon.curCD <= 0) {
      // 重置冷却时间
      weapon.curCD = weapon.cooldown;
      
      // 获取武器配置
      const weaponSpec = WEAPON_SPECS[weapon.id];
      if (!weaponSpec) continue;
      
      // 获取弹药配置
      const ammoSpec = AMMO_SPECS[weaponSpec.ammoType];
      if (!ammoSpec) continue;
      
      // 生成子弹实体
      const bulletId = generateId();
      
      // 计算子弹位置（在玩家前方）
      const bulletX = transform.x;
      const bulletY = transform.y - 20;
      
      // 计算子弹伤害（考虑武器等级）
      const damage = ammoSpec.damage * (1 + 0.1 * weapon.level);
      
      // 创建子弹组件
      addComponent(w, bulletId, new Transform({ x: bulletX, y: bulletY }));
      addComponent(w, bulletId, new Bullet({ 
        owner: id, 
        ammoType: weaponSpec.ammoType,
        pierceLeft: ammoSpec.pierce,
        bouncesLeft: ammoSpec.bounces
      }));
      
      // 添加速度组件使子弹向上移动
      addComponent(w, bulletId, { vx: 0, vy: -ammoSpec.speed } as any);
      
      // 添加生命周期组件（子弹存在10秒）
      addComponent(w, bulletId, { timer: 10000 } as any);
    }
  }
}