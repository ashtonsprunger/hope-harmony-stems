import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

function getSliderTrackStyle(value, isMuted = false) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  if (isMuted) {
    return {
      background: `linear-gradient(to right, #94a3b8 0%, #94a3b8 ${clamped}%, rgba(148, 163, 184, 0.2) ${clamped}%, rgba(148, 163, 184, 0.2) 100%)`,
    };
  }
  return {
    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${clamped}%, rgba(148, 163, 184, 0.25) ${clamped}%, rgba(148, 163, 184, 0.25) 100%)`,
  };
}

export default function Mixer({
  section,
  focusPart,
  stemVolumes,
  onSingleStemVolumeChange,
  linkedHarmonyVolume,
  onLinkedHarmonyVolumeChange,
  beatVolume,
  onBeatVolumeChange,
  mutedStates,
  onToggleMute,
}) {
  const stems = section?.stems || [];
  const hasBeat = !!section?.beat;

  const focusedStem = stems.find((s) => s.id === focusPart);
  const focusedVol = focusedStem ? (stemVolumes[focusedStem.id] ?? 100) : 100;
  const isFocusedMuted = focusedStem ? !!mutedStates[focusedStem.id] : false;

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          MODE A: FOCUS PART SELECTED (Selected Harmony + Other Harmonies + Beat)
         ───────────────────────────────────────────────────────────── */}
      {focusPart !== 'none' && focusedStem && (
        <div className="space-y-3.5">
          {/* 1. Selected Harmony Part (Hero Card) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/95 border-2 border-blue-500/40 dark:border-blue-500/50 shadow-sm ring-1 ring-blue-500/20">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                  {focusedStem.name}
                </h3>
                <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 shrink-0">
                  Your Part
                </span>
              </div>

              <button
                onClick={() => onToggleMute(focusedStem.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  isFocusedMuted
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isFocusedMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                <span>Mute</span>
              </button>
            </div>

            <div className="flex items-center gap-3 py-1">
              <input
                type="range"
                min="0"
                max="100"
                value={focusedVol}
                onChange={(e) => onSingleStemVolumeChange(focusedStem.id, Number(e.target.value))}
                disabled={isFocusedMuted}
                className={`flex-1 ${isFocusedMuted ? 'opacity-40 pointer-events-none' : ''}`}
                style={getSliderTrackStyle(focusedVol, isFocusedMuted)}
              />
              <span className={`font-bold font-mono tabular-nums text-sm sm:text-base text-slate-900 dark:text-slate-100 w-8 text-right shrink-0 ${isFocusedMuted ? 'opacity-40' : ''}`}>
                {focusedVol}
              </span>
            </div>
          </div>

          {/* 2. Other Harmonies */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                Other Harmonies
              </h3>

              <button
                onClick={() => onToggleMute('harmonies')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  mutedStates['harmonies']
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {mutedStates['harmonies'] ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                <span>Mute</span>
              </button>
            </div>

            {/* Unified Slider */}
            <div className="flex items-center gap-3 py-1">
              <input
                type="range"
                min="0"
                max="100"
                value={linkedHarmonyVolume}
                onChange={(e) => onLinkedHarmonyVolumeChange(Number(e.target.value))}
                disabled={mutedStates['harmonies']}
                className={`flex-1 ${mutedStates['harmonies'] ? 'opacity-40 pointer-events-none' : ''}`}
                style={getSliderTrackStyle(linkedHarmonyVolume, !!mutedStates['harmonies'])}
              />
              <span className={`font-bold font-mono tabular-nums text-sm sm:text-base text-slate-900 dark:text-slate-100 w-8 text-right shrink-0 ${mutedStates['harmonies'] ? 'opacity-40' : ''}`}>
                {linkedHarmonyVolume}
              </span>
            </div>
          </div>

          {/* 3. Beat / Click Track (Independent Slider) */}
          {hasBeat && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                  Beat
                </h3>

                <button
                  onClick={() => onToggleMute('beat')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    mutedStates['beat']
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {mutedStates['beat'] ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>Mute</span>
                </button>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beatVolume}
                  onChange={(e) => onBeatVolumeChange(Number(e.target.value))}
                  disabled={mutedStates['beat']}
                  className={`flex-1 ${mutedStates['beat'] ? 'opacity-40 pointer-events-none' : ''}`}
                  style={getSliderTrackStyle(beatVolume, !!mutedStates['beat'])}
                />
                <span className={`font-bold font-mono tabular-nums text-sm sm:text-base text-slate-900 dark:text-slate-100 w-8 text-right shrink-0 ${mutedStates['beat'] ? 'opacity-40' : ''}`}>
                  {beatVolume}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE B: FOCUS = NONE (All stems unlinked with individual sliders)
         ───────────────────────────────────────────────────────────── */}
      {focusPart === 'none' && (
        <div className="space-y-3">
          {/* Individual Harmony Stem Cards */}
          {stems.map((stem) => {
            const vol = stemVolumes[stem.id] ?? 100;
            const isMuted = !!mutedStates[stem.id];

            return (
              <div
                key={stem.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-750 transition shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                    {stem.name}
                  </h3>

                  <button
                    onClick={() => onToggleMute(stem.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      isMuted
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80 ring-1 ring-rose-400 dark:ring-rose-500/40'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    )}
                    <span>Mute</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={vol}
                    onChange={(e) => onSingleStemVolumeChange(stem.id, Number(e.target.value))}
                    disabled={isMuted}
                    className={`flex-1 ${isMuted ? 'opacity-40 pointer-events-none' : ''}`}
                    style={getSliderTrackStyle(vol, isMuted)}
                  />
                  <span className={`font-bold font-mono tabular-nums text-sm sm:text-base text-slate-900 dark:text-slate-100 w-8 text-right shrink-0 ${isMuted ? 'opacity-40' : ''}`}>
                    {vol}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Beat track in unlinked mode */}
          {hasBeat && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                  Beat
                </h3>

                <button
                  onClick={() => onToggleMute('beat')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    mutedStates['beat']
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {mutedStates['beat'] ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  )}
                  <span>Mute</span>
                </button>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beatVolume}
                  onChange={(e) => onBeatVolumeChange(Number(e.target.value))}
                  disabled={mutedStates['beat']}
                  className={`flex-1 ${mutedStates['beat'] ? 'opacity-40 pointer-events-none' : ''}`}
                  style={getSliderTrackStyle(beatVolume, !!mutedStates['beat'])}
                />
                <span className={`font-bold font-mono tabular-nums text-sm sm:text-base text-slate-900 dark:text-slate-100 w-8 text-right shrink-0 ${mutedStates['beat'] ? 'opacity-40' : ''}`}>
                  {beatVolume}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
