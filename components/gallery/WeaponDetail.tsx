import React from 'react';
import { WeaponItem } from './types';
import { calculateDPS, getDPSByLevel } from '@/game/utils/dpsCalculator';

interface WeaponDetailProps {
  weapon: WeaponItem;
}

export const WeaponDetail: React.FC<WeaponDetailProps> = ({ weapon }) => {
  // 计算当前等级（假设为最大等级9）的DPS
  const currentDPS = calculateDPS(weapon.config, 9);
  
  // 获取各级别的DPS值用于显示
  const dpsByLevel = getDPSByLevel(weapon.config);
  
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BASE DMG</span>
        <span className="text-yellow-300 font-semibold">{weapon.config.baseDamage}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">DMG/LV</span>
        <span className="text-yellow-300 font-semibold">+{weapon.config.damagePerLevel}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BULLET SPD</span>
        <span className="text-cyan-300 font-semibold">{weapon.config.speed}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">FIRE RATE</span>
        <span className="text-cyan-300 font-semibold">{weapon.config.baseFireRate}ms</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">RATE/LV</span>
        <span className="text-cyan-300 font-semibold">-{weapon.config.ratePerLevel}ms</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SIZE</span>
        <span className="text-gray-300 font-semibold">{weapon.config.bullet.size.width}×{weapon.config.bullet.size.height}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2 col-span-2">
        <span className="text-gray-500 text-xs">DPS (LV.9)</span>
        <span className="text-green-400 font-semibold">{currentDPS}</span>
      </div>
      <div className="col-span-2 mt-2">
        <div className="text-gray-500 text-xs mb-1">DPS BY LEVEL</div>
        <div className="flex justify-between text-xs">
          {Object.entries(dpsByLevel).map(([level, dps]) => (
            <div key={level} className="flex flex-col items-center">
              <span className="text-gray-400">LV.{level}</span>
              <span className="text-green-400 font-semibold">{dps}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};