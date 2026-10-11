import React from 'react';
import { Volume2, VolumeX, Drum, Layers } from 'lucide-react';

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

  // Colors for harmony parts to give distinct visual anchors
  const getPartColor = (index, name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('soprano')) return 'text-pink-500 dark:text-pink-400 border-pink-400/50 dark:border-pink-500/30 bg-pink-100 dark:bg-pink-500/10';
    if (lower.includes('alto')) return 'text-amber-600 dark:text-amber-400 border-amber-400/50 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-500/10';
    if (lower.includes('tenor')) return 'text-cyan-600 dark:text-cyan-400 border-cyan-400/50 dark:border-cyan-500/30 bg-cyan-100 dark:bg-cyan-500/10';
    if (lower.includes('bass')) return 'text-emerald-600 dark:text-emerald-400 border-emerald-400/50 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/10';

    const colors = [
      'text-blue-600 dark:text-blue-400 border-blue-400/50 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-500/10',
      'text-rose-600 dark:text-rose-400 border-rose-400/50 dark:border-rose-500/30 bg-rose-100 dark:bg-rose-500/10',
      'text-teal-600 dark:text-teal-400 border-teal-400/50 dark:border-teal-500/30 bg-teal-100 dark:bg-teal-500/10',
      'text-indigo-600 dark:text-indigo-400 border-indigo-400/50 dark:border-indigo-500/30 bg-indigo-100 dark:bg-indigo-500/10',
    ];
    return colors[index % colors.length];
  };

  const focusedStem = stems.find((s) => s.id === focusPart);
  const otherStems = stems.filter((s) => s.id !== focusPart);
  const focusedIndex = stems.findIndex((s) => s.id === focusPart);
  const focusedColorClass = focusedStem
    ? getPartColor(focusedIndex >= 0 ? focusedIndex : 0, focusedStem.name)
    : '';
  const focusedVol = focusedStem ? (stemVolumes[focusedStem.id] ?? 100) : 100;
  const isFocusedMuted = focusedStem ? !!mutedStates[focusedStem.id] : false;

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          MODE A: FOCUS PART SELECTED (Selected Harmony + Other Harmonies + Beat)
         ───────────────────────────────────────────────────────────── */}
      {focusPart !== 'none' && focusedStem && (
        <div className="space-y-3.5">
          {/* 1. Selected Harmony Part */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full border ${focusedColorClass}`} />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  {focusedStem.name}
                </h3>
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
                className={`flex-1 h-3 ${isFocusedMuted ? 'opacity-40 pointer-events-none' : ''}`}
              />
              <span className={`font-bold font-mono text-sm sm:text-base text-black dark:text-white w-8 text-right shrink-0 ${isFocusedMuted ? 'opacity-40' : ''}`}>
                {focusedVol}
              </span>
            </div>
          </div>

          {/* 2. Other Harmonies */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    Other Harmonies
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ({otherStems.map((s) => s.name).join(', ')})
                  </p>
                </div>
              </div>

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
                className={`flex-1 h-3 ${mutedStates['harmonies'] ? 'opacity-40 pointer-events-none' : ''}`}
              />
              <span className={`font-bold font-mono text-sm sm:text-base text-black dark:text-white w-8 text-right shrink-0 ${mutedStates['harmonies'] ? 'opacity-40' : ''}`}>
                {linkedHarmonyVolume}
              </span>
            </div>
          </div>

          {/* 3. Beat / Click Track (Independent Slider) */}
          {hasBeat && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
                    <Drum className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Beat / Rhythm Track
                    </h3>
                  </div>
                </div>

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
                  className={`flex-1 h-3 ${mutedStates['beat'] ? 'opacity-40 pointer-events-none' : ''}`}
                />
                <span className={`font-bold font-mono text-sm sm:text-base text-black dark:text-white w-8 text-right shrink-0 ${mutedStates['beat'] ? 'opacity-40' : ''}`}>
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
          {stems.map((stem, idx) => {
            const vol = stemVolumes[stem.id] ?? 80;
            const isMuted = !!mutedStates[stem.id];
            const colorClass = getPartColor(idx, stem.name);

            return (
              <div
                key={stem.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-750 transition shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full border ${colorClass}`} />
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {stem.name}
                    </h3>
                  </div>

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
                    className={`flex-1 h-3 ${isMuted ? 'opacity-40 pointer-events-none' : ''}`}
                  />
                  <span className={`font-bold font-mono text-sm sm:text-base text-black dark:text-white w-8 text-right shrink-0 ${isMuted ? 'opacity-40' : ''}`}>
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
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center">
                    <Drum className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Beat / Rhythm Track
                    </h3>
                  </div>
                </div>

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
                  className={`flex-1 h-3 ${mutedStates['beat'] ? 'opacity-40 pointer-events-none' : ''}`}
                />
                <span className={`font-bold font-mono text-sm sm:text-base text-black dark:text-white w-8 text-right shrink-0 ${mutedStates['beat'] ? 'opacity-40' : ''}`}>
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
