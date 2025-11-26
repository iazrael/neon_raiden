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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spriteGen = useRef(new SpriteGenerator());

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
        // Since SpriteGenerator returns Canvases, we can draw them directly.
        let sprite: HTMLCanvasElement | null = null;

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
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
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

        if (activeTab === 'FIGHTERS') {
            spriteKey = 'player';
            color = '#00ffff';
        } else if (activeTab === 'ARMORY') {
            spriteKey = WeaponConfig[selectedItem.type as WeaponType].sprite;
            color = WeaponConfig[selectedItem.type as WeaponType].color;
        } else if (activeTab === 'BESTIARY') {
            spriteKey = `enemy_${selectedItem.type}`;
            // Enemy color logic is inside generator, but we can pass a dummy one
        } else if (activeTab === 'BOSSES') {
            spriteKey = `boss_${selectedItem.level}`;
            isBoss = true;
        }

        drawSprite(ctx, spriteKey, color, isBoss);

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
                                className={`p-4 border border-cyan-500/30 bg-cyan-900/20 rounded hover:bg-cyan-800/40 cursor-pointer ${selectedItem === f ? 'border-cyan-400 bg-cyan-800/60' : ''}`}
                                onClick={() => setSelectedItem(f)}
                            >
                                <div className="font-bold text-cyan-300">{f.name}</div>
                            </div>
                        ))}
                    </div>
                );
            case 'ARMORY':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {weapons.map((w) => {
                            const isLocked = maxLevelReached < w.unlockLevel;
                            return (
                                <div key={w.type}
                                    className={`p-3 border rounded cursor-pointer transition-all ${isLocked
                                        ? 'border-gray-700 bg-gray-900/50 text-gray-600'
                                        : selectedItem === w
                                            ? 'border-yellow-500 bg-yellow-900/30 text-yellow-100'
                                            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/40'
                                        }`}
                                    onClick={() => !isLocked && setSelectedItem(w)}
                                >
                                    <div className="font-bold text-sm">{isLocked ? '???' : w.name}</div>
                                    <div className="text-xs opacity-60">{isLocked ? `Unlock at Lv.${w.unlockLevel}` : `DMG: ${w.config.baseDamage}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'BESTIARY':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {enemies.map((e) => {
                            const isLocked = maxLevelReached < e.unlockLevel;
                            return (
                                <div key={e.type}
                                    className={`p-3 border rounded cursor-pointer transition-all ${isLocked
                                        ? 'border-gray-700 bg-gray-900/50 text-gray-600'
                                        : selectedItem === e
                                            ? 'border-red-500 bg-red-900/30 text-red-100'
                                            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/40'
                                        }`}
                                    onClick={() => !isLocked && setSelectedItem(e)}
                                >
                                    <div className="font-bold text-sm">{isLocked ? '???' : e.name}</div>
                                    <div className="text-xs opacity-60">{isLocked ? `Encounter at Lv.${e.unlockLevel}` : `HP: ${e.config.baseHp}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
            case 'BOSSES':
                return (
                    <div className="grid grid-cols-1 gap-2">
                        {bosses.map((b) => {
                            const isLocked = maxLevelReached < b.unlockLevel;
                            return (
                                <div key={b.level}
                                    className={`p-3 border rounded cursor-pointer transition-all ${isLocked
                                        ? 'border-gray-700 bg-gray-900/50 text-gray-600'
                                        : selectedItem === b
                                            ? 'border-purple-500 bg-purple-900/30 text-purple-100'
                                            : 'border-cyan-500/30 bg-cyan-900/20 text-cyan-100 hover:bg-cyan-800/40'
                                        }`}
                                    onClick={() => !isLocked && setSelectedItem(b)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="font-bold text-sm">{isLocked ? '???' : b.name}</div>
                                        <div className="text-xs font-mono">LV.{b.level}</div>
                                    </div>
                                    <div className="text-xs opacity-60">{isLocked ? `Defeat Lv.${b.level} Boss` : `HP: ${b.config.hp}`}</div>
                                </div>
                            );
                        })}
                    </div>
                );
        }
    };

    // Auto-select first item when tab changes
    useEffect(() => {
        setSelectedItem(null);
    }, [activeTab]);

    return (
        <div className="absolute inset-0 z-50 bg-black/95 text-white flex flex-col font-mono backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/50">
                <h2 className="text-2xl font-bold text-cyan-400 tracking-widest flex items-center gap-2">
                    <span className="text-3xl">❖</span> DATABASE
                </h2>
                <button onClick={onClose} className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-900/20 rounded transition-colors">
                    CLOSE [X]
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-48 border-r border-gray-800 flex flex-col bg-gray-900/20">
                    {(['FIGHTERS', 'ARMORY', 'BESTIARY', 'BOSSES'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`p-4 text-left border-l-4 transition-all ${activeTab === tab
                                ? 'border-cyan-400 bg-cyan-900/30 text-cyan-100'
                                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* List View */}
                    <div className="w-1/3 p-4 overflow-y-auto border-r border-gray-800 bg-black/20 custom-scrollbar">
                        {renderContent()}
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 p-8 flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
                        {selectedItem ? (
                            <>
                                <div className="w-64 h-64 border border-cyan-500/20 rounded-full flex items-center justify-center bg-black/50 mb-8 relative group">
                                    <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[spin_10s_linear_infinite]"></div>
                                    <div className="absolute inset-2 rounded-full border border-cyan-500/10 animate-[spin_15s_linear_infinite_reverse]"></div>
                                    <canvas ref={canvasRef} width={200} height={200} className="relative z-10 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-110 transition-transform duration-500" />
                                </div>

                                <div className="w-full max-w-lg space-y-4">
                                    <div className="border-b border-cyan-500/30 pb-2">
                                        <h3 className="text-3xl font-bold text-cyan-100">{selectedItem.name || 'Unknown'}</h3>
                                        <div className="text-cyan-500 text-sm tracking-widest uppercase opacity-70">
                                            {activeTab === 'BOSSES' ? `Threat Level: ${selectedItem.level}` : activeTab}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {selectedItem.stats && Object.entries(selectedItem.stats).map(([k, v]) => (
                                            <div key={k} className="flex justify-between border-b border-gray-800 py-1">
                                                <span className="text-gray-500 uppercase">{k}</span>
                                                <span className="text-gray-300">{v as any}</span>
                                            </div>
                                        ))}
                                        {selectedItem.config && (
                                            <>
                                                {selectedItem.config.baseDamage && (
                                                    <div className="flex justify-between border-b border-gray-800 py-1">
                                                        <span className="text-gray-500">DAMAGE</span>
                                                        <span className="text-gray-300">{selectedItem.config.baseDamage}</span>
                                                    </div>
                                                )}
                                                {selectedItem.config.baseHp && (
                                                    <div className="flex justify-between border-b border-gray-800 py-1">
                                                        <span className="text-gray-500">HP</span>
                                                        <span className="text-gray-300">{selectedItem.config.baseHp}</span>
                                                    </div>
                                                )}
                                                {selectedItem.config.hp && (
                                                    <div className="flex justify-between border-b border-gray-800 py-1">
                                                        <span className="text-gray-500">HP</span>
                                                        <span className="text-gray-300">{selectedItem.config.hp}</span>
                                                    </div>
                                                )}
                                                {selectedItem.config.speed && (
                                                    <div className="flex justify-between border-b border-gray-800 py-1">
                                                        <span className="text-gray-500">SPEED</span>
                                                        <span className="text-gray-300">{selectedItem.config.speed}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {selectedItem.description && (
                                        <p className="text-gray-400 italic mt-4 border-l-2 border-cyan-500/50 pl-4">
                                            "{selectedItem.description}"
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-600 flex flex-col items-center">
                                <div className="text-6xl mb-4 opacity-20">?</div>
                                <div>SELECT AN ITEM TO VIEW DETAILS</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
