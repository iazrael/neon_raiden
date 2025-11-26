
import React from 'react';
import { GameState } from '@/types';
import { getVersion } from '@/game/version';
import { Gallery } from './Gallery';

interface GameUIProps {
  state: GameState;
  score: number;
  level: number;
  hp: number;
  bombs?: number;
  onStart: () => void;
  onRestart: () => void;
  onUseBomb?: () => void;
  showLevelTransition?: boolean;
  levelTransitionTimer?: number;
  maxLevelReached?: number;
  onOpenGallery?: () => void;
  onCloseGallery?: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({
  state, score, level, hp, bombs = 0,
  onStart, onRestart, onUseBomb,
  showLevelTransition = false, levelTransitionTimer = 0,
  maxLevelReached = 1, onOpenGallery, onCloseGallery
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pt-safe font-mono text-white select-none">

      {/* HUD - Always Visible during play */}
      <div className="flex justify-between items-start w-full z-10">
        <div>
          <div className="text-xl font-bold text-yellow-400 drop-shadow-md">SCORE: {score.toString().padStart(6, '0')}</div>
          <div className="text-sm text-gray-300">LEVEL: {level}</div>
        </div>
        <div className="flex flex-col items-end w-1/3">
          <div className="w-full bg-gray-800 h-4 rounded-full border border-gray-600 overflow-hidden relative">
            <div
              className={`h-full ${hp > 50 ? 'bg-gradient-to-r from-green-500 to-green-400' : hp > 20 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-red-500'} transition-all duration-200`}
              style={{ width: `${Math.max(0, hp)}%` }}
            ></div>
          </div>
          <div className="text-xs mt-1 text-gray-400 tracking-wider">SHIELD INTEGRITY</div>
        </div>
      </div>

      {/* Bomb Button (Bottom Right) */}
      {state === GameState.PLAYING && (
        <div className="absolute bottom-12 right-6 pointer-events-auto z-30 flex flex-col items-center gap-1 pb-safe">
          <span className="text-xs font-bold text-red-400 tracking-widest">BOMB x{bombs}</span>
          <button
            onClick={onUseBomb}
            className={`w-20 h-20 rounded-full border-4 ${bombs > 0 ? 'border-red-500 bg-red-600/50 animate-pulse hover:bg-red-500/80 active:scale-95' : 'border-gray-600 bg-gray-800/50 opacity-50'} flex items-center justify-center transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]`}
            disabled={bombs <= 0}
          >
            <span className="text-3xl">☢️</span>
          </button>
        </div>
      )}

      {/* Menus - Pointer events allowed */}
      {state === GameState.MENU && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto z-20 backdrop-blur-sm">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 mb-2 tracking-tighter drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] text-center">
            NEON<br />RAIDEN
          </h1>
          <p className="mb-8 text-cyan-200 text-center text-sm px-4 uppercase tracking-[0.2em] animate-pulse">
            System Online // Awaiting Pilot
          </p>
          <button
            onClick={onStart}
            className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-none border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse active:scale-95 transition-transform skew-x-[-10deg]"
          >
            START MISSION
          </button>

          <button
            onClick={onOpenGallery}
            className="mt-4 px-8 py-3 bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold rounded-none border border-gray-600 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-transform skew-x-[-10deg] text-sm tracking-widest"
          >
            DATABASE
          </button>

          <div className="mt-8 text-xs text-cyan-500/50 tracking-widest font-mono">
            {getVersion()}
          </div>
        </div>
      )}

      {state === GameState.GALLERY && (
        <Gallery onClose={onCloseGallery!} maxLevelReached={maxLevelReached} />
      )}

      {state === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center pointer-events-auto z-20 backdrop-blur-md">
          <h2 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] tracking-widest">CRITICAL FAILURE</h2>
          <div className="text-3xl mb-8 font-light">SCORE: <span className="text-white font-bold">{score}</span></div>
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200 active:scale-95 transition-transform uppercase tracking-widest"
          >
            Reboot System
          </button>
        </div>
      )}

      {state === GameState.VICTORY && (
        <div className="absolute inset-0 bg-yellow-900/90 flex flex-col items-center justify-center pointer-events-auto z-20 backdrop-blur-md">
          <h2 className="text-5xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] tracking-widest">MISSION ACCOMPLISHED</h2>
          <div className="text-3xl mb-8 font-light">SCORE: <span className="text-white font-bold">{score}</span></div>
          <div className="text-center text-sm max-w-xs mb-8 text-yellow-100/80">Galaxy secured. Returning to base.</div>
          <button
            onClick={onRestart}
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
            opacity: levelTransitionTimer < 300 ? levelTransitionTimer / 300 :
              levelTransitionTimer > 1200 ? (1500 - levelTransitionTimer) / 300 : 1
          }}
        >
          <div className="text-2xl font-bold text-cyan-400 tracking-wider drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
            STAGE {level}
          </div>
        </div>
      )}

      {/* Version Display - Bottom Right */}
      {state === GameState.PLAYING && (
        <div className="absolute bottom-4 right-4 text-xs text-white/40 pointer-events-none z-10 pb-safe">
          {getVersion()}
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
