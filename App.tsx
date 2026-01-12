import React, { useEffect, useRef, useState } from 'react';
import { EngineWrapper } from './game/EngineWrapper';
import { GameUI } from './components/GameUI';
import { GameState, WeaponType, ClickType } from './types';

import { SpriteGenerator } from './game/SpriteGenerator';
import { GameConfig } from './game/config/game';
import ReloadPrompt from './components/ReloadPrompt';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EngineWrapper | null>(null);

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
  const [showBossWarning, setShowBossWarning] = useState<boolean>(false);
  const [comboState, setComboState] = useState({ count: 0, timer: 0, level: 0, maxCombo: 0, hasBerserk: false });
  const [activeSynergies, setActiveSynergies] = useState<any[]>([]);
  const [weaponType, setWeaponType] = useState<WeaponType>(WeaponType.VULCAN);
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponType | null>(null);
  const [weaponLevel, setWeaponLevel] = useState<number>(1);

  useEffect(() => {
    SpriteGenerator.preloadAssets();

    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isMaster = urlParams.has('master');
    const debugMode = urlParams.get('debug') === '1';
    const bossDivisor = parseInt(urlParams.get('boss') || '1');

    if (isMaster && debugMode) {
      GameConfig.debug = true;
      GameConfig.debugBossDivisor = Math.max(1, bossDivisor);
    }

    if (!canvasRef.current) return;

    const engine = new EngineWrapper(
      canvasRef.current,
      setScore,
      setLevel,
      setGameState,
      setHp,
      setBombs,
      setMaxLevelReached,
      setShowBossWarning,
      setComboState
    );
    engineRef.current = engine;

    const intervalId = setInterval(() => {
      setShieldPercent(engine.getShieldPercent());
      setShowLevelTransition(engine.showLevelTransition);
      setLevelTransitionTimer(engine.levelTransitionTimer);
      setActiveSynergies(engine.synergy.getActiveSynergies());
      setWeaponType(engine.weaponType);
      setSecondaryWeapon(engine.secondaryWeapon);
      setWeaponLevel(engine.weaponLevel);
    }, 100);

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
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
