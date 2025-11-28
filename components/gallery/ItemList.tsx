import React from 'react';
import { ClickType } from '@/types';
import { FighterItem, WeaponItem, EnemyItem, BossItem } from './types';
import { FighterListItem } from './FighterListItem';
import { WeaponListItem } from './WeaponListItem';
import { EnemyListItem } from './EnemyListItem';
import { BossListItem } from './BossListItem';

type Tab = 'FIGHTERS' | 'ARMORY' | 'BESTIARY' | 'BOSSES';

interface ItemListProps {
  activeTab: Tab;
  fighters: FighterItem[];
  weapons: WeaponItem[];
  enemies: EnemyItem[];
  bosses: BossItem[];
  selectedItem: FighterItem | WeaponItem | EnemyItem | BossItem | null;
  onSelectItem: (item: FighterItem | WeaponItem | EnemyItem | BossItem) => void;
  playClick?: (type?: ClickType) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  activeTab,
  fighters,
  weapons,
  enemies,
  bosses,
  selectedItem,
  onSelectItem,
  playClick
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'FIGHTERS':
        return (
          <div className="grid grid-cols-1 gap-4">
            {fighters.map((fighter, i) => (
              <FighterListItem
                key={i}
                fighter={fighter}
                isSelected={selectedItem === fighter}
                onSelect={() => {
                  playClick?.(ClickType.DEFAULT);
                  onSelectItem(fighter);
                }}
              />
            ))}
          </div>
        );
      case 'ARMORY':
        return (
          <div className="grid grid-cols-2 gap-3 sm:gap-3">
            {weapons.map((weapon) => (
              <WeaponListItem
                key={weapon.type}
                weapon={weapon}
                isSelected={selectedItem === weapon}
                onSelect={() => {
                  if (weapon.isUnlocked) {
                    playClick?.(ClickType.DEFAULT);
                    onSelectItem(weapon);
                  }
                }}
              />
            ))}
          </div>
        );
      case 'BESTIARY':
        return (
          <div className="grid grid-cols-2 gap-3 sm:gap-3">
            {enemies.map((enemy) => (
              <EnemyListItem
                key={enemy.type}
                enemy={enemy}
                isSelected={selectedItem === enemy}
                onSelect={() => {
                  if (enemy.isUnlocked) {
                    playClick?.(ClickType.DEFAULT);
                    onSelectItem(enemy);
                  }
                }}
              />
            ))}
          </div>
        );
      case 'BOSSES':
        return (
          <div className="grid grid-cols-1 gap-4">
            {bosses.map((boss) => (
              <BossListItem
                key={boss.level}
                boss={boss}
                isSelected={selectedItem === boss}
                onSelect={() => {
                  if (boss.isUnlocked) {
                    playClick?.(ClickType.DEFAULT);
                    onSelectItem(boss);
                  }
                }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-4 overflow-y-auto bg-black/20 custom-scrollbar pointer-events-auto">
      {renderContent()}
    </div>
  );
};