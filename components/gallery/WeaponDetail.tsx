import React from 'react';
import { WeaponItem } from './types';
import { calculateDPS, getDPSByLevel } from '@/game/utils/dpsCalculator';
import { SYNERGY_CONFIGS, SynergyType } from '@/game/systems-deprecated/WeaponSynergySystem';
import { WeaponConfig } from '@/game/config';

interface WeaponDetailProps {
  weapon: WeaponItem;
}

export const WeaponDetail: React.FC<WeaponDetailProps> = ({ weapon }) => {
  // 计算1级和满级(9级)的DPS
  const dpsLv1 = calculateDPS(weapon.config, 1);
  const dpsLvMax = calculateDPS(weapon.config, 9);

  // 获取各级别的DPS值用于显示
  const dpsByLevel = getDPSByLevel(weapon.config);

  // 获取该武器的组合技信息
  const getSynergiesForWeapon = () => {
    const synergies: Array<{ partnerWeapon: string; effect: string, name: string }> = [];

    Object.values(SYNERGY_CONFIGS).forEach(config => {
      if (config.requiredWeapons.includes(weapon.type)) {
        // 找到组合的另一个武器
        const partnerWeaponType = config.requiredWeapons.find(w => w !== weapon.type);
        if (partnerWeaponType) {
          const partnerWeapon = WeaponConfig[partnerWeaponType];
          
          synergies.push({
            partnerWeapon: partnerWeapon.chineseName,
            name: config.chineseName,
            effect: config.description
          });
        }
      }
    });

    return synergies;
  };

  const synergies = getSynergiesForWeapon();

  return (
    <>
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
          <span className="text-gray-500 text-xs">BULLET SIZE</span>
          <span className="text-gray-300 font-semibold">{weapon.config.bullet.size.width}×{weapon.config.bullet.size.height}</span>
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

      {/* 组合技信息 */}
      {synergies.length > 0 && (
        <div className="mt-4 pt-4 border-t border-cyan-500/30">
          <h4 className="text-cyan-400 font-bold text-sm mb-3 tracking-wider">武器协同</h4>
          <div className="space-y-4">
            {synergies.map((synergy, index) => (
              <div key={index} className="pb-3 border-b border-gray-800 last:border-0 last:pb-0">
                {/* 组合技名称 */}
                <div className="mb-2">
                  <div className="inline-block border-2 border-orange-500/70 rounded-lg px-2 py-1">
                    <span className="text-orange-400 font-bold text-base">{synergy.name}</span>
                  </div>
                </div>
                
                {/* 武器组合 */}
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-xs">
                    {weapon.config.chineseName}
                  </div>
                  <span className="text-orange-400/70 text-sm">×</span>
                  <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-300 text-xs">
                    {synergy.partnerWeapon}
                  </div>
                </div>
                      
                {/* 效果说明 */}
                <div className="text-gray-300 text-xs">
                  {synergy.effect}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};