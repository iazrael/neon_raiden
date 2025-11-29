import React from 'react';
import { FighterItem } from './types';

interface FighterDetailProps {
  fighter: FighterItem;
}

export const FighterDetail: React.FC<FighterDetailProps> = ({ fighter }) => {
  const leveling = fighter.config.leveling;
  const maxLevel = leveling.maxLevel ?? fighter.config.initialLevel;
  const levelsGained = Math.max(0, maxLevel - fighter.config.initialLevel);
  const maxHpFinal = fighter.config.maxHp + (leveling.bonusesPerLevel.maxHpFlat ?? 0) * levelsGained;
  const maxShieldFinal = fighter.config.maxShield + (leveling.bonusesPerLevel.maxShieldFlat ?? 0) * levelsGained;
  const defensePctFinal = (leveling.bonusesPerLevel.defensePct ?? 0) * levelsGained;
  const fireRatePctFinal = (leveling.bonusesPerLevel.fireRatePct ?? 0) * levelsGained;
  const damagePctFinal = (leveling.bonusesPerLevel.damagePct ?? 0) * levelsGained;
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">LEVEL</span>
        <span className="text-gray-300 font-semibold">{fighter.config.initialLevel}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">MAX LEVEL</span>
        <span className="text-cyan-300 font-semibold">{maxLevel}</span>
      </div>

      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">HP</span>
        <span className="text-cyan-300 font-semibold">{fighter.config.maxHp}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">HP (MAX)</span>
        <span className="text-cyan-300 font-semibold">{maxHpFinal}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SHIELD</span>
        <span className="text-blue-300 font-semibold">{fighter.config.maxShield}</span>
      </div>

      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SPEED</span>
        <span className="text-green-300 font-semibold">{fighter.config.speed}</span>
      </div>

      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">WIDTH</span>
        <span className="text-gray-300 font-semibold">{fighter.config.size.width}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">HEIGHT</span>
        <span className="text-gray-300 font-semibold">{fighter.config.size.height}</span>
      </div>

      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BOMBS</span>
        <span className="text-yellow-300 font-semibold">{fighter.config.initialBombs}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BOMBS (MAX)</span>
        <span className="text-yellow-300 font-semibold">{fighter.config.maxBombs}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SHIELD (MAX)</span>
        <span className="text-blue-300 font-semibold">{maxShieldFinal}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">DEFENSE (MAX)</span>
        <span className="text-green-300 font-semibold">{defensePctFinal}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">FIRE RATE (MAX)</span>
        <span className="text-yellow-300 font-semibold">{fireRatePctFinal}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">DAMAGE (MAX)</span>
        <span className="text-red-300 font-semibold">{damagePctFinal}%</span>
      </div>
    </div>
  );
};
