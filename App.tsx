
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameUI } from './components/GameUI';
import { GameState } from './types';

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

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Engine
    const engine = new GameEngine(
      canvasRef.current,
      (newScore) => setScore(newScore),
      (newLevel) => setLevel(newLevel),
      (newState) => setGameState(newState),
      (newHp) => setHp(newHp),
      (newBombs) => setBombs(newBombs),
      (maxLevel) => setMaxLevelReached(maxLevel)
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

  const handleBomb = () => {
    engineRef.current?.triggerBomb();
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
        onOpenGallery={() => setGameState(GameState.GALLERY)}
        onCloseGallery={() => setGameState(GameState.MENU)}
      />
    </div>
  );
}

export default App;
