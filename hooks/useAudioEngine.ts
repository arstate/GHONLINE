
import { useRef, useState } from 'react';
import { getSongBuffer, Song } from '../lib/utils';
import { analyzeBeatMap, InstrumentType } from '../lib/beatDetection';

export function useAudioEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | { vocals: AudioBuffer, other: AudioBuffer, drums: AudioBuffer, bass: AudioBuffer } | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const audioGainNodeRef = useRef<GainNode | null>(null);
  const audioGainP2Ref = useRef<GainNode | null>(null);
  const beatMapRef = useRef<any[]>([]);
  const beatMapP2Ref = useRef<any[]>([]);
  const [bpm, setBpm] = useState<number>(0);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchWithProgress = async (url: string, onProgress: (loaded: number, total: number) => void) => {
    const response = await fetch(url);
    if (!response.body) return null;
    
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];

    while(true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress(loaded, total);
    }

    const allChunks = new Uint8Array(loaded);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    return allChunks.buffer;
  };

  const analyzeAndGenerateBeatMap = async (
    buffer: AudioBuffer, 
    currentDiff: string, 
    targetRef: any = beatMapRef, 
    instrumentType: InstrumentType = 'other'
  ) => {
    const detectedNotes = await analyzeBeatMap(buffer, instrumentType, currentDiff);
    
    // Convert to the game's internal format
    // Group notes by timestamp for chords
    const grouped: Record<string, any[]> = {};
    detectedNotes.forEach(note => {
      const timeKey = note.time.toFixed(4);
      if (!grouped[timeKey]) grouped[timeKey] = [];
      grouped[timeKey].push({ lane: note.lane, type: note.type, duration: note.duration });
    });

    const beatMap = Object.entries(grouped)
      .map(([time, notes]) => ({ time: parseFloat(time), notes }))
      .sort((a, b) => a.time - b.time);

    targetRef.current = beatMap;

    // Estimate BPM from intervals if not already set
    if (beatMap.length > 1) {
      let intervals = [];
      for(let i=1; i < Math.min(beatMap.length, 100); i++) {
        const diff = beatMap[i].time - beatMap[i-1].time;
        if (diff > 0.1) intervals.push(diff);
      }
      if (intervals.length > 0) {
        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        let b = Math.round(60 / median);
        while (b < 100) b *= 2;
        while (b > 200) b /= 2;
        setBpm(Math.round(b));
      } else {
        setBpm(120);
      }
    } else {
      setBpm(120);
    }
  };


  const loadSong = async (song: Song, difficulty: string, instrumentMode: 'other' | 'drums' | 'bass', gameMode: 'single' | 'multiplayer' = 'single') => {
    setIsLoadingSong(true);
    setLoadingProgress(0);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      let analyzeBufferP1: AudioBuffer;
      let analyzeBufferP2: AudioBuffer | null = null;

      if (song.stems) {
        const stemUrls = [song.stems.vocals, song.stems.other, song.stems.drums, song.stems.bass];
        const progressMap = new Map<number, { loaded: number, total: number }>();
        const updateGlobalProgress = () => {
          let totalLoaded = 0, totalSize = 0;
          progressMap.forEach(p => { totalLoaded += p.loaded; totalSize += p.total; });
          if (totalSize > 0) setLoadingProgress(Math.floor((totalLoaded / totalSize) * 100));
        };
        const stemBuffers = await Promise.all(stemUrls.map((url, idx) => 
          fetchWithProgress(url, (loaded, total) => {
            progressMap.set(idx, { loaded, total });
            updateGlobalProgress();
          })
        ));
        if (stemBuffers.some(b => b === null)) throw new Error("Failed to download stems");
        const [vocBuf, otherBuf, drumBuf, bassBuf] = await Promise.all(stemBuffers.map(buf => audioCtxRef.current!.decodeAudioData(buf!)));
        audioBufferRef.current = { vocals: vocBuf, other: otherBuf, drums: drumBuf, bass: bassBuf };
        
        if (gameMode === 'multiplayer') {
          analyzeBufferP1 = otherBuf; // P1 is Guitar
          analyzeBufferP2 = drumBuf;  // P2 is Drums
        } else {
          analyzeBufferP1 = instrumentMode === 'drums' ? drumBuf : instrumentMode === 'bass' ? bassBuf : otherBuf;
        }
      } else {
        let arrayBuffer: ArrayBuffer;
        if (song.type === 'remote') {
          const buffer = await fetchWithProgress(song.url!, (loaded, total) => { if (total > 0) setLoadingProgress(Math.floor((loaded / total) * 100)); });
          if (!buffer) throw new Error("Failed to download song");
          arrayBuffer = buffer;
        } else {
          arrayBuffer = await getSongBuffer(song.dbId!);
          setLoadingProgress(100);
        }
        const decodedBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedBuffer;
        analyzeBufferP1 = decodedBuffer;
        if (gameMode === 'multiplayer') analyzeBufferP2 = decodedBuffer;
      }
      setIsAnalyzing(true);
      
      await analyzeAndGenerateBeatMap(analyzeBufferP1, difficulty, beatMapRef, gameMode === 'multiplayer' ? 'other' : instrumentMode);
      
      if (analyzeBufferP2) {
        await analyzeAndGenerateBeatMap(analyzeBufferP2, difficulty, beatMapP2Ref, 'drums'); // P2 is always Drums in multiplayer
      } else {
        beatMapP2Ref.current = [];
      }
      setIsAnalyzing(false);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsLoadingSong(false);
      setIsAnalyzing(false);
    }
  };

  const stopAudio = () => {
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    audioSourcesRef.current = [];
  };

  return {
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
  };
}
