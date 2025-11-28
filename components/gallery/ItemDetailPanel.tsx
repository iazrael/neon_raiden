import React from 'react';
import { ClickType } from '@/types';
import { FighterItem, WeaponItem, EnemyItem, BossItem } from './types';
import { FighterDetail } from './FighterDetail';
import { WeaponDetail } from './WeaponDetail';
import { EnemyDetail } from './EnemyDetail';
import { BossDetail } from './BossDetail';
import { CachedImage } from './CachedImage';

type Tab = 'FIGHTERS' | 'ARMORY' | 'BESTIARY' | 'BOSSES';

interface ItemDetailPanelProps {
  activeTab: Tab;
  selectedItem: FighterItem | WeaponItem | EnemyItem | BossItem | null;
  showDetail: boolean;
  onClose: () => void;
  playClick?: (type?: ClickType) => void;
  getSpriteSrc: (item: any, tab: Tab) => string;
}

export const ItemDetailPanel: React.FC<ItemDetailPanelProps> = ({
  activeTab,
  selectedItem,
  showDetail,
  onClose,
  playClick,
  getSpriteSrc
}) => {
  if (!showDetail || !selectedItem) {
    return null;
  }

  const handleDetailClose = () => {
    playClick?.(ClickType.CANCEL);
    onClose();
  };

  const renderDetailComponent = () => {
    switch (activeTab) {
      case 'FIGHTERS':
        return <FighterDetail fighter={selectedItem as FighterItem} />;
      case 'ARMORY':
        return <WeaponDetail weapon={selectedItem as WeaponItem} />;
      case 'BESTIARY':
        return <EnemyDetail enemy={selectedItem as EnemyItem} />;
      case 'BOSSES':
        return <BossDetail boss={selectedItem as BossItem} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed sm:absolute inset-0 bg-black/60 backdrop-blur-sm z-40 pointer-events-auto"
        onClick={handleDetailClose}
      />

      {/* Detail View - 从底部/右侧滑出 */}
      <div className={`
        fixed sm:absolute
        bottom-0 sm:bottom-auto sm:right-0 sm:top-0
        left-0 sm:left-auto
        w-full sm:w-[400px] lg:w-[480px]
        h-[75vh] sm:h-full
        bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black
        border-t-2 sm:border-t-0 sm:border-l-2 border-cyan-500/40
        shadow-2xl shadow-cyan-500/20
        z-50
        overflow-y-auto custom-scrollbar
        pointer-events-auto
        animate-slideUp sm:animate-slideLeft
        rounded-t-2xl sm:rounded-t-none
      `}>
        {/* 关闭按钮 */}
        <button
          onClick={handleDetailClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all active:scale-95"
        >
          <span className="text-xl">×</span>
        </button>

        <div className="p-6 sm:p-8 flex flex-col items-center">
          <div className="w-32 h-32 sm:w-40 sm:h-40 border border-cyan-500/20 rounded-full flex items-center justify-center bg-black/50 mb-6 relative group flex-shrink-0">
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border border-cyan-500/10 animate-[spin_15s_linear_infinite_reverse]"></div>
            <CachedImage
              src={getSpriteSrc(selectedItem, activeTab)}
              alt={selectedItem.name}
              className="relative z-10 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-110 transition-transform duration-500 w-28 h-28 sm:w-32 object-contain"
            />
          </div>

          <div className="w-full space-y-4 text-sm sm:text-base">
            <div className="border-b border-cyan-500/30 pb-3">
              <h3 className="text-2xl sm:text-3xl font-bold text-cyan-100">{selectedItem.chineseName || selectedItem.name || 'Unknown'}</h3>
              <p className="text-lg font-bold text-cyan-300">{selectedItem.name || ''}</p>
              <div className="text-cyan-500 text-sm tracking-widest uppercase opacity-70 mt-1">
                {activeTab === 'BOSSES' ? `Threat Level: ${(selectedItem as BossItem).level}` : activeTab}
              </div>
            </div>

            {renderDetailComponent()}

            {selectedItem.chineseDescription && (
              <p className="text-cyan-300 italic text-base mt-2 border-l-2 border-cyan-500/50 pl-4 leading-relaxed">
                {selectedItem.chineseDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
