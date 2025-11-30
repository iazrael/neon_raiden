import React from 'react';
import { WeaponItem } from './types';
import { calculateDPS, getDPSByLevel } from '@/game/utils/dpsCalculator';

interface WeaponDetailProps {
  weapon: WeaponItem;
}

export const WeaponDetail: React.FC<WeaponDetailProps> = ({ weapon }) => {
  // 计算1级和满级(9级)的DPS
  const dpsLv1 = calculateDPS(weapon.config, 1);
  const dpsLvMax = calculateDPS(weapon.config, 9);
  
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
        <span className="text-gray-500 text-xs">BULLET WIDTH</span>
        <span className="text-gray-300 font-semibold">{weapon.config.bullet.size.width}px</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BULLET HEIGHT</span>
        <span className="text-gray-300 font-semibold">{weapon.config.bullet.size.height}px</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2 col-span-2">
        <span className="text-gray-500 text-xs">DPS (LV.1 / LV.max)</span>
        <div className="flex items-center gap-2">
          <span className="text-green-300 font-semibold">{dpsLv1}</span>
          <span className="text-gray-600">→</span>
          <span className="text-green-400 font-semibold">{dpsLvMax}</span>
        </div>
      </div>
    </div>
  );
};