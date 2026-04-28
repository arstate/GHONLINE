
'use client';

import { useEffect, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, cn } from '../lib/utils';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useGameLoop } from '../hooks/useGameLoop';
import { Lobby } from '../components/Lobby';
import { GameOverlay } from '../components/GameOverlay';
import { Modals } from '../components/Modals';

export default function RhythmGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'game' | 'paused' | 'resuming' | 'postgame'>('lobby');
  const gameStateRef = useRef<'lobby' | 'countdown' | 'game' | 'paused' | 'resuming' | 'postgame'>('lobby');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState('normal');
  const [instrumentMode, setInstrumentMode] = useState<'other' | 'drums' | 'bass'>('drums');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const countdownRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [keyMappings, setKeyMappings] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rhytmika_keys');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to load keys", e);
        }
      }
    }
    return ['a', 's', 'j', 'k', 'l'];
  });
  const [showSettings, setShowSettings] = useState(false);
  const [mappingLane, setMappingLane] = useState<number | null>(null);

  const saveKeys = (keys: string[]) => {
    setKeyMappings(keys);
    localStorage.setItem('rhytmika_keys', JSON.stringify(keys));
  };

  useEffect(() => {
    if (mappingLane === null) return;

    let rafId: number;
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (!gp) continue;
        gp.buttons.forEach((btn, idx) => {
          if (btn.pressed) {
            const newKeys = [...keyMappings];
            newKeys[mappingLane] = `gp:${idx}`;
            saveKeys(newKeys);
            setMappingLane(null);
          }
        });
      }
      if (mappingLane !== null) rafId = requestAnimationFrame(pollGamepad);
    };

    rafId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(rafId);
  }, [mappingLane, keyMappings]);

  const {
    audioCtxRef,
    audioBufferRef,
    audioSourcesRef,
    audioGainNodeRef,
    beatMapRef,
    bpm,
    isLoadingSong,
    loadingProgress,
    isAnalyzing,
    loadSong,
    stopAudio
  } = useAudioEngine();

  const handleGameEnd = (finalScore: number) => {
    setGameState('postgame');
    gameStateRef.current = 'postgame';
    setScore(finalScore);
    playVictorySound();
  };

  const { startGameRequestRef } = useGameLoop({
    canvasRef,
    gameState,
    gameStateRef,
    audioCtxRef,
    audioBufferRef,
    audioSourcesRef,
    audioGainNodeRef,
    beatMapRef,
    difficulty,
    instrumentMode,
    setGameState,
    setScore,
    onGameEnd: handleGameEnd,
    keyMappings
  });

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const resumeGame = () => {
    if (gameStateRef.current === 'paused') {
        setGameState('resuming');
        let count = 5;
        setCountdown(count);
        const interval = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count < 0) {
              clearInterval(interval);
              setGameState('game');
              setCountdown(null);
              if (audioCtxRef.current) audioCtxRef.current.resume();
          }
        }, 1000);
    }
  };

  const startGame = () => {
    setGameState('countdown');
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    let count = 5;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count < 0) {
          clearInterval(interval);
          setGameState('game');
          setCountdown(null);
          startGameRequestRef.current = true;
      }
    }, 1000);
  };

  const handlePlaySong = async () => {
    if (!selectedSong) return;
    const success = await loadSong(selectedSong, difficulty, instrumentMode);
    if (success) {
      setSelectedSong(null);
      startGame();
    } else {
      alert("Failed to load song.");
    }
  };

  const playVictorySound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        const start = ctx.currentTime + (idx * 0.15);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
    });
  };

  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = mainContainerRef.current;
    if (!parent) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (trackContainerRef.current) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          const scale = Math.min(w / 1280, h / 720);
          trackContainerRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
          trackContainerRef.current.style.left = '50%';
          trackContainerRef.current.style.top = '50%';
        }
      }
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#050505] text-slate-100 flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Landscape Warning for mobile */}
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-8 text-center md:hidden portrait:flex landscape:hidden">
          <div className="w-24 h-24 mb-6 text-emerald-500 animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Rotate Your Device</h2>
          <p className="text-emerald-500/60 font-bold uppercase text-sm tracking-widest">Please play in Landscape Mode for the best experience.</p>
      </div>

      {gameState === 'lobby' && (
        <div className="fixed top-8 right-8 z-[9999]">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-5 bg-emerald-500 hover:bg-emerald-400 text-black border-4 border-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(16,185,129,0.5)] group"
          >
            <Settings className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-zinc-900 border-2 border-emerald-500/30 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.2)]"
            >
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <Settings className="w-8 h-8 text-emerald-500 animate-pulse" />
                  SETTINGS
                </h2>
                <button onClick={() => setShowSettings(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div>
                  <h3 className="text-emerald-500 font-bold uppercase text-sm tracking-widest mb-6">Input Mapping</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {keyMappings.map((key, i) => (
                      <div key={i} className="flex flex-col items-center gap-3">
                        <div className={`w-12 h-3 rounded-full ${['bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-orange-500'][i]} shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                        <button 
                          onClick={() => setMappingLane(i)}
                          className={`w-full aspect-square flex items-center justify-center rounded-2xl border-2 transition-all shadow-lg ${
                            mappingLane === i 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse scale-110' 
                              : 'bg-zinc-800 border-zinc-700 text-white hover:border-emerald-500/50'
                          }`}
                        >
                          <span className="text-2xl font-black uppercase">{mappingLane === i ? '?' : (key.startsWith('gp:') ? key.replace('gp:', 'B') : key)}</span>
                        </button>
                        <span className="text-xs text-zinc-500 font-bold uppercase">Lane {i+1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-6 bg-black/50 rounded-3xl border border-zinc-800/50">
                    <p className="text-zinc-400 text-xs leading-relaxed text-center italic">
                      Click a button above then press any key or controller button to remap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-900/50 border-t border-zinc-800 flex gap-4">
                <button 
                  onClick={() => {
                    const defaults = ['a', 's', 'j', 'k', 'l'];
                    saveKeys(defaults);
                  }}
                  className="flex-1 py-5 px-6 rounded-2xl bg-zinc-800 text-zinc-400 font-black tracking-widest hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
                >
                  RESET
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-[2] py-5 px-6 rounded-2xl bg-emerald-500 text-black font-black tracking-widest hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {mappingLane !== null && (
        <div className="fixed inset-0 z-[11000] bg-transparent" 
          tabIndex={0} 
          autoFocus 
          onKeyDown={(e) => {
            const newKeys = [...keyMappings];
            newKeys[mappingLane] = e.key.toLowerCase();
            saveKeys(newKeys);
            setMappingLane(null);
          }}
        />
      )}
        <div className="relative w-full h-full shadow-2xl bg-black flex flex-col overflow-hidden">
          <div ref={mainContainerRef} className="relative w-full h-full overflow-hidden bg-[#000000]">
            <div ref={trackContainerRef} className="absolute overflow-hidden" style={{ width: 1280, height: 720, transformOrigin: 'center center' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ perspective: 400, perspectiveOrigin: '640px 180px', transformStyle: 'preserve-3d' }}>
                <div className="absolute top-[0px] left-0 w-full h-[350px] z-10 bg-gradient-to-b from-black via-black/80 to-transparent" />
                <div style={{ position: 'absolute', left: 290, width: 700, top: 620, height: 5000, transformOrigin: 'center 0', transform: 'rotateX(90deg)', transformStyle: 'preserve-3d' }}>
                  <div id="trackSurface" style={{ position: 'absolute', left: 0, width: '100%', top: -2000, height: 10000, backgroundImage: "url('https://ia902903.us.archive.org/12/items/track1_202604/track1.jpg')", backgroundSize: "700px 640px", opacity: 0.8, willChange: 'transform' }} />
                </div>
              </div>

              <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full touch-none z-10 bg-transparent" />
              
              <GameOverlay score={score} bpm={bpm} gameState={gameState} onPause={() => setGameState('paused')} />
            </div>
            
            {(gameState === 'countdown' || gameState === 'resuming') && countdown !== null && (
               <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                  <div className="text-[180px] font-black text-white drop-shadow-[0_0_60px_#10b981] animate-in zoom-in duration-300">
                    {countdown === 0 ? "GO!" : countdown}
                  </div>
               </div>
            )}
          </div>

          <Modals 
            gameState={gameState}
            selectedSong={selectedSong}
            difficulty={difficulty}
            instrumentMode={instrumentMode}
            setDifficulty={setDifficulty}
            setInstrumentMode={setInstrumentMode}
            isLoadingSong={isLoadingSong}
            loadingProgress={loadingProgress}
            isAnalyzing={isAnalyzing}
            score={score}
            onCancelSelection={() => setSelectedSong(null)}
            onPlaySong={handlePlaySong}
            onResume={resumeGame}
            onBackToLobby={() => { setGameState('lobby'); stopAudio(); }}
            onReplay={() => { setGameState('countdown'); stopAudio(); startGame(); }}
          />

          {gameState === 'lobby' && <Lobby onSelectSong={setSelectedSong} isLoadingSong={isLoadingSong} />}
          
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-lg shadow-inner z-20" />
        </div>
      </div>
  );
}
