import React from 'react';
import { Volume2, VolumeX, Lock, Drum, Layers, Sliders } from 'lucide-react';

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
  const otherStems = stems.filter((s) => s.id !== focusPart);

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

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          MODE A: FOCUS PART SELECTED (Linked Harmony + Independent Beat)
         ───────────────────────────────────────────────────────────── */}
      {focusPart !== 'none' && focusedStem && (
        <div className="space-y-3.5">
          {/* 1. Focused Stem (Locked at 100%) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-500/70 shadow-sm dark:shadow-blue-950/20">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                  Focus Track
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  {focusedStem.name}
                </h3>
              </div>

              {/* Mute button */}
              <button
                onClick={() => onToggleMute(focusedStem.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  mutedStates[focusedStem.id]
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80 ring-1 ring-rose-400 dark:ring-rose-500/40'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {mutedStates[focusedStem.id] ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>MUTED</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Mute</span>
                  </>
                )}
              </button>
            </div>

            {/* Locked Visual Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative flex items-center">
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-150 ${
                      mutedStates[focusedStem.id]
                        ? 'w-0 bg-slate-400 dark:bg-slate-600'
                        : 'w-full bg-blue-600 dark:bg-blue-500 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0">
                <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{mutedStates[focusedStem.id] ? '0% (Muted)' : '100% (Fixed)'}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              The focus track stays fixed at maximum volume so you can hear your part clearly over the mix.
            </p>
          </div>

          {/* 2. Other Harmonies (Linked Slider) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Other Harmonies (Linked)
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      ({otherStems.map((s) => s.name).join(', ')})
                    </span>
                  </h3>
                </div>
              </div>

              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700 w-fit">
                {linkedHarmonyVolume}%
              </span>
            </div>

            {/* Unified Slider */}
            <div className="py-2">
              <input
                type="range"
                min="0"
                max="100"
                value={linkedHarmonyVolume}
                onChange={(e) => onLinkedHarmonyVolumeChange(Number(e.target.value))}
                className="w-full h-3"
              />
            </div>

            {/* Individual Mute Buttons for non-focused parts */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Individual Mute Controls
              </div>
              <div className="flex flex-wrap gap-2">
                {otherStems.map((stem) => {
                  const isMuted = !!mutedStates[stem.id];
                  return (
                    <button
                      key={stem.id}
                      onClick={() => onToggleMute(stem.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition border ${
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
                      <span>{stem.name}</span>
                      <span className={`text-[10px] ml-0.5 ${isMuted ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                        {isMuted ? 'OFF' : 'ON'}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Independent volume</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700">
                    {mutedStates['beat'] ? 'Muted' : `${beatVolume}%`}
                  </span>

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
                    <span>{mutedStates['beat'] ? 'MUTED' : 'Mute'}</span>
                  </button>
                </div>
              </div>

              <div className="py-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beatVolume}
                  onChange={(e) => onBeatVolumeChange(Number(e.target.value))}
                  disabled={mutedStates['beat']}
                  className={`w-full h-3 ${mutedStates['beat'] ? 'opacity-40 pointer-events-none' : ''}`}
                />
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
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
            <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Independent Stem Sliders
            </span>
            <span>Adjust each track individually</span>
          </div>

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

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {isMuted ? 'Muted' : `${vol}%`}
                    </span>

                    <button
                      onClick={() => onToggleMute(stem.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isMuted
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/80 ring-1 ring-rose-400 dark:ring-rose-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>MUTED</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Mute</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="py-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={vol}
                    onChange={(e) => onSingleStemVolumeChange(stem.id, Number(e.target.value))}
                    disabled={isMuted}
                    className={`w-full h-3 ${isMuted ? 'opacity-40 pointer-events-none' : ''}`}
                  />
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

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700">
                    {mutedStates['beat'] ? 'Muted' : `${beatVolume}%`}
                  </span>

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
                    <span>{mutedStates['beat'] ? 'MUTED' : 'Mute'}</span>
                  </button>
                </div>
              </div>

              <div className="py-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beatVolume}
                  onChange={(e) => onBeatVolumeChange(Number(e.target.value))}
                  disabled={mutedStates['beat']}
                  className={`w-full h-3 ${mutedStates['beat'] ? 'opacity-40 pointer-events-none' : ''}`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
