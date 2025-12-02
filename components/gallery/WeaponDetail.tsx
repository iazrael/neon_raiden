import React from 'react';
import { WeaponItem } from './types';
import { calculateDPS, getDPSByLevel } from '@/game/utils/dpsCalculator';
import { SYNERGY_CONFIGS, SynergyType } from '@/game/systems/WeaponSynergySystem';
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
    const synergies: Array<{ partnerWeapon: string; effect: string }> = [];

    Object.values(SYNERGY_CONFIGS).forEach(config => {
      if (config.requiredWeapons.includes(weapon.type)) {
        // 找到组合的另一个武器
        const partnerWeaponType = config.requiredWeapons.find(w => w !== weapon.type);
        if (partnerWeaponType) {
          const partnerWeapon = WeaponConfig[partnerWeaponType];
          synergies.push({
            partnerWeapon: partnerWeapon.chineseName,
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
          <h4 className="text-cyan-400 font-bold text-sm mb-3 tracking-wider">组合技</h4>
          <div className="space-y-2">
            {synergies.map((synergy, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 flex-shrink-0">+</span>
                  <div className="flex-1">
                    <span className="text-cyan-300 font-semibold">{synergy.partnerWeapon}</span>
                    <span className="text-gray-400">: </span>
                    <span className="text-gray-300">{synergy.effect}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};