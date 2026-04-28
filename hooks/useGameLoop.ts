
import { useRef, useEffect, useCallback } from 'react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#f97316'];
const KEYS = ['A', 'S', 'J', 'K', 'L'];
const KEY_MAP: Record<string, number> = { a: 0, s: 1, j: 2, k: 3, l: 4 };

class Note {
  lane: number;
  z: number;
  speedZ: number;
  color: string;
  type: 'tap' | 'hold';
  lengthZ: number;
  isActiveHold: boolean;
  missed: boolean;

  constructor(lane: number, z: number, speedZ: number, type: 'tap' | 'hold', lengthZ: number = 0) {
    this.lane = lane;
    this.z = z;
    this.speedZ = speedZ;
    this.color = COLORS[lane];
    this.type = type;
    this.lengthZ = lengthZ;
    this.isActiveHold = false;
    this.missed = false;
  }
}

export function useGameLoop({
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
  onGameEnd
}: any) {
  const notesRef = useRef<Note[]>([]);
  const spawnedIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const activeLanesRef = useRef([false, false, false, false, false]);
  const activeHoldsRef = useRef<(Note | null)[]>([null, null, null, null, null]);
  const currentScoreRef = useRef(0);
  const startGameRequestRef = useRef(false);
  const trackScrollYRef = useRef(0);
  
  const FOCAL_LENGTH = 250;
  const START_Z = 1500;
  const BASE_Y_OFFSET = 500;
  
  const getSpeedZ = useCallback(() => {
    const speedMap: Record<string, number> = { easy: 400, normal: 600, hard: 800, expert: 1100 };
    return speedMap[difficulty] || 600;
  }, [difficulty]);

  const syncScoreUI = useCallback((val: number) => {
    const str = val.toString().padStart(6, '0');
    const s1 = document.getElementById('scoreDisplay');
    const s2 = document.getElementById('scoreDisplayGame');
    if (s1) s1.innerText = str;
    if (s2) s2.innerText = str;
  }, []);

  const triggerMiss = useCallback(() => {
    if (audioGainNodeRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        audioGainNodeRef.current.gain.cancelScheduledValues(now);
        audioGainNodeRef.current.gain.setValueAtTime(audioGainNodeRef.current.gain.value, now);
        audioGainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.02);
        audioGainNodeRef.current.gain.setValueAtTime(0, now + 1.5);
        audioGainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + 1.55);
    }
  }, [audioGainNodeRef, audioCtxRef]);

  const triggerHit = useCallback((laneIndex: number) => {
    if (activeLanesRef.current[laneIndex]) return;
    activeLanesRef.current[laneIndex] = true;
    
    let hitIndex = -1;
    let minDiff = Infinity;
    const notes = notesRef.current;

    for (let j = 0; j < notes.length; j++) {
        const note = notes[j];
        if (note.lane === laneIndex && !note.isActiveHold && !note.missed) {
            const diff = Math.abs(note.z);
            if (diff < 150 && diff < minDiff) { 
               minDiff = diff;
               hitIndex = j;
            }
        }
    }
    
    if (hitIndex !== -1) {
        if (audioGainNodeRef.current && audioCtxRef.current) {
            const now = audioCtxRef.current.currentTime;
            audioGainNodeRef.current.gain.cancelScheduledValues(now);
            audioGainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + 0.02);
        }

        const note = notes[hitIndex];
        if (note.type === 'tap') {
            notes.splice(hitIndex, 1);
            currentScoreRef.current += (minDiff <= 50 ? 10 : 5);
        } else if (note.type === 'hold') {
            note.isActiveHold = true;
            activeHoldsRef.current[laneIndex] = note;
            currentScoreRef.current += (minDiff <= 50 ? 10 : 5);
        }
        syncScoreUI(currentScoreRef.current);
    } else {
        if (gameStateRef.current === 'game') triggerMiss();
    }
  }, [gameStateRef, audioGainNodeRef, audioCtxRef, triggerMiss, syncScoreUI]);

  const triggerRelease = useCallback((laneIndex: number) => {
    activeLanesRef.current[laneIndex] = false;
    const holdNote = activeHoldsRef.current[laneIndex];
    if (holdNote) {
        const idx = notesRef.current.indexOf(holdNote);
        if (idx !== -1) {
            if (holdNote.lengthZ <= 50) {
                notesRef.current.splice(idx, 1);
            } else {
                holdNote.isActiveHold = false;
                holdNote.missed = true;
            }
        }
        activeHoldsRef.current[laneIndex] = null;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    const VP_X = width / 2;
    const VP_Y = 180;
    const FOCAL_LENGTH = 400;
    const BASE_Y_OFFSET = 440;
    const LANE_GAP = 140;
    
    const getScale = (z: number) => Math.max(0.01, FOCAL_LENGTH / (FOCAL_LENGTH + Math.max(z, -FOCAL_LENGTH + 10)));
    const getScreenX = (offsetX: number, z: number) => VP_X + offsetX * getScale(z);
    const getScreenY = (z: number) => VP_Y + BASE_Y_OFFSET * getScale(z);

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const octx = offscreen.getContext('2d');
    if (octx) {
      octx.save();
      octx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      octx.shadowBlur = 10;
      octx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      octx.lineWidth = 3;
      octx.beginPath();
      octx.moveTo(getScreenX(-350, START_Z), getScreenY(START_Z));
      octx.lineTo(getScreenX(-350, -200), getScreenY(-200));
      octx.stroke();
      octx.beginPath();
      octx.moveTo(getScreenX(350, START_Z), getScreenY(START_Z));
      octx.lineTo(getScreenX(350, -200), getScreenY(-200));
      octx.stroke();
      octx.restore();
      octx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 1; i <= 4; i++) {
         const offset = (i - 2.5) * LANE_GAP;
         octx.beginPath();
         octx.moveTo(getScreenX(offset, START_Z), getScreenY(START_Z));
         octx.lineTo(getScreenX(offset, -200), getScreenY(-200));
         octx.stroke();
      }
      octx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      octx.lineWidth = 2;
      octx.beginPath();
      octx.moveTo(getScreenX(-350, 0), getScreenY(0));
      octx.lineTo(getScreenX(350, 0), getScreenY(0));
      octx.stroke();
    }

    let animationId: number;
    let lastFrameTime = performance.now();

    const loop = (time: number) => {
      const deltaTime = Math.min((time - lastFrameTime) / 1000, 0.1);
      lastFrameTime = time;

      if (startGameRequestRef.current) {
        startGameRequestRef.current = false;
        notesRef.current = [];
        spawnedIndexRef.current = 0;
        currentScoreRef.current = 0;
        trackScrollYRef.current = 0;
        syncScoreUI(0);
        
        if (audioCtxRef.current && audioBufferRef.current) {
          const masterGain = audioCtxRef.current.createGain();
          const targetVol = 0.9;
          const audioBuffer = audioBufferRef.current;
          
          if (!('vocals' in audioBuffer)) {
             const source = audioCtxRef.current.createBufferSource();
             source.buffer = audioBuffer as AudioBuffer;
             const peak = Math.max(...source.buffer.getChannelData(0).map(Math.abs));
             masterGain.gain.value = peak > 0 ? targetVol / peak : 1.0;
             const penalty = audioCtxRef.current.createGain();
             audioGainNodeRef.current = penalty;
             source.connect(masterGain).connect(penalty).connect(audioCtxRef.current.destination);
             audioSourcesRef.current = [source];
             source.start();
             startTimeRef.current = audioCtxRef.current.currentTime;
          } else {
             const stems = ['vocals', 'other', 'drums', 'bass'] as const;
             const buffers = audioBuffer as any;
             let maxPeak = 0;
             const len = Math.min(...stems.map(s => buffers[s].getChannelData(0).length));
             for(let i=0; i<len; i+=100) {
                const s = Math.abs(stems.reduce((acc, stem) => acc + buffers[stem].getChannelData(0)[i], 0));
                if(s > maxPeak) maxPeak = s;
             }
             masterGain.gain.value = maxPeak > 0 ? targetVol / maxPeak : 1.0;
             masterGain.connect(audioCtxRef.current.destination);
             const startT = audioCtxRef.current.currentTime;
             stems.forEach(stem => {
                const src = audioCtxRef.current!.createBufferSource();
                src.buffer = buffers[stem];
                const g = audioCtxRef.current!.createGain();
                if((instrumentMode === stem) || (instrumentMode === 'other' && stem === 'other')) audioGainNodeRef.current = g;
                src.connect(g).connect(masterGain);
                audioSourcesRef.current.push(src);
                src.start(startT);
             });
             startTimeRef.current = startT;
          }
        }
      }

      if (gameStateRef.current === 'game') {
        const speed = getSpeedZ();
        trackScrollYRef.current += speed * deltaTime;
        const ts = document.getElementById('trackSurface');
        if (ts) ts.style.transform = `translateY(${(trackScrollYRef.current % 640)}px)`;

        if (audioCtxRef.current) {
          const pbTime = audioCtxRef.current.currentTime - startTimeRef.current;
          const fallT = START_Z / speed;
          const beats = beatMapRef.current;
          while (spawnedIndexRef.current < beats.length) {
            const beat = beats[spawnedIndexRef.current];
            if (pbTime >= beat.time - fallT) {
              beat.notes.forEach((bn: any) => {
                notesRef.current.push(new Note(bn.lane, START_Z, speed, bn.type, bn.duration * speed));
              });
              spawnedIndexRef.current++;
            } else break;
          }
          
          if(audioBufferRef.current) {
            const buf = audioBufferRef.current;
            const duration = 'vocals' in buf ? buf.vocals.duration : buf.duration;
            if(pbTime > duration + 1.0 && spawnedIndexRef.current >= beats.length && notesRef.current.length === 0) {
              onGameEnd(currentScoreRef.current);
            }
          }
        }

        for (let i = notesRef.current.length - 1; i >= 0; i--) {
          const n = notesRef.current[i];
          n.z -= n.speedZ * deltaTime;
          if (n.isActiveHold) {
            currentScoreRef.current += 1;
            syncScoreUI(currentScoreRef.current);
            n.lengthZ -= n.speedZ * deltaTime;
            n.z = 0;
            if (n.lengthZ <= 0) {
              currentScoreRef.current += 50;
              notesRef.current.splice(i, 1);
              activeHoldsRef.current[n.lane] = null;
            }
          } else {
            if (!n.missed && n.z < -100) { triggerMiss(); n.missed = true; }
            if ((n.type === 'hold' ? n.z + n.lengthZ : n.z) < -300) notesRef.current.splice(i, 1);
          }
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(offscreen, 0, 0);

      const hitZ = 0;
      for (let i = 0; i < 5; i++) {
        const x = getScreenX((i - 2) * LANE_GAP, hitZ);
        const y = getScreenY(hitZ);
        const s = getScale(hitZ);
        ctx.beginPath();
        ctx.ellipse(x, y, 60 * s, 22 * s, 0, 0, Math.PI * 2);
        ctx.strokeStyle = activeLanesRef.current[i] ? '#ffffff' : COLORS[i];
        ctx.lineWidth = activeLanesRef.current[i] ? 6 : 3;
        ctx.stroke();
        if (activeLanesRef.current[i]) { ctx.fillStyle = COLORS[i] + '66'; ctx.fill(); }
        ctx.fillStyle = activeLanesRef.current[i] ? '#fff' : 'rgba(255,255,255,0.7)';
        ctx.font = `bold ${activeLanesRef.current[i] ? 24 : 20}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(KEYS[i], x, y + 40);
      }

      // Draw notes (Furthest to Closest)
      const sortedNotes = [...notesRef.current].sort((a, b) => b.z - a.z);
      sortedNotes.forEach(n => {
        if (n.z > START_Z + 500) return;
        ctx.shadowBlur = 0; // Reset shadow state for each note
        const off = (n.lane - 2) * LANE_GAP;
        const color = n.missed ? '#555555' : n.color;
        if (n.type === 'hold' && n.lengthZ > 0 && n.z <= START_Z) {
           const bZ = n.z, tZ = Math.min(n.z + n.lengthZ, START_Z);
           const wB = 45 * getScale(bZ), wT = 45 * getScale(tZ);
           const xB = getScreenX(off, bZ), yB = getScreenY(bZ), xT = getScreenX(off, tZ), yT = getScreenY(tZ);
           ctx.fillStyle = color + '90'; ctx.beginPath();
           ctx.moveTo(xB - wB, yB); ctx.lineTo(xB + wB, yB); ctx.lineTo(xT + wT, yT); ctx.lineTo(xT - wT, yT); ctx.fill();
           if(n.isActiveHold) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(xB, yB, wB, wB*0.35, 0, 0, Math.PI*2); ctx.fill(); }
        }
        const scale = getScale(n.z);
        if (scale < 0.02) return;
        const x = getScreenX(off, n.z), y = getScreenY(n.z);
        const bRX = 50 * scale, bRY = 18 * scale, iBRX = 45 * scale, iBRY = 15 * scale, tRX = 25 * scale, tRY = 9 * scale, nH = 20 * scale;
        const tY = y - nH, nC = n.missed ? '#64748b' : color;
        
        ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.ellipse(x, y, bRX, bRY, 0, 0, Math.PI * 2); ctx.fill();
        const grad = ctx.createLinearGradient(x - iBRX, 0, x + iBRX, 0); grad.addColorStop(0, '#000'); grad.addColorStop(0.3, nC); grad.addColorStop(0.7, nC); grad.addColorStop(1, '#000');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(x, y, iBRX, iBRY, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - iBRX, y); ctx.lineTo(x + iBRX, y); ctx.lineTo(x + tRX, tY); ctx.lineTo(x - tRX, tY); ctx.fill();
        ctx.fillStyle = nC; ctx.beginPath(); ctx.ellipse(x, tY, tRX, tRY, 0, 0, Math.PI * 2); ctx.fill();
        
        const btRX = tRX * 0.4, btRY = tRY * 0.4, btH = 5 * scale, btTY = tY - btH;
        ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.ellipse(x, tY, btRX, btRY, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - btRX, tY); ctx.lineTo(x + btRX, tY); ctx.lineTo(x + btRX, btTY); ctx.lineTo(x - btRX, btTY); ctx.fill();
        
        // Puck top with highlight/glow
        ctx.fillStyle = '#fff'; 
        if (!n.missed && scale > 0.1) {
          ctx.shadowColor = '#fff'; 
          ctx.shadowBlur = 6 * scale;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath(); ctx.ellipse(x, btTY, btRX, btRY, 0, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0; 
        ctx.strokeStyle = n.missed ? '#94a3b8' : '#ffffff'; 
        ctx.lineWidth = Math.max(0.5, 1 * scale);
        ctx.stroke();
      });

      const horizonY = getScreenY(START_Z);
      const fG = ctx.createLinearGradient(0, horizonY - 50, 0, horizonY + 200);
      fG.addColorStop(0, '#000'); fG.addColorStop(0.3, '#000'); fG.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fG; ctx.fillRect(0, 0, width, horizonY + 200);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if(k in KEY_MAP) triggerHit(KEY_MAP[k]);
      else if(e.key === 'Escape') gameStateRef.current === 'game' ? setGameState('paused') : gameStateRef.current === 'paused' ? setGameState('resuming') : null;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if(k in KEY_MAP) triggerRelease(KEY_MAP[k]);
    };
    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      if (gameStateRef.current !== 'game') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      
      const touches = 'touches' in e ? Array.from(e.changedTouches) : [e as PointerEvent];
      
      touches.forEach(t => {
        const x = ('clientX' in t ? t.clientX : (t as any).clientX) - rect.left;
        const y = ('clientY' in t ? t.clientY : (t as any).clientY) - rect.top;
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;
        
        // Check lane based on canvasX
        const lane = Math.round((canvasX - VP_X) / LANE_GAP) + 2;
        if (lane >= 0 && lane < 5 && canvasY > 300) {
          triggerHit(lane);
        }
      });
    };

    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = width / rect.width;
      const touches = 'touches' in e ? Array.from(e.changedTouches) : [e as PointerEvent];
      touches.forEach(t => {
        const x = ('clientX' in t ? t.clientX : (t as any).clientX) - rect.left;
        const canvasX = x * scaleX;
        const lane = Math.round((canvasX - VP_X) / LANE_GAP) + 2;
        if (lane >= 0 && lane < 5) triggerRelease(lane);
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointerdown', handlePointerDown as any);
    canvas.addEventListener('pointerup', handlePointerUp as any);
    canvas.addEventListener('touchstart', (e: TouchEvent) => { e.preventDefault(); handlePointerDown(e); }, { passive: false });
    canvas.addEventListener('touchend', (e: TouchEvent) => { e.preventDefault(); handlePointerUp(e); }, { passive: false });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', handlePointerDown as any);
      canvas.removeEventListener('pointerup', handlePointerUp as any);
    };
  }, [canvasRef, gameStateRef, audioCtxRef, audioBufferRef, audioSourcesRef, audioGainNodeRef, beatMapRef, instrumentMode, onGameEnd, setGameState, getSpeedZ, syncScoreUI, triggerHit, triggerMiss, triggerRelease]);

  return { startGameRequestRef };
}
