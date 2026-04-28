
import React from 'react';

interface GameOverlayProps {
  score: number;
  bpm: number;
  onPause: () => void;
  gameState: string;
}

export function GameOverlay({ score, bpm, onPause, gameState }: GameOverlayProps) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-30">
      <div id="scoreDisplayGame" className="text-3xl font-black tracking-tighter text-white drop-shadow-md">
        {score.toString().padStart(6, '0')}
      </div>
      <div className="flex gap-4 pointer-events-auto items-center">
        <div className="text-sm font-bold tracking-widest text-emerald-400 drop-shadow-md mt-1 mr-2">
          BPM: {bpm}
        </div>
        {gameState === 'game' && (
          <button 
            onClick={onPause}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg transition-all backdrop-blur-md"
            aria-label="Pause Game"
          >
             <div className="flex gap-1.5 pl-0.5">
                 <div className="w-1.5 h-4 bg-white rounded-sm"></div>
                 <div className="w-1.5 h-4 bg-white rounded-sm"></div>
             </div>
          </button>
        )}
      </div>
    </div>
  );
}
