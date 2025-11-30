import React from 'react';
import { WeaponItem } from './types';
import { calculateDPS } from '@/game/utils/dpsCalculator';

interface WeaponListItemProps {
  weapon: WeaponItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const WeaponListItem: React.FC<WeaponListItemProps> = ({ weapon, isSelected, onSelect }) => {
  const isLocked = !weapon.isUnlocked;

  return (
    <div
      className={`p-3 sm:p-2 border-2 rounded-lg active:scale-98 cursor-pointer transition-all pointer-events-auto select-none min-h-[72px] flex flex-col justify-center shadow-md ${
        isLocked
          ? 'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
          : isSelected
            ? 'border-yellow-500 bg-yellow-900/40 text-yellow-100 shadow-yellow-500/30'
            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/40 hover:border-cyan-400/50'
      }`}
      onClick={() => !isLocked && onSelect()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isLocked) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="font-bold text-base sm:text-sm">{isLocked ? '???' : weapon.chineseName || weapon.name}</div>
      <div className="text-xs opacity-70 mt-1.5">
        {isLocked ? `Pick up this weapon to unlock` : `DPS: ${calculateDPS(weapon.config, 1)}`}
      </div>
    </div>
  );
};
