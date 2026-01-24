// //
// // 敌人成长数据配置文件
// // 定义敌人随着关卡提升而获得的属性增长
// //

// import { EnemyType } from '../../../../types';

// /**
//  * 敌人成长数据配置
//  * 定义了不同类型敌人随关卡提升的属性增长数据
//  */
// export const EnemyGrowthData: Record<EnemyType, {
//   /** 基础血量 */
//   baseHp: number;
//   /** 每级增加的血量 */
//   hpPerLevel: number;
//   /** 基础速度 */
//   baseSpeed: number;
//   /** 每级增加的速度 */
//   speedPerLevel: number;
//   /** 击杀得分 */
//   score: number;
// }> = {
//     /** 普通敌人成长数据 */
//     [EnemyType.NORMAL]: {
//         /** 基础血量 */
//         baseHp: 30,
//         /** 每级增加的血量 */
//         hpPerLevel: 10,
//         /** 基础速度 */
//         baseSpeed: 2,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.5,
//         /** 击杀得分 */
//         score: 100,
//     },
//     /** 快速敌人成长数据 */
//     [EnemyType.FAST]: {
//         /** 基础血量 */
//         baseHp: 10,
//         /** 每级增加的血量 */
//         hpPerLevel: 2,
//         /** 基础速度 */
//         baseSpeed: 10,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.5,
//         /** 击杀得分 */
//         score: 200,
//     },
//     /** 坦克敌人成长数据 */
//     [EnemyType.TANK]: {
//         /** 基础血量 */
//         baseHp: 60,
//         /** 每级增加的血量 */
//         hpPerLevel: 20,
//         /** 基础速度 */
//         baseSpeed: 1,
//         /** 每级增加的速度 */
//         speedPerLevel: 1,
//         /** 击杀得分 */
//         score: 300,
//     },
//     /** 自杀式敌人成长数据 */
//     [EnemyType.KAMIKAZE]: {
//         /** 基础血量 */
//         baseHp: 5,
//         /** 每级增加的血量 */
//         hpPerLevel: 1,
//         /** 基础速度 */
//         baseSpeed: 10,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.8,
//         /** 击杀得分 */
//         score: 400,
//     },
//     /** 精英炮艇敌人成长数据 */
//     [EnemyType.ELITE_GUNBOAT]: {
//         /** 基础血量 */
//         baseHp: 100,
//         /** 每级增加的血量 */
//         hpPerLevel: 10,
//         /** 基础速度 */
//         baseSpeed: 0.5,
//         /** 每级增加的速度 */
//         speedPerLevel: 0,
//         /** 击杀得分 */
//         score: 500,
//     },
//     /** 激光拦截机敌人成长数据 */
//     [EnemyType.LASER_INTERCEPTOR]: {
//         /** 基础血量 */
//         baseHp: 80,
//         /** 每级增加的血量 */
//         hpPerLevel: 15,
//         /** 基础速度 */
//         baseSpeed: 5,
//         /** 每级增加的速度 */
//         speedPerLevel: 1,
//         /** 击杀得分 */
//         score: 600,
//     },
//     /** 布雷船敌人成长数据 */
//     [EnemyType.MINE_LAYER]: {
//         /** 基础血量 */
//         baseHp: 60,
//         /** 每级增加的血量 */
//         hpPerLevel: 10,
//         /** 基础速度 */
//         baseSpeed: 1.5,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.1,
//         /** 击杀得分 */
//         score: 700,
//     },
//     /** 脉冲敌人成长数据 */
//     [EnemyType.PULSAR]: {
//         /** 基础血量 */
//         baseHp: 15,
//         /** 每级增加的血量 */
//         hpPerLevel: 5,
//         /** 基础速度 */
//         baseSpeed: 6,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.5,
//         /** 击杀得分 */
//         score: 250,
//     },
//     /** 堡垒敌人成长数据 */
//     [EnemyType.FORTRESS]: {
//         /** 基础血量 */
//         baseHp: 200,
//         /** 每级增加的血量 */
//         hpPerLevel: 10,
//         /** 基础速度 */
//         baseSpeed: 0.8,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.2,
//         /** 击杀得分 */
//         score: 800,
//     },
//     /** 追踪者敌人成长数据 */
//     [EnemyType.STALKER]: {
//         /** 基础血量 */
//         baseHp: 30,
//         /** 每级增加的血量 */
//         hpPerLevel: 10,
//         /** 基础速度 */
//         baseSpeed: 5,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.5,
//         /** 击杀得分 */
//         score: 350,
//     },
//     /** 弹幕敌人成长数据 */
//     [EnemyType.BARRAGE]: {
//         /** 基础血量 */
//         baseHp: 100,
//         /** 每级增加的血量 */
//         hpPerLevel: 10,
//         /** 基础速度 */
//         baseSpeed: 1.2,
//         /** 每级增加的速度 */
//         speedPerLevel: 0.1,
//         /** 击杀得分 */
//         score: 600,
//     }
// };