import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameUI } from './components/GameUI';
import { GameState, WeaponType, ClickType } from './types';
import type { ComboState } from './game/systems/ComboSystem';
import type { SynergyConfig } from './game/systems/WeaponSynergySystem';

import { SpriteGenerator } from './game/SpriteGenerator';
import { GameConfig } from './game/config/game';
import ReloadPrompt from './components/ReloadPrompt';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React State for UI Sync
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [hp, setHp] = useState(100);
  const [bombs, setBombs] = useState(0);
  const [shieldPercent, setShieldPercent] = useState(0);
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const [levelTransitionTimer, setLevelTransitionTimer] = useState(0);
  const [maxLevelReached, setMaxLevelReached] = useState(1);
  const [stateBeforeGallery, setStateBeforeGallery] = useState<GameState>(GameState.MENU);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [comboState, setComboState] = useState<ComboState>({ count: 0, timer: 0, level: 0, maxCombo: 0, hasBerserk: false }); // P2 Combo
  const [activeSynergies, setActiveSynergies] = useState<SynergyConfig[]>([]); // P2 Weapon Synergy
  const [weaponType, setWeaponType] = useState<WeaponType>(WeaponType.VULCAN); // P2 Current weapon
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponType | null>(null); // P2 Secondary weapon
  const [weaponLevel, setWeaponLevel] = useState<number>(1);

  useEffect(() => {
    // Preload assets
    SpriteGenerator.preloadAssets();

    // 隐藏加载指示器
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    // 解析URL参数以确定是否启用调试模式
    const urlParams = new URLSearchParams(window.location.search);
    const isMaster = urlParams.has('master');
    const debugMode = urlParams.get('debug') === '1';
    const bossDivisor = parseInt(urlParams.get('boss') || '1');

    // 如果是master模式且debug=1，则启用调试模式
    if (isMaster && debugMode) {
      GameConfig.debug = true;
      GameConfig.debugBossDivisor = Math.max(1, bossDivisor);
    }

    if (!canvasRef.current) return;

    // Initialize Engine
    const engine = new GameEngine(
      canvasRef.current
    );
    engineRef.current = engine;

    // Animation Loop
    let lastTime = performance.now();
    let animationId: number;

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      engine.loop(Math.min(dt, 50)); // Cap dt to prevent huge jumps

      // Sync state from snapshot
      const snap = engine.getSnapshot(); // We need to expose this or subscribe to snapshot$
      // Actually, engine.loop calls update which emits snapshot.
      // But here we are inside the loop.
      // We should probably subscribe to snapshot$ in useEffect, OR just read it from engine if we want sync update.
      // But the user pattern in New.md suggests React subscribes to snapshot$.
      // However, for 60fps loop driving the engine, we might want to just let the engine drive and React update on frame or subscription.
      // If we use subscription, we might trigger too many re-renders if we are not careful.
      // But let's follow the pattern: React subscribes.

      animationId = requestAnimationFrame(loop);
    };

    // We'll use a separate effect for subscription or just update state here if we have access to latest snapshot.
    // Since we are in the loop, we can just get the latest snapshot from the engine if we expose it, or rely on the subscription.
    // But wait, the loop is running in App.tsx.
    // If we want to decouple, the loop should probably be in the engine or started by the engine, and App just subscribes.
    // The user's New.md says: "React 渲染层 ← 只订阅快照".
    // So App.tsx shouldn't necessarily run the loop?
    // "startEngine(canvas)" in New.md runs the loop.
    // But currently App.tsx runs the loop.
    // I should probably move the loop into GameEngine and have App.tsx just subscribe.
    // But for now, to minimize changes, I will keep the loop here but update state from snapshot$.

    // Actually, let's just subscribe to snapshot$ in useEffect.

    animationId = requestAnimationFrame(loop);

    const sub = engine.snapshot$.subscribe((snap) => {
      if (!snap) return;
      setScore(snap.score);
      setLevel(snap.level);
      setGameState(snap.state);
      setHp(snap.player.hp);
      setBombs(snap.player.bombs);
      setShieldPercent(snap.player.shieldPercent);
      setShowLevelTransition(snap.showLevelTransition);
      setLevelTransitionTimer(snap.levelTransitionTimer);
      setMaxLevelReached(snap.maxLevelReached);
      setShowBossWarning(snap.showBossWarning);
      setComboState(snap.comboState);
      setActiveSynergies(snap.player.activeSynergies);
      setWeaponType(snap.player.weaponType);
      setSecondaryWeapon(snap.player.secondaryWeapon);
      setWeaponLevel(snap.player.weaponLevel);
    });

    return () => {
      cancelAnimationFrame(animationId);
      sub.unsubscribe();
      window.removeEventListener('resize', () => engine.resize());
    };
  }, []);

  const handleStart = () => {
    engineRef.current?.startGame();
  };

  const handleBomb = (x?: number, y?: number) => {
    engineRef.current?.triggerBomb(x, y);
  };

  const playClick = (type: ClickType = ClickType.DEFAULT) => {
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
        weaponLevel={weaponLevel}
        shieldPercent={shieldPercent}
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
      <ReloadPrompt />
    </div>
  );
}

export default App;
