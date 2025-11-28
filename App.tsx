import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameUI } from './components/GameUI';
import { GameState, WeaponType } from './types';
import type { ComboState } from './game/systems/ComboSystem';
import type { SynergyConfig } from './game/systems/WeaponSynergySystem';

import { SpriteGenerator } from './game/SpriteGenerator';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React State for UI Sync
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [hp, setHp] = useState(100);
  const [bombs, setBombs] = useState(0);
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const [levelTransitionTimer, setLevelTransitionTimer] = useState(0);
  const [maxLevelReached, setMaxLevelReached] = useState(1);
  const [stateBeforeGallery, setStateBeforeGallery] = useState<GameState>(GameState.MENU);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [comboState, setComboState] = useState<ComboState>({ count: 0, timer: 0, level: 0, maxCombo: 0, hasBerserk: false }); // P2 Combo
  const [activeSynergies, setActiveSynergies] = useState<SynergyConfig[]>([]); // P2 Weapon Synergy
  const [weaponType, setWeaponType] = useState<WeaponType>(WeaponType.VULCAN); // P2 Current weapon
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponType | null>(null); // P2 Secondary weapon

  useEffect(() => {
    // Preload assets
    SpriteGenerator.preloadAssets();

    // 隐藏加载指示器
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    if (!canvasRef.current) return;

    // Initialize Engine
    const engine = new GameEngine(
      canvasRef.current,
      (newScore) => setScore(newScore),
      (newLevel) => setLevel(newLevel),
      (newState) => setGameState(newState),
      (newHp) => setHp(newHp),
      (newBombs) => setBombs(newBombs),
      (maxLevel) => setMaxLevelReached(maxLevel),
      (show) => setShowBossWarning(show),
      (newComboState) => setComboState(newComboState) // P2 Combo
    );
    engineRef.current = engine;

    // Animation Loop
    let lastTime = performance.now();
    let animationId: number;

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      engine.loop(Math.min(dt, 50)); // Cap dt to prevent huge jumps

      // Sync level transition state
      setShowLevelTransition(engine.showLevelTransition);
      setLevelTransitionTimer(engine.levelTransitionTimer);
      
      // P2 Sync weapon synergy state
      setActiveSynergies(engine.synergySys.getActiveSynergies());
      setWeaponType(engine.weaponType);
      setSecondaryWeapon(engine.secondaryWeapon);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', () => engine.resize());
    };
  }, []);

  const handleStart = () => {
    engineRef.current?.startGame();
  };

  const handleBomb = (x?: number, y?: number) => {
    engineRef.current?.triggerBomb(x, y);
  };

  const playClick = (type?: 'default' | 'confirm' | 'cancel' | 'menu') => {
    engineRef.current?.audio.playClick(type);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden touch-none select-none">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
      <GameUI
        state={gameState}
        score={score}
        level={level}
        hp={hp}
        bombs={bombs}
        onStart={handleStart}
        onRestart={handleStart}
        onUseBomb={handleBomb}
        showLevelTransition={showLevelTransition}
        levelTransitionTimer={levelTransitionTimer}
        maxLevelReached={maxLevelReached}
        showBossWarning={showBossWarning}
        comboState={comboState}
        activeSynergies={activeSynergies}
        weaponType={weaponType}
        secondaryWeapon={secondaryWeapon}
        onOpenGallery={() => {
          setStateBeforeGallery(gameState);
          if (gameState === GameState.PLAYING) {
            engineRef.current?.pause();
          }
          setGameState(GameState.GALLERY);
        }}
        onCloseGallery={() => {
          if (stateBeforeGallery === GameState.PLAYING) {
            engineRef.current?.resume();
          }
          setGameState(stateBeforeGallery);
        }}
        playClick={playClick}
        onBackToMenu={() => {
          engineRef.current?.stop();
          setGameState(GameState.MENU);
        }}
        onPause={() => engineRef.current?.pause()}
        onResume={() => engineRef.current?.resume()}
      />
    </div>
  );
}

export default App;
