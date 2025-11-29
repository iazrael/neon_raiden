import React from 'react';
import { FighterItem } from './types';

interface FighterListItemProps {
  fighter: FighterItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const FighterListItem: React.FC<FighterListItemProps> = ({ fighter, isSelected, onSelect }) => {
  return (
    <div
      className={`p-3 sm:p-2 border-2 rounded-lg active:scale-98 cursor-pointer pointer-events-auto select-none transition-all min-h-[72px] flex items-center shadow-lg ${
        isSelected 
          ? 'border-cyan-400 bg-cyan-800/60 shadow-cyan-500/50' 
          : 'border-cyan-500/30 bg-cyan-900/20 hover:bg-cyan-800/40 hover:border-cyan-400/50'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="font-bold text-cyan-300 text-lg sm:text-base">{fighter.name}</div>
    </div>
  );
};
