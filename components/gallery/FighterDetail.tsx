import React from 'react';
import { FighterItem } from './types';

interface FighterDetailProps {
  fighter: FighterItem;
}

export const FighterDetail: React.FC<FighterDetailProps> = ({ fighter }) => {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">INITIAL HP</span>
        <span className="text-cyan-300 font-semibold">{fighter.config.initialHp}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">MAX HP</span>
        <span className="text-cyan-300 font-semibold">{fighter.config.maxHp}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SPEED</span>
        <span className="text-green-300 font-semibold">{fighter.config.speed}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">INITIAL BOMBS</span>
        <span className="text-yellow-300 font-semibold">{fighter.config.initialBombs}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">MAX BOMBS</span>
        <span className="text-yellow-300 font-semibold">{fighter.config.maxBombs}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">MAX SHIELD</span>
        <span className="text-blue-300 font-semibold">{fighter.config.maxShield}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">WIDTH</span>
        <span className="text-gray-300 font-semibold">{fighter.config.size.width}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">HEIGHT</span>
        <span className="text-gray-300 font-semibold">{fighter.config.size.height}</span>
      </div>
    </div>
  );
};