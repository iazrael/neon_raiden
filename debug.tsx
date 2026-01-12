import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { AudioSystem } from '@/game/systems-deprecated/AudioSystem';
import { WeaponType, ClickType, ExplosionSize } from '@/types';

const DebugPage = () => {
    const [activeTab, setActiveTab] = useState('audio');
    const audioSystemRef = useRef<AudioSystem | null>(null);

    useEffect(() => {
        audioSystemRef.current = new AudioSystem();
        // Resume audio context on click
        const resume = () => audioSystemRef.current?.resume();
        window.addEventListener('click', resume);
        return () => window.removeEventListener('click', resume);
    }, []);

    const play = (action: (audio: AudioSystem) => void) => {
        if (audioSystemRef.current) {
            audioSystemRef.current.resume();
            action(audioSystemRef.current);
        }
    };

    return (
        <div className="p-4 min-h-screen bg-black text-gray-200 font-mono">
            <h1 className="text-3xl font-bold mb-6 text-cyan-400 border-b border-cyan-900/50 pb-2">
                NEON RAIDEN // DEBUG CONSOLE
            </h1>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('audio')}
                    className={`px-4 py-2 rounded transition-colors ${activeTab === 'audio' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    Audio System
                </button>
                {/* Add more tabs here if needed */}
            </div>

            {activeTab === 'audio' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Section title="UI Sounds">
                        <Btn label="Click: Default" onClick={() => play(a => a.playClick(ClickType.DEFAULT))} />
                        <Btn label="Click: Confirm" onClick={() => play(a => a.playClick(ClickType.CONFIRM))} />
                        <Btn label="Click: Cancel" onClick={() => play(a => a.playClick(ClickType.CANCEL))} />
                        <Btn label="Click: Menu" onClick={() => play(a => a.playClick(ClickType.MENU))} />
                    </Section>

                    <Section title="Weapon Sounds">
                        {Object.values(WeaponType).map(type => (
                            <Btn key={type} label={`Shoot: ${type}`} onClick={() => play(a => a.playShoot(type))} />
                        ))}
                    </Section>

                    <Section title="Combat Sounds">
                        <Btn label="Hit" onClick={() => play(a => a.playHit())} />
                        <Btn label="Explosion: Small" onClick={() => play(a => a.playExplosion(ExplosionSize.SMALL))} />
                        <Btn label="Explosion: Large" onClick={() => play(a => a.playExplosion(ExplosionSize.LARGE))} />
                        <Btn label="Shield Break" onClick={() => play(a => a.playShieldBreak())} />
                        <Btn label="Bomb" onClick={() => play(a => a.playBomb())} />
                    </Section>

                    <Section title="Game Events">
                        <Btn label="Power Up" onClick={() => play(a => a.playPowerUp())} />
                        <Btn label="Level Up" onClick={() => play(a => a.playLevelUp())} />
                        <Btn label="Warning" onClick={() => play(a => a.playWarning())} />
                        <Btn label="Victory" onClick={() => play(a => a.playVictory())} />
                        <Btn label="Defeat" onClick={() => play(a => a.playDefeat())} />
                        <Btn label="Boss Defeat" onClick={() => play(a => a.playBossDefeat())} />
                        <Btn label="Slow Motion Enter" onClick={() => play(a => a.playSlowMotionEnter())} />
                    </Section>

                    <Section title="Loops">
                        <Btn label="Start Shield Loop" onClick={() => play(a => a.playShieldLoop())} />
                        <Btn label="Stop Shield Loop" onClick={() => play(a => a.stopShieldLoop())} />
                    </Section>
                </div>
            )}
        </div>
    );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-gray-900/50 p-4 rounded border border-gray-800">
        <h3 className="text-sm font-bold mb-3 text-cyan-500/80 uppercase tracking-wider">{title}</h3>
        <div className="flex flex-wrap gap-2">
            {children}
        </div>
    </div>
);

const Btn = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 active:bg-cyan-600 active:text-white text-xs text-gray-300 rounded border border-gray-700 transition-all"
    >
        {label}
    </button>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <DebugPage />
    </React.StrictMode>
);
