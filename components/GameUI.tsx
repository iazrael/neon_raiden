import React from 'react';
import { GameState } from '../types';

interface GameUIProps {
  state: GameState;
  score: number;
  level: number;
  hp: number;
  onStart: () => void;
  onRestart: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ state, score, level, hp, onStart, onRestart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono text-white select-none">
      
      {/* HUD - Always Visible during play */}
      <div className="flex justify-between items-start w-full z-10">
        <div>
          <div className="text-xl font-bold text-yellow-400">SCORE: {score.toString().padStart(6, '0')}</div>
          <div className="text-sm text-gray-300">LEVEL: {level}</div>
        </div>
        <div className="flex flex-col items-end w-1/3">
           <div className="w-full bg-gray-700 h-4 rounded border border-gray-500 overflow-hidden">
             <div 
               className={`h-full ${hp > 50 ? 'bg-green-500' : hp > 20 ? 'bg-yellow-500' : 'bg-red-500'} transition-all duration-200`} 
               style={{ width: `${Math.max(0, hp)}%` }}
             ></div>
           </div>
           <div className="text-xs mt-1">SHIELD</div>
        </div>
      </div>

      {/* Menus - Pointer events allowed */}
      {state === GameState.MENU && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto z-20">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 mb-8 tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] text-center">
            NEON<br/>RAIDEN
          </h1>
          <p className="mb-8 text-cyan-200 text-center text-sm px-4">
            Drag to Move • Auto Fire • Destroy Bosses
          </p>
          <button 
            onClick={onStart}
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse active:scale-95 transition-transform"
          >
            START MISSION
          </button>
        </div>
      )}

      {state === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center pointer-events-auto z-20">
          <h2 className="text-5xl font-bold text-red-500 mb-4 drop-shadow-md">MISSION FAILED</h2>
          <div className="text-2xl mb-8">FINAL SCORE: {score}</div>
          <button 
            onClick={onRestart}
            className="px-8 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200 active:scale-95 transition-transform"
          >
            RETRY
          </button>
        </div>
      )}

      {state === GameState.VICTORY && (
        <div className="absolute inset-0 bg-yellow-900/80 flex flex-col items-center justify-center pointer-events-auto z-20">
          <h2 className="text-5xl font-bold text-yellow-400 mb-4 drop-shadow-md">MISSION COMPLETE</h2>
          <div className="text-2xl mb-8">FINAL SCORE: {score}</div>
          <div className="text-center text-sm max-w-xs mb-8">You have saved the galaxy from the neon shapes!</div>
          <button 
            onClick={onRestart}
            className="px-8 py-3 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-300 active:scale-95 transition-transform"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
      
      {/* Mobile Hint */}
      {state === GameState.PLAYING && (
         <div className="text-center text-white/20 text-xs mb-4">
            TOUCH & DRAG TO MOVE
         </div>
      )}
    </div>
  );
};