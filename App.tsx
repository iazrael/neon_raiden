import React, { useEffect, useRef, useState } from 'react';
import { ReactEngine } from './src/engine/ReactEngine';
import { GameUI } from './components/GameUI';
import { WeaponType, ClickType } from './types';

import { SpriteManager } from './src/engine/SpriteManager';
import ReloadPrompt from './src/views/components/ReloadPrompt';
import { ComboState, GameState } from './src/engine';
import { GAME_CONFIG } from './src/engine/configs';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReactEngine | null>(null);

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
  const [weaponType, setWeaponType] = useState<WeaponType>(WeaponType.VULCAN); // P2 Current weapon
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponType | null>(null); // P2 Secondary weapon
  const [weaponLevel, setWeaponLevel] = useState<number>(1);

  useEffect(() => {
    // Preload assets - both old and new systems
    Promise.all([
      SpriteManager.preloadAll(),
    ]).then(() => {
      console.log('[App] All assets preloaded');
    });

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
      GAME_CONFIG.debug = true;
      GAME_CONFIG.debugBossDivisor = Math.max(1, bossDivisor);
    }

    if (!canvasRef.current) return;

    // Initialize ReactEngine
    const engine = new ReactEngine(
      canvasRef.current,
      (newScore) => setScore(newScore),
      (newLevel) => setLevel(newLevel),
      (newState) => setGameState(newState),
      (newHp) => setHp(newHp),
      (newBombs) => setBombs(newBombs),
      (maxLevel) => setMaxLevelReached(maxLevel),
      (show) => setShowBossWarning(show),
      (newComboState) => setComboState(newComboState)
    );
    engineRef.current = engine;

    // ReactEngine 内部通过 snapshot$ 同步状态，不需要手动动画循环
    // 只需要定期同步额外的 UI 状态
    const syncInterval = setInterval(() => {
      setShowLevelTransition(engine.showLevelTransition);
      setLevelTransitionTimer(engine.levelTransitionTimer);
      setWeaponType(engine.weaponId as any as WeaponType);
      setSecondaryWeapon(engine.secondaryWeapon as any as WeaponType);
      setWeaponLevel(engine.weaponLevel);
      setShieldPercent(engine.getShieldPercent());
    }, 100); // 每 100ms 同步一次 UI 状态

    return () => {
      clearInterval(syncInterval);
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
