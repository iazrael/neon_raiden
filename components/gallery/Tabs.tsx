import React from 'react';
import { ClickType } from '@/types';

type Tab = 'FIGHTERS' | 'ARMORY' | 'BESTIARY' | 'BOSSES';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  playClick?: (type?: ClickType) => void;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, playClick }) => {
  const tabs: Tab[] = ['FIGHTERS', 'ARMORY', 'BESTIARY', 'BOSSES'];

  return (
    <>
      {/* Mobile Tab Navigation - 显示在顶部，sticky固定 */}
      <div className="sm:hidden sticky top-0 z-40 w-full">
        <div className="flex border-b border-gray-800 bg-gray-900/95 backdrop-blur-md flex-shrink-0 overflow-x-auto scrollbar-hide shadow-lg w-full">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => {
                playClick?.(ClickType.MENU);
                setActiveTab(tab);
              }}
              className={`flex-1 min-w-[90px] py-4 px-3 text-sm text-center border-b-2 transition-all whitespace-nowrap font-bold active:scale-95 ${activeTab === tab
                ? 'border-cyan-400 bg-cyan-900/40 text-cyan-100'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Navigation - 仅桌面显示 */}
      <div className="hidden sm:flex w-40 lg:w-48 border-r border-gray-800 flex-col bg-gray-900/20 flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => {
              playClick?.(ClickType.MENU);
              setActiveTab(tab);
            }}
            className={`p-4 text-sm lg:text-base text-left border-l-4 transition-all font-bold ${activeTab === tab
              ? 'border-cyan-400 bg-cyan-900/30 text-cyan-100'
              : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </>
  );
};