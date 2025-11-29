import React from 'react';
import { EnemyItem } from './types';

interface EnemyListItemProps {
  enemy: EnemyItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const EnemyListItem: React.FC<EnemyListItemProps> = ({ enemy, isSelected, onSelect }) => {
  const isLocked = !enemy.isUnlocked;

  return (
    <div
      className={`p-3 sm:p-2 border-2 rounded-lg active:scale-98 cursor-pointer transition-all pointer-events-auto select-none min-h-[72px] flex flex-col justify-center shadow-md ${
        isLocked
          ? 'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
          : isSelected
            ? 'border-red-500 bg-red-900/40 text-red-100 shadow-red-500/30'
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
      <div className="font-bold text-base sm:text-sm">{isLocked ? '???' : enemy.name}</div>
      <div className="text-xs opacity-70 mt-1.5">
        {isLocked ? `Defeat this enemy to unlock` : `HP: ${enemy.config.baseHp}`}
      </div>
    </div>
  );
};
