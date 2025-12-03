import { World, DropTable, PickupItem } from '../types';
import { view, addComponent, generateId } from '../world';

/**
 * 掉落系统
 * 监听带有DestroyTag且具有DropTable组件的实体
 * 根据掉落表生成相应的PickupItem实体
 */
export function LootSystem(w: World, dt: number) {
  // TODO: 实现掉落系统逻辑
  // 监听带有DestroyTag且具有DropTable组件的实体
  // 根据掉落表生成相应的PickupItem实体
}