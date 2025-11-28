import React from "react";
import { GameState } from "@/types";
import { getVersion } from "@/game/version";
import { Gallery } from "./Gallery";
import type { ComboState } from "@/game/systems/ComboSystem";

interface GameUIProps {
  state: GameState;
  score: number;
  level: number;
  hp: number;
  bombs?: number;
  onStart: () => void;
  onRestart: () => void;
  onUseBomb?: (x?: number, y?: number) => void;
  showLevelTransition?: boolean;
  levelTransitionTimer?: number;
  maxLevelReached?: number;
  onOpenGallery?: () => void;
  onCloseGallery?: () => void;
  playClick?: (type?: 'default' | 'confirm' | 'cancel' | 'menu') => void;
  onBackToMenu?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  showBossWarning?: boolean;
  comboState?: ComboState; // P2 Combo system
}

export const GameUI: React.FC<GameUIProps> = ({
  state,
  score,
  level,
  hp,
  bombs = 0,
  onStart,
  onRestart,
  onUseBomb,
  showLevelTransition = false,
  levelTransitionTimer = 0,
  maxLevelReached = 1,
  onOpenGallery,
  onCloseGallery,
  playClick,
  onBackToMenu,
  onPause,
  onResume,
  showBossWarning = false,
  comboState, // P2 Combo system
}) => {
  const [showExitDialog, setShowExitDialog] = React.useState(false);

  const handleBombClick = () => {
    // Bomb triggers at player's current position, not button position
    onUseBomb?.();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] font-mono text-white select-none">
      {/* HUD - Always Visible during play */}
      <div className="flex justify-between items-start w-full z-10">
        <div>
          <div className="text-xl font-bold text-yellow-400 drop-shadow-md">
            SCORE: {score.toString().padStart(6, "0")}
          </div>
          <div className="text-sm text-gray-300">LEVEL: {level}</div>
        </div>

        {/* HP Bar */}
        <div className="flex flex-col items-end w-1/3">
          <div className="w-full bg-gray-800 h-4 rounded-full border border-gray-600 overflow-hidden relative">
            <div
              className={`h-full ${hp > 50
                ? "bg-gradient-to-r from-green-500 to-green-400"
                : hp > 20
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                  : "bg-gradient-to-r from-red-600 to-red-500"
                } transition-all duration-200`}
              style={{ width: `${Math.max(0, hp)}%` }}
            ></div>
          </div>
          <div className="text-xs mt-1 text-gray-400 tracking-wider">
            SHIELD INTEGRITY
          </div>
        </div>
      </div>

      {/* P2 Combo Display */}
      {state === GameState.PLAYING && comboState && comboState.count > 0 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-40 flex flex-col items-center gap-2">
          {/* Combo Count */}
          <div 
            className="text-center transition-all duration-200"
            style={{
              transform: `scale(${1 + Math.min(comboState.count / 100, 1) * 0.5})`,
            }}
          >
            <div 
              className="text-5xl font-black tracking-wider drop-shadow-[0_0_15px_currentColor]"
              style={{ 
                color: getComboColor(comboState.level),
                textShadow: `0 0 20px ${getComboColor(comboState.level)}`
              }}
            >
              {comboState.count}
            </div>
            <div 
              className="text-sm font-bold tracking-widest mt-1"
              style={{ color: getComboColor(comboState.level) }}
            >
              {getComboTierName(comboState.level)}
            </div>
          </div>
          
          {/* Progress Bar to next tier */}
          {comboState.level < 4 && (
            <div className="w-32 h-1 bg-gray-800/50 rounded-full overflow-hidden border border-gray-600/50">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${getProgressToNextTier(comboState) * 100}%`,
                  backgroundColor: getComboColor(comboState.level)
                }}
              />
            </div>
          )}
          
          {/* Multipliers */}
          <div className="flex gap-3 text-xs">
            <div className="text-red-400 drop-shadow-md">
              DMG ×{getComboMultiplier(comboState.level, 'damage').toFixed(1)}
            </div>
            <div className="text-yellow-400 drop-shadow-md">
              SCORE ×{getComboMultiplier(comboState.level, 'score').toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Exit Button (Top Right, below HUD) */}
      {state === GameState.PLAYING && (
        <div className="absolute top-[max(4rem,calc(env(safe-area-inset-top)+3rem))] right-4 pointer-events-auto z-30">
          <button
            onClick={() => {
              playClick?.('cancel');
              onPause?.();
              setShowExitDialog(true);
            }}
            className="w-10 h-10 rounded-full border border-gray-600 bg-gray-900/50 text-gray-400 hover:text-white hover:bg-red-900/50 hover:border-red-500 flex items-center justify-center transition-all backdrop-blur-sm"
            title="Abort Mission"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitDialog && state === GameState.PLAYING && (
        <>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 pointer-events-auto" onClick={() => {
            setShowExitDialog(false);
            onResume?.();
          }} />

          {/* Dialog */}
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-red-500/50 rounded-lg p-6 max-w-sm mx-4 shadow-[0_0_30px_rgba(239,68,68,0.5)] pointer-events-auto animate-[scale-in_0.2s_ease-out]">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-400 mb-2 tracking-wider">ABORT MISSION?</h3>
                <p className="text-gray-400 text-sm mb-6">All progress will be lost. Return to base?</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      playClick?.('cancel');
                      onResume?.();
                      setShowExitDialog(false);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded border border-gray-600 transition-all active:scale-95"
                  >
                    CONTINUE
                  </button>
                  <button
                    onClick={() => {
                      playClick?.('confirm');
                      setShowExitDialog(false);
                      onBackToMenu?.();
                    }}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95"
                  >
                    ABORT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bomb Button (Bottom Right) */}
      {state === GameState.PLAYING && (
        <div className="absolute bottom-20 right-6 pointer-events-auto z-30 flex flex-col items-center gap-1 pb-safe">
          <span className="text-xs font-bold text-red-400 tracking-widest">
            BOMB x{bombs}
          </span>
          <button
            onClick={handleBombClick}
            className={`w-20 h-20 rounded-full border-4 ${bombs > 0
              ? "border-red-500 bg-red-600/50 animate-pulse hover:bg-red-500/80 active:scale-95"
              : "border-gray-600 bg-gray-800/50 opacity-50"
              } flex items-center justify-center transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]`}
            disabled={bombs <= 0}
          >
            <span className="text-3xl">☢️</span>
          </button>
        </div>
      )}

      {/* Menus - Pointer events allowed */}
      {state === GameState.MENU && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto z-20 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
          {/* 标题和Logo - 响应式布局，移动端垂直排列 */}
          <div className="flex flex-col items-center mb-6 w-full max-w-lg px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-2 tracking-tighter drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] text-center w-full">
              {/* 移动端：标题与Logo重叠效果 | 桌面端：水平排列 */}
              <div className="relative flex flex-col items-center justify-center md:flex md:flex-row w-full">
                {/* NEON - 从中心点往左上偏移 - 使用蓝色到青色渐变 */}
                <span className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wider md:text-center absolute left-1/2 top-1/2 -translate-x-[110%] -translate-y-[100%] md:static md:translate-x-0 md:translate-y-0 block z-10">NEON</span>

                {/* Logo - 居中显示，作为背景元素 */}
                <img
                  src="./logo-no-grid.svg"
                  alt="Neon Raiden Logo"
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-24 md:h-24 mx-auto z-0 opacity-80"
                />

                {/* RAIDEN - 从中心点往右下偏移 - 使用青色到紫色渐变 */}
                <span className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent tracking-wider md:text-center absolute left-1/2 top-1/2 translate-x-[-25%] translate-y-[20%] md:static md:translate-x-0 md:translate-y-0 block z-10">RAIDEN</span>
              </div>
            </h1>

            {/* 状态文本 */}
            <p className="text-cyan-200 text-center text-xs sm:text-sm px-4 uppercase tracking-[0.2em] animate-pulse">
              System Online // Awaiting Pilot
            </p>
          </div>

          {/* 按钮组 */}
          <div className="flex flex-col items-center w-full">
            <button
              onClick={() => {
                playClick?.('confirm');
                onStart();
              }}
              className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-none border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse active:scale-95 transition-transform skew-x-[-10deg]"
            >
              START MISSION
            </button>

            <button
              onClick={() => {
                playClick?.('menu');
                onOpenGallery?.();
              }}
              className="mt-4 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold rounded-none border border-gray-600 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-transform skew-x-[-10deg] text-sm tracking-widest"
            >
              LIBRARY
            </button>
          </div>

          {/* 版本信息 */}
          <div className="mt-12 text-xs text-cyan-500/50 tracking-widest font-mono">
            {getVersion()}
          </div>
        </div>
      )}

      {state === GameState.GALLERY && (
        <Gallery onClose={onCloseGallery!} maxLevelReached={maxLevelReached} playClick={playClick} />
      )}

      {state === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center pointer-events-auto z-20 backdrop-blur-md">
          <h2 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] tracking-widest">
            CRITICAL FAILURE
          </h2>
          <div className="text-3xl mb-8 font-light">
            SCORE: <span className="text-white font-bold">{score}</span>
          </div>
          <button
            onClick={() => {
              playClick?.('confirm');
              onRestart();
            }}
            className="px-8 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200 active:scale-95 transition-transform uppercase tracking-widest"
          >
            Reboot System
          </button>

          <button
            onClick={() => {
              playClick?.('cancel');
              onBackToMenu?.();
            }}
            className="mt-4 px-6 py-2 bg-gray-900 text-red-400 font-bold border border-red-500/50 hover:bg-red-900/40 hover:border-red-400 hover:text-red-300 rounded transition-all uppercase tracking-widest text-sm shadow-lg"
          >
            Return to Home
          </button>
        </div>
      )}

      {state === GameState.VICTORY && (
        <div className="absolute inset-0 bg-yellow-900/90 flex flex-col items-center justify-center pointer-events-auto z-20 backdrop-blur-md">
          <h2 className="text-5xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] tracking-widest">
            MISSION ACCOMPLISHED
          </h2>
          <div className="text-3xl mb-8 font-light">
            SCORE: <span className="text-white font-bold">{score}</span>
          </div>
          <div className="text-center text-sm max-w-xs mb-8 text-yellow-100/80">
            Galaxy secured. Returning to base.
          </div>
          <button
            onClick={() => {
              playClick?.('confirm');
              onRestart();
            }}
            className="px-8 py-3 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-300 active:scale-95 transition-transform uppercase tracking-widest"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Level Transition Overlay - Top Left */}
      {showLevelTransition && (
        <div
          className="absolute top-8 left-4 pointer-events-none z-50"
          style={{
            opacity:
              levelTransitionTimer < 300
                ? levelTransitionTimer / 300
                : levelTransitionTimer > 1200
                  ? (1500 - levelTransitionTimer) / 300
                  : 1,
          }}
        >
          <div className="text-2xl font-bold text-cyan-400 tracking-wider drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            STAGE {level}
          </div>
        </div>
      )}

      {/* Boss Warning Overlay */}
      {showBossWarning && state === GameState.PLAYING && (
        <div
          className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
          style={{
            animation: 'bossWarningFlash 0.5s ease-in-out infinite'
          }}
        >
          <style>{`
            @keyframes bossWarningFlash {
              0%, 100% { background-color: rgba(220, 38, 38, 0); }
              50% { background-color: rgba(220, 38, 38, 0.3); }
            }
          `}</style>
          <div className="text-center">
            <div className="text-6xl md:text-8xl font-black text-red-500 tracking-widest drop-shadow-[0_0_30px_rgba(220,38,38,1)] animate-pulse">
              ⚠️ WARNING ⚠️
            </div>
            <div className="text-2xl md:text-4xl font-bold text-red-400 mt-4 tracking-wider drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
              BOSS APPROACHING
            </div>
          </div>
        </div>
      )}

      {/* Mobile Hint */}
      {state === GameState.PLAYING && (
        <div className="absolute bottom-10 left-0 right-0 text-center text-white/30 text-[10px] pointer-events-none pb-safe">
          DRAG TO MOVE • COLLECT ITEMS
        </div>
      )}
    </div>
  );
};

// P2 Combo Helper Functions
function getComboColor(level: number): string {
  const colors = ['#ffffff', '#4ade80', '#60a5fa', '#a78bfa', '#f87171'];
  return colors[level] || '#ffffff';
}

function getComboTierName(level: number): string {
  const names = ['', 'COMBO', 'HIGH COMBO', 'SUPER COMBO', 'BERSERK'];
  return names[level] || '';
}

function getProgressToNextTier(comboState: ComboState): number {
  const thresholds = [0, 10, 25, 50, 100];
  const currentThreshold = thresholds[comboState.level];
  const nextThreshold = thresholds[comboState.level + 1];
  if (!nextThreshold) return 0;
  return (comboState.count - currentThreshold) / (nextThreshold - currentThreshold);
}

function getComboMultiplier(level: number, type: 'damage' | 'score'): number {
  const damage = [1.0, 1.2, 1.5, 2.0, 3.0];
  const score = [1.0, 1.5, 2.0, 3.0, 5.0];
  return type === 'damage' ? damage[level] : score[level];
}
