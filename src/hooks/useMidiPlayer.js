import { useState, useEffect, useRef, useCallback } from 'react';
import { parseMidi } from '../audio/midiParser';
import { ensureSoundfontLoaded } from '../audio/soundfontLoader';

// Default volume constants matching useStemPlayer
const DEFAULT_SELECTED_PART_VOLUME = 100;
const DEFAULT_OTHER_HARMONIES_VOLUME = 18;
const DEFAULT_BEAT_VOLUME = 25;

export function useMidiPlayer(section, songId, midiUrl, speed = 1.0) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);

  // Live Measure & Beat display
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentTimeSig, setCurrentTimeSig] = useState('4/4');
  const [totalMeasures, setTotalMeasures] = useState(1);

  // Focus: 'none' or stem id (e.g. 'soprano')
  const [focusPart, setFocusPartState] = useState(() => {
    if (songId) {
      try {
        const saved = localStorage.getItem(`hh_part_${songId}`);
        if (saved && (saved === 'none' || section?.stems?.some((s) => s.id === saved))) {
          return saved;
        }
      } catch (e) {}
    }
    return section?.stems?.[0]?.id || 'soprano';
  });

  const setFocusPart = useCallback((newPart) => {
    setFocusPartState(newPart);
    if (songId) {
      try {
        localStorage.setItem(`hh_part_${songId}`, newPart);
      } catch (e) {}
    }
  }, [songId]);

  // Keep focusPart in sync if stems change
  useEffect(() => {
    if (!songId || !section) return;
    try {
      const saved = localStorage.getItem(`hh_part_${songId}`);
      if (saved && (saved === 'none' || section.stems?.some((s) => s.id === saved))) {
        setFocusPartState(saved);
        return;
      }
    } catch (e) {}

    setFocusPartState((prev) => {
      if (prev && (prev === 'none' || section.stems?.some((s) => s.id === prev))) {
        return prev;
      }
      return section.stems?.[0]?.id || 'soprano';
    });
  }, [songId, section]);

  // Stem Volumes (0 to 100)
  const [stemVolumes, setStemVolumes] = useState({});
  const [linkedHarmonyVolume, setLinkedHarmonyVolumeState] = useState(DEFAULT_OTHER_HARMONIES_VOLUME);
  const [beatVolume, setBeatVolumeState] = useState(DEFAULT_BEAT_VOLUME);
  const [mutedStates, setMutedStates] = useState({});

  // Reset session volumes when song changes
  useEffect(() => {
    setStemVolumes({});
    setLinkedHarmonyVolumeState(DEFAULT_OTHER_HARMONIES_VOLUME);
    setBeatVolumeState(DEFAULT_BEAT_VOLUME);
    setMutedStates({});
  }, [songId]);

  // Audio Context & WebAudioFont Engine references
  const audioCtxRef = useRef(null);
  const playerRef = useRef(null);
  const pianoPresetRef = useRef(null);
  const beatPresetRef = useRef(null);
  const masterGainRef = useRef(null);
  const limiterRef = useRef(null);
  const partGainNodesRef = useRef({}); // { [partId]: GainNode }

  // Parsed MIDI Data
  const parsedMidiRef = useRef(null);
  const trackNotesMapRef = useRef(new Map()); // partId -> [{ pitch, startTick, endTick, velocity, channel }]

  // Playback Timing references
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const speedRef = useRef(speed);
  const audioStartTimeRef = useRef(0);
  const scheduledIndicesRef = useRef({}); // partId -> nextNoteIndexToSchedule
  const animationFrameIdRef = useRef(null);
  const scheduleIntervalIdRef = useRef(null);
  const lastUiUpdateRef = useRef(0);
  const currentMeasureRef = useRef(1);
  const currentBeatRef = useRef(1);
  const currentTimeSigRef = useRef('4/4');

  // Dynamic Volume / Mute Refs
  const focusPartRef = useRef(focusPart);
  const stemVolumesRef = useRef(stemVolumes);
  const linkedHarmonyVolumeRef = useRef(linkedHarmonyVolume);
  const beatVolumeRef = useRef(beatVolume);
  const mutedStatesRef = useRef(mutedStates);

  useEffect(() => { focusPartRef.current = focusPart; }, [focusPart]);
  useEffect(() => { stemVolumesRef.current = stemVolumes; }, [stemVolumes]);
  useEffect(() => { linkedHarmonyVolumeRef.current = linkedHarmonyVolume; }, [linkedHarmonyVolume]);
  useEffect(() => { beatVolumeRef.current = beatVolume; }, [beatVolume]);
  useEffect(() => { mutedStatesRef.current = mutedStates; }, [mutedStates]);

  // Updates real-time Web Audio GainNodes without re-triggering audio
  const applyGains = useCallback(() => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    const currentFocus = focusPartRef.current;
    const currentStemVols = stemVolumesRef.current;
    const currentLinkedVol = linkedHarmonyVolumeRef.current;
    const currentBeatVol = beatVolumeRef.current;
    const currentMutes = mutedStatesRef.current;
    const gainNodes = partGainNodesRef.current;

    const parts = ['soprano', 'alto', 'tenor', 'bass', 'beat'];

    for (const part of parts) {
      const gNode = gainNodes[part];
      if (!gNode) continue;

      let targetGain = 1.0;

      if (part === 'beat') {
        const isMuted = !!currentMutes['beat'];
        targetGain = isMuted ? 0 : currentBeatVol / 100;
      } else {
        // Vocal Harmony Part
        if (currentFocus !== 'none') {
          if (part === currentFocus) {
            const isMuted = !!currentMutes[part];
            const vol = currentStemVols[part] ?? DEFAULT_SELECTED_PART_VOLUME;
            targetGain = isMuted ? 0 : vol / 100;
          } else {
            const isMuted = !!currentMutes['harmonies'] || !!currentMutes[part];
            targetGain = isMuted ? 0 : currentLinkedVol / 100;
          }
        } else {
          // Focus = 'none' (individual mixing)
          const isMuted = !!currentMutes[part];
          const vol = currentStemVols[part] ?? DEFAULT_SELECTED_PART_VOLUME;
          targetGain = isMuted ? 0 : vol / 100;
        }
      }

      // Smooth anti-click gain ramp
      try {
        gNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.015);
      } catch (e) {
        gNode.gain.value = targetGain;
      }
    }
  }, []);

  // Update gains whenever mixer settings change
  useEffect(() => {
    applyGains();
  }, [focusPart, stemVolumes, linkedHarmonyVolume, beatVolume, mutedStates, applyGains]);

  // Audio Context & SoundFont Initialization
  const initAudioEngine = useCallback(async () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master Gain (headroom 0.50)
      const master = ctx.createGain();
      master.gain.value = 0.5;
      masterGainRef.current = master;

      // Anti-clipping Brickwall Limiter (-1.5 dBFS)
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-1.5, ctx.currentTime);
      comp.knee.setValueAtTime(0.0, ctx.currentTime);
      comp.ratio.setValueAtTime(20.0, ctx.currentTime);
      comp.attack.setValueAtTime(0.001, ctx.currentTime);
      comp.release.setValueAtTime(0.08, ctx.currentTime);
      limiterRef.current = comp;

      master.connect(comp);
      comp.connect(ctx.destination);

      // Part gain nodes
      const parts = ['soprano', 'alto', 'tenor', 'bass', 'beat'];
      for (const p of parts) {
        const g = ctx.createGain();
        g.gain.value = 1.0;
        g.connect(master);
        partGainNodesRef.current[p] = g;
      }
    }

    const { WebAudioFontPlayer, pianoPreset, beatPreset } = await ensureSoundfontLoaded();
    if (!playerRef.current) {
      playerRef.current = new WebAudioFontPlayer();
    }
    pianoPresetRef.current = pianoPreset;
    beatPresetRef.current = beatPreset;

    const ctx = audioCtxRef.current;
    if (pianoPreset) playerRef.current.adjustPreset(ctx, pianoPreset);
    if (beatPreset) playerRef.current.adjustPreset(ctx, beatPreset);

    applyGains();
  }, [applyGains]);

  // Load and Parse MIDI file
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadingError(null);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setIsPlaying(false);
    isPlayingRef.current = false;

    async function loadMidi() {
      try {
        const effectiveMidiUrl = midiUrl || section?.midiFile;
        if (!effectiveMidiUrl) {
          throw new Error('No MIDI file specified for this song.');
        }

        const [res] = await Promise.all([
          fetch(effectiveMidiUrl),
          initAudioEngine()
        ]);

        if (!res.ok) {
          throw new Error(`Failed to download MIDI file: HTTP ${res.status}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        if (isCancelled) return;

        const parsed = parseMidi(arrayBuffer);
        parsedMidiRef.current = parsed;

        // Map parsed tracks to part IDs
        const trackMap = new Map();
        for (const trk of parsed.tracks) {
          const lowerName = trk.name.toLowerCase().trim();
          let partId = null;

          if (lowerName.includes('soprano')) partId = 'soprano';
          else if (lowerName.includes('alto')) partId = 'alto';
          else if (lowerName.includes('tenor')) partId = 'tenor';
          else if (lowerName.includes('bass')) partId = 'bass';
          else if (lowerName.includes('beat') || lowerName.includes('click')) partId = 'beat';
          else if (trk.notes.length > 0) {
            // Fallback by track index if names aren't present
            if (trk.index === 1) partId = 'soprano';
            else if (trk.index === 2) partId = 'alto';
            else if (trk.index === 3) partId = 'tenor';
            else if (trk.index === 4) partId = 'bass';
            else if (trk.index === 5) partId = 'beat';
          }

          if (partId) {
            const existing = trackMap.get(partId) || [];
            trackMap.set(partId, existing.concat(trk.notes));
          }
        }

        // Sort all notes by startTick
        for (const [pId, notes] of trackMap.entries()) {
          notes.sort((a, b) => a.startTick - b.startTick);
          trackMap.set(pId, notes);
        }
        trackNotesMapRef.current = trackMap;

        const songDuration = parsed.tickToTime(parsed.maxTick, speedRef.current);
        setDuration(songDuration);
        durationRef.current = songDuration;

        // Initial measure/beat
        const mb = parsed.getMeasureAndBeat(0);
        currentMeasureRef.current = mb.measure;
        currentBeatRef.current = mb.beat;
        currentTimeSigRef.current = mb.timeSig;
        setCurrentMeasure(mb.measure);
        setCurrentBeat(mb.beat);
        setCurrentTimeSig(mb.timeSig);
        setTotalMeasures(parsed.totalMeasures || 99);

        setIsLoading(false);
      } catch (err) {
        if (!isCancelled) {
          console.error('Error loading MIDI:', err);
          setLoadingError(err.message || 'Failed to load MIDI track.');
          setIsLoading(false);
        }
      }
    }

    loadMidi();

    return () => {
      isCancelled = true;
      if (playerRef.current && audioCtxRef.current) {
        try {
          playerRef.current.cancelQueue(audioCtxRef.current);
        } catch (e) {}
      }
    };
  }, [midiUrl, section?.midiFile, songId, initAudioEngine]);

  // Handle Dynamic Speed / Tempo Changes
  useEffect(() => {
    const oldSpeed = speedRef.current;
    const newSpeed = speed || 1.0;
    if (oldSpeed === newSpeed) return;
    speedRef.current = newSpeed;

    const parsed = parsedMidiRef.current;
    if (!parsed) return;

    // Preserve musical position (exact tick) across speed changes
    const curTime = currentTimeRef.current;
    const curTick = parsed.timeToTick(curTime, oldSpeed);
    const newTime = parsed.tickToTime(curTick, newSpeed);
    const newDuration = parsed.tickToTime(parsed.maxTick, newSpeed);

    setDuration(newDuration);
    durationRef.current = newDuration;
    setCurrentTime(newTime);
    currentTimeRef.current = newTime;

    if (isPlayingRef.current && audioCtxRef.current) {
      if (playerRef.current) {
        try {
          playerRef.current.cancelQueue(audioCtxRef.current);
        } catch (e) {}
      }
      audioStartTimeRef.current = audioCtxRef.current.currentTime - newTime;
      resetScheduledIndices(curTick);
    }
  }, [speed]);

  // Reset note scheduler indices to a given tick
  const resetScheduledIndices = useCallback((atTick) => {
    const trackMap = trackNotesMapRef.current;
    const newIndices = {};
    for (const [partId, notes] of trackMap.entries()) {
      let idx = 0;
      while (idx < notes.length && notes[idx].startTick < atTick) {
        idx++;
      }
      newIndices[partId] = idx;
    }
    scheduledIndicesRef.current = newIndices;
  }, []);

  // Note Scheduling Loop
  const scheduleLookahead = useCallback(() => {
    const audioCtx = audioCtxRef.current;
    const player = playerRef.current;
    const parsed = parsedMidiRef.current;
    if (!audioCtx || !player || !parsed || !isPlayingRef.current) return;

    const currentSpeed = speedRef.current;
    const audioCurTime = audioCtx.currentTime;
    const songCurTime = Math.max(0, audioCurTime - audioStartTimeRef.current);

    // Lookahead window: 1.5s lookahead buffer provides immune playback against mobile main-thread stalls
    const lookaheadSecs = 1.5;
    const windowEndSecs = songCurTime + lookaheadSecs;
    const windowEndTick = parsed.timeToTick(windowEndSecs, currentSpeed);

    const trackMap = trackNotesMapRef.current;
    const scheduledIndices = scheduledIndicesRef.current;
    const gainNodes = partGainNodesRef.current;
    const pianoPreset = pianoPresetRef.current;
    const beatPreset = beatPresetRef.current;

    for (const [partId, notes] of trackMap.entries()) {
      const gNode = gainNodes[partId];
      if (!gNode) continue;

      let idx = scheduledIndices[partId] || 0;
      const isBeat = partId === 'beat';
      const preset = isBeat ? beatPreset : pianoPreset;
      if (!preset) continue;

      while (idx < notes.length) {
        const note = notes[idx];
        if (note.startTick > windowEndTick) break;

        const noteStartSecs = parsed.tickToTime(note.startTick, currentSpeed);
        const when = audioStartTimeRef.current + noteStartSecs;

        // Schedule if the note is in the future or not older than 150ms in the past
        if (when >= audioCurTime - 0.15) {
          const noteDurationSecs = Math.max(
            0.05,
            parsed.tickToTime(note.endTick, currentSpeed) - noteStartSecs
          );

          const velScale = (note.velocity / 127) * (isBeat ? 1.0 : 0.85);
          // For beat percussion (snare drum), always trigger at GM acoustic snare pitch (38)
          // so the snare sample plays at 1.0x native pitch regardless of the raw MIDI note
          const pitchToPlay = isBeat ? 38 : note.pitch;
          const playDuration = isBeat ? Math.max(noteDurationSecs, 0.4) : noteDurationSecs;

          try {
            player.queueWaveTable(
              audioCtx,
              gNode,
              preset,
              Math.max(audioCurTime, when),
              pitchToPlay,
              playDuration,
              velScale
            );
          } catch (e) {
            console.warn('Error scheduling note:', e);
          }
        }
        idx++;
      }

      scheduledIndices[partId] = idx;
    }
  }, []);

  // Seek Function
  const seekTo = useCallback((targetSeconds) => {
    const audioCtx = audioCtxRef.current;
    const parsed = parsedMidiRef.current;
    const maxDur = durationRef.current || 100;
    const clamped = Math.max(0, Math.min(maxDur, targetSeconds));

    if (playerRef.current && audioCtx) {
      try {
        playerRef.current.cancelQueue(audioCtx);
      } catch (e) {}
    }

    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    lastUiUpdateRef.current = performance.now();

    if (parsed) {
      const curTick = parsed.timeToTick(clamped, speedRef.current);
      resetScheduledIndices(curTick);

      const mb = parsed.getMeasureAndBeat(curTick);
      currentMeasureRef.current = mb.measure;
      currentBeatRef.current = mb.beat;
      currentTimeSigRef.current = mb.timeSig;
      setCurrentMeasure(mb.measure);
      setCurrentBeat(mb.beat);
      setCurrentTimeSig(mb.timeSig);
    }

    if (isPlayingRef.current && audioCtx) {
      audioStartTimeRef.current = audioCtx.currentTime - clamped;
      scheduleLookahead();
    }
  }, [resetScheduledIndices, scheduleLookahead]);

  // Quick Jump (+/- seconds)
  const quickJump = useCallback((deltaSeconds) => {
    seekTo(currentTimeRef.current + deltaSeconds);
  }, [seekTo]);

  // Master Play / Pause
  const togglePlayPause = useCallback(async () => {
    const audioCtx = audioCtxRef.current;
    const parsed = parsedMidiRef.current;
    if (!audioCtx || !parsed) return;

    if (isPlayingRef.current) {
      // Pause
      isPlayingRef.current = false;
      setIsPlaying(false);

      if (playerRef.current) {
        try {
          playerRef.current.cancelQueue(audioCtx);
        } catch (e) {}
      }

      if (scheduleIntervalIdRef.current) {
        clearInterval(scheduleIntervalIdRef.current);
        scheduleIntervalIdRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    } else {
      // Resume AudioContext if suspended by browser
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // If at end of song, restart from beginning
      if (currentTimeRef.current >= durationRef.current - 0.2) {
        seekTo(0);
      }

      audioStartTimeRef.current = audioCtx.currentTime - currentTimeRef.current;
      const curTick = parsed.timeToTick(currentTimeRef.current, speedRef.current);
      resetScheduledIndices(curTick);

      isPlayingRef.current = true;
      setIsPlaying(true);

      // Start Note Scheduling timer (every 50ms with 1.5s lookahead buffer)
      scheduleLookahead();
      scheduleIntervalIdRef.current = setInterval(scheduleLookahead, 50);

      // Start UI animation frame loop with throttled React state updates (20fps)
      const onFrame = () => {
        if (!isPlayingRef.current || !audioCtxRef.current) return;

        const songCurTime = Math.max(0, audioCtxRef.current.currentTime - audioStartTimeRef.current);

        if (songCurTime >= durationRef.current) {
          // Finished playback
          currentTimeRef.current = durationRef.current;
          setCurrentTime(durationRef.current);
          setIsPlaying(false);
          isPlayingRef.current = false;
          if (scheduleIntervalIdRef.current) {
            clearInterval(scheduleIntervalIdRef.current);
            scheduleIntervalIdRef.current = null;
          }
          return;
        }

        currentTimeRef.current = songCurTime;

        // Throttle React state updates to ~20fps (every 50ms) to eliminate 120Hz render churn on Pixel 10 Pro
        const now = performance.now();
        if (now - lastUiUpdateRef.current >= 50) {
          lastUiUpdateRef.current = now;
          setCurrentTime(songCurTime);

          if (parsedMidiRef.current) {
            const curTick = parsedMidiRef.current.timeToTick(songCurTime, speedRef.current);
            const mb = parsedMidiRef.current.getMeasureAndBeat(curTick);
            if (mb.measure !== currentMeasureRef.current) {
              currentMeasureRef.current = mb.measure;
              setCurrentMeasure(mb.measure);
            }
            if (mb.beat !== currentBeatRef.current) {
              currentBeatRef.current = mb.beat;
              setCurrentBeat(mb.beat);
            }
            if (mb.timeSig !== currentTimeSigRef.current) {
              currentTimeSigRef.current = mb.timeSig;
              setCurrentTimeSig(mb.timeSig);
            }
          }
        }

        animationFrameIdRef.current = requestAnimationFrame(onFrame);
      };

      animationFrameIdRef.current = requestAnimationFrame(onFrame);
    }
  }, [scheduleLookahead, seekTo, resetScheduledIndices]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (scheduleIntervalIdRef.current) {
        clearInterval(scheduleIntervalIdRef.current);
        scheduleIntervalIdRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (playerRef.current && audioCtxRef.current) {
        try {
          playerRef.current.cancelQueue(audioCtxRef.current);
        } catch (e) {}
      }
    };
  }, []);

  // Individual Mixer controls
  const setSingleStemVolume = useCallback((stemId, volume) => {
    setStemVolumes((prev) => ({ ...prev, [stemId]: volume }));
  }, []);

  const setLinkedHarmonyVolume = useCallback((volume) => {
    setLinkedHarmonyVolumeState(volume);
  }, []);

  const setBeatVolume = useCallback((volume) => {
    setBeatVolumeState(volume);
  }, []);

  const toggleMute = useCallback((id) => {
    setMutedStates((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    loadingError,
    focusPart,
    setFocusPart,
    stemVolumes,
    setSingleStemVolume,
    linkedHarmonyVolume,
    setLinkedHarmonyVolume,
    beatVolume,
    setBeatVolume,
    mutedStates,
    toggleMute,
    togglePlayPause,
    seekTo,
    quickJump,
    currentMeasure,
    currentBeat,
    currentTimeSig,
    totalMeasures
  };
}
