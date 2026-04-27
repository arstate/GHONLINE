'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';

type Song = {
  id: string;
  title: string;
  type: 'remote' | 'local';
  url?: string;
  stems?: {
    vocals: string;
    other: string; // guitar etc
    drums: string;
    bass: string;
  };
  dbId?: number;
};

const defaultPlaylist: Song[] = [
  { 
    id: '1', 
    title: "Ghea Indrawari - Teramini (Multitrack)", 
    type: 'remote', 
    stems: {
      vocals: "https://ia600702.us.archive.org/6/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-vocals-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-vocals-Ab%20major-158bpm-441hz.mp3",
      other: "https://ia600607.us.archive.org/1/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-other-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-other-Ab%20major-158bpm-441hz.mp3",
      drums: "https://ia903200.us.archive.org/31/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-drums-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-drums-Ab%20major-158bpm-441hz.mp3",
      bass: "https://ia601906.us.archive.org/12/items/ghea-indrawari-teramini-cover-damnt-rh-youtube-bass-ab-major-158bpm-441hz/Ghea%20Indrawari%20-%20Teramini%20%28COVER%29%20-%20damnt_rh%20%28youtube%29-bass-Ab%20major-158bpm-441hz.mp3"
    } 
  },
  { id: '2', title: "Dewi", type: 'remote', url: "https://ia601502.us.archive.org/20/items/dewi_20260427/Dewi.mp3" },
  { id: '3', title: "Threesixty - Dewi (Pop Punk Cover)", type: 'remote', url: "https://ia600104.us.archive.org/1/items/threesixty-dewi-pop-punk-cover-lyric-video/Threesixty%20-%20Dewi%EF%BD%9C%20Pop%20Punk%20Cover%20%28Lyric%20Video%29.mp3" },
  { id: '4', title: "Hindia - everything u are", type: 'remote', url: "https://ia601507.us.archive.org/4/items/hindia-everything-u-are/Hindia%20-%20everything%20u%20are.mp3" },
  { id: '5', title: ".Feast - Nina", type: 'remote', url: "https://ia600704.us.archive.org/33/items/feast-nina-official-lyric-video/Feast%20-%20Nina%20%28Official%20Lyric%20Video%29.mp3" },
  { id: '6', title: "Sampai Nanti - Threesixty Skatepunk", type: 'remote', url: "https://ia600900.us.archive.org/13/items/sampai-nanti-threesixty-skatepunk/Sampai%20Nanti%20-%20Threesixty%20Skatepunk.mp3" },
  { id: '7', title: "DRAGONFORCE - Through the Fire and Flames", type: 'remote', url: "https://ia600909.us.archive.org/35/items/dragonforce-through-the-fire-and-flames-official-video-dragon-force-youtube/DRAGONFORCE%20-%20Through%20the%20Fire%20and%20Flames%20%28Official%20Video%29%20-%20DragonForce%20%28youtube%29.mp3" },
  { id: '8', title: "Tulus - Andai Aku Bisa (Chrisye Cover)", type: 'remote', url: "https://ia601600.us.archive.org/11/items/tulus-andai-aku-bisa-chrisye-cover-lirik-vero-april-youtube/Tulus%20-%20Andai%20Aku%20Bisa%20%28Chrisye%20Cover%29%20%20Lirik%20-%20Vero%20April%20%28youtube%29.mp3" }
];

const DB_NAME = 'RhythmGameDB';
const STORE_NAME = 'myMusic';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveSong = async (file: File): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({
      title: file.name.replace(/\.[^/.]+$/, ""),
      file: file,
      timestamp: Date.now()
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getSongs = async (): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            resolve(request.result.map((item: any) => ({
                id: `local_${item.id}`,
                dbId: item.id,
                title: item.title,
                type: 'local'
            })));
        };
        request.onerror = () => reject(request.error);
    });
};

const getSongBuffer = async (dbId: number): Promise<ArrayBuffer> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(dbId);
        request.onsuccess = async () => {
            if (request.result && request.result.file) {
                resolve(await request.result.file.arrayBuffer());
            } else {
                reject(new Error("File not found"));
            }
        };
        request.onerror = () => reject(request.error);
    });
}

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

  const [currentTab, setCurrentTab] = useState<'playlist' | 'favorite' | 'myMusic'>('playlist');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [myMusicList, setMyMusicList] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [instrumentMode, setInstrumentMode] = useState<'other' | 'drums' | 'bass'>('drums');
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio and game state refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | { vocals: AudioBuffer, other: AudioBuffer, drums: AudioBuffer, bass: AudioBuffer } | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const beatMapRef = useRef<any[]>([]);
  const spawnedIndexRef = useRef<number>(0);
  const gameActiveRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const startGameRequestRef = useRef<boolean>(false);
  const difficultyRef = useRef('normal');
  const instrumentModeRef = useRef<'other' | 'drums' | 'bass'>('drums');
  
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { instrumentModeRef.current = instrumentMode; }, [instrumentMode]);

  useEffect(() => {
    const savedFavs = localStorage.getItem('rhythm_favorites');
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch(e){}
    }
    getSongs().then(setMyMusicList).catch(console.error);
  }, []);

  const toggleFavorite = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
       const next = prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId];
       localStorage.setItem('rhythm_favorites', JSON.stringify(next));
       return next;
    });
  };

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingSong(true);
    try {
       await saveSong(file);
       const updated = await getSongs();
       setMyMusicList(updated);
    } catch (err) {
       console.error(err);
    } finally {
       setIsLoadingSong(false);
    }
  };

  const handlePlaySong = async () => {
    if (!selectedSong) return;
    setIsLoadingSong(true);
    
    try {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        let analyzeBuffer: AudioBuffer;

        if (selectedSong.stems) {
            const stems = selectedSong.stems;
            const [vocRes, otherRes, drumRes, bassRes] = await Promise.all([
               fetch(stems.vocals).then(r => r.arrayBuffer()),
               fetch(stems.other).then(r => r.arrayBuffer()),
               fetch(stems.drums).then(r => r.arrayBuffer()),
               fetch(stems.bass).then(r => r.arrayBuffer())
            ]);
            
            const [vocBuf, otherBuf, drumBuf, bassBuf] = await Promise.all([
                audioCtxRef.current.decodeAudioData(vocRes),
                audioCtxRef.current.decodeAudioData(otherRes),
                audioCtxRef.current.decodeAudioData(drumRes),
                audioCtxRef.current.decodeAudioData(bassRes)
            ]);
            
            audioBufferRef.current = { vocals: vocBuf, other: otherBuf, drums: drumBuf, bass: bassBuf };
            
            if (instrumentMode === 'drums') analyzeBuffer = drumBuf;
            else if (instrumentMode === 'bass') analyzeBuffer = bassBuf;
            else analyzeBuffer = otherBuf; // Guitar/Other
            
        } else {
            let arrayBuffer: ArrayBuffer;
            if (selectedSong.type === 'remote') {
                const res = await fetch(selectedSong.url!);
                arrayBuffer = await res.arrayBuffer();
            } else {
                arrayBuffer = await getSongBuffer(selectedSong.dbId!);
            }
            const decodedBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            audioBufferRef.current = decodedBuffer;
            analyzeBuffer = decodedBuffer;
        }
        
        // Step 17: Adaptive Multiband Beat Detection
        setIsAnalyzing(true);
        await analyzeAndGenerateBeatMap(analyzeBuffer!, difficulty);
        setIsAnalyzing(false);
        
        setSelectedSong(null);
        startGame();
    } catch (err) {
        console.error("Failed to load song", err);
        alert("Failed to load song. Please try another.");
        setIsAnalyzing(false);
    } finally {
        setIsLoadingSong(false);
    }
  };

  const analyzeAndGenerateBeatMap = async (buffer: AudioBuffer, currentDiff: string) => {
    const offlineCtx = new OfflineAudioContext(3, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    const merger = offlineCtx.createChannelMerger(3);

    // Filter setup
    const lp = offlineCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 150;
    source.connect(lp);
    lp.connect(merger, 0, 0);

    const bp = offlineCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1300;
    bp.Q.value = 0.5;
    source.connect(bp);
    bp.connect(merger, 0, 1);

    const hp = offlineCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    source.connect(hp);
    hp.connect(merger, 0, 2);

    merger.connect(offlineCtx.destination);
    source.start();

    const renderedBuffer = await offlineCtx.startRendering();
    const lowData = renderedBuffer.getChannelData(0);
    const midData = renderedBuffer.getChannelData(1);
    const highData = renderedBuffer.getChannelData(2);

    // 1. Normalization: Make sure the signals are consistent
    const normalize = (data: Float32Array) => {
        let max = 0;
        for (let i = 0; i < data.length; i++) {
            const val = Math.abs(data[i]);
            if (val > max) max = val;
        }
        if (max > 0) {
            for (let i = 0; i < data.length; i++) data[i] /= max;
        }
    };
    normalize(lowData);
    normalize(midData);
    normalize(highData);

    // 2. Genre Analysis
    let lowEnergy = 0;
    let midEnergy = 0;
    const energyStep = Math.floor(buffer.sampleRate / 2); // Check every 0.5s
    for (let i = 0; i < lowData.length; i += energyStep) {
        lowEnergy += Math.abs(lowData[i]);
        midEnergy += Math.abs(midData[i]);
    }
    const isRock = midEnergy > (lowEnergy * 0.65);
    console.log(`Step 17 Analytics - Genre: ${isRock ? "Rock/Metal" : "Pop/Acoustic"}, Mid/Low Ratio: ${(midEnergy/lowEnergy).toFixed(2)}`);

    // 3. Peak Detection with Spectral Flux and Dynamic Threshold
    const beatMap: any[] = [];
    const sampleRate = buffer.sampleRate;
    const sampleWindow = 512;
    const windowSeconds = 1.5; 
    const windowSamples = Math.floor(windowSeconds * sampleRate / sampleWindow);
    
    // Config based on difficulty
    let sensitivity = 1.35; // Flux sensitivity multiplier vs moving average
    let cooldownSecs = 0.22;
    let holdProb = 0.1;
    
    if (currentDiff === 'easy') { sensitivity = 1.8; cooldownSecs = 0.45; holdProb = 0.05; }
    else if (currentDiff === 'hard') { sensitivity = 1.25; cooldownSecs = 0.16; holdProb = 0.25; }
    else if (currentDiff === 'expert') { sensitivity = 1.15; cooldownSecs = 0.12; holdProb = 0.4; }

    let lastPeakTime = -cooldownSecs;

    // We calculate Flux (rate of change) in energy
    let localFluxSum = 0;
    const fluxHistory: number[] = [];
    
    const analysisData = isRock ? midData : lowData;
    let prevEnergy = 0;

    for (let i = 0; i < analysisData.length; i += sampleWindow) {
        // Calculate Energy for this small window
        let sum = 0;
        let limit = Math.min(i + sampleWindow, analysisData.length);
        for(let j = i; j < limit; j++) {
            sum += Math.abs(analysisData[j]);
        }
        const currentEnergy = sum / (limit - i);
        
        // Spectral Flux (only positive changes)
        const flux = Math.max(0, currentEnergy - prevEnergy);
        prevEnergy = currentEnergy;

        const currentTime = i / sampleRate;

        // Maintain moving average of Flux
        fluxHistory.push(flux);
        localFluxSum += flux;
        if (fluxHistory.length > windowSamples) {
            localFluxSum -= fluxHistory.shift()!;
        }

        const localFluxAvg = localFluxSum / fluxHistory.length;
        const dynamicThreshold = localFluxAvg * sensitivity;

        // Strict peak detection: flux is higher than neighboring average + absolute minimum floor
        if (flux > dynamicThreshold && flux > 0.005 && (currentTime - lastPeakTime) > cooldownSecs) {
            const lowVal = Math.abs(lowData[i]);
            const midVal = Math.abs(midData[i]);
            
            const beatNotes = [];
            let numNotes = 1;
            // Expert/Hard can have double/triple notes on very high spikes
            if (currentDiff === 'expert' && flux > dynamicThreshold * 1.8) numNotes = 3;
            else if ((currentDiff === 'hard' || currentDiff === 'expert') && flux > dynamicThreshold * 1.4) numNotes = 2;

            const spdZ = 120 * 200 / 24; 
            let availableLanes = [0, 1, 2, 3, 4];

            for (let n = 0; n < numNotes; n++) {
                if (availableLanes.length === 0) break;
                
                // Smart Lane Mapping
                let lane;
                if (lowVal > midVal * 1.2) {
                    // Kick/Bass -> Outer
                    const outer = availableLanes.filter(l => l === 0 || l === 4);
                    lane = outer.length > 0 ? outer[Math.floor(Math.random() * outer.length)] : availableLanes[Math.floor(Math.random() * availableLanes.length)];
                } else {
                    // Snare/Lead -> Inner
                    const inner = availableLanes.filter(l => l === 1 || l === 2 || l === 3);
                    lane = inner.length > 0 ? inner[Math.floor(Math.random() * inner.length)] : availableLanes[Math.floor(Math.random() * availableLanes.length)];
                }

                availableLanes = availableLanes.filter(l => l !== lane);
                const isHold = n === 0 && Math.random() < holdProb;
                const lengthZ = isHold ? (spdZ * (0.3 + Math.random() * 0.7)) : 0;
                beatNotes.push({ lane, type: isHold ? 'hold' : 'tap', lengthZ });
            }

            beatMap.push({ time: currentTime, notes: beatNotes });
            lastPeakTime = currentTime;
        }
    }

    beatMapRef.current = beatMap;
    
    // 4. BPM Calculation using Histogram Mode (Clustering)
    let intervals: number[] = [];
    for (let j = 1; j < beatMap.length; j++) {
        const interval = beatMap[j].time - beatMap[j-1].time;
        // only consider sensible intervals for BPM (e.g., 60-200 BPM is 0.3s to 1s)
        if (interval > 0.25 && interval < 1.0) {
            intervals.push(interval);
        }
    }
    
    let calculatedBpm = 120; // fallback
    if (intervals.length > 0) {
        // Group into bins (e.g. 0.05s precision)
        const bins: Record<string, number> = {};
        for (const interval of intervals) {
            // round to nearest 0.05
            const binKey = (Math.round(interval * 20) / 20).toFixed(2);
            bins[binKey] = (bins[binKey] || 0) + 1;
        }
        
        let maxCount = 0;
        let modeInterval = 0.5;
        for (const [key, count] of Object.entries(bins)) {
            if (count > maxCount) {
                maxCount = count;
                modeInterval = parseFloat(key);
            }
        }
        calculatedBpm = Math.round(60 / modeInterval);
    }
    
    setBpm(calculatedBpm);
    bpmRef.current = calculatedBpm;
    console.log(`Estimated BPM: ${calculatedBpm} via mode interval clustering.`);
  };

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

    const getSpeed = () => {
      const currentBpm = bpmRef.current || 120;
      return Math.max(3, Math.min(currentBpm / 24, 12));
    };

    const START_Z = 3000;
    const FOCAL_LENGTH = 300;
    const BASE_Y_OFFSET = 550;

    const VP_X = width / 2;
    const VP_Y = 150;
    const getScale = (z: number) => Math.max(0.01, FOCAL_LENGTH / (FOCAL_LENGTH + Math.max(z, -FOCAL_LENGTH + 10)));
    const getScreenX = (offsetX: number, z: number) => VP_X + offsetX * getScale(z);
    const getScreenY = (z: number) => VP_Y + BASE_Y_OFFSET * getScale(z);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const octx = offscreenCanvas.getContext('2d');
    
    if (octx) {
      octx.fillStyle = '#050505';
      octx.fillRect(0, 0, width, height);

      octx.fillStyle = '#111111';
      octx.beginPath();
      octx.moveTo(getScreenX(-250, START_Z), getScreenY(START_Z));
      octx.lineTo(getScreenX(250, START_Z), getScreenY(START_Z));
      octx.lineTo(getScreenX(250, -200), getScreenY(-200));
      octx.lineTo(getScreenX(-250, -200), getScreenY(-200));
      octx.fill();

      octx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      octx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
         const offset = (i - 2.5) * 100;
         octx.beginPath();
         octx.moveTo(getScreenX(offset, START_Z), getScreenY(START_Z));
         octx.lineTo(getScreenX(offset, -200), getScreenY(-200));
         octx.stroke();
      }

      const hitZ = 0;
      octx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      octx.lineWidth = 2;
      octx.beginPath();
      octx.moveTo(getScreenX(-250, hitZ), getScreenY(hitZ));
      octx.lineTo(getScreenX(250, hitZ), getScreenY(hitZ));
      octx.stroke();
    }

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
        this.color = colors[lane];
        this.type = type;
        this.lengthZ = lengthZ;
        this.isActiveHold = false;
        this.missed = false;
      }
    }

    const notes: Note[] = [];
    const activeHolds: (Note | null)[] = [null, null, null, null, null];
    let animationId: number;

    const update = (deltaTime: number) => {
      for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        note.z -= note.speedZ * deltaTime;
        
        if (note.isActiveHold) {
           currentScoreRef.current += 1;
           const s1 = document.getElementById('scoreDisplay');
           const s2 = document.getElementById('scoreDisplayGame');
           const val = currentScoreRef.current.toString().padStart(6, '0');
           if (s1) s1.innerText = val;
           if (s2) s2.innerText = val;
           
           note.lengthZ -= note.speedZ * deltaTime;
           note.z = 0;

           if (note.lengthZ <= 0) {
               currentScoreRef.current += 50;
               notes.splice(i, 1);
               activeHolds[note.lane] = null;
           }
        } else {
           if (!note.missed && note.z < -100) { // Passed hitbox tolerance
               triggerMiss();
               note.missed = true;
           }
           
           const tailZ = note.type === 'hold' ? note.z + note.lengthZ : note.z;
           if (tailZ < -300) { // Fully off screen
               notes.splice(i, 1);
               continue;
           }
        }
      }
    };

    const draw = () => {
      // Clear and draw static background
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(offscreenCanvas, 0, 0);

      const hitZ = 0;
      // Lane hit targets
      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * 100;
        const x = getScreenX(offset, hitZ);
        const y = getScreenY(hitZ);
        const scale = getScale(hitZ);
        
        ctx.beginPath();
        ctx.ellipse(x, y, 40 * scale, 15 * scale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = activeLanes[i] ? '#ffffff' : colors[i];
        ctx.lineWidth = activeLanes[i] ? 4 : 2;
        ctx.stroke();
        
        if (activeLanes[i]) {
            ctx.fillStyle = colors[i] + '44';
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(keys[i], x, y + 25);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(keys[i], x, y + 25);
        }
      }

      // Draw Notes (back-to-front rendering)
      for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];
        if (note.z > START_Z + 500) continue; // Skip notes too far away
        
        const offset = (note.lane - 2) * 100;
        const color = note.missed ? '#555555' : note.color;
        
        if (note.type === 'hold' && note.lengthZ > 0) {
            const botZ = note.z;
            const topZ = Math.min(note.z + note.lengthZ, START_Z);
            
            if (botZ <= START_Z) {
                const wBot = 30 * getScale(botZ);
                const wTop = 30 * getScale(topZ);
                const xBot = getScreenX(offset, botZ);
                const yBot = getScreenY(botZ);
                const xTop = getScreenX(offset, topZ);
                const yTop = getScreenY(topZ);

                ctx.fillStyle = color + '90';
                ctx.beginPath();
                ctx.moveTo(xBot - wBot, yBot);
                ctx.lineTo(xBot + wBot, yBot);
                ctx.lineTo(xTop + wTop, yTop);
                ctx.lineTo(xTop - wTop, yTop);
                ctx.fill();
                
                if (note.isActiveHold) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.ellipse(xBot, yBot, wBot, wBot*0.35, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        // Draw Note Head
        const scale = getScale(note.z);
        if (scale < 0.02) continue; // skip extremely tiny notes

        const x = getScreenX(offset, note.z);
        const y = getScreenY(note.z);
        const radX = 35 * scale;
        const radY = 12 * scale;
        
        ctx.beginPath();
        ctx.ellipse(x, y, radX, radY, 0, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(x, y - radY*0.5, radX*0.1, x, y, radX);
        gradient.addColorStop(0, note.missed ? '#888888' : '#ffffff');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.lineWidth = 2 * scale;
        ctx.strokeStyle = note.missed ? '#aaaaaa' : '#fff';
        ctx.stroke();
      }

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

    let lastFrameTime = performance.now();

    const gameLoop = (time: number) => {
      const deltaTime = (time - lastFrameTime) / 1000;
      lastFrameTime = time;
      // Cap deltaTime at 0.1s to prevent extreme jumps if the browser tab was inactive
      const safeDelta = Math.min(deltaTime, 0.1);

      if (startGameRequestRef.current) {
        startGameRequestRef.current = false;
        notes.length = 0;
        spawnedIndexRef.current = 0;
        currentScoreRef.current = 0;
        
        const s1 = document.getElementById('scoreDisplay');
        const s2 = document.getElementById('scoreDisplayGame');
        if (s1) s1.innerText = '000000';
        if (s2) s2.innerText = '000000';
        
        if (audioCtxRef.current && audioBufferRef.current) {
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          if (audioSourcesRef.current && audioSourcesRef.current.length > 0) {
             audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
          }
          audioSourcesRef.current = [];
          
          const audioBuffer = audioBufferRef.current;
          const masterGainNode = audioCtxRef.current.createGain();
          const targetVolume = 0.9;
          
          if (!('vocals' in audioBuffer)) {
            // Single track mode
            const source = audioCtxRef.current.createBufferSource();
            source.buffer = audioBuffer as AudioBuffer;
            
            const channelData = source.buffer.getChannelData(0);
            let maxPeak = 0;
            for (let i = 0; i < channelData.length; i++) {
                const absVal = Math.abs(channelData[i]);
                if (absVal > maxPeak) maxPeak = absVal;
            }
            
            masterGainNode.gain.value = maxPeak > 0 ? targetVolume / maxPeak : 1.0;
            
            const penaltyGainNode = audioCtxRef.current.createGain();
            penaltyGainNode.gain.value = 1.0;
            audioGainNodeRef.current = penaltyGainNode;
            
            source.connect(masterGainNode);
            masterGainNode.connect(penaltyGainNode);
            penaltyGainNode.connect(audioCtxRef.current.destination);
            
            audioSourcesRef.current.push(source);
            
            const startTime = audioCtxRef.current.currentTime;
            source.start(startTime);
            startTimeRef.current = startTime;
          } else {
            // Multitrack mode
            const mode = instrumentModeRef.current;
            const stems = ['vocals', 'other', 'drums', 'bass'] as const;
            
            masterGainNode.gain.value = 1.0; // overall mix safely kept flat if stems are pre-mixed
            masterGainNode.connect(audioCtxRef.current.destination);
            
            const startTime = audioCtxRef.current.currentTime;
            
            stems.forEach(stem => {
                const source = audioCtxRef.current!.createBufferSource();
                source.buffer = (audioBuffer as any)[stem];
                
                const stemGain = audioCtxRef.current!.createGain();
                stemGain.gain.value = 1.0;
                
                // Targeted penalty routing
                if (
                    (mode === 'other' && stem === 'other') ||
                    (mode === 'drums' && stem === 'drums') ||
                    (mode === 'bass' && stem === 'bass')
                ) {
                    audioGainNodeRef.current = stemGain;
                }
                
                source.connect(stemGain);
                stemGain.connect(masterGainNode);
                
                audioSourcesRef.current.push(source);
                source.start(startTime); // Start synchronously
            });
            
            startTimeRef.current = startTime;
          }
          
          gameActiveRef.current = true;
        }
      }

      const currentSpeedZ = getSpeed() * 200;

      if (gameActiveRef.current && audioCtxRef.current) {
        const playbackTime = audioCtxRef.current.currentTime - startTimeRef.current;
        const fallTime = START_Z / currentSpeedZ;

        const beats = beatMapRef.current;
        while (spawnedIndexRef.current < beats.length) {
          const beat = beats[spawnedIndexRef.current];
          if (playbackTime >= beat.time - fallTime) {
             beat.notes.forEach((bn: any) => {
                 notes.push(new Note(bn.lane, START_Z, currentSpeedZ, bn.type, bn.lengthZ));
             });

             spawnedIndexRef.current++;
          } else {
             break;
          }
        }
        
        if (audioBufferRef.current) {
            const buf = audioBufferRef.current;
            const duration = 'vocals' in buf ? buf.vocals.duration : buf.duration;
            const allSpawned = spawnedIndexRef.current >= beats.length;
            if (playbackTime > duration + 1.0 && allSpawned && notes.length === 0) {
                handleGameEnd();
            }
        }
      }

      if (gameStateRef.current === 'game') {
          update(safeDelta);
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
        // Audio penalty: mute targeted stem briefly to provide feedback for misses
        if (audioGainNodeRef.current && audioCtxRef.current) {
            const ctx = audioCtxRef.current;
            const now = ctx.currentTime;
            
            // Fixed duck volume for isolated stems
            const duckVolume = 0.0;
            
            audioGainNodeRef.current.gain.cancelScheduledValues(now);
            audioGainNodeRef.current.gain.setValueAtTime(audioGainNodeRef.current.gain.value || 1.0, now);
            audioGainNodeRef.current.gain.linearRampToValueAtTime(duckVolume, now + 0.05);
            audioGainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + 0.5);
        }
    };

    const triggerHit = (laneIndex: number) => {
        if (activeLanes[laneIndex]) return;
        activeLanes[laneIndex] = true;
        
        let hitIndex = -1;
        let minDiff = Infinity;
        for (let j = 0; j < notes.length; j++) {
            const note = notes[j];
            if (note.lane === laneIndex && !note.isActiveHold && !note.missed) {
                const diff = Math.abs(note.z);
                if (diff < 150 && diff < minDiff) { // 150 Z distance tolerance
                   minDiff = diff;
                   hitIndex = j;
                }
            }
        }
        
        if (hitIndex !== -1) {
            const note = notes[hitIndex];
            if (note.type === 'tap') {
                notes.splice(hitIndex, 1);
                currentScoreRef.current += (minDiff <= 50 ? 10 : 5);
            } else if (note.type === 'hold') {
                note.isActiveHold = true;
                activeHolds[laneIndex] = note;
                currentScoreRef.current += (minDiff <= 50 ? 10 : 5);
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
                if (holdNote!.lengthZ <= 50) {
                    // Valid early finish (tolerance)
                    notes.splice(idx, 1);
                } else {
                    triggerMiss();
                    holdNote!.isActiveHold = false;
                    holdNote!.missed = true;
                }
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
    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const renderSongItem = (song: Song) => {
    const isFav = favorites.includes(song.id);
    return (
       <div key={song.id} 
            className="flex items-center justify-between p-4 bg-neutral-800/80 hover:bg-neutral-700/80 rounded-xl cursor-pointer transition-colors border border-white/5 active:scale-[0.99] group"
            onClick={() => setSelectedSong(song)}>
          <span className="font-bold text-slate-200 text-lg truncate max-w-[80%] group-hover:text-white transition-colors">{song.title}</span>
          <button 
             onClick={(e) => toggleFavorite(song.id, e)}
             className={`p-2 rounded-full transition-colors ${isFav ? 'text-rose-500 hover:bg-rose-500/10' : 'text-neutral-500 hover:text-slate-300 hover:bg-white/10'}`}>
              <Heart fill={isFav ? "currentColor" : "none"} strokeWidth={isFav ? 0 : 2} size={24} />
          </button>
       </div>
    );
  };

  const renderSongList = () => {
    let list: Song[] = [];
    if (currentTab === 'playlist') list = defaultPlaylist;
    else if (currentTab === 'myMusic') list = myMusicList;
    else if (currentTab === 'favorite') {
       list = [...defaultPlaylist, ...myMusicList].filter(s => favorites.includes(s.id));
    }

    if (currentTab === 'myMusic') {
       return (
          <>
            <label className="flex items-center justify-center p-6 rounded-xl border-2 border-dashed border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer text-emerald-400 font-bold mb-4 transition-all">
               <span>+ Upload New Song (MP3)</span>
               <input type="file" accept="audio/*" className="hidden" onChange={handleLocalUpload} />
            </label>
            {list.length === 0 && <p className="text-center text-neutral-500 mt-8">No uploaded songs yet.</p>}
            {list.map(s => renderSongItem(s))}
          </>
       )
    }

    if (list.length === 0) {
        return <p className="text-center text-neutral-500 mt-8">No songs found.</p>;
    }

    return list.map(s => renderSongItem(s));
  }

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

          {/* Modern Player Lobby Overlay */}
      {gameState === 'lobby' && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center overflow-auto selection:bg-emerald-500/30">
            {/* Header */}
            <div className="w-full p-6 text-center pt-12 md:pt-16 pb-8">
                <h1 className="text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    Rhytmika
                </h1>
                <p className="text-emerald-500/60 font-bold tracking-[0.2em] text-sm mt-3 uppercase">Drop the beat.</p>
            </div>

            {/* Tabs Content */}
            <div className="w-full max-w-2xl px-4 pb-24 flex flex-col gap-6">
                
                {/* Custom Tab Panel */}
                <div className="bg-neutral-800/50 p-1 flex rounded-xl border border-white/5">
                    {(['playlist', 'favorite', 'myMusic'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setCurrentTab(tab)}
                            className={`flex-1 py-3 text-sm font-bold tracking-wide rounded-lg transition-all capitalize ${
                                currentTab === tab 
                                    ? 'bg-neutral-700/80 text-white shadow-sm border border-white/5' 
                                    : 'text-neutral-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            {tab === 'myMusic' ? 'My Music' : tab}
                        </button>
                    ))}
                </div>

                {/* Song List */}
                <div className="flex flex-col gap-3">
                    {renderSongList()}
                </div>
            </div>
        </div>
      )}

      {/* Difficulty Selection Modal */}
      {selectedSong && gameState === 'lobby' && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                    {selectedSong.title}
                </h2>
                <div className="text-emerald-500/80 font-bold tracking-widest text-xs uppercase mb-8">
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

                {selectedSong.stems && (
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
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                                    : 'border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300 bg-neutral-950/50'
                                }`}
                            >
                                {inst === 'other' ? 'Guitar/Keys' : inst}
                            </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={() => setSelectedSong(null)}
                        disabled={isLoadingSong}
                        className="flex-1 py-4 font-bold rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors disabled:opacity-50"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handlePlaySong}
                        disabled={isLoadingSong}
                        className="flex-[2] py-4 font-black rounded-xl bg-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 tracking-widest"
                    >
                        {isLoadingSong ? 'LOADING...' : 'LET\'S GO'}
                    </button>
                </div>
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
                    if (audioSourcesRef.current) {
                        audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
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
      {/* Analysis & Loading Overlay */}
      {isLoadingSong || isAnalyzing ? (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-sm transition-all animate-in fade-in duration-300">
          <div className="text-center px-6">
            <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-emerald-500 font-black text-2xl tracking-[0.2em] uppercase mb-3 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              {isAnalyzing ? "Analyzing Spectrum" : "Loading Track"}
            </h3>
            <p className="text-white/60 font-bold text-xs tracking-widest uppercase animate-pulse">
              {isAnalyzing ? "Mapping Genre-Adaptive Peaks..." : "Buffering Audio Stream..."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
