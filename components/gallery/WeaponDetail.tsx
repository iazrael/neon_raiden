import React from 'react';
import { WeaponItem } from './types';

interface WeaponDetailProps {
  weapon: WeaponItem;
}

export const WeaponDetail: React.FC<WeaponDetailProps> = ({ weapon }) => {
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
    </div>
  );
};