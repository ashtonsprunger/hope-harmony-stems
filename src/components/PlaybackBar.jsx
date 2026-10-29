import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Loader2, AlertCircle, ChevronLeft, ChevronRight, FileText, Gauge, Check } from 'lucide-react';

function formatTime(secs) {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlaybackBar({
  isPlaying,
  currentTime,
  duration,
  isLoading,
  loadingError,
  onTogglePlayPause,
  onSeek,
  onQuickJump,
  // Page buttons built into dock for sheet music mode
  isSheetOpen = false,
  pageNumber = 1,
  numPages = 1,
  onPrevPage,
  onNextPage,
  hasSheetMusic = false,
  onToggleSheet,
  // Speed / section selector
  sections = [],
  activeSectionId = '',
  onSelectSection,
  speedLabel = 'Speed:',
  // Live Measure & Beat indicator
  currentMeasure,
  currentBeat,
  timeSig,
  totalMeasures,
}) {
  const playbackBarRef = useRef(null);

  useEffect(() => {
    const el = playbackBarRef.current;
    if (!el) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty('--playback-bar-height', `${el.offsetHeight}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const speedMenuRef = useRef(null);

  // Close speed menu when sheet closes or clicking outside
  useEffect(() => {
    if (!isSheetOpen) {
      setIsSpeedMenuOpen(false);
    }
  }, [isSheetOpen]);

  useEffect(() => {
    if (!isSpeedMenuOpen) return;
    const handleClickOutside = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSpeedMenuOpen]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playbackBarRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90 shadow-[0_-10px_35px_rgba(0,0,0,0.12)] dark:shadow-none px-4 sm:px-6 py-3 sm:py-4 transition-colors duration-200"
    >
      <div className="max-w-4xl mx-auto">
        {/* Loading error warning */}
        {loadingError && (
          <div className="mb-2.5 flex items-center gap-2 text-xs sm:text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-3.5 py-2 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{loadingError}</span>
          </div>
        )}

        {/* 📄 Page Buttons Built into Player Control Dock */}
        {isSheetOpen && numPages > 1 && (
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
            <button
              onClick={onPrevPage}
              disabled={pageNumber <= 1}
              className="flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              <span>Prev Page</span>
            </button>

            <span className="text-xs sm:text-sm font-mono font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-inner">
              Page {pageNumber} of {numPages}
            </span>

            <button
              onClick={onNextPage}
              disabled={pageNumber >= numPages}
              className="flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none text-xs sm:text-sm font-bold transition active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm"
              title="Next Page"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        )}

        {/* Timeline Scrubber */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 mb-2.5 sm:mb-3">
          <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 text-left shrink-0">
            {currentMeasure !== undefined && currentMeasure !== null
              ? `${currentMeasure}.${currentBeat || 1}`
              : formatTime(currentTime)}
          </span>

          <div className="flex-1 relative flex items-center py-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={isLoading || duration === 0}
              className={`w-full ${isLoading || duration === 0 ? 'opacity-40 pointer-events-none' : ''}`}
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${progressPercent}%, rgba(148, 163, 184, 0.25) ${progressPercent}%, rgba(148, 163, 184, 0.25) 100%)`,
              }}
            />
          </div>

          <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400 text-right shrink-0">
            {currentMeasure !== undefined && currentMeasure !== null
              ? `${totalMeasures || 99}`
              : formatTime(duration)}
          </span>
        </div>

        {/* Transport Controls - Centered with Speed button on left and Sheet button on right */}
        <div className="relative flex items-center justify-center">
          {/* Speed / Version Button - Positioned in Bottom Left (when multiple speeds exist) */}
          {sections && sections.length > 1 && (() => {
            const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0];
            let speedButtonLabel = '1x';
            if (currentSection) {
              if (currentSection.speed !== undefined) {
                speedButtonLabel = `${currentSection.speed}x`;
              } else if (currentSection.name) {
                const match = currentSection.name.match(/\b(\d+(\.\d+)?)x?\b/);
                if (match) {
                  speedButtonLabel = `${match[1]}x`;
                } else {
                  speedButtonLabel = currentSection.name.length > 5 ? currentSection.name.slice(0, 4) : currentSection.name;
                }
              }
            }

            return (
              <div ref={speedMenuRef} className="absolute left-0 top-1/2 -translate-y-1/2">
                {isSpeedMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-3 min-w-[150px] sm:min-w-[170px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xl shadow-slate-900/10 dark:shadow-black/50 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {speedLabel.replace(':', '')}
                    </div>
                    <div className="space-y-0.5">
                      {sections.map((sec) => {
                        const isSelected = sec.id === activeSectionId;
                        const displayName = sec.speed !== undefined ? `${sec.speed}x` : sec.name;
                        return (
                          <button
                            key={sec.id}
                            onClick={() => {
                              if (onSelectSection) onSelectSection(sec);
                              setIsSpeedMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-[0.98] ${
                              isSelected
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate">{displayName}</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
                  className={`h-11 sm:h-12 px-2.5 sm:px-3 min-w-[2.75rem] sm:min-w-[3.25rem] rounded-2xl flex items-center justify-center border transition active:scale-95 shadow-sm font-mono font-bold text-xs sm:text-sm ${
                    isSpeedMenuOpen
                      ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-600/25 ring-2 ring-blue-500/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white border-slate-200 dark:border-slate-700'
                  }`}
                  title={`${speedLabel.replace(':', '')}: ${currentSection?.name || speedButtonLabel}`}
                  aria-label={`Select ${speedLabel.replace(':', '').toLowerCase()}`}
                >
                  <span className={isSpeedMenuOpen ? 'text-white' : 'text-blue-600 dark:text-blue-400'}>
                    {speedButtonLabel}
                  </span>
                </button>
              </div>
            );
          })()}

          {/* Centered Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {/* Quick Jump -5s */}
            <button
              onClick={() => onQuickJump(-5)}
              disabled={isLoading || duration === 0}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700/80 active:scale-95 transition disabled:opacity-40 font-bold text-xs sm:text-sm shadow-sm"
              title="Rewind 5 seconds"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              <span>-5s</span>
            </button>

            {/* Master Play / Pause Button - Dead Centered */}
            <button
              onClick={onTogglePlayPause}
              disabled={isLoading || duration === 0}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center transition-all duration-150 shadow-xl ${
                isLoading || duration === 0
                  ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/35 dark:shadow-blue-600/50 active:scale-95 border border-blue-400/40 ring-4 ring-blue-500/15'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-blue-200 dark:text-blue-300" />
              ) : isPlaying ? (
                <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-current" />
              ) : (
                <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current ml-1" />
              )}
            </button>

            {/* Quick Jump +5s */}
            <button
              onClick={() => onQuickJump(5)}
              disabled={isLoading || duration === 0}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700/80 active:scale-95 transition disabled:opacity-40 font-bold text-xs sm:text-sm shadow-sm"
              title="Fast forward 5 seconds"
            >
              <span>+5s</span>
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* Sheet Music Button - Positioned in Bottom Right */}
          {hasSheetMusic && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <button
                onClick={onToggleSheet}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition active:scale-95 shadow-sm ${
                  isSheetOpen
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-600/25 ring-2 ring-blue-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white border-slate-200 dark:border-slate-700'
                }`}
                title={isSheetOpen ? 'Hide Sheet Music' : 'View Sheet Music'}
                aria-label={isSheetOpen ? 'Hide Sheet Music' : 'View Sheet Music'}
              >
                <FileText className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${isSheetOpen ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
