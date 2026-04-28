/**
 * Advanced Beat Detection Engine
 * Implements Spectral Flux for Guitars, Frequency-specific Onset for Drums/Bass,
 * and BPM-aligned Quantization.
 */

export interface DetectedNote {
  time: number;
  lane: number;
  type: 'tap' | 'hold';
  duration: number;
}

export type InstrumentType = 'other' | 'drums' | 'bass';

export async function analyzeBeatMap(
  buffer: AudioBuffer,
  instrument: InstrumentType,
  difficulty: string,
  bpmHint?: number
): Promise<DetectedNote[]> {
  const sampleRate = buffer.sampleRate;
  const channelData = buffer.getChannelData(0); // Use mono for analysis
  
  // 1. FFT-like analysis via OfflineAudioContext for filtering
  const offlineCtx = new OfflineAudioContext(1, buffer.length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  // Setup filters based on instrument
  const filterNode = offlineCtx.createBiquadFilter();
  
  if (instrument === 'drums') {
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 150; // Kick region
  } else if (instrument === 'bass') {
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 250;
  } else {
    // Guitar/Other: Use a wider band for spectral flux analysis
    filterNode.type = 'bandpass';
    filterNode.frequency.value = 1500;
    filterNode.Q.value = 0.5;
  }

  source.connect(filterNode);
  filterNode.connect(offlineCtx.destination);
  
  source.start(0);
  const renderedBuffer = await offlineCtx.startRendering();
  const analyzedData = renderedBuffer.getChannelData(0);

  // 2. Multi-band analysis for Guitars to determine "low vs high" notes
  let guitarHighBandData: Float32Array | null = null;
  if (instrument === 'other') {
    const highCtx = new OfflineAudioContext(1, buffer.length, sampleRate);
    const hSource = highCtx.createBufferSource();
    hSource.buffer = buffer;
    const hFilter = highCtx.createBiquadFilter();
    hFilter.type = 'highpass';
    hFilter.frequency.value = 3000;
    hSource.connect(hFilter);
    hFilter.connect(highCtx.destination);
    hSource.start(0);
    const hBuffer = await highCtx.startRendering();
    guitarHighBandData = hBuffer.getChannelData(0);
  }

  // 3. Compute Energy & Spectral Flux
  const windowSize = 1024;
  const hopSize = 512;
  const fluxes: number[] = [];
  const times: number[] = [];
  const highEnergyRatios: number[] = [];

  let prevEnergy = 0;
  for (let i = 0; i < analyzedData.length - windowSize; i += hopSize) {
    let energy = 0;
    let highEnergy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += Math.abs(analyzedData[i + j]);
      if (guitarHighBandData) highEnergy += Math.abs(guitarHighBandData[i + j]);
    }
    energy /= windowSize;
    highEnergy /= windowSize;

    const flux = Math.max(0, energy - prevEnergy);
    fluxes.push(flux);
    times.push((i + hopSize / 2) / sampleRate);
    highEnergyRatios.push(energy > 0 ? highEnergy / energy : 0);
    prevEnergy = energy;
  }

  // 4. Thresholding & Peak Picking
  let thresholdMultiplier = 1.0;
  if (difficulty === 'easy') thresholdMultiplier = 2.5;
  else if (difficulty === 'normal') thresholdMultiplier = 1.25;
  else if (difficulty === 'hard') thresholdMultiplier = 1.1;
  else if (difficulty === 'expert') thresholdMultiplier = 1.05;

  const threshold = calculateDynamicThreshold(fluxes, instrument).map(v => v * thresholdMultiplier);
  const peaks: { time: number; intensity: number; highRatio: number }[] = [];

  for (let i = 1; i < fluxes.length - 1; i++) {
    if (fluxes[i] > threshold[i] && fluxes[i] > fluxes[i - 1] && fluxes[i] > fluxes[i + 1]) {
      peaks.push({ time: times[i], intensity: fluxes[i], highRatio: highEnergyRatios[i] });
    }
  }

  // 5. BPM Detection & Quantization
  const estimatedBpm = estimateBPM(peaks);
  const finalBpm = bpmHint || estimatedBpm || 120;
  const beatInterval = 60 / finalBpm;
  const quantizedNotes: DetectedNote[] = [];

  const minGap = difficulty === 'expert' ? 0.08 : difficulty === 'hard' ? 0.15 : difficulty === 'easy' ? 0.6 : 0.3;
  let lastNoteTime = -1;
  let lastLane = 2;
  let handPosCenter = 2; // Track fretboard position across the whole song
  const laneFreeTime = [0, 0, 0, 0, 0]; 

  const javaSeed = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  for (const peak of peaks) {
    const sixteenth = beatInterval / 4;
    const quantizedTime = Math.round(peak.time / sixteenth) * sixteenth;

    if (quantizedTime <= lastNoteTime + minGap) continue;

    const intensityFactor = peak.intensity / (threshold[times.indexOf(peak.time)] || 1);
    
    // Determine number of notes (chords)
    let numNotes = 1;
    if (difficulty !== 'easy') {
      if (instrument === 'other') {
        // Very restrictive: 3-note chords only on massive peaks
        if (intensityFactor > 5.5 && difficulty === 'expert') numNotes = 3;
        else if (intensityFactor > 3.5 && (difficulty === 'hard' || difficulty === 'expert')) numNotes = 2;
      } else if (instrument === 'drums') {
        if (intensityFactor > 4.0) numNotes = 2;
      }
    }

    let availableLanes = [0, 1, 2, 3, 4].filter(l => quantizedTime >= laneFreeTime[l]);
    
    for (let n = 0; n < numNotes; n++) {
      if (availableLanes.length === 0) break;
      
      let lane = 2;
      const seed = javaSeed(peak.time + n * 0.1);

      if (instrument === 'bass') {
         lane = 1 + (Math.floor(peak.time * 7.5 + n) % 3);
      } else if (instrument === 'drums') {
         if (peak.intensity > 0.08) {
           lane = (Math.floor(peak.time * 5 + n) % 2) === 0 ? 0 : 4;
         } else {
           lane = 1 + (Math.floor(peak.time * 8 + n) % 3);
         }
      } else {
         // Guitar: Melodic Flow Logic
         const targetBias = peak.highRatio * 4; // Frequency-based lane target
         
         // Hand position slowly follows the frequency energy (high notes = right side)
         handPosCenter = (0.85 * handPosCenter + 0.15 * targetBias);
         
         // Within a position, notes should jump in a "melodic" interval (usually 1-2 lanes away)
         const jump = (seed > 0.6) ? (seed > 0.85 ? 2 : 1) : 0;
         const direction = javaSeed(peak.time * 1.5) > 0.5 ? 1 : -1;
         
         let idealLane = Math.floor(handPosCenter + (jump * direction));
         idealLane = Math.max(0, Math.min(4, idealLane));

         // If multiple notes in a chord, spread them out naturally
         if (n > 0) {
           if (idealLane > 2) idealLane -= n;
           else idealLane += n;
         }

         const candidateLanes = availableLanes.filter(l => Math.abs(l - idealLane) <= 1);
         lane = candidateLanes.length > 0 
           ? candidateLanes[Math.floor(seed * candidateLanes.length)] 
           : availableLanes[Math.floor(seed * availableLanes.length)];
      }

      if (!availableLanes.includes(lane)) {
        lane = availableLanes[Math.floor(seed * availableLanes.length)];
      }
      
      availableLanes = availableLanes.filter(l => l !== lane);
      if (n === 0) lastLane = lane;

      // Hold Logic
      let type: 'tap' | 'hold' = 'tap';
      let duration = 0;
      const holdChance = instrument === 'bass' ? 0.4 : instrument === 'drums' ? 0.05 : 0.15;
      
      if (n === 0 && javaSeed(peak.time * 99) < holdChance) {
        type = 'hold';
        duration = instrument === 'bass' ? beatInterval * 1.5 : beatInterval * 0.8;
      }

      laneFreeTime[lane] = quantizedTime + duration + minGap;

      quantizedNotes.push({
        time: quantizedTime,
        lane,
        type,
        duration
      });
    }

    lastNoteTime = quantizedTime;
  }

  return quantizedNotes;
}

function calculateDynamicThreshold(fluxes: number[], instrument: InstrumentType): number[] {
  const windowSize = 25; // Smoothing window
  const thresholds: number[] = [];
  const multiplier = instrument === 'drums' ? 1.4 : instrument === 'bass' ? 1.6 : 1.8;

  for (let i = 0; i < fluxes.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(fluxes.length, i + windowSize);
    let sum = 0;
    for (let j = start; j < end; j++) sum += fluxes[j];
    const avg = sum / (end - start);
    thresholds.push(Math.max(0.001, avg * multiplier));
  }
  return thresholds;
}

function estimateBPM(peaks: { time: number }[]): number {
  if (peaks.length < 2) return 120;
  
  const intervals: number[] = [];
  for (let i = 1; i < Math.min(peaks.length, 50); i++) {
    intervals.push(peaks[i].time - peaks[i - 1].time);
  }

  // Find most common interval (mode-ish cluster)
  const sortedIntervals = [...intervals].sort();
  const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
  
  let bpm = 60 / medianInterval;
  while (bpm < 90) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  
  return Math.round(bpm / 5) * 5; // Snap to nearest 5 BPM
}
