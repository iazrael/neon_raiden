import React, { useState, useEffect, useRef } from 'react';
import { WeaponType } from '@/types';
import { WeaponConfig, EnemyConfig, BossConfig, BossName, EnemyType } from '@/game/config';
import { SpriteGenerator } from '@/game/SpriteGenerator';

interface GalleryProps {
    onClose: () => void;
    maxLevelReached: number;
}

type Tab = 'FIGHTERS' | 'ARMORY' | 'BESTIARY' | 'BOSSES';

export const Gallery: React.FC<GalleryProps> = ({ onClose, maxLevelReached }) => {
    const [activeTab, setActiveTab] = useState<Tab>('FIGHTERS');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spriteGen = useRef(new SpriteGenerator());

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

    // Helper to draw sprite to a canvas
    const drawSprite = (ctx: CanvasRenderingContext2D, spriteKey: string, color?: string, isBoss: boolean = false) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);

        // Scale up for visibility
        const scale = isBoss ? 1.5 : 3;
        ctx.scale(scale, scale);

        if (isBoss) {
            ctx.rotate(Math.PI); // Bosses face down
        }

        // Generate sprite on the fly if needed, or use a pre-generated one
        // Since SpriteGenerator returns Canvases or Images, we can draw them directly.
        let sprite: HTMLCanvasElement | HTMLImageElement | null = null;

        if (spriteKey === 'player') sprite = spriteGen.current.generatePlayer();
        else if (spriteKey.startsWith('enemy_')) {
            const type = parseInt(spriteKey.split('_')[1]);
            sprite = spriteGen.current.generateEnemy(type);
        }
        else if (spriteKey.startsWith('boss_')) {
            const level = parseInt(spriteKey.split('_')[1]);
            sprite = spriteGen.current.generateBoss(level);
        }
        else if (spriteKey.startsWith('bullet_')) {
            const typeStr = spriteKey.split('_')[1] as any;
            sprite = spriteGen.current.generateBullet(typeStr);
        }

        if (sprite) {
            if (sprite instanceof HTMLImageElement && !sprite.complete) {
                sprite.onload = () => {
                    // Redraw when loaded
                    // We need to re-apply transforms because context is restored at end of function
                    // But we can't easily re-apply them without refactoring.
                    // Instead, let's just trigger a re-render or handle it here if we are careful.
                    // Actually, since this is inside a function, the context state is lost after restore.
                    // We should probably just let the effect re-run or force update.
                    // But simpler: just draw it here with same transforms.
                    ctx.save();
                    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
                    const scale = isBoss ? 1.5 : 3;
                    ctx.scale(scale, scale);
                    if (isBoss) ctx.rotate(Math.PI);
                    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
                    ctx.restore();
                };
            } else {
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            }
        } else if (color) {
            // Fallback for simple shapes if sprite gen fails or isn't mapped
            ctx.fillStyle = color;
            ctx.fillRect(-10, -10, 20, 20);
        }

        ctx.restore();
    };

    // Effect to draw selected item
    useEffect(() => {
        if (!selectedItem || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let spriteKey = '';
        let color = '#fff';
        let isBoss = false;

        try {
            if (activeTab === 'FIGHTERS') {
                spriteKey = 'player';
                color = '#00ffff';
            } else if (activeTab === 'ARMORY' && selectedItem.type !== undefined) {
                const config = WeaponConfig[selectedItem.type as WeaponType];
                if (config) {
                    spriteKey = config.sprite;
                    color = config.color;
                }
            } else if (activeTab === 'BESTIARY' && selectedItem.type !== undefined) {
                spriteKey = `enemy_${selectedItem.type}`;
                // Enemy color logic is inside generator, but we can pass a dummy one
            } else if (activeTab === 'BOSSES' && selectedItem.level !== undefined) {
                spriteKey = `boss_${selectedItem.level}`;
                isBoss = true;
            }

            if (spriteKey) {
                drawSprite(ctx, spriteKey, color, isBoss);
            }
        } catch (error) {
            console.error('Error drawing sprite:', error);
        }

    }, [selectedItem, activeTab]);

    // Data Sources
    const fighters = [
        { name: 'Neon Raiden', description: 'Advanced prototype fighter with adaptable weapon systems.', stats: { hp: 100, speed: 'High' } }
    ];

    const weapons = Object.entries(WeaponConfig).map(([type, config]) => ({
        type: parseInt(type),
        name: WeaponType[parseInt(type)],
        config,
        unlockLevel: parseInt(type) + 1 // Simplified unlock logic
    }));

    const enemies = Object.entries(EnemyConfig.types).map(([type, config]) => ({
        type: parseInt(type),
        name: EnemyType[parseInt(type)],
        config,
        unlockLevel: [1, 2, 3, 3, 5, 6, 7][parseInt(type)] || 1
    }));

    const bosses = Object.values(BossConfig).map((config) => ({
        name: Object.keys(BossName)[config.level - 1], // Rough mapping
        level: config.level,
        config,
        unlockLevel: config.level + 1 // Unlock after beating
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
                            const isLocked = maxLevelReached < w.unlockLevel;
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
                                    <div className="text-xs opacity-70 mt-1.5">{isLocked ? `Unlock at Lv.${w.unlockLevel}` : `DMG: ${w.config.baseDamage}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'BESTIARY':
                return (
                    <div className="grid grid-cols-2 gap-3 sm:gap-3">
                        {enemies.map((e) => {
                            const isLocked = maxLevelReached < e.unlockLevel;
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
                                    <div className="text-xs opacity-70 mt-1.5">{isLocked ? `Encounter at Lv.${e.unlockLevel}` : `HP: ${e.config.baseHp}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'BOSSES':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        {bosses.map((b) => {
                            const isLocked = maxLevelReached < b.unlockLevel;
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
                                    <div className="text-xs opacity-70 mt-2">{isLocked ? `Defeat Lv.${b.level} Boss` : `HP: ${b.config.hp}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
        }
    };

    // Auto-select first item when tab changes (but don't show detail)
    useEffect(() => {
        setShowDetail(false);
        if (activeTab === 'FIGHTERS') {
            setSelectedItem(fighters[0] || null);
        } else if (activeTab === 'ARMORY') {
            setSelectedItem(weapons[0] || null);
        } else if (activeTab === 'BESTIARY') {
            setSelectedItem(enemies[0] || null);
        } else if (activeTab === 'BOSSES') {
            setSelectedItem(bosses[0] || null);
        }
    }, [activeTab]);

    // Handle item selection
    const handleItemSelect = (item: any) => {
        setSelectedItem(item);
        setShowDetail(true);
    };

    // Handle detail close
    const handleDetailClose = () => {
        setShowDetail(false);
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/95 text-white flex flex-col font-mono backdrop-blur-xl pointer-events-auto">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-800 flex justify-between items-center bg-black/50 flex-shrink-0">
                <h2 className="text-lg sm:text-2xl font-bold text-cyan-400 tracking-widest flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                    <span className="text-2xl sm:text-3xl flex-shrink-0">❖</span> <span className="truncate">LIBRARY</span>
                </h2>
                <button onClick={onClose} className="ml-2 px-3 py-2 text-xs sm:text-sm border border-red-500/50 text-red-400 hover:bg-red-900/20 rounded transition-colors flex-shrink-0">
                    CLOSE
                </button>
            </div>

            {/* Mobile Tab Navigation - 显示在顶部，sticky固定 */}
            <div className="sm:hidden sticky top-0 z-40 flex border-b border-gray-800 bg-gray-900/95 backdrop-blur-md flex-shrink-0 overflow-x-auto scrollbar-hide shadow-lg">
                {(['FIGHTERS', 'ARMORY', 'BESTIARY', 'BOSSES'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[90px] py-4 px-3 text-sm text-center border-b-2 transition-all whitespace-nowrap font-bold active:scale-95 ${
                            activeTab === tab
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
                            onClick={() => setActiveTab(tab)}
                            className={`p-4 text-sm lg:text-base text-left border-l-4 transition-all font-bold ${
                                activeTab === tab
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
                                        <canvas ref={canvasRef} width={200} height={200} className="relative z-10 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-110 transition-transform duration-500 w-28 h-28 sm:w-32" />
                                    </div>

                                    <div className="w-full space-y-4 text-sm sm:text-base">
                                        <div className="border-b border-cyan-500/30 pb-3">
                                            <h3 className="text-2xl sm:text-3xl font-bold text-cyan-100">{selectedItem.name || 'Unknown'}</h3>
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
                                                    {selectedItem.config.baseDamage && (
                                                        <div className="flex justify-between border-b border-gray-800 py-2">
                                                            <span className="text-gray-500 text-xs">DAMAGE</span>
                                                            <span className="text-gray-300 font-semibold">{selectedItem.config.baseDamage}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.config.baseHp && (
                                                        <div className="flex justify-between border-b border-gray-800 py-2">
                                                            <span className="text-gray-500 text-xs">HP</span>
                                                            <span className="text-gray-300 font-semibold">{selectedItem.config.baseHp}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.config.hp && (
                                                        <div className="flex justify-between border-b border-gray-800 py-2">
                                                            <span className="text-gray-500 text-xs">HP</span>
                                                            <span className="text-gray-300 font-semibold">{selectedItem.config.hp}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.config.speed && (
                                                        <div className="flex justify-between border-b border-gray-800 py-2">
                                                            <span className="text-gray-500 text-xs">SPEED</span>
                                                            <span className="text-gray-300 font-semibold">{selectedItem.config.speed}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {selectedItem.description && (
                                            <p className="text-gray-400 italic text-sm mt-4 border-l-2 border-cyan-500/50 pl-4 leading-relaxed">
                                                "{selectedItem.description}"
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
