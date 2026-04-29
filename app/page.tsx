
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
  const [gameMode, setGameMode] = useState<'single' | 'multiplayer'>('single');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoDownloadProgress, setVideoDownloadProgress] = useState(0);
  const [videoDownloadedBytes, setVideoDownloadedBytes] = useState(0);
  const [videoTotalBytes, setVideoTotalBytes] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const VIDEO_SOURCE_URL = "https://res.cloudinary.com/dxghgdt9t/video/upload/v1777434968/8K_60FPS_Paranoid_-_Black_Sabbath_-_Pandora_720p_h264_ytllwb.mp4";

  // Pre-download video for caching
  useEffect(() => {
    const downloadVideo = async () => {
      try {
        const response = await fetch(VIDEO_SOURCE_URL);
        if (!response.body) return;
        
        const reader = response.body.getReader();
        const contentLength = +(response.headers.get('Content-Length') || 0);
        let receivedLength = 0;
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          setVideoDownloadedBytes(receivedLength);
          if (contentLength) {
            setVideoTotalBytes(contentLength);
            setVideoDownloadProgress(Math.round((receivedLength / contentLength) * 100));
          }
        }

        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
      } catch (e) {
        console.error("Failed to pre-download video:", e);
        setVideoBlobUrl("error");
      }
    };
    downloadVideo();
  }, []);

  // Sync video with game state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (gameState === 'game' || gameState === 'countdown' || gameState === 'resuming') {
      if (video.currentTime < 5) video.currentTime = 5;
      video.play().catch(e => console.warn("Video play interrupted:", e));
    } else if (gameState === 'paused' || gameState === 'postgame') {
      video.pause();
    } else if (gameState === 'lobby') {
      video.currentTime = 5;
    }
  }, [gameState]);
  const countdownRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioOffset, setAudioOffset] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rhytmika_audio_offset');
      if (saved) return parseInt(saved, 10);
    }
    return 0;
  });

  const [p1Keys, setP1Keys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rhytmika_p1_keys');
      if (saved) try { return JSON.parse(saved); } catch (e) {}
    }
    return ['a', 's', 'j', 'k', 'l'];
  });

  const [p2Keys, setP2Keys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rhytmika_p2_keys');
      if (saved) try { return JSON.parse(saved); } catch (e) {}
    }
    return ['1', '2', '3', '4', '5'];
  });

  const [mappingPlayer, setMappingPlayer] = useState<1 | 2>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [mappingLane, setMappingLane] = useState<number | null>(null);

  const saveKeys = (player: 1 | 2, keys: string[]) => {
    if (player === 1) {
      setP1Keys(keys);
      localStorage.setItem('rhytmika_p1_keys', JSON.stringify(keys));
    } else {
      setP2Keys(keys);
      localStorage.setItem('rhytmika_p2_keys', JSON.stringify(keys));
    }
  };

  const saveOffset = (offset: number) => {
    setAudioOffset(offset);
    localStorage.setItem('rhytmika_audio_offset', offset.toString());
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
            const currentKeys = mappingPlayer === 1 ? p1Keys : p2Keys;
            const newKeys = [...currentKeys];
            newKeys[mappingLane] = `gp:${idx}`;
            saveKeys(mappingPlayer, newKeys);
            setMappingLane(null);
          }
        });
      }
      if (mappingLane !== null) rafId = requestAnimationFrame(pollGamepad);
    };
    rafId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(rafId);
  }, [mappingLane, p1Keys, p2Keys, mappingPlayer]);

  const {
    audioCtxRef,
    audioBufferRef,
    audioSourcesRef,
    audioGainNodeRef,
    audioGainP2Ref,
    beatMapRef,
    beatMapP2Ref,
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
    audioGainP2Ref,
    beatMapRef,
    beatMapP2Ref,
    difficulty,
    instrumentMode,
    gameMode,
    setGameState,
    setScore,
    onGameEnd: handleGameEnd,
    p1Keys,
    p2Keys,
    audioOffset
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
    const success = await loadSong(selectedSong, difficulty, instrumentMode, gameMode);
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
                <div className="flex gap-2 p-1 bg-black/50 rounded-2xl border border-zinc-800">
                  <button 
                    onClick={() => setMappingPlayer(1)}
                    className={cn("flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all", mappingPlayer === 1 ? "bg-emerald-500 text-black" : "text-zinc-500 hover:text-white")}
                  >
                    PLAYER 1
                  </button>
                  <button 
                    onClick={() => setMappingPlayer(2)}
                    className={cn("flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all", mappingPlayer === 2 ? "bg-emerald-500 text-black" : "text-zinc-500 hover:text-white")}
                  >
                    PLAYER 2
                  </button>
                </div>

                <div>
                  <h3 className="text-emerald-500 font-bold uppercase text-sm tracking-widest mb-6">Input Mapping</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {(mappingPlayer === 1 ? p1Keys : p2Keys).map((key, i) => (
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
                      Configuring {mappingPlayer === 1 ? 'Player 1' : 'Player 2'}. Click a button above then press any key or controller button to remap.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-emerald-500 font-bold uppercase text-sm tracking-widest">Audio Sync (Latency)</h3>
                    <span className={cn("text-lg font-black font-mono px-3 py-1 rounded bg-black", audioOffset > 0 ? "text-rose-400" : audioOffset < 0 ? "text-blue-400" : "text-emerald-400")}>
                      {audioOffset > 0 ? '+' : ''}{audioOffset}ms
                    </span>
                  </div>
                  <div className="px-4">
                    <input 
                      type="range" 
                      min="-500" 
                      max="500" 
                      step="5"
                      value={audioOffset} 
                      onChange={(e) => saveOffset(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                      <span>Notes Late (-500ms)</span>
                      <span>Balanced (0ms)</span>
                      <span>Notes Early (+500ms)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-900/50 border-t border-zinc-800 flex gap-4">
                <button 
                  onClick={() => {
                    const defaults = mappingPlayer === 1 ? ['a', 's', 'j', 'k', 'l'] : ['h', 'j', 'k', 'l', ';'];
                    saveKeys(mappingPlayer, defaults);
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
            const currentKeys = mappingPlayer === 1 ? p1Keys : p2Keys;
            const newKeys = [...currentKeys];
            newKeys[mappingLane] = e.key.toLowerCase();
            saveKeys(mappingPlayer, newKeys);
            setMappingLane(null);
          }}
        />
      )}
        <div className="relative w-full h-full shadow-2xl bg-black flex flex-col overflow-hidden">
          <div ref={mainContainerRef} className="relative w-full h-full overflow-hidden bg-black z-0">
            {/* BACKGROUND VIDEO */}
            {videoBlobUrl && videoBlobUrl !== "error" && (
              <video 
                ref={videoRef}
                muted 
                playsInline 
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-10",
                  (gameState === 'game' || gameState === 'paused' || gameState === 'resuming' || gameState === 'countdown') ? "opacity-60" : "opacity-0"
                )}
                onEnded={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 5;
                    videoRef.current.play();
                  }
                }}
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  if (video.currentTime >= 180 && gameState !== 'lobby' && gameState !== 'postgame') {
                    video.currentTime = 5;
                  }
                }}
              >
                <source src={videoBlobUrl} type="video/mp4" />
              </video>
            )}
            <div ref={trackContainerRef} className="absolute overflow-hidden z-20" style={{ width: 1280, height: 720, transformOrigin: 'center center' }}>
              {/* TEXTURE LAYER - ROTASI 90 DERAJAT SEMPURNA */}
              <div 
                className="absolute inset-0 z-0 pointer-events-none" 
                style={{ 
                  maskImage: 'linear-gradient(to bottom, transparent 280px, transparent 330px, black 350px)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 280px, transparent 330px, black 350px)'
                }}
              >
                {gameMode === 'single' ? (
                  <div className="absolute inset-0" style={{ perspective: '400px', perspectiveOrigin: '50% 180px' }}>
                     <div id="trackSurfaceP1" className="absolute" 
                          style={{ 
                            left: '50%', 
                            bottom: '0px', // Full screen bottom
                            width: '700px', 
                            height: '4000px', 
                            marginLeft: '-350px',
                            transformOrigin: 'center calc(100% - 100px)', // Pivot remains at Y=620
                            transform: 'rotateX(90deg)',      // Rebahan sempurna jadi lantai 3D
                            backgroundImage: `url('https://dn720801.ca.archive.org/0/items/track1_202604/track1.jpg')`, 
                            backgroundRepeat: 'repeat-y', 
                            backgroundSize: '100% 400px',
                            opacity: 1
                          }} />
                  </div>
                ) : (
                  <>
                    {/* P1 Kiri (Multiplayer) */}
                    <div className="absolute top-0 left-0 w-1/2 h-full" style={{ perspective: '400px', perspectiveOrigin: '50% 180px' }}>
                       <div id="trackSurfaceP1" className="absolute" 
                            style={{ 
                              left: '50%', 
                              bottom: '0px', 
                              width: '350px', 
                              height: '4000px', 
                              marginLeft: '-175px', 
                              transformOrigin: 'center calc(100% - 100px)', 
                              transform: 'rotateX(90deg)', 
                              backgroundImage: `url('https://dn720801.ca.archive.org/0/items/track1_202604/track1.jpg')`, 
                              backgroundRepeat: 'repeat-y', 
                              backgroundSize: '100% 200px', 
                              opacity: 1 
                            }} />
                    </div>
                    {/* P2 Kanan (Multiplayer) */}
                    <div className="absolute top-0 right-0 w-1/2 h-full" style={{ perspective: '400px', perspectiveOrigin: '50% 180px' }}>
                       <div id="trackSurfaceP2" className="absolute" 
                            style={{ 
                              left: '50%', 
                              bottom: '0px', 
                              width: '350px', 
                              height: '4000px', 
                              marginLeft: '-175px', 
                              transformOrigin: 'center calc(100% - 100px)', 
                              transform: 'rotateX(90deg)', 
                              backgroundImage: `url('https://dn720801.ca.archive.org/0/items/track1_202604/track1.jpg')`, 
                              backgroundRepeat: 'repeat-y', 
                              backgroundSize: '100% 200px', 
                              opacity: 1 
                            }} />
                    </div>
                  </>
                )}
              </div>

              <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full touch-none z-20 bg-transparent" />
              
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
            gameMode={gameMode}
            setDifficulty={setDifficulty}
            setInstrumentMode={setInstrumentMode}
            setGameMode={setGameMode}
            isLoadingSong={isLoadingSong}
            loadingProgress={loadingProgress}
            videoDownloadProgress={videoDownloadProgress}
            videoDownloadedBytes={videoDownloadedBytes}
            videoTotalBytes={videoTotalBytes}
            videoBlobUrl={videoBlobUrl}
            isAnalyzing={isAnalyzing}
            score={score}
            audioOffset={audioOffset}
            setAudioOffset={saveOffset}
            onCancelSelection={() => setSelectedSong(null)}
            onPlaySong={handlePlaySong}
            onResume={resumeGame}
            onBackToLobby={() => { setGameState('lobby'); stopAudio(); }}
            onReplay={() => { setGameState('countdown'); stopAudio(); startGame(); }}
            onOpenSettings={() => setShowSettings(true)}
          />

          {gameState === 'lobby' && <Lobby onSelectSong={setSelectedSong} isLoadingSong={isLoadingSong} />}
          
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-lg shadow-inner z-20" />
        </div>
      </div>
  );
}
