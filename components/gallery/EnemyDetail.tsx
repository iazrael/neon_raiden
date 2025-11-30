import React from 'react';
import { EnemyItem } from './types';
import { EnemyConfig } from '@/game/config/enemies/entities';
import { EnemyCommonConfig } from '@/game/config/enemies/common';

interface EnemyDetailProps {
  enemy: EnemyItem;
}

export const EnemyDetail: React.FC<EnemyDetailProps> = ({ enemy }) => {
  // 获取敌人武器配置
  const weaponConfig = enemy.config.weapon;
  const bulletType = EnemyConfig[enemy.config.type]?.weapon.bulletType || weaponConfig.bulletType;
  
  // 计算精英敌人属性
  const eliteHpMultiplier = EnemyCommonConfig.eliteHpMultiplier;
  const eliteDamageMultiplier = EnemyCommonConfig.eliteDamageMultiplier;
  const eliteFireRateMultiplier = EnemyCommonConfig.eliteFireRateMultiplier;
  
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BASE HP</span>
        <span className="text-red-300 font-semibold">{enemy.config.baseHp}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">HP/LV</span>
        <span className="text-red-300 font-semibold">+{enemy.config.hpPerLevel}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BASE SPD</span>
        <span className="text-cyan-300 font-semibold">{enemy.config.baseSpeed}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SPD/LV</span>
        <span className="text-cyan-300 font-semibold">+{enemy.config.speedPerLevel}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SIZE</span>
        <span className="text-gray-300 font-semibold">{enemy.config.size.width}×{enemy.config.size.height}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SCORE</span>
        <span className="text-green-300 font-semibold">{enemy.config.score}</span>
      </div>
      {/* <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BULLET TYPE</span>
        <span className="text-yellow-300 font-semibold">{bulletType}</span>
      </div> */}
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">FIRE RATE</span>
        <span className="text-cyan-300 font-semibold">{(weaponConfig.frequency || 0).toFixed(3)}</span>
      </div>
    </div>
  );
};