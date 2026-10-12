import { useState, useEffect, useRef, useCallback } from 'react';

// Default volume constants per requirements
const DEFAULT_SELECTED_PART_VOLUME = 100;
const DEFAULT_OTHER_HARMONIES_VOLUME = 15;
const DEFAULT_BEAT_VOLUME = 10;

export function useStemPlayer(section, songId) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);

  // Focus: 'none' or stem id (e.g. 'soprano')
  // Default is 1st in the list always, or restored from localStorage
  const [focusPart, setFocusPartState] = useState(() => {
    if (songId) {
      try {
        const saved = localStorage.getItem(`hh_part_${songId}`);
        if (saved) {
          if (saved === 'none' || section?.stems?.some((s) => s.id === saved)) {
            return saved;
          }
        }
      } catch (e) {
        console.warn('Could not read saved part from localStorage', e);
      }
    }
    // 1st in list always
    return section?.stems?.[0]?.id || 'none';
  });

  const setFocusPart = useCallback((newPart) => {
    setFocusPartState(newPart);
    if (songId) {
      try {
        localStorage.setItem(`hh_part_${songId}`, newPart);
      } catch (e) {
        console.warn('Could not save part to localStorage', e);
      }
    }
  }, [songId]);

  // Keep focusPart in sync when songId or section changes
  useEffect(() => {
    if (!songId || !section) return;
    try {
      const saved = localStorage.getItem(`hh_part_${songId}`);
      if (saved) {
        if (saved === 'none' || section.stems?.some((s) => s.id === saved)) {
          setFocusPartState(saved);
          return;
        }
      }
    } catch (e) {}

    // Default to 1st in the list if current focusPart is not in section stems
    setFocusPartState((prev) => {
      if (prev && (prev === 'none' || section.stems?.some((s) => s.id === prev))) {
        return prev;
      }
      return section.stems?.[0]?.id || 'none';
    });
  }, [songId, section]);

  // Volumes (0 to 100): in-memory defaults (selected part: 100, other harmonies: 15, beat: 10)
  // For unlinked / individual stems: { [stemId]: number }
  const [stemVolumes, setStemVolumes] = useState({});
  // When a focus is selected, other harmony parts share this linked volume (default 15%)
  const [linkedHarmonyVolume, setLinkedHarmonyVolumeState] = useState(DEFAULT_OTHER_HARMONIES_VOLUME);
  // Beat track volume (default 10%)
  const [beatVolume, setBeatVolumeState] = useState(DEFAULT_BEAT_VOLUME);

  // Mute states: { [stemId]: boolean, beat: boolean }
  const [mutedStates, setMutedStates] = useState({});

  // Reset volumes and mutes to standard defaults whenever songId changes
  useEffect(() => {
    setStemVolumes({});
    setLinkedHarmonyVolumeState(DEFAULT_OTHER_HARMONIES_VOLUME);
    setBeatVolumeState(DEFAULT_BEAT_VOLUME);
    setMutedStates({});
  }, [songId]);

  // Refs to always have latest volume/mute/focus values in async audio callbacks
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

  // Audio Context & Web Audio Nodes
  const audioCtxRef = useRef(null);
  const buffersRef = useRef({}); // { [id]: AudioBuffer }
  const gainNodesRef = useRef({}); // { [id]: GainNode }
  const sourceNodesRef = useRef({}); // { [id]: AudioBufferSourceNode }
  const masterGainRef = useRef(null);

  // Playback timing refs
  const playStartTimeRef = useRef(0);
  const offsetAtStartRef = useRef(0);
  const animFrameRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);

  // Initialize or resume AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Calculate and apply target gain to a GainNode
  const applyGainToNode = useCallback((trackId, gainNode, immediate = false) => {
    if (!gainNode || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const isOtherHarmony = focusPartRef.current !== 'none' && trackId !== 'beat' && trackId !== focusPartRef.current;
    const isMuted = !!mutedStatesRef.current[trackId] || (isOtherHarmony && !!mutedStatesRef.current['harmonies']);

    let targetGain = 0;
    if (!isMuted) {
      if (trackId === 'beat') {
        // Capped so 100% on slider = 25% audio gain for fine control
        targetGain = (beatVolumeRef.current / 100) * 0.25;
      } else if (focusPartRef.current === 'none') {
        const vol = stemVolumesRef.current[trackId] ?? 100;
        targetGain = vol / 100;
      } else if (focusPartRef.current === trackId) {
        const vol = stemVolumesRef.current[trackId] ?? 100;
        targetGain = vol / 100;
      } else {
        targetGain = linkedHarmonyVolumeRef.current / 100;
      }
    }

    if (immediate) {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(targetGain, now);
    } else {
      gainNode.gain.setTargetAtTime(targetGain, now, 0.02);
    }
  }, []);

  // Update stemVolumes state when section changes, ensuring all stems have defaults
  useEffect(() => {
    if (!section) return;

    setStemVolumes((prev) => {
      const updated = { ...prev };
      section.stems?.forEach((stem) => {
        if (updated[stem.id] === undefined) {
          updated[stem.id] = DEFAULT_SELECTED_PART_VOLUME;
        }
      });
      return updated;
    });

    setMutedStates((prev) => {
      const updated = { ...prev };
      if (updated['beat'] === undefined) updated['beat'] = false;
      if (updated['harmonies'] === undefined) updated['harmonies'] = false;
      section.stems?.forEach((stem) => {
        if (updated[stem.id] === undefined) updated[stem.id] = false;
      });
      return updated;
    });
  }, [section]);

  // Load and decode all audio stems for the current section
  useEffect(() => {
    if (!section) return;

    let isCancelled = false;
    setIsLoading(true);
    setLoadingError(null);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentTime(0);
    currentTimeRef.current = 0;
    offsetAtStartRef.current = 0;

    // Stop and cleanup previous sources and nodes
    Object.values(sourceNodesRef.current).forEach((source) => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    sourceNodesRef.current = {};

    const ctx = getAudioContext();
    buffersRef.current = {};
    gainNodesRef.current = {};

    const tracksToLoad = [
      ...(section.stems || []).map((s) => ({ id: s.id, file: s.file })),
      ...(section.beat ? [{ id: 'beat', file: section.beat }] : []),
    ];

    async function loadTracks() {
      try {
        let maxDuration = 0;
        const loadPromises = tracksToLoad.map(async (track) => {
          try {
            const response = await fetch(track.file);
            if (!response.ok) {
              throw new Error(`Failed to load ${track.file} (${response.status})`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

            if (!isCancelled) {
              buffersRef.current[track.id] = decodedBuffer;
              if (decodedBuffer.duration > maxDuration) {
                maxDuration = decodedBuffer.duration;
              }

              // Create dedicated GainNode for this track
              const gainNode = ctx.createGain();
              gainNode.connect(masterGainRef.current);

              // Immediately initialize the gain to the user's configured volume!
              applyGainToNode(track.id, gainNode, true);

              gainNodesRef.current[track.id] = gainNode;
            }
          } catch (err) {
            console.warn(`Error loading track ${track.id}:`, err);
          }
        });

        await Promise.all(loadPromises);

        if (!isCancelled) {
          if (Object.keys(buffersRef.current).length === 0) {
            setLoadingError('Could not load audio tracks for this section.');
          } else {
            setDuration(maxDuration);
            // Re-apply gains across all newly instantiated gain nodes to guarantee volume accuracy
            Object.entries(gainNodesRef.current).forEach(([id, node]) => {
              applyGainToNode(id, node, true);
            });
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setLoadingError(err.message || 'Error loading audio stems');
          setIsLoading(false);
        }
      }
    }

    loadTracks();

    return () => {
      isCancelled = true;
      Object.values(sourceNodesRef.current).forEach((source) => {
        try { source.stop(); } catch (e) { /* ignore */ }
      });
      sourceNodesRef.current = {};
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [section, getAudioContext, applyGainToNode]);

  // Update gains in real time whenever volumes, mutes, or focus changes
  useEffect(() => {
    Object.entries(gainNodesRef.current).forEach(([id, node]) => {
      applyGainToNode(id, node, false);
    });
  }, [section, focusPart, stemVolumes, linkedHarmonyVolume, beatVolume, mutedStates, applyGainToNode]);

  // Animation frame loop to keep currentTime synced with audio clock
  const updateProgress = useCallback(() => {
    if (!isPlayingRef.current || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const elapsed = ctx.currentTime - playStartTimeRef.current;
    const current = offsetAtStartRef.current + elapsed;

    if (duration > 0 && current >= duration) {
      // Reached the end
      stopPlayback();
      setCurrentTime(0);
      currentTimeRef.current = 0;
      offsetAtStartRef.current = 0;
      return;
    }

    setCurrentTime(current);
    currentTimeRef.current = current;
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [duration]);

  // Start all stems at the exact same microsecond
  const startPlayback = useCallback((offset = 0) => {
    const ctx = getAudioContext();
    if (Object.keys(buffersRef.current).length === 0) return;

    // Stop any existing sources
    Object.values(sourceNodesRef.current).forEach((source) => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    sourceNodesRef.current = {};

    // Re-verify gains before scheduling playback
    Object.entries(gainNodesRef.current).forEach(([id, node]) => {
      applyGainToNode(id, node, true);
    });

    // Schedule slightly in future for sample-accurate simultaneous trigger
    const startTime = ctx.currentTime + 0.04;
    const clampedOffset = Math.max(0, Math.min(offset, duration - 0.05));

    Object.entries(buffersRef.current).forEach(([id, buffer]) => {
      if (clampedOffset >= buffer.duration) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = gainNodesRef.current[id];
      if (gainNode) {
        source.connect(gainNode);
      } else {
        source.connect(masterGainRef.current);
      }

      source.start(startTime, clampedOffset);
      sourceNodesRef.current[id] = source;
    });

    playStartTimeRef.current = startTime;
    offsetAtStartRef.current = clampedOffset;
    isPlayingRef.current = true;
    setIsPlaying(true);

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [getAudioContext, duration, updateProgress, applyGainToNode]);

  // Stop playback cleanly
  const stopPlayback = useCallback(() => {
    Object.values(sourceNodesRef.current).forEach((source) => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    sourceNodesRef.current = {};

    if (isPlayingRef.current && audioCtxRef.current) {
      const elapsed = audioCtxRef.current.currentTime - playStartTimeRef.current;
      offsetAtStartRef.current = Math.min(duration, Math.max(0, offsetAtStartRef.current + elapsed));
      setCurrentTime(offsetAtStartRef.current);
      currentTimeRef.current = offsetAtStartRef.current;
    }

    isPlayingRef.current = false;
    setIsPlaying(false);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, [duration]);

  // Toggle Play / Pause
  const togglePlayPause = useCallback(() => {
    if (isPlayingRef.current) {
      stopPlayback();
    } else {
      startPlayback(currentTimeRef.current);
    }
  }, [startPlayback, stopPlayback]);

  // Seek to specific time position
  const seekTo = useCallback((targetTime) => {
    const clamped = Math.max(0, Math.min(targetTime, duration));
    const wasPlaying = isPlayingRef.current;

    if (wasPlaying) {
      stopPlayback();
      startPlayback(clamped);
    } else {
      offsetAtStartRef.current = clamped;
      setCurrentTime(clamped);
      currentTimeRef.current = clamped;
    }
  }, [duration, stopPlayback, startPlayback]);

  // Quick jump by seconds (e.g. -5s or +5s)
  const quickJump = useCallback((deltaSeconds) => {
    const nextTime = (currentTimeRef.current || 0) + deltaSeconds;
    seekTo(nextTime);
  }, [seekTo]);

  // Volume & Mute setter helpers (in-memory session state only, no localStorage)
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
  };
}
