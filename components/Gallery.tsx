import React, { useState, useEffect } from 'react';
import {  ClickType } from '@/types';
import { WeaponConfig, EnemyConfig, BossConfig, PlayerConfig, ASSETS_BASE_PATH } from '@/game/config';
import { isWeaponUnlocked, isEnemyUnlocked, isBossUnlocked } from '@/game/unlockedItems';
import { Tabs } from './gallery/Tabs';
import { ItemList } from './gallery/ItemList';
import { ItemDetailPanel } from './gallery/ItemDetailPanel';
import { FighterItem, WeaponItem, EnemyItem, BossItem } from './gallery/types';


interface GalleryProps {
    onClose: () => void;
    maxLevelReached: number;
    playClick?: (type?: ClickType) => void;
}

type Tab = 'FIGHTERS' | 'ARMORY' | 'BESTIARY' | 'BOSSES';

export const Gallery: React.FC<GalleryProps> = ({ onClose, maxLevelReached, playClick }) => {
  const [activeTab, setActiveTab] = useState<Tab>('FIGHTERS');
  const [selectedItem, setSelectedItem] = useState<FighterItem | WeaponItem | EnemyItem | BossItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Add scrollbar hiding styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.3);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.5);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const getSpriteSrc = (item: any, tab: Tab): string => {
    if (tab === 'FIGHTERS') return `${ASSETS_BASE_PATH}fighters/${item.config.sprite}.svg`;
    if (tab === 'ARMORY') return `${ASSETS_BASE_PATH}bullets/${item.config.sprite}.svg`;
    if (tab === 'BESTIARY') return `${ASSETS_BASE_PATH}enemies/${item.config.sprite}.svg`;
    if (tab === 'BOSSES') return `${ASSETS_BASE_PATH}bosses/${item.config.sprite}.svg`;
    return '';
  };

  // Data Sources
  const fighters: FighterItem[] = [
    {
      name: PlayerConfig.name,
      chineseName: PlayerConfig.chineseName,
      chineseDescription: PlayerConfig.describe,
      config: PlayerConfig
    }
  ];

  const weapons: WeaponItem[] = Object.values(WeaponConfig).map((config) => ({
    type: config.type,
    name: config.name,
    chineseName: config.chineseName,
    chineseDescription: config.describe,
    config,
    isUnlocked: isWeaponUnlocked(config.type)
  }));

  const enemies: EnemyItem[] = Object.values(EnemyConfig).map((config) => ({
    type: config.type,
    name: config.name,
    chineseName: config.chineseName,
    chineseDescription: config.describe,
    config,
    isUnlocked: isEnemyUnlocked(config.type)
  }));

  const bosses: BossItem[] = Object.values(BossConfig).map((config) => ({
    name: config.name,
    chineseName: config.chineseName,
    chineseDescription: config.describe,
    level: config.level,
    config,
    isUnlocked: isBossUnlocked(config.level),
    weapons: config.weapons || [],
    wingmenCount: config.wingmen ? config.wingmen.count : 0,
    wingmenType: config.wingmen ? config.wingmen.type : ''
  }));

  // Auto-select first unlocked item when tab changes (but don't show detail)
  useEffect(() => {
    setShowDetail(false);
    if (activeTab === 'FIGHTERS') {
      setSelectedItem(fighters[0] || null);
    } else if (activeTab === 'ARMORY') {
      // Try to select first unlocked weapon, otherwise first locked weapon
      const unlockedWeapon = weapons.find(w => w.isUnlocked);
      setSelectedItem(unlockedWeapon || weapons[0] || null);
    } else if (activeTab === 'BESTIARY') {
      // Try to select first unlocked enemy, otherwise first locked enemy
      const unlockedEnemy = enemies.find(e => e.isUnlocked);
      setSelectedItem(unlockedEnemy || enemies[0] || null);
    } else if (activeTab === 'BOSSES') {
      // Try to select first unlocked boss, otherwise first locked boss
      const unlockedBoss = bosses.find(b => b.isUnlocked);
      setSelectedItem(unlockedBoss || bosses[0] || null);
    }
  }, [activeTab]);

  // Handle item selection
  const handleItemSelect = (item: FighterItem | WeaponItem | EnemyItem | BossItem) => {
    playClick?.(ClickType.DEFAULT);
    setSelectedItem(item);
    setShowDetail(true);
  };

  // Handle detail close
  const handleDetailClose = () => {
    playClick?.(ClickType.CANCEL);
    setShowDetail(false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 text-white flex flex-col font-mono backdrop-blur-xl pointer-events-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-800 flex justify-between items-center bg-black/50 flex-shrink-0">
        <h2 className="text-lg sm:text-2xl font-bold text-cyan-400 tracking-widest flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          <span className="text-2xl sm:text-3xl flex-shrink-0">❖</span> <span className="truncate">LIBRARY</span>
        </h2>
        <button onClick={() => {
          playClick?.(ClickType.CANCEL);
          onClose();
        }} className="ml-2 px-3 py-2 text-xs sm:text-sm border border-red-500/50 text-red-400 hover:bg-red-900/20 rounded transition-colors flex-shrink-0">
          CLOSE
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0 flex-col sm:flex-row">
        {/* Tabs Navigation */}
        <Tabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          playClick={playClick} 
        />

        {/* Main Content Area - 手机竖屏上下布局，桌面左右布局 */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-w-0 relative">
          {/* List View - 全屏显示 */}
          <ItemList
            activeTab={activeTab}
            fighters={fighters}
            weapons={weapons}
            enemies={enemies}
            bosses={bosses}
            selectedItem={selectedItem}
            onSelectItem={handleItemSelect}
            playClick={playClick}
          />

          {/* Detail Overlay - 浮动详情页 */}
          <ItemDetailPanel
            activeTab={activeTab}
            selectedItem={selectedItem}
            showDetail={showDetail}
            onClose={handleDetailClose}
            playClick={playClick}
            getSpriteSrc={getSpriteSrc}
          />
        </div>
      </div>
    </div>
  );
};
