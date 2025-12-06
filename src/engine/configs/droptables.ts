// /** 掉落表组件 - 定义实体被销毁时的掉落物品 */
// export class DropTable extends Component {
//     /**
//      * 构造函数
//      * @param cfg 掉落表配置
//      */
//     constructor(cfg: { 
//         /** 掉落项数组 */
//         table: Array<{ item: string; weight: number; min?: number; max?: number }>; 
//     }) {
//         super();
//         this.table = cfg.table;
//     }
//     public table: Array<{ item: string; weight: number; min?: number; max?: number }>;
//     static check(c: any): c is DropTable { return c instanceof DropTable; }
// }
// src/configs/droptables/common.ts
export const DROP_TABLE_COMMON: DropTable = {
  table: [
    { item: 'coin', weight: 50 },
    { item: 'weapon_vulcan', weight: 10 },
    { item: 'buff_speed', weight: 5 },
  ],
};
// src/configs/
// ├─ droptables/
// │   ├─ common.ts             ← 普通敌人掉落权重
// │   ├─ elite.ts              ← 精英敌人掉落权重
// │   ├─ boss.ts               ← Boss 掉落权重
// │   └─ index.ts              ← barrel 导出
// ├─ gallery/
// │   ├─ index.ts
// │   └─ droptables.ts         ← 图鉴字典（名字/描述/图标）
// │   └─ index.ts              ← barrel 导出
// ├─ playerGrowth.ts           ← 升级数值（跨局成长）
// └─ index.ts                  ← barrel 导出