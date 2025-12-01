#!/usr/bin/env ts-node

/**
 * 武器合并功能验证脚本
 * 用于验证武器组合技是否正常工作
 */

import { WeaponType, Entity, EntityType } from '../types/index.ts';
import { WeaponSynergySystem, SynergyType } from '../game/systems/WeaponSynergySystem.ts';

// 创建武器组合技系统实例
const synergySystem = new WeaponSynergySystem();

// 测试函数
function runTests() {
  console.log('开始武器合并功能验证...\n');

  // 1. 测试组合技检测
  console.log('1. 测试组合技检测...');
  const canCombine = synergySystem.canCombine(WeaponType.LASER, WeaponType.TESLA);
  console.log(`LASER和TESLA是否可以组合: ${canCombine}`);
  
  // 2. 测试组合技激活
  console.log('\n2. 测试组合技激活...');
  synergySystem.updateEquippedWeapons([WeaponType.LASER, WeaponType.TESLA]);
  const isLaserTeslaActive = synergySystem.isSynergyActive(SynergyType.LASER_TESLA);
  console.log(`LASER_TESLA组合技是否激活: ${isLaserTeslaActive}`);
  
  // 3. 测试组合技触发
  console.log('\n3. 测试组合技触发...');
  // 模拟LASER子弹命中敌人的情况
  const targetEnemy: Entity = { 
    x: 100, 
    y: 100, 
    hp: 100, 
    maxHp: 100, 
    type: EntityType.ENEMY,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    color: '#ff0000',
    markedForDeletion: false
  };
  
  const enemies: Entity[] = [
    { 
      x: 100, 
      y: 100, 
      hp: 100, 
      maxHp: 100, 
      type: EntityType.ENEMY,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
      color: '#ff0000',
      markedForDeletion: false
    }, // 被命中的敌人
    { 
      x: 150, 
      y: 150, 
      hp: 100, 
      maxHp: 100, 
      type: EntityType.ENEMY,
      width: 30,
      height: 30,
      vx: 0,
      vy: 0,
      color: '#ff0000',
      markedForDeletion: false
    }  // 附近的敌人
  ];
  
  const player: Entity = { 
    x: 50, 
    y: 50, 
    hp: 100, 
    maxHp: 100, 
    type: EntityType.PLAYER,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    color: '#00ff00',
    markedForDeletion: false
  };
  
  const context = {
    weaponType: WeaponType.LASER,
    bulletX: 100,
    bulletY: 100,
    targetEnemy,
    enemies,
    player,
    eventType: 'hit'
  };
  
  const triggerResults = synergySystem.tryTriggerSynergies(context as any);
  console.log(`触发的组合技数量: ${triggerResults.length}`);
  triggerResults.forEach((result, index) => {
    console.log(`  组合技 ${index + 1}: ${result.type}, 效果: ${result.effect}, 数值: ${result.value}`);
  });
  
  console.log('\n验证完成。');
}

// 运行测试
runTests();