
import { useRef, useState } from 'react';
import { getSongBuffer, Song } from '../lib/utils';

export function useAudioEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | { vocals: AudioBuffer, other: AudioBuffer, drums: AudioBuffer, bass: AudioBuffer } | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const audioGainNodeRef = useRef<GainNode | null>(null);
  const beatMapRef = useRef<any[]>([]);
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

  const analyzeAndGenerateBeatMap = async (buffer: AudioBuffer, currentDiff: string) => {
    const offlineCtx = new OfflineAudioContext(3, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    const merger = offlineCtx.createChannelMerger(3);

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

    let lowEnergy = 0;
    let midEnergy = 0;
    const energyStep = Math.floor(buffer.sampleRate / 2);
    for (let i = 0; i < lowData.length; i += energyStep) {
        lowEnergy += Math.abs(lowData[i]);
        midEnergy += Math.abs(midData[i]);
    }
    const isRock = midEnergy > (lowEnergy * 0.65);

    const beatMap: any[] = [];
    const sampleRate = buffer.sampleRate;
    const sampleWindow = 512;
    const windowSeconds = 1.5; 
    const windowSamples = Math.floor(windowSeconds * sampleRate / sampleWindow);
    
    let sensitivity = 1.35;
    let cooldownSecs = 0.22;
    let holdProb = 0.1;
    
    if (currentDiff === 'easy') { sensitivity = 1.8; cooldownSecs = 0.45; holdProb = 0.05; }
    else if (currentDiff === 'hard') { sensitivity = 1.25; cooldownSecs = 0.16; holdProb = 0.25; }
    else if (currentDiff === 'expert') { sensitivity = 1.15; cooldownSecs = 0.12; holdProb = 0.4; }

    let lastPeakTime = -cooldownSecs;
    let laneFreeTime = [0, 0, 0, 0, 0];
    const minGap = 0.2; 

    let localFluxSum = 0;
    const fluxHistory: number[] = [];
    const analysisData = isRock ? midData : lowData;
    let prevEnergy = 0;

    for (let i = 0; i < analysisData.length; i += sampleWindow) {
        let sum = 0;
        let limit = Math.min(i + sampleWindow, analysisData.length);
        for(let j = i; j < limit; j++) sum += Math.abs(analysisData[j]);
        const currentEnergy = sum / (limit - i);
        const flux = Math.max(0, currentEnergy - prevEnergy);
        prevEnergy = currentEnergy;
        const currentTime = i / sampleRate;

        fluxHistory.push(flux);
        localFluxSum += flux;
        if (fluxHistory.length > windowSamples) localFluxSum -= fluxHistory.shift()!;
        const localFluxAvg = localFluxSum / fluxHistory.length;
        const dynamicThreshold = localFluxAvg * sensitivity;

        if (flux > dynamicThreshold && flux > 0.005 && (currentTime - lastPeakTime) > cooldownSecs) {
            const lowVal = Math.abs(lowData[i]);
            const midVal = Math.abs(midData[i]);
            let numNotes = 1;
            if (currentDiff === 'expert' && flux > dynamicThreshold * 1.8) numNotes = 3;
            else if ((currentDiff === 'hard' || currentDiff === 'expert') && flux > dynamicThreshold * 1.4) numNotes = 2;
            
            let availableLanes = [0, 1, 2, 3, 4].filter(l => currentTime >= laneFreeTime[l]);
            if (availableLanes.length === 0) continue;
            numNotes = Math.min(numNotes, availableLanes.length);

            const beatNotes = [];
            for (let n = 0; n < numNotes; n++) {
                if (availableLanes.length === 0) break;
                let lane;
                if (lowVal > midVal * 1.2) {
                    const outer = availableLanes.filter(l => l === 0 || l === 4);
                    lane = outer.length > 0 ? outer[Math.floor(Math.random() * outer.length)] : availableLanes[Math.floor(Math.random() * availableLanes.length)];
                } else {
                    const inner = availableLanes.filter(l => l === 1 || l === 2 || l === 3);
                    lane = inner.length > 0 ? inner[Math.floor(Math.random() * inner.length)] : availableLanes[Math.floor(Math.random() * availableLanes.length)];
                }
                availableLanes = availableLanes.filter(l => l !== lane);
                const isHold = n === 0 && Math.random() < holdProb;
                const holdDurationSecs = isHold ? (0.3 + Math.random() * 0.7) : 0;
                laneFreeTime[lane] = currentTime + holdDurationSecs + minGap;
                beatNotes.push({ lane, type: isHold ? 'hold' : 'tap', duration: holdDurationSecs });
            }
            if (beatNotes.length > 0) {
                beatMap.push({ time: currentTime, notes: beatNotes });
                lastPeakTime = currentTime;
            }
        }
    }
    beatMapRef.current = beatMap;
    
    let intervals: number[] = [];
    for (let j = 1; j < beatMap.length; j++) {
        const interval = beatMap[j].time - beatMap[j-1].time;
        if (interval > 0.25 && interval < 1.0) intervals.push(interval);
    }
    
    let calculatedBpm = 120;
    if (intervals.length > 0) {
        const bins: Record<string, number> = {};
        for (const interval of intervals) {
            const binKey = (Math.round(interval * 20) / 20).toFixed(2);
            bins[binKey] = (bins[binKey] || 0) + 1;
        }
        let maxCount = 0;
        let modeInterval = 0.5;
        for (const [key, count] of Object.entries(bins)) {
            if (count > maxCount) { maxCount = count; modeInterval = parseFloat(key); }
        }
        calculatedBpm = Math.round(60 / modeInterval);
    }
    setBpm(calculatedBpm);
  };

  const loadSong = async (song: Song, difficulty: string, instrumentMode: 'other' | 'drums' | 'bass') => {
    setIsLoadingSong(true);
    setLoadingProgress(0);
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      let analyzeBuffer: AudioBuffer;

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
        analyzeBuffer = instrumentMode === 'drums' ? drumBuf : instrumentMode === 'bass' ? bassBuf : otherBuf;
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
        analyzeBuffer = decodedBuffer;
      }
      setIsAnalyzing(true);
      await analyzeAndGenerateBeatMap(analyzeBuffer, difficulty);
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
    beatMapRef,
    bpm,
    isLoadingSong,
    loadingProgress,
    isAnalyzing,
    loadSong,
    stopAudio
  };
}
