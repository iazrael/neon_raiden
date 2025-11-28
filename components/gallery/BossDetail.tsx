import React from 'react';
import { BossItem, EnemyItem } from './types';
import { EnemyConfig, BossWeaponConfig } from '@/game/config';
import { BossWeaponType } from '@/types';

interface BossDetailProps {
  boss: BossItem;
}

export const BossDetail: React.FC<BossDetailProps> = ({ boss }) => {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">HP</span>
        <span className="text-purple-300 font-semibold">{boss.config.hp}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SPEED</span>
        <span className="text-cyan-300 font-semibold">{boss.config.speed}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BULLET CNT</span>
        <span className="text-yellow-300 font-semibold">{boss.config.weaponConfigs.bulletCount}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">BULLET SPD</span>
        <span className="text-yellow-300 font-semibold">{boss.config.weaponConfigs.bulletSpeed}</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">FIRE RATE</span>
        <span className="text-yellow-300 font-semibold">{(boss.config.weaponConfigs.fireRate * 100).toFixed(1)}%</span>
      </div>
      <div className="flex justify-between border-b border-gray-800 py-2">
        <span className="text-gray-500 text-xs">SCORE</span>
        <span className="text-green-300 font-semibold">{boss.config.score}</span>
      </div>
      
      {boss.config.laser && boss.config.laser.type !== 'none' && (
        <>
          <div className="flex justify-between border-b border-gray-800 py-2">
            <span className="text-gray-500 text-xs">LASER DMG</span>
            <span className="text-red-300 font-semibold">{boss.config.laser.damage}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 py-2">
            <span className="text-gray-500 text-xs">LASER CD</span>
            <span className="text-red-300 font-semibold">{boss.config.laser.cooldown}ms</span>
          </div>
        </>
      )}
      
      {/* Weapons Display */}
      {boss.weapons && boss.weapons.length > 0 && (
        <div className="col-span-2 border-b border-gray-800 py-2 mt-2 mb-2">
          <span className="text-gray-500 text-xs uppercase">WEAPONS</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {boss.weapons.map((weapon: BossWeaponType, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-300 text-xs">
                {BossWeaponConfig[weapon]?.name || weapon}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Wingmen Display */}
      {boss.wingmenCount > 0 && (
        <div className="col-span-2 border-b border-gray-800 py-2">
          <span className="text-gray-500 text-xs uppercase">WINGMENS</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-blue-300 font-semibold">
              {EnemyConfig[boss.wingmenType as keyof typeof EnemyConfig]?.name || boss.wingmenType} × {boss.wingmenCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};