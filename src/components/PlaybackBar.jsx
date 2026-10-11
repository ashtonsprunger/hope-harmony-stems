import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Square, Loader2, AlertCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

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
  // Sheet Music toggle
  hasSheetMusic = false,
  onToggleSheet,
}) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90 shadow-[0_-10px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.6)] px-4 py-3 sm:py-4 transition-colors duration-200">
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
        <div className="flex items-center gap-3 sm:gap-4 mb-2.5 sm:mb-3">
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-500 dark:text-slate-400 w-11 sm:w-12 text-right">
            {formatTime(currentTime)}
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
              className="timeline-scrubber w-full h-2.5 rounded-full cursor-pointer disabled:opacity-40 bg-slate-200 dark:bg-slate-800"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${progressPercent}%, transparent ${progressPercent}%, transparent 100%)`,
              }}
            />
          </div>

          <span className="text-xs sm:text-sm font-mono font-bold text-slate-500 dark:text-slate-400 w-11 sm:w-12 text-left">
            {formatTime(duration)}
          </span>
        </div>

        {/* Transport Controls - Large Touch Targets */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
          {/* Reset to Start */}
          <button
            onClick={() => onSeek(0)}
            disabled={isLoading || duration === 0}
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 active:scale-95 transition disabled:opacity-40 shadow-sm"
            title="Reset to Beginning"
          >
            <Square className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

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

          {/* Master Play / Pause Button */}
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

          {/* Sheet Music Pop-up Toggle Button */}
          {hasSheetMusic && (
            <button
              onClick={onToggleSheet}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl border font-bold text-xs sm:text-sm active:scale-95 transition shadow-sm ${
                isSheetOpen
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-600/25 ring-2 ring-blue-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700/80'
              }`}
              title={isSheetOpen ? 'Hide Sheet Music' : 'View Sheet Music'}
            >
              <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${isSheetOpen ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className="hidden sm:inline">Sheet Music</span>
              <span className="sm:hidden">Sheet</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
