'use client';

import { useEffect, useRef, useState } from 'react';

export default function RhythmGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0); // keep for lobby if needed
  const currentScoreRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'game' | 'postgame'>('lobby');
  const [bpm, setBpm] = useState<number>(0);
  const bpmRef = useRef<number>(0);
  const gameStateRef = useRef<'lobby' | 'countdown' | 'game' | 'postgame'>('lobby');
  const countdownRef = useRef<number | null>(null);
  const audioGainNodeRef = useRef<GainNode | null>(null);
  const [difficulty, setDifficulty] = useState('normal');

  // Audio and game state refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const beatMapRef = useRef<any[]>([]);
  const spawnedIndexRef = useRef<number>(0);
  const gameActiveRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const startGameRequestRef = useRef<boolean>(false);
  const difficultyRef = useRef('normal');
  
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  const startGame = () => {
    setGameState('countdown');
    gameStateRef.current = 'countdown';
    countdownRef.current = 5;
    
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      countdownRef.current = count;
      if (count < 0) {
          clearInterval(interval);
          setGameState('game');
          gameStateRef.current = 'game';
          countdownRef.current = null;
          startGameRequestRef.current = true;
      }
    }, 1000);
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const laneWidth = width / 5;
    const hitboxY = height - 100;
    const colors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#f97316'];
    const keys = ['A', 'S', 'J', 'K', 'L'];
    const keyMap: Record<string, number> = {
      a: 0, s: 1, j: 2, k: 3, l: 4,
    };
    const activeLanes = [false, false, false, false, false];

    const getBpmSetting = (diff: string) => {
      switch (diff) {
        case 'easy': return 158;
        case 'normal': return 165;
        case 'hard': return 175;
        case 'expert': return 180;
        default: return 165;
      }
    };

    const getSpeed = (diff: string) => {
      const simulatedBpm = getBpmSetting(diff);
      return Math.max(3, Math.min(simulatedBpm / 24, 12));
    };

    class Note {
      lane: number;
      x: number;
      y: number;
      speed: number;
      color: string;
      type: 'tap' | 'hold';
      length: number;
      isActiveHold: boolean;

      constructor(lane: number, x: number, speed: number, type: 'tap' | 'hold', length: number = 0) {
        this.lane = lane;
        this.x = x;
        this.y = 0;
        this.speed = speed;
        this.color = colors[lane];
        this.type = type;
        this.length = length;
        this.isActiveHold = false;
      }
    }

    const notes: Note[] = [];
    const activeHolds: (Note | null)[] = [null, null, null, null, null];
    let animationId: number;

    const update = () => {
      for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        note.y += note.speed;
        
        if (note.isActiveHold) {
           currentScoreRef.current += 1;
           const s1 = document.getElementById('scoreDisplay');
           const s2 = document.getElementById('scoreDisplayGame');
           const val = currentScoreRef.current.toString().padStart(6, '0');
           if (s1) s1.innerText = val;
           if (s2) s2.innerText = val;
           
           if (note.y - note.length > hitboxY) {
               currentScoreRef.current += 50;
               notes.splice(i, 1);
               activeHolds[note.lane] = null;
           }
        } else {
           if (note.y > hitboxY + 55) {
               triggerMiss();
               notes.splice(i, 1);
               continue;
           }
        }
      }
    };

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw Lanes Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
        ctx.stroke();
      }

      // Hitbox Area Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, hitboxY - 40, width, 80);

      // Draw Notes
      notes.forEach((note) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = note.color;
        
        if (note.type === 'hold') {
            const holdWidth = 20;
            const topY = note.y - note.length;
            const drawBottomY = note.isActiveHold ? Math.max(topY, hitboxY) : note.y;
            
            // Body
            ctx.fillStyle = note.color + '88';
            ctx.fillRect(note.x - holdWidth / 2, topY, holdWidth, drawBottomY - topY);
            
            // Top Cap
            ctx.beginPath();
            ctx.arc(note.x, topY, holdWidth / 2, 0, Math.PI * 2);
            ctx.fillStyle = note.color;
            ctx.fill();
            
            // Bottom Cap
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(note.x, drawBottomY, 25, 0, Math.PI * 2);
            ctx.fillStyle = note.isActiveHold ? '#ffffff' : note.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(note.x, note.y, 25, 0, Math.PI * 2);
            ctx.fillStyle = note.color;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
      });

      // Draw Buttons in Hitbox
      keys.forEach((key, i) => {
        const x = (i * laneWidth) + (laneWidth / 2);
        const color = colors[i];
        const isActive = activeLanes[i];

        // Button Shadow/Glow
        ctx.shadowBlur = isActive ? 30 : 15;
        ctx.shadowColor = color;
        
        // Outer Circle
        ctx.beginPath();
        ctx.arc(x, hitboxY, isActive ? 34 : 30, 0, Math.PI * 2);
        ctx.strokeStyle = isActive ? '#ffffff' : color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner Fill (Subtle)
        ctx.fillStyle = isActive ? color : color + '22';
        ctx.fill();

        // Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = isActive ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key, x, hitboxY);
      });

      // Subtle Perspective Effect Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, hitboxY - 40);
      ctx.lineTo(width, hitboxY - 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, hitboxY + 40);
      ctx.lineTo(width, hitboxY + 40);
      ctx.stroke();

      if (gameStateRef.current === 'countdown') {
          const txt = countdownRef.current === 0 ? "GO!" : (countdownRef.current?.toString() || "");
          if (txt) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 120px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#10b981';
            ctx.fillText(txt, width / 2, height / 2);
            ctx.shadowBlur = 0;
          }
      }
    };

    const handleGameEnd = () => {
        if (gameStateRef.current === 'postgame') return;
        gameActiveRef.current = false;
        setGameState('postgame');
        gameStateRef.current = 'postgame';
        setScore(currentScoreRef.current);
        
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const victoryNotes = [523.25, 659.25, 783.99, 1046.50];
        victoryNotes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const scheduleTime = ctx.currentTime + (idx * 0.15);
            gain.gain.setValueAtTime(0, scheduleTime);
            gain.gain.linearRampToValueAtTime(0.3, scheduleTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, scheduleTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(scheduleTime);
            osc.stop(scheduleTime + 0.3);
        });
    };

    const gameLoop = () => {
      if (startGameRequestRef.current) {
        startGameRequestRef.current = false;
        notes.length = 0;
        spawnedIndexRef.current = 0;
        currentScoreRef.current = 0;
        
        const s1 = document.getElementById('scoreDisplay');
        const s2 = document.getElementById('scoreDisplayGame');
        if (s1) s1.innerText = '000000';
        if (s2) s2.innerText = '000000';
        
        if (audioBufferRef.current) {
          const channelData = audioBufferRef.current.getChannelData(0);
          const sampleRate = audioBufferRef.current.sampleRate;
          const diff = difficultyRef.current;
          
          let threshold = 0.8;
          let cooldownSecs = 0.2;
          let holdProb = 0.1;
          
          if (diff === 'easy') { threshold = 0.9; cooldownSecs = 0.35; holdProb = 0.05; }
          else if (diff === 'hard') { threshold = 0.6; cooldownSecs = 0.15; holdProb = 0.25; }
          else if (diff === 'expert') { threshold = 0.45; cooldownSecs = 0.1; holdProb = 0.4; }
          
          const beatMap: any[] = [];
          let lastPeakTime = -cooldownSecs;

          for (let i = 0; i < channelData.length; i++) {
            const val = Math.abs(channelData[i]);
            const currentTime = i / sampleRate;
            
            if (val > threshold && (currentTime - lastPeakTime) > cooldownSecs) {
              const numNotes = (diff === 'expert' && val > 0.85) ? (val > 0.95 ? 3 : 2) : (diff === 'hard' && val > 0.9 ? 2 : 1);
              const beatNotes = [];
              let availableLanes = [0,1,2,3,4];
              
              // Only determining `speed` dynamically for `hold` length.
              const spd = getSpeed(diff);
              
              for(let n=0; n<numNotes; n++) {
                  if (availableLanes.length === 0) break;
                  const laneIdx = Math.floor(Math.random() * availableLanes.length);
                  const lane = availableLanes.splice(laneIdx, 1)[0];
                  // If it's a multiple note spawn, only maybe make the first one a hold note
                  const isHold = n === 0 && Math.random() < holdProb;
                  const length = isHold ? (spd * 60 * (0.3 + Math.random() * 0.7)) : 0;
                  beatNotes.push({ lane, type: isHold ? 'hold' : 'tap', length });
              }
              
              beatMap.push({ time: currentTime, energy: val, notes: beatNotes });
              lastPeakTime = currentTime;
            }
          }
          beatMapRef.current = beatMap;
          
          const simulatedBpm = getBpmSetting(diff);
          setBpm(simulatedBpm);
          bpmRef.current = simulatedBpm;
          
          console.log(`Generated ${beatMap.length} beats for ${diff} mode. Simulated BPM: ${simulatedBpm}`);
        }

        if (audioCtxRef.current && audioBufferRef.current) {
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          if (audioSourceRef.current) {
             try { audioSourceRef.current.stop(); } catch(e) {}
          }
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = audioBufferRef.current;
          
          const gainNode = audioCtxRef.current.createGain();
          gainNode.gain.value = 1.0;
          audioGainNodeRef.current = gainNode;
          
          source.connect(gainNode);
          gainNode.connect(audioCtxRef.current.destination);
          
          source.start(0);
          audioSourceRef.current = source;
          
          startTimeRef.current = audioCtxRef.current.currentTime;
          gameActiveRef.current = true;
        }
      }

      const currentSpeed = getSpeed(difficultyRef.current);

      if (gameActiveRef.current && audioCtxRef.current) {
        const playbackTime = audioCtxRef.current.currentTime - startTimeRef.current;
        const fallTime = hitboxY / (currentSpeed * 60);

        const beats = beatMapRef.current;
        while (spawnedIndexRef.current < beats.length) {
          const beat = beats[spawnedIndexRef.current];
          if (playbackTime >= beat.time - fallTime) {
             beat.notes.forEach((bn: any) => {
                 const x = (bn.lane * laneWidth) + (laneWidth / 2);
                 notes.push(new Note(bn.lane, x, currentSpeed, bn.type, bn.length));
             });

             spawnedIndexRef.current++;
          } else {
             break;
          }
        }
        
        if (audioBufferRef.current) {
            const duration = audioBufferRef.current.duration;
            const allSpawned = spawnedIndexRef.current >= beats.length;
            if (playbackTime > duration + 1.0 && allSpawned && notes.length === 0) {
                handleGameEnd();
            }
        }
      }

      if (gameStateRef.current === 'game') {
          update();
      }
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    const handleFileUpload = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      let audioCtx = audioCtxRef.current;
      if (!audioCtx) {
         audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
         audioCtxRef.current = audioCtx;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;
        console.log("Audio decoded successfully.");
        setIsReady(true);
      } catch (err) {
        console.error("Error decoding audio data", err);
      }
    };

    const audioUploadElement = document.getElementById('audioUpload');
    audioUploadElement?.addEventListener('change', handleFileUpload);

    const triggerMiss = () => {
        // Audio penalty removed per user request.
    };

    const triggerHit = (laneIndex: number) => {
        if (activeLanes[laneIndex]) return;
        activeLanes[laneIndex] = true;
        
        let hitIndex = -1;
        let minDiff = Infinity;
        for (let j = 0; j < notes.length; j++) {
            const note = notes[j];
            if (note.lane === laneIndex && !note.isActiveHold) {
                const diff = Math.abs(note.y - hitboxY);
                if (diff < 55 && diff < minDiff) {
                   minDiff = diff;
                   hitIndex = j;
                }
            }
        }
        
        if (hitIndex !== -1) {
            const note = notes[hitIndex];
            if (note.type === 'tap') {
                notes.splice(hitIndex, 1);
                currentScoreRef.current += (minDiff <= 25 ? 10 : 5);
            } else if (note.type === 'hold') {
                note.isActiveHold = true;
                activeHolds[laneIndex] = note;
                currentScoreRef.current += (minDiff <= 25 ? 10 : 5);
            }
            const s1 = document.getElementById('scoreDisplay');
            const s2 = document.getElementById('scoreDisplayGame');
            const val = currentScoreRef.current.toString().padStart(6, '0');
            if (s1) s1.innerText = val;
            if (s2) s2.innerText = val;
        } else {
            if (gameStateRef.current === 'game') {
                triggerMiss();
            }
        }
    };

    const triggerRelease = (laneIndex: number) => {
        activeLanes[laneIndex] = false;
        if (activeHolds[laneIndex]) {
            const holdNote = activeHolds[laneIndex];
            const idx = notes.indexOf(holdNote!);
            if (idx !== -1) {
                if (holdNote!.y - holdNote!.length > hitboxY - 25) {
                    // Valid early finish (tolerance)
                } else {
                    triggerMiss();
                }
                notes.splice(idx, 1);
            }
            activeHolds[laneIndex] = null;
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keyMap) {
        triggerHit(keyMap[key]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keyMap) {
        triggerRelease(keyMap[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const touchLaneMap: Record<number, number> = {};

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (!gameActiveRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const hwFactor = width / rect.width;
      
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const x = (touch.clientX - rect.left) * hwFactor; // x relative to canvas
        const laneIndex = Math.floor(x / laneWidth);
        
        if (laneIndex >= 0 && laneIndex < 5) {
          touchLaneMap[touch.identifier] = laneIndex;
          triggerHit(laneIndex);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const laneIndex = touchLaneMap[touch.identifier];
        if (laneIndex !== undefined) {
          triggerRelease(laneIndex);
          delete touchLaneMap[touch.identifier];
        }
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Start loop
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      audioUploadElement?.removeEventListener('change', handleFileUpload);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-slate-100 flex items-center justify-center overflow-hidden font-sans p-4">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-[500px] flex justify-center z-10 aspect-[5/8]">
        <div className="relative w-full h-full shadow-2xl rounded-xl p-1 bg-gradient-to-b from-white/10 to-transparent flex flex-col">
          
          {/* Game Canvas Container */}
          <canvas
            ref={canvasRef}
            width={500}
            height={800}
            className="w-full h-auto bg-[#0c0c0c] rounded-lg block touch-none"
          />
          
          {/* Game UI Overlay */}
          {(gameState === 'game' || gameState === 'countdown') && (
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-30">
              <div id="scoreDisplayGame" className="text-3xl font-black tracking-tighter text-white drop-shadow-md">
                000000
              </div>
              <div className="text-sm font-bold tracking-widest text-emerald-400 drop-shadow-md mt-1">
                BPM: {bpm}
              </div>
            </div>
          )}

          {/* Lobby UI Overlay */}
          {gameState === 'lobby' && (
            <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md rounded-lg flex flex-col items-center justify-center p-8 text-center z-40 border border-white/5">
              <h1 className="text-5xl font-black tracking-tighter text-white mb-8 drop-shadow-lg">
                BEAT<span className="text-emerald-500">SCAPE</span>
              </h1>
              
              <div className="w-full space-y-6">
                 <div className="space-y-3">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-bold block">Track Selection</label>
                    <div className="relative">
                      <input type="file" id="audioUpload" accept=".mp3" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                      <div className="flex items-center justify-center w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg pointer-events-none transition-all text-sm font-medium text-white/90">
                        {isReady ? 'Upload Another MP3' : 'Import MP3'}
                      </div>
                    </div>
                 </div>
                 
                 <div className="space-y-3 relative z-20">
                   <label className="text-xs uppercase tracking-widest text-slate-500 font-bold block">Difficulty</label>
                   <select 
                     className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none text-center font-medium cursor-pointer"
                     value={difficulty}
                     onChange={(e) => setDifficulty(e.target.value)}
                   >
                     <option value="easy" className="bg-[#111]">Easy</option>
                     <option value="normal" className="bg-[#111]">Normal</option>
                     <option value="hard" className="bg-[#111]">Hard</option>
                     <option value="expert" className="bg-[#111]">Expert</option>
                   </select>
                 </div>

                 {isReady && (
                    <button
                      onClick={startGame}
                      className="w-full px-4 py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest text-sm mt-6 z-20 relative active:scale-95"
                    >
                      Mulai Game
                    </button>
                  )}
              </div>
            </div>
          )}

          {/* Post-Game UI Overlay */}
          {gameState === 'postgame' && (
            <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-center rounded-lg border border-white/10 p-8">
              <h2 className="text-3xl font-black text-white mb-2 tracking-widest uppercase">Your Score</h2>
              <div className="text-6xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] mb-8">
                {score.toString().padStart(6, '0')}
              </div>
              <div className="flex flex-col gap-4 w-full">
                <button 
                  onClick={startGame}
                  className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
                >
                  Replay
                </button>
                <button 
                  onClick={() => {
                    setGameState('lobby');
                    gameStateRef.current = 'lobby';
                    if (audioSourceRef.current) {
                        try { audioSourceRef.current.stop(); } catch(e){}
                    }
                  }}
                  className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg uppercase tracking-wider transition-all backdrop-blur-md border border-white/5 active:scale-95"
                >
                  Back to Lobby
                </button>
              </div>
            </div>
          )}

          {/* Subtle Overlay Lines */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-lg shadow-inner z-20"></div>
        </div>
      </div>
    </div>
  );
}
