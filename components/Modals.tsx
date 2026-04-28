
import React from 'react';
import { Song } from '../lib/utils';

interface ModalsProps {
  gameState: 'lobby' | 'countdown' | 'game' | 'paused' | 'resuming' | 'postgame';
  selectedSong: Song | null;
  difficulty: string;
  instrumentMode: 'other' | 'drums' | 'bass';
  gameMode: 'single' | 'multiplayer';
  setDifficulty: (diff: string) => void;
  setInstrumentMode: (inst: 'other' | 'drums' | 'bass') => void;
  setGameMode: (mode: 'single' | 'multiplayer') => void;
  isLoadingSong: boolean;
  loadingProgress: number;
  isAnalyzing: boolean;
  score: number;
  onCancelSelection: () => void;
  onPlaySong: () => void;
  onResume: () => void;
  onBackToLobby: () => void;
  onReplay: () => void;
}

export function Modals({
  gameState,
  selectedSong,
  difficulty,
  instrumentMode,
  gameMode,
  setDifficulty,
  setInstrumentMode,
  setGameMode,
  isLoadingSong,
  loadingProgress,
  isAnalyzing,
  score,
  onCancelSelection,
  onPlaySong,
  onResume,
  onBackToLobby,
  onReplay
}: ModalsProps) {
  return (
    <>
      {/* Difficulty Selection */}
      {selectedSong && gameState === 'lobby' && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                    {selectedSong.title}
                </h2>
                
                {selectedSong.stems && (
                  <div className="mb-6 mt-4">
                    <div className="text-emerald-500/80 font-bold tracking-widest text-xs uppercase mb-3">
                        Game Mode
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['single', 'multiplayer'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setGameMode(mode)}
                                className={`py-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 ${
                                    gameMode === mode 
                                    ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]' 
                                    : 'border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 bg-neutral-950/50'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="text-emerald-500/80 font-bold tracking-widest text-xs uppercase mb-4">
                    Select Difficulty
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    {(['easy', 'normal', 'hard', 'expert'] as const).map(diff => (
                        <button
                            key={diff}
                            onClick={() => setDifficulty(diff)}
                            className={`py-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 ${
                                difficulty === diff 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                                : 'border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 bg-neutral-950/50'
                            }`}
                        >
                            {diff}
                        </button>
                    ))}
                </div>

                {selectedSong.stems && gameMode === 'single' && (
                  <div className="mb-8">
                    <div className="text-emerald-500/80 font-bold tracking-widest text-xs uppercase mb-3">
                        Target Instrument
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['other', 'drums', 'bass'] as const).map(inst => (
                            <button
                                key={inst}
                                onClick={() => setInstrumentMode(inst)}
                                className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all border ${
                                    instrumentMode === inst 
                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                    : 'border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 bg-neutral-950/50'
                                }`}
                            >
                                {inst === 'other' ? 'Guitar/Keys' : inst}
                            </button>
                        ))}
                    </div>
                  </div>
                )}
                
                {selectedSong.stems && gameMode === 'multiplayer' && (
                   <div className="mb-8 p-4 bg-black/40 rounded-xl border border-rose-500/20 text-center">
                     <p className="text-neutral-400 text-xs font-bold uppercase tracking-tighter">
                       P1: Guitar/Keys <span className="text-rose-500 mx-2">VS</span> P2: Drums
                     </p>
                   </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onCancelSelection} disabled={isLoadingSong} className="flex-1 py-4 font-bold rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-50">CANCEL</button>
                    <button onClick={onPlaySong} disabled={isLoadingSong} className="flex-[2] py-4 font-black rounded-xl bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 tracking-widest">
                        {isLoadingSong ? 'LOADING...' : 'LET\'S GO'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Pause Menu */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center z-50 text-center rounded-lg border border-white/10 p-8 shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-8 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Paused</h2>
          <div className="flex flex-col gap-4 w-full max-w-xs">
              <button onClick={onResume} className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]">Resume</button>
              <button onClick={onBackToLobby} className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg uppercase tracking-wider transition-all backdrop-blur-md border border-white/5 active:scale-95">Back to Lobby</button>
          </div>
        </div>
      )}

      {/* Post Game */}
      {gameState === 'postgame' && (
        <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-center rounded-lg border border-white/10 p-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-widest uppercase">Your Score</h2>
          <div className="text-6xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] mb-8">
            {score.toString().padStart(6, '0')}
          </div>
          <div className="flex flex-col gap-4 w-full">
            <button onClick={onReplay} className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95">Replay</button>
            <button onClick={onBackToLobby} className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg uppercase tracking-wider transition-all backdrop-blur-md border border-white/5 active:scale-95">Back to Lobby</button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(isLoadingSong || isAnalyzing) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-sm transition-all animate-in fade-in duration-300">
          <div className="text-center px-6">
            <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-emerald-500 font-black text-xl z-10">{isLoadingSong && !isAnalyzing ? `${loadingProgress}%` : ""}</div>
            </div>
            <h3 className="text-emerald-500 font-black text-2xl tracking-[0.2em] uppercase mb-3 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              {isAnalyzing ? "Analyzing Spectrum" : "Loading Track"}
            </h3>
            <p className="text-white/60 font-bold text-xs tracking-widest uppercase animate-pulse">
              {isAnalyzing ? "Mapping Genre-Adaptive Peaks..." : "Buffering Audio Stream..."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
