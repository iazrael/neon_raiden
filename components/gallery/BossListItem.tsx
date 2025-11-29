import React from 'react';
import { BossItem } from './types';

interface BossListItemProps {
  boss: BossItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const BossListItem: React.FC<BossListItemProps> = ({ boss, isSelected, onSelect }) => {
  const isLocked = !boss.isUnlocked;

  return (
    <div
      className={`p-3 sm:p-2 border-2 rounded-lg active:scale-98 cursor-pointer transition-all pointer-events-auto select-none min-h-[80px] flex flex-col justify-center shadow-lg ${
        isLocked
          ? 'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
          : isSelected
            ? 'border-purple-500 bg-purple-900/40 text-purple-100 shadow-purple-500/30'
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
      <div className="flex justify-between items-center">
        <div className="font-bold text-base sm:text-sm">{isLocked ? '???' : boss.name}</div>
        <div className="text-sm font-mono px-2 py-0.5 bg-purple-500/20 rounded">LV.{boss.level}</div>
      </div>
      <div className="text-xs opacity-70 mt-2">
        {isLocked ? `Defeat this Boss to unlock` : `HP: ${boss.config.hp}`}
      </div>
    </div>
  );
};
