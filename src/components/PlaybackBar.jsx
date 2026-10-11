import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Square, Loader2, AlertCircle } from 'lucide-react';

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
}) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/90 shadow-[0_-10px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_-12px_40px_rgba(0,0,0,0.6)] px-4 py-3 sm:py-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Loading error warning */}
        {loadingError && (
          <div className="mb-2 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{loadingError}</span>
          </div>
        )}

        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3 mb-2 sm:mb-3">
          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={isLoading || duration === 0}
              className="timeline-scrubber w-full h-2 rounded-full cursor-pointer disabled:opacity-40 bg-slate-200 dark:bg-slate-800"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${progressPercent}%, transparent ${progressPercent}%, transparent 100%)`,
              }}
            />
          </div>

          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 w-10 text-left">
            {formatTime(duration)}
          </span>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {/* Reset to Start */}
          <button
            onClick={() => onSeek(0)}
            disabled={isLoading || duration === 0}
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition disabled:opacity-40"
            title="Reset to Beginning"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Quick Jump -5s */}
          <button
            onClick={() => onQuickJump(-5)}
            disabled={isLoading || duration === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700/80 active:scale-95 transition disabled:opacity-40 font-semibold text-xs sm:text-sm shadow-sm"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>-5s</span>
          </button>

          {/* Master Play / Pause Button - Solid Blue with Drop Shadow */}
          <button
            onClick={onTogglePlayPause}
            disabled={isLoading || duration === 0}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-150 shadow-xl ${
              isLoading || duration === 0
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/35 dark:shadow-blue-600/50 active:scale-95 border border-blue-400/40 ring-4 ring-blue-500/15'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-200 dark:text-blue-300" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          {/* Quick Jump +5s */}
          <button
            onClick={() => onQuickJump(5)}
            disabled={isLoading || duration === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700/80 active:scale-95 transition disabled:opacity-40 font-semibold text-xs sm:text-sm shadow-sm"
            title="Fast forward 5 seconds"
          >
            <span>+5s</span>
            <RotateCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
