import React, { useState, useEffect } from 'react';
import { AssetsLoader } from '@/game/AssetsLoader';
import { WeaponType } from '@/types';
import { WeaponConfig, EnemyConfig, BossConfig, BossName, EnemyType, PlayerConfig, ASSETS_BASE_PATH, BossWeaponNames, WingmenNames } from '@/game/config';
import { isWeaponUnlocked, isEnemyUnlocked, isBossUnlocked } from '@/game/unlockedItems';

interface GalleryProps {
    onClose: () => void;
    maxLevelReached: number;
    playClick?: (type?: 'default' | 'confirm' | 'cancel' | 'menu') => void;
}

type Tab = 'FIGHTERS' | 'ARMORY' | 'BESTIARY' | 'BOSSES';

// Helper component to render cached images
const CachedImage: React.FC<{ src: string; alt: string; className: string }> = ({ src, alt, className }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!containerRef.current) return;

        const cached = AssetsLoader.getAsset(src);
        let img: HTMLImageElement;

        if (cached) {
            img = cached.cloneNode(true) as HTMLImageElement;
        } else {
            img = new Image();
            img.src = src;
        }

        img.alt = alt;
        img.className = className;

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(img);
    }, [src, alt, className]);

    return <div ref={containerRef} className="contents" />;
};

export const Gallery: React.FC<GalleryProps> = ({ onClose, maxLevelReached, playClick }) => {
    const [activeTab, setActiveTab] = useState<Tab>('FIGHTERS');
    const [selectedItem, setSelectedItem] = useState<any>(null);
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
        if (tab === 'FIGHTERS') return `${ASSETS_BASE_PATH}fighters/player.svg`;
        if (tab === 'ARMORY') {
            const config = WeaponConfig[item.type as WeaponType];
            if (config) {
                // Map weapon type to bullet SVG
                return `${ASSETS_BASE_PATH}bullets/${config.sprite}.svg`;
            }
        }
        if (tab === 'BESTIARY') return `${ASSETS_BASE_PATH}enemies/enemy_${item.type}.svg`;
        if (tab === 'BOSSES') return `${ASSETS_BASE_PATH}bosses/boss_${item.level}.svg`;
        return '';
    };



    // Data Sources
    const fighters = [
        {
            name: 'Neon Raiden',
            chineseName: PlayerConfig.chineseName,
            description: 'Advanced prototype fighter with adaptable weapon systems.',
            chineseDescription: PlayerConfig.chineseDescription,
            config: PlayerConfig
        }
    ];

    const weapons = Object.entries(WeaponConfig).map(([type, config]) => ({
        type: parseInt(type),
        name: WeaponType[parseInt(type)],
        chineseName: config.chineseName || WeaponType[parseInt(type)],
        description: `Base Damage: ${config.baseDamage}`,
        chineseDescription: config.chineseDescription || '',
        config,
        isUnlocked: isWeaponUnlocked(parseInt(type) as WeaponType)
    }));

    const enemies = Object.entries(EnemyConfig.types).map(([type, config]) => ({
        type: parseInt(type),
        name: EnemyType[parseInt(type)],
        chineseName: config.chineseName || EnemyType[parseInt(type)],
        description: `Base HP: ${config.baseHp}`,
        chineseDescription: config.chineseDescription || '',
        config,
        isUnlocked: isEnemyUnlocked(parseInt(type) as EnemyType)
    }));

    const bosses = Object.values(BossConfig).map((config) => ({
        name: Object.keys(BossName)[config.level - 1], // Rough mapping
        chineseName: config.chineseName || Object.keys(BossName)[config.level - 1],
        description: `HP: ${config.hp}`,
        chineseDescription: config.chineseDescription || '',
        level: config.level,
        config,
        isUnlocked: isBossUnlocked(config.level),
        weapons: config.weapons || [],
        wingmenCount: config.wingmenCount || 0,
        wingmenType: config.wingmenType || 0
    }));

    const renderContent = () => {
        switch (activeTab) {
            case 'FIGHTERS':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        {fighters.map((f, i) => (
                            <div key={i}
                                className={`p-5 sm:p-4 border-2 rounded-lg active:scale-98 cursor-pointer pointer-events-auto select-none transition-all min-h-[80px] flex items-center shadow-lg ${selectedItem === f ? 'border-cyan-400 bg-cyan-800/60 shadow-cyan-500/50' : 'border-cyan-500/30 bg-cyan-900/20 hover:bg-cyan-800/40 hover:border-cyan-400/50'}`}
                                onClick={() => handleItemSelect(f)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedItem(f);
                                    }
                                }}
                            >
                                <div className="font-bold text-cyan-300 text-lg sm:text-base">{f.name}</div>
                            </div>
                        ))}
                    </div>
                );
            case 'ARMORY':
                return (
                    <div className="grid grid-cols-2 gap-3 sm:gap-3">
                        {weapons.map((w) => {
                            const isLocked = !w.isUnlocked;
                            return (
                                <div key={w.type}
                                    className={`p-4 sm:p-3 border-2 rounded-lg active:scale-98 cursor-pointer transition-all pointer-events-auto select-none min-h-[90px] flex flex-col justify-center shadow-md ${isLocked
                                        ? 'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
                                        : selectedItem === w
                                            ? 'border-yellow-500 bg-yellow-900/40 text-yellow-100 shadow-yellow-500/30'
                                            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/40 hover:border-cyan-400/50'
                                        }`}
                                    onClick={() => !isLocked && handleItemSelect(w)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ') && !isLocked) {
                                            e.preventDefault();
                                            setSelectedItem(w);
                                        }
                                    }}
                                >
                                    <div className="font-bold text-base sm:text-sm">{isLocked ? '???' : w.name}</div>
                                    <div className="text-xs opacity-70 mt-1.5">{isLocked ? `Pick up this weapon to unlock` : `DMG: ${w.config.baseDamage}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'BESTIARY':
                return (
                    <div className="grid grid-cols-2 gap-3 sm:gap-3">
                        {enemies.map((e) => {
                            const isLocked = !e.isUnlocked;
                            return (
                                <div key={e.type}
                                    className={`p-4 sm:p-3 border-2 rounded-lg active:scale-98 cursor-pointer transition-all pointer-events-auto select-none min-h-[90px] flex flex-col justify-center shadow-md ${isLocked
                                        ? 'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
                                        : selectedItem === e
                                            ? 'border-red-500 bg-red-900/40 text-red-100 shadow-red-500/30'
                                            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/40 hover:border-cyan-400/50'
                                        }`}
                                    onClick={() => !isLocked && handleItemSelect(e)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ') && !isLocked) {
                                            e.preventDefault();
                                            setSelectedItem(e);
                                        }
                                    }}
                                >
                                    <div className="font-bold text-base sm:text-sm">{isLocked ? '???' : e.name}</div>
                                    <div className="text-xs opacity-70 mt-1.5">{isLocked ? `Defeat this enemy to unlock` : `HP: ${e.config.baseHp}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'BOSSES':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        {bosses.map((b) => {
                            const isLocked = !b.isUnlocked;
                            return (
                                <div key={b.level}
                                    className={`p-5 sm:p-3 border-2 rounded-lg active:scale-98 cursor-pointer transition-all pointer-events-auto select-none min-h-[90px] flex flex-col justify-center shadow-lg ${isLocked
                                        ? 'border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-60'
                                        : selectedItem === b
                                            ? 'border-purple-500 bg-purple-900/40 text-purple-100 shadow-purple-500/30'
                                            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/40 hover:border-cyan-400/50'
                                        }`}
                                    onClick={() => !isLocked && handleItemSelect(b)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ') && !isLocked) {
                                            e.preventDefault();
                                            setSelectedItem(b);
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="font-bold text-base sm:text-sm">{isLocked ? '???' : b.name}</div>
                                        <div className="text-sm font-mono px-2 py-0.5 bg-purple-500/20 rounded">LV.{b.level}</div>
                                    </div>
                                    <div className="text-xs opacity-70 mt-2">{isLocked ? `Defeat this Boss to unlock` : `HP: ${b.config.hp}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
        }
    };

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
    const handleItemSelect = (item: any) => {
        playClick?.('default');
        setSelectedItem(item);
        setShowDetail(true);
    };

    // Handle detail close
    const handleDetailClose = () => {
        playClick?.('cancel');
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
                    playClick?.('cancel');
                    onClose();
                }} className="ml-2 px-3 py-2 text-xs sm:text-sm border border-red-500/50 text-red-400 hover:bg-red-900/20 rounded transition-colors flex-shrink-0">
                    CLOSE
                </button>
            </div>

            {/* Mobile Tab Navigation - 显示在顶部，sticky固定 */}
            <div className="sm:hidden sticky top-0 z-40 flex border-b border-gray-800 bg-gray-900/95 backdrop-blur-md flex-shrink-0 overflow-x-auto scrollbar-hide shadow-lg">
                {(['FIGHTERS', 'ARMORY', 'BESTIARY', 'BOSSES'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            playClick?.('menu');
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

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Sidebar Navigation - 仅桌面显示 */}
                <div className="hidden sm:flex w-40 lg:w-48 border-r border-gray-800 flex-col bg-gray-900/20 flex-shrink-0">
                    {(['FIGHTERS', 'ARMORY', 'BESTIARY', 'BOSSES'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => {
                                playClick?.('menu');
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

                {/* Main Content Area - 手机竖屏上下布局，桌面左右布局 */}
                <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-w-0 relative">
                    {/* List View - 全屏显示 */}
                    <div className="flex-1 p-4 sm:p-4 overflow-y-auto bg-black/20 custom-scrollbar pointer-events-auto">
                        {renderContent()}
                    </div>

                    {/* Detail Overlay - 浮动详情页 */}
                    {showDetail && selectedItem && (
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
                                                {activeTab === 'BOSSES' ? `Threat Level: ${selectedItem.level}` : activeTab}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {selectedItem.stats && Object.entries(selectedItem.stats).map(([k, v]) => (
                                                <div key={k} className="flex justify-between border-b border-gray-800 py-2">
                                                    <span className="text-gray-500 uppercase text-xs">{k}</span>
                                                    <span className="text-gray-300 font-semibold">{v as any}</span>
                                                </div>
                                            ))}
                                            {selectedItem.config && (
                                                <>
                                                    {/* Fighter Stats */}
                                                    {activeTab === 'FIGHTERS' && selectedItem.config && (
                                                        <>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">INITIAL HP</span>
                                                                <span className="text-cyan-300 font-semibold">{selectedItem.config.initialHp}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">MAX HP</span>
                                                                <span className="text-cyan-300 font-semibold">{selectedItem.config.maxHp}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">SPEED</span>
                                                                <span className="text-green-300 font-semibold">{selectedItem.config.speed}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">INITIAL BOMBS</span>
                                                                <span className="text-yellow-300 font-semibold">{selectedItem.config.initialBombs}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">MAX BOMBS</span>
                                                                <span className="text-yellow-300 font-semibold">{selectedItem.config.maxBombs}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">MAX SHIELD</span>
                                                                <span className="text-blue-300 font-semibold">{selectedItem.config.maxShield}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">WIDTH</span>
                                                                <span className="text-gray-300 font-semibold">{selectedItem.config.width}px</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">HEIGHT</span>
                                                                <span className="text-gray-300 font-semibold">{selectedItem.config.height}px</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {/* Weapon Stats */}
                                                    {activeTab === 'ARMORY' && (
                                                        <>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">BASE DMG</span>
                                                                <span className="text-yellow-300 font-semibold">{selectedItem.config.baseDamage}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">DMG/LV</span>
                                                                <span className="text-yellow-300 font-semibold">+{selectedItem.config.damagePerLevel}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">BULLET SPD</span>
                                                                <span className="text-cyan-300 font-semibold">{selectedItem.config.speed}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">FIRE RATE</span>
                                                                <span className="text-cyan-300 font-semibold">{selectedItem.config.baseFireRate}ms</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">RATE/LV</span>
                                                                <span className="text-cyan-300 font-semibold">-{selectedItem.config.ratePerLevel}ms</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">SIZE</span>
                                                                <span className="text-gray-300 font-semibold">{selectedItem.config.width}×{selectedItem.config.height}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {/* Enemy Stats */}
                                                    {activeTab === 'BESTIARY' && (
                                                        <>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">BASE HP</span>
                                                                <span className="text-red-300 font-semibold">{selectedItem.config.baseHp}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">HP/LV</span>
                                                                <span className="text-red-300 font-semibold">+{selectedItem.config.hpPerLevel}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">BASE SPD</span>
                                                                <span className="text-cyan-300 font-semibold">{selectedItem.config.baseSpeed}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">SPD/LV</span>
                                                                <span className="text-cyan-300 font-semibold">+{selectedItem.config.speedPerLevel}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">SIZE</span>
                                                                <span className="text-gray-300 font-semibold">{selectedItem.config.width}×{selectedItem.config.height}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">SCORE</span>
                                                                <span className="text-green-300 font-semibold">{selectedItem.config.score}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {/* Boss Stats */}
                                                    {activeTab === 'BOSSES' && (
                                                        <>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">HP</span>
                                                                <span className="text-purple-300 font-semibold">{selectedItem.config.hp}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">SPEED</span>
                                                                <span className="text-cyan-300 font-semibold">{selectedItem.config.speed}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">BULLET CNT</span>
                                                                <span className="text-yellow-300 font-semibold">{selectedItem.config.bulletCount}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">BULLET SPD</span>
                                                                <span className="text-yellow-300 font-semibold">{selectedItem.config.bulletSpeed}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">FIRE RATE</span>
                                                                <span className="text-yellow-300 font-semibold">{(selectedItem.config.fireRate * 100).toFixed(1)}%</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-gray-800 py-2">
                                                                <span className="text-gray-500 text-xs">SCORE</span>
                                                                <span className="text-green-300 font-semibold">{selectedItem.config.score}</span>
                                                            </div>
                                                            {selectedItem.config.hasLaser && (
                                                                <>
                                                                    <div className="flex justify-between border-b border-gray-800 py-2">
                                                                        <span className="text-gray-500 text-xs">LASER DMG</span>
                                                                        <span className="text-red-300 font-semibold">{selectedItem.config.laserDamage}</span>
                                                                    </div>
                                                                    <div className="flex justify-between border-b border-gray-800 py-2">
                                                                        <span className="text-gray-500 text-xs">LASER CD</span>
                                                                        <span className="text-red-300 font-semibold">{selectedItem.config.laserCooldown}ms</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {/* Weapons Display */}
                                                            {selectedItem.weapons && selectedItem.weapons.length > 0 && (
                                                                <>
                                                                    <div className="col-span-2 border-b border-gray-800 py-2 mt-2 mb-2">
                                                                        <span className="text-gray-500 text-xs uppercase">WEAPONS</span>
                                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                                            {selectedItem.weapons.map((weapon: string, idx: number) => (
                                                                                <span key={idx} className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-300 text-xs">
                                                                                    {BossWeaponNames[weapon as keyof typeof BossWeaponNames] || weapon}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {/* Wingmen Display */}
                                                            {selectedItem.wingmenCount > 0 && (
                                                                <>
                                                                    <div className="col-span-2 border-b border-gray-800 py-2">
                                                                        <span className="text-gray-500 text-xs uppercase">WINGMENS</span>
                                                                        <div className="mt-2 flex items-center justify-between">
                                                                            <span className="text-blue-300 font-semibold">{WingmenNames[selectedItem.wingmenType] || '未知'} × {selectedItem.wingmenCount}</span>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {selectedItem.chineseDescription && (
                                            <p className="text-cyan-300 italic text-base mt-2 border-l-2 border-cyan-500/50 pl-4 leading-relaxed">
                                                {selectedItem.chineseDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
