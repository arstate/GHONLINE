
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
  audioGainP2Ref,
  beatMapRef,
  beatMapP2Ref,
  difficulty,
  instrumentMode,
  gameMode, // 'single' | 'multiplayer'
  setGameState,
  setScore,
  onGameEnd,
  p1Keys,
  p2Keys,
  audioOffset,
  hitButtonImgs,
  hitButtonPressedImgs,
  activeSong
}: any) {
  const notesP1Ref = useRef<Note[]>([]);
  const notesP2Ref = useRef<Note[]>([]);
  const spawnedIndexP1Ref = useRef(0);
  const spawnedIndexP2Ref = useRef(0);
  const startTimeRef = useRef(0);
  const activeLanesP1Ref = useRef([false, false, false, false, false]);
  const activeLanesP2Ref = useRef([false, false, false, false, false]);
  const activeHoldsP1Ref = useRef<(Note | null)[]>([null, null, null, null, null]);
  const activeHoldsP2Ref = useRef<(Note | null)[]>([null, null, null, null, null]);
  const scoreP1Ref = useRef(0);
  const scoreP2Ref = useRef(0);
  const startGameRequestRef = useRef(false);
  const laneHitStatesP1Ref = useRef([0, 0, 0, 0, 0]);
  const laneHitStatesP2Ref = useRef([0, 0, 0, 0, 0]);
  const trackScrollYRef = useRef(0);
  
  const FOCAL_LENGTH = 250;
  const START_Z = gameMode === 'multiplayer' ? 1500 : 4000;
  const BASE_Y_OFFSET = 500;
  
  const getSpeedZ = useCallback(() => {
    if (activeSong?.customBeatmap?.speeds) {
       const lookupDiff = difficulty === 'expert' ? 'extreme' : difficulty;
       if (activeSong.customBeatmap.speeds[lookupDiff]) {
         return activeSong.customBeatmap.speeds[lookupDiff];
       }
    }
    const speedMap: Record<string, number> = { easy: 400, normal: 600, hard: 1000, expert: 1000 };
    return speedMap[difficulty] || 600;
  }, [difficulty, activeSong]);

  const syncScoreUI = useCallback(() => {
    const s1 = document.getElementById('scoreDisplay');
    const s2 = document.getElementById('scoreDisplayGame');
    if (gameMode === 'multiplayer') {
      const p1Str = scoreP1Ref.current.toString().padStart(6, '0');
      const p2Str = scoreP2Ref.current.toString().padStart(6, '0');
      if (s1) s1.textContent = `${p1Str} | ${p2Str}`;
      if (s2) s2.textContent = `${p1Str} | ${p2Str}`;
    } else {
      const str = scoreP1Ref.current.toString().padStart(6, '0');
      if (s1) s1.textContent = str;
      if (s2) s2.textContent = str;
    }
  }, [gameMode]);

  const triggerMissP1 = useCallback(() => {
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

  const triggerMissP2 = useCallback(() => {
    const gain = gameMode === 'multiplayer' ? audioGainP2Ref.current : audioGainNodeRef.current;
    if (gain && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.02);
        gain.gain.setValueAtTime(0, now + 1.5);
        gain.gain.linearRampToValueAtTime(1.0, now + 1.55);
    }
  }, [audioGainP2Ref, audioGainNodeRef, audioCtxRef, gameMode]);

  const triggerHitP1 = useCallback((laneIndex: number) => {
    if (activeLanesP1Ref.current[laneIndex]) return;
    activeLanesP1Ref.current[laneIndex] = true;
    
    let hitIndex = -1;
    let minDiff = Infinity;
    const notes = notesP1Ref.current;

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
            audioGainNodeRef.current.gain.setValueAtTime(audioGainNodeRef.current.gain.value, now);
            audioGainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + 0.02);
        }
        const note = notes[hitIndex];
        if (note.type === 'tap') {
            notes.splice(hitIndex, 1);
            scoreP1Ref.current += (minDiff <= 50 ? 10 : 5);
            laneHitStatesP1Ref.current[laneIndex] = 0.15;
        } else if (note.type === 'hold') {
            note.isActiveHold = true;
            activeHoldsP1Ref.current[laneIndex] = note;
            scoreP1Ref.current += (minDiff <= 50 ? 10 : 5);
        }
        syncScoreUI();
    } else {
        if (gameStateRef.current === 'game') triggerMissP1();
    }
  }, [gameStateRef, audioGainNodeRef, audioCtxRef, triggerMissP1, syncScoreUI]);

  const triggerHitP2 = useCallback((laneIndex: number) => {
    if (activeLanesP2Ref.current[laneIndex]) return;
    activeLanesP2Ref.current[laneIndex] = true;
    
    let hitIndex = -1;
    let minDiff = Infinity;
    const notes = notesP2Ref.current;

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
        const gain = gameMode === 'multiplayer' ? audioGainP2Ref.current : audioGainNodeRef.current;
        if (gain && audioCtxRef.current) {
            const now = audioCtxRef.current.currentTime;
            gain.gain.cancelScheduledValues(now);
            gain.gain.setValueAtTime(gain.gain.value, now);
            gain.gain.linearRampToValueAtTime(1.0, now + 0.02);
        }
        const note = notes[hitIndex];
        if (note.type === 'tap') {
            notes.splice(hitIndex, 1);
            scoreP2Ref.current += (minDiff <= 50 ? 10 : 5);
            laneHitStatesP2Ref.current[laneIndex] = 0.15;
        } else if (note.type === 'hold') {
            note.isActiveHold = true;
            activeHoldsP2Ref.current[laneIndex] = note;
            scoreP2Ref.current += (minDiff <= 50 ? 10 : 5);
        }
        syncScoreUI();
    } else {
        if (gameStateRef.current === 'game') triggerMissP2();
    }
  }, [gameStateRef, audioGainP2Ref, audioGainNodeRef, audioCtxRef, triggerMissP2, syncScoreUI, gameMode]);

  const triggerReleaseP1 = useCallback((laneIndex: number) => {
    activeLanesP1Ref.current[laneIndex] = false;
    const holdNote = activeHoldsP1Ref.current[laneIndex];
    if (holdNote) {
        const idx = notesP1Ref.current.indexOf(holdNote);
        if (idx !== -1) {
            if (holdNote.lengthZ <= 50) notesP1Ref.current.splice(idx, 1);
            else { holdNote.isActiveHold = false; holdNote.missed = true; }
        }
        activeHoldsP1Ref.current[laneIndex] = null;
    }
  }, []);

  const triggerReleaseP2 = useCallback((laneIndex: number) => {
    activeLanesP2Ref.current[laneIndex] = false;
    const holdNote = activeHoldsP2Ref.current[laneIndex];
    if (holdNote) {
        const idx = notesP2Ref.current.indexOf(holdNote);
        if (idx !== -1) {
            if (holdNote.lengthZ <= 50) notesP2Ref.current.splice(idx, 1);
            else { holdNote.isActiveHold = false; holdNote.missed = true; }
        }
        activeHoldsP2Ref.current[laneIndex] = null;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    const VP_Y = 180;
    const FOCAL_LENGTH = 400;
    const BASE_Y_OFFSET = 440;
    const LANE_GAP = gameMode === 'multiplayer' ? 70 : 140;
    
    const getScale = (z: number) => Math.max(0.01, FOCAL_LENGTH / (FOCAL_LENGTH + Math.max(z, -FOCAL_LENGTH + 10)));
    const getScreenX = (offsetX: number, z: number, vpX: number) => vpX + offsetX * getScale(z);
    const getScreenY = (z: number) => VP_Y + BASE_Y_OFFSET * getScale(z);

    const drawPuck = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale: number, missed: boolean, isHit: boolean = false) => {
      const baseSize = gameMode === 'multiplayer' ? 25 : 50;
      const bRX = baseSize * scale, bRY = (baseSize * 0.36) * scale, iBRX = (baseSize * 0.9) * scale, iBRY = (baseSize * 0.3) * scale, tRX = (baseSize * 0.5) * scale, tRY = (baseSize * 0.18) * scale, nH = (baseSize * 0.4) * scale;
      const tY = y - nH, nC = missed ? '#64748b' : color;
      
      // Base glow if hit
      if (isHit) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 20 * scale;
        ctx.fillStyle = color + '44';
        ctx.beginPath(); ctx.ellipse(x, y, bRX * 1.5, bRY * 1.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

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
      if (!missed && scale > 0.1) {
        ctx.shadowColor = '#fff'; 
        ctx.shadowBlur = (isHit ? 12 : 6) * scale;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.beginPath(); ctx.ellipse(x, btTY, btRX, btRY, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; 
      ctx.strokeStyle = missed ? '#94a3b8' : '#ffffff'; 
      ctx.lineWidth = Math.max(0.5, 1 * scale);
      ctx.stroke();
    };


    let animationId: number;
    let lastFrameTime = performance.now();
    const lastGamepadState = { current: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false] };

    const loop = (time: number) => {
      const deltaTime = Math.min((time - lastFrameTime) / 1000, 0.1);
      lastFrameTime = time;

      // Handle Gamepads for both P1 and P2
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (!gp) continue;
        gp.buttons.forEach((btn, idx) => {
          const mapping = `gp:${idx}`;
          const p1Lane = (p1Keys as string[]).findIndex(m => m.toLowerCase() === mapping);
          const p2Lane = (p2Keys as string[]).findIndex(m => m.toLowerCase() === mapping);
          
          if (p1Lane !== -1) {
            if (btn.pressed && !lastGamepadState.current[idx]) triggerHitP1(p1Lane);
            else if (!btn.pressed && lastGamepadState.current[idx]) triggerReleaseP1(p1Lane);
          }
          if (p2Lane !== -1) {
            if (btn.pressed && !lastGamepadState.current[idx]) triggerHitP2(p2Lane);
            else if (!btn.pressed && lastGamepadState.current[idx]) triggerReleaseP2(p2Lane);
          }
          lastGamepadState.current[idx] = btn.pressed;
        });
      }

      if (startGameRequestRef.current) {
        startGameRequestRef.current = false;
        notesP1Ref.current = [];
        notesP2Ref.current = [];
        spawnedIndexP1Ref.current = 0;
        spawnedIndexP2Ref.current = 0;
        scoreP1Ref.current = 0;
        scoreP2Ref.current = 0;
        trackScrollYRef.current = 0;
        syncScoreUI();
        
        if (audioCtxRef.current && audioBufferRef.current) {
          const targetVol = 0.9;
          const audioBuffer = audioBufferRef.current;
          const ctx = audioCtxRef.current;
          const masterGain = ctx.createGain();
          masterGain.connect(ctx.destination);
          
          const speedFactor = difficulty === 'hard' ? 1.5 : difficulty === 'extreme' ? 2.0 : 1.0;
          const speedMultiplier = (window as any).customSpeedMultiplier || 1.0;
          const speedZ = 1000 * speedFactor * speedMultiplier;
          const delayT = START_Z / speedZ;

          if (audioBuffer instanceof AudioBuffer) {
             const source = ctx.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(masterGain);
             const penalty = ctx.createGain();
             audioGainNodeRef.current = penalty;
             source.connect(penalty); // Link P1/Single penalty
             audioSourcesRef.current = [source];
             const startT = ctx.currentTime + delayT;
             source.start(startT);
             startTimeRef.current = startT;
          } else {
             const stems = ['vocals', 'other', 'drums', 'bass'] as const;
             const buffers = audioBuffer as any;
             const startT = ctx.currentTime + delayT;
             stems.forEach(stem => {
                const src = ctx.createBufferSource();
                src.buffer = buffers[stem];
                const g = ctx.createGain();
                
                // Muting Logic:
                if (stem === 'vocals' || stem === 'bass') {
                  // Selalu terdengar
                  src.connect(masterGain);
                } else if (stem === 'other') { // Gitar
                  if (gameMode === 'multiplayer' || instrumentMode === 'other') {
                    audioGainNodeRef.current = g;
                  }
                  src.connect(g).connect(masterGain);
                } else if (stem === 'drums') {
                  if (gameMode === 'multiplayer') {
                    audioGainP2Ref.current = g;
                  } else if (instrumentMode === 'drums') {
                    audioGainNodeRef.current = g;
                  }
                  src.connect(g).connect(masterGain);
                }
                
                audioSourcesRef.current.push(src);
                src.start(startT);
             });
             startTimeRef.current = startT;
          }
        }
      }

      if (gameStateRef.current === 'paused') {
        if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
          audioCtxRef.current.suspend();
        }
        animationId = requestAnimationFrame(loop);
        return;
      }

      if (gameStateRef.current === 'game') {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const speed = getSpeedZ();
        trackScrollYRef.current += speed * deltaTime * 0.95;
        const ts1 = document.getElementById('trackSurfaceP1');
        const ts2 = document.getElementById('trackSurfaceP2');
        if (ts1) ts1.style.backgroundPositionY = `${trackScrollYRef.current}px`;
        if (ts2) ts2.style.backgroundPositionY = `${trackScrollYRef.current}px`;

        if (audioCtxRef.current) {
          const pbTime = (audioCtxRef.current.currentTime - startTimeRef.current) + (audioOffset / 1000);
          const fallT = START_Z / speed;
          
          // Spawn P1
          const beatsP1 = beatMapRef.current;
          while (spawnedIndexP1Ref.current < beatsP1.length) {
            const beat = beatsP1[spawnedIndexP1Ref.current];
            if (pbTime >= beat.time - fallT) {
              const exactZ = START_Z - ((pbTime - (beat.time - fallT)) * speed);
              beat.notes.forEach((bn: any) => notesP1Ref.current.push(new Note(bn.lane, exactZ, speed, bn.type, bn.duration * speed)));
              spawnedIndexP1Ref.current++;
            } else break;
          }
          
          // Spawn P2
          const beatsP2 = gameMode === 'multiplayer' ? beatMapP2Ref.current : [];
          while (spawnedIndexP2Ref.current < beatsP2.length) {
            const beat = beatsP2[spawnedIndexP2Ref.current];
            if (pbTime >= beat.time - fallT) {
              const exactZ = START_Z - ((pbTime - (beat.time - fallT)) * speed);
              beat.notes.forEach((bn: any) => notesP2Ref.current.push(new Note(bn.lane, exactZ, speed, bn.type, bn.duration * speed)));
              spawnedIndexP2Ref.current++;
            } else break;
          }
          
          if(audioBufferRef.current) {
            const buf = audioBufferRef.current;
            const duration = (buf instanceof AudioBuffer) ? buf.duration : (buf as any).vocals.duration;
            if(pbTime > duration + 1.0 && spawnedIndexP1Ref.current >= beatsP1.length && notesP1Ref.current.length === 0 && notesP2Ref.current.length === 0) {
              onGameEnd(scoreP1Ref.current + scoreP2Ref.current);
            }
          }
        }

        // Update P1 Notes
        for (let i = notesP1Ref.current.length - 1; i >= 0; i--) {
          const n = notesP1Ref.current[i];
          n.z -= n.speedZ * deltaTime;
          if (n.isActiveHold) {
            scoreP1Ref.current += 1;
            syncScoreUI();
            n.lengthZ -= n.speedZ * deltaTime;
            n.z = 0;
            if (n.lengthZ <= 0) {
              scoreP1Ref.current += 50;
              notesP1Ref.current.splice(i, 1);
              activeHoldsP1Ref.current[n.lane] = null;
            }
          } else {
            if (!n.missed && n.z < -100) { triggerMissP1(); n.missed = true; }
            if ((n.type === 'hold' ? n.z + n.lengthZ : n.z) < -300) notesP1Ref.current.splice(i, 1);
          }
        }
        
        // Update P2 Notes
        for (let i = notesP2Ref.current.length - 1; i >= 0; i--) {
          const n = notesP2Ref.current[i];
          n.z -= n.speedZ * deltaTime;
          if (n.isActiveHold) {
            scoreP2Ref.current += 1;
            syncScoreUI();
            n.lengthZ -= n.speedZ * deltaTime;
            n.z = 0;
            if (n.lengthZ <= 0) {
              scoreP2Ref.current += 50;
              notesP2Ref.current.splice(i, 1);
              activeHoldsP2Ref.current[n.lane] = null;
            }
          } else {
            if (!n.missed && n.z < -100) { triggerMissP2(); n.missed = true; }
            if ((n.type === 'hold' ? n.z + n.lengthZ : n.z) < -300) notesP2Ref.current.splice(i, 1);
          }
        }

        for (let i = 0; i < 5; i++) {
          if (laneHitStatesP1Ref.current[i] > 0) laneHitStatesP1Ref.current[i] -= deltaTime;
          if (laneHitStatesP2Ref.current[i] > 0) laneHitStatesP2Ref.current[i] -= deltaTime;
        }
      }

      ctx.clearRect(0, 0, width, height);
      
      const renderTrack = (notes: Note[], vpX: number, activeLanes: boolean[], activeHolds: (Note|null)[], hitStates: number[], keys: string[]) => {
        // Draw static grid lines for this track
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
           const off = (i - 2) * LANE_GAP;
           ctx.beginPath();
           ctx.moveTo(getScreenX(off, START_Z, vpX), getScreenY(START_Z));
           ctx.lineTo(getScreenX(off, -200, vpX), getScreenY(-200));
           ctx.stroke();
        }
        
        // Side border lines (White lines on the side as requested)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        const sideOff = 2.5 * LANE_GAP;
        [-1, 1].forEach(side => {
          ctx.beginPath();
          ctx.moveTo(getScreenX(side * sideOff, START_Z, vpX), getScreenY(START_Z));
          ctx.lineTo(getScreenX(side * sideOff, -200, vpX), getScreenY(-200));
          ctx.stroke();
        });

        for (let i = 0; i < 5; i++) {
          const x = getScreenX((i - 2) * LANE_GAP, 0, vpX);
          const y = getScreenY(0);
          const s = getScale(0);

          const hitImg = hitButtonImgs && hitButtonImgs[i];
          const pressedImg = hitButtonPressedImgs && hitButtonPressedImgs[i];
          const isPressed = activeLanes[i];

          if (hitImg) {
            const imgWidth = (gameMode === 'multiplayer' ? 62 : 132) * s;
            const imgHeight = (gameMode === 'multiplayer' ? 25 : 53) * s;
            
            // Add soft drop shadow for 3D/Ambient Occlusion effect
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10 * s;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8 * s;
            
            // Draw idle image
            // Menambahkan (4 * s) untuk menggeser sedikit ke bawah
            ctx.drawImage(hitImg, x - imgWidth / 2, y - imgHeight / 2 + (4 * s), imgWidth, imgHeight);
            ctx.restore();

            // Draw pressed image overlay if active
            if (isPressed && pressedImg) {
              ctx.drawImage(pressedImg, x - imgWidth / 2, y - imgHeight / 2 + (4 * s), imgWidth, imgHeight);
            }
          }


        }

        const sorted = [...notes].sort((a, b) => b.z - a.z);
        sorted.forEach(n => {
          if (n.z > START_Z + 200) return;
          const off = (n.lane - 2) * LANE_GAP;
          const color = n.missed ? '#333333' : n.color; // Darker grey for missed
          if (n.type === 'hold' && n.lengthZ > 0 && n.z <= START_Z) {
             const bZ = n.z, tZ = Math.min(n.z + n.lengthZ, START_Z);
             const wB = (gameMode === 'multiplayer' ? 25 : 45) * getScale(bZ), wT = (gameMode === 'multiplayer' ? 25 : 45) * getScale(tZ);
             const xB = getScreenX(off, bZ, vpX), yB = getScreenY(bZ), xT = getScreenX(off, tZ, vpX), yT = getScreenY(tZ);
             ctx.fillStyle = n.missed ? '#22222299' : color + '80'; 
             ctx.beginPath();
             ctx.moveTo(xB - wB, yB); ctx.lineTo(xB + wB, yB); ctx.lineTo(xT + wT, yT); ctx.lineTo(xT - wT, yT); ctx.fill();
          }
          const scale = getScale(n.z);
          if (scale < 0.02) return;
          drawPuck(ctx, getScreenX(off, n.z, vpX), getScreenY(n.z), n.color, scale, n.missed);
        });
      };

      if (gameMode === 'multiplayer') {
        renderTrack(notesP1Ref.current, width * 0.25, activeLanesP1Ref.current, activeHoldsP1Ref.current, laneHitStatesP1Ref.current, p1Keys);
        renderTrack(notesP2Ref.current, width * 0.75, activeLanesP2Ref.current, activeHoldsP2Ref.current, laneHitStatesP2Ref.current, p2Keys);
      } else {
        renderTrack(notesP1Ref.current, width * 0.5, activeLanesP1Ref.current, activeHoldsP1Ref.current, laneHitStatesP1Ref.current, p1Keys);
      }

      const fG = ctx.createLinearGradient(0, 320, 0, 370);
      fG.addColorStop(0, 'rgba(0,0,0,1)'); 
      fG.addColorStop(0.3, 'rgba(0,0,0,1)'); // Keep it solid for a bit longer
      fG.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = fG; 
      ctx.fillRect(0, 0, width, 370);
      
      // Solid erase header to mask notes that are behind the vanishing point
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, 0, width, 320);
      ctx.globalCompositeOperation = 'source-over';

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const p1Idx = p1Keys.findIndex((m: string) => m.toLowerCase() === k);
      const p2Idx = p2Keys.findIndex((m: string) => m.toLowerCase() === k);
      if (p1Idx !== -1) triggerHitP1(p1Idx);
      if (p2Idx !== -1) triggerHitP2(p2Idx);
      if (e.key === 'Escape') gameStateRef.current === 'game' ? setGameState('paused') : gameStateRef.current === 'paused' ? setGameState('resuming') : null;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const p1Idx = p1Keys.findIndex((m: string) => m.toLowerCase() === k);
      const p2Idx = p2Keys.findIndex((m: string) => m.toLowerCase() === k);
      if (p1Idx !== -1) triggerReleaseP1(p1Idx);
      if (p2Idx !== -1) triggerReleaseP2(p2Idx);
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
        if (canvasY > 300) {
          if (gameMode === 'multiplayer') {
            if (canvasX < width / 2) {
              const lane = Math.round((canvasX - width * 0.25) / LANE_GAP) + 2;
              if (lane >= 0 && lane < 5) triggerHitP1(lane);
            } else {
              const lane = Math.round((canvasX - width * 0.75) / LANE_GAP) + 2;
              if (lane >= 0 && lane < 5) triggerHitP2(lane);
            }
          } else {
            const lane = Math.round((canvasX - width * 0.5) / LANE_GAP) + 2;
            if (lane >= 0 && lane < 5) triggerHitP1(lane);
          }
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
        if (gameMode === 'multiplayer') {
           if (canvasX < width / 2) {
             const lane = Math.round((canvasX - width * 0.25) / LANE_GAP) + 2;
             if (lane >= 0 && lane < 5) triggerReleaseP1(lane);
           } else {
             const lane = Math.round((canvasX - width * 0.75) / LANE_GAP) + 2;
             if (lane >= 0 && lane < 5) triggerReleaseP2(lane);
           }
        } else {
          const lane = Math.round((canvasX - width * 0.5) / LANE_GAP) + 2;
          if (lane >= 0 && lane < 5) triggerReleaseP1(lane);
        }
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
  }, [canvasRef, gameStateRef, audioCtxRef, audioBufferRef, audioSourcesRef, audioGainNodeRef, audioGainP2Ref, beatMapRef, beatMapP2Ref, difficulty, instrumentMode, gameMode, onGameEnd, setGameState, getSpeedZ, syncScoreUI, triggerHitP1, triggerHitP2, triggerMissP1, triggerMissP2, triggerReleaseP1, triggerReleaseP2, p1Keys, p2Keys, audioOffset, START_Z, hitButtonImgs, hitButtonPressedImgs]);

  return { startGameRequestRef };
}
