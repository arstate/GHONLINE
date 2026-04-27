'use client';

import { useEffect, useRef, useState } from 'react';

export default function RhythmGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');
  const [difficulty, setDifficulty] = useState('normal');

  // Audio and game state refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const beatMapRef = useRef<number[]>([]);
  const spawnedIndexRef = useRef<number>(0);
  const gameActiveRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const difficultyRef = useRef<string>('normal');

  const startGame = () => {
    if (!audioCtxRef.current || !audioBufferRef.current) return;
    
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
    
    setGameState('playing');
    
    // Create source and play
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioCtxRef.current.destination);
    source.start(0);
    
    startTimeRef.current = audioCtxRef.current.currentTime;
    gameActiveRef.current = true;
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

    const speedMap: Record<string, number> = {
      easy: 3,
      normal: 5, // slightly faster to compensate for 60fps avg
      hard: 7,
      expert: 10
    };

    class Note {
      lane: number;
      x: number;
      y: number;
      speed: number;
      color: string;

      constructor(lane: number, x: number) {
        this.lane = lane;
        this.x = x;
        this.y = 0;
        this.speed = speedMap[difficultyRef.current] || 5;
        this.color = colors[lane];
      }
    }

    const notes: Note[] = [];
    let animationId: number;

    const update = () => {
      for (let i = notes.length - 1; i >= 0; i--) {
        notes[i].y += notes[i].speed;
        if (notes[i].y > height) {
          notes.splice(i, 1);
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
        
        ctx.beginPath();
        ctx.arc(note.x, note.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = note.color;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
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
    };

    const gameLoop = () => {
      if (gameActiveRef.current && audioCtxRef.current) {
        const playbackTime = audioCtxRef.current.currentTime - startTimeRef.current;
        const currentSpeed = speedMap[difficultyRef.current] || 5;
        const fallTime = hitboxY / (currentSpeed * 60);

        const beats = beatMapRef.current;
        while (spawnedIndexRef.current < beats.length) {
          const beatTime = beats[spawnedIndexRef.current];
          if (playbackTime >= beatTime - fallTime) {
             const lane = Math.floor(Math.random() * 5);
             const x = (lane * laneWidth) + (laneWidth / 2);
             notes.push(new Note(lane, x));
             spawnedIndexRef.current++;
          } else {
             break;
          }
        }
      }

      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    const handleFileUpload = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;
        const channelData = audioBuffer.getChannelData(0); // Only use channel 0 for detection
        const sampleRate = audioBuffer.sampleRate;
        
        const beatMap: number[] = [];
        const threshold = 0.8;
        const cooldownSecs = 0.2; // 200 milidetik cooldown
        let lastPeakTime = -cooldownSecs;

        for (let i = 0; i < channelData.length; i++) {
          const val = Math.abs(channelData[i]);
          const currentTime = i / sampleRate;
          
          if (val > threshold && (currentTime - lastPeakTime) > cooldownSecs) {
            beatMap.push(currentTime);
            lastPeakTime = currentTime;
          }
        }
        
        console.log("Beatmap generated (timestamps in seconds):", beatMap);
        beatMapRef.current = beatMap;
        setIsReady(true);
      } catch (err) {
        console.error("Error decoding audio data", err);
      }
    };

    const audioUploadElement = document.getElementById('audioUpload');
    audioUploadElement?.addEventListener('change', handleFileUpload);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys if needed
      if (['a', 's', 'j', 'k', 'l'].includes(e.key.toLowerCase())) {
        if (gameActiveRef.current) e.preventDefault();
      }

      const key = e.key.toLowerCase();
      if (key in keyMap) {
        if (!activeLanes[keyMap[key]]) {
          const lane = keyMap[key];
          activeLanes[lane] = true;

          const hitboxTolerance = 40;
          for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note.lane === lane && Math.abs(note.y - hitboxY) < hitboxTolerance) {
              notes.splice(i, 1);
              setScore((prev) => prev + 10);
              break;
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keyMap) {
        activeLanes[keyMap[key]] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    // Start loop
    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      audioUploadElement?.removeEventListener('change', handleFileUpload);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-slate-100 flex items-center justify-center overflow-hidden font-sans relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full"></div>
      </div>

      {/* LOBBY UI */}
      {gameState === 'lobby' && (
        <div className="relative z-20 flex flex-col items-center gap-8 w-full max-w-sm">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-200 drop-shadow-sm uppercase">
              Beat Pulse
            </h1>
            <p className="text-slate-400 text-xs uppercase tracking-[0.3em] font-bold">Web Audio Rhythm</p>
          </div>

          <div className="w-full p-8 bg-[#111] border border-white/5 rounded-2xl shadow-2xl space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Track Selection</label>
              <div className="relative">
                <input type="file" id="audioUpload" accept=".mp3" className="hidden" />
                <label htmlFor="audioUpload" className="flex items-center justify-center w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all text-sm font-medium">
                  {isReady ? 'Upload Another MP3' : 'Import MP3'}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Difficulty</label>
              <select 
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  difficultyRef.current = e.target.value;
                }}
                className="w-full px-4 py-3 bg-[#0c0c0c] border border-white/10 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                style={{ appearance: 'none' }}
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Controls</label>
              <div className="grid grid-cols-5 gap-2">
                {['A', 'S', 'J', 'K', 'L'].map((key, i) => {
                  const colors = ['text-emerald-400 bg-emerald-500/20', 'text-red-400 bg-red-500/20', 'text-yellow-400 bg-yellow-500/20', 'text-blue-400 bg-blue-500/20', 'text-orange-400 bg-orange-500/20'];
                  return (
                    <div key={key} className={`w-10 h-10 mx-auto rounded border border-white/10 flex items-center justify-center text-sm font-bold ${colors[i]}`}>
                      {key}
                    </div>
                  );
                })}
              </div>
            </div>

            {isReady && (
              <button
                onClick={startGame}
                className="w-full px-4 py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest text-sm mt-4"
              >
                Play Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* GAME UI */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-700 ${gameState === 'playing' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
        
        {/* Score Display Overlay */}
        <div className="w-full max-w-[500px] flex justify-between items-center mb-4 px-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Score</span>
            <div className="text-4xl font-black tracking-tighter text-white drop-shadow-md">
              {score.toString().padStart(6, '0')}
            </div>
          </div>
          
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs uppercase tracking-widest text-slate-400 font-bold">
            {difficulty}
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="relative p-1 bg-gradient-to-b from-white/10 to-transparent rounded-xl shadow-2xl">
          <canvas
            ref={canvasRef}
            width={500}
            height={600}
            className="bg-[#0c0c0c] rounded-lg block"
          />
          
          {/* Overlaying UI elements for depth */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-lg shadow-inner"></div>
        </div>
      </div>
    </div>
  );
}

