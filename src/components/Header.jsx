import React, { useEffect, useRef } from 'react';
import { Sun, Moon, ArrowLeft } from 'lucide-react';

export default function Header({
  currentSong,
  onBackToSongs,
  theme,
  onToggleTheme,
  hasSheetMusic,
  isSheetOpen,
  isSheetZoomed = false,
  onToggleSheet,
}) {
  const headerRef = useRef(null);

  // Dynamically observe header height so modals fit snugly under it even when multiline notes expand
  useEffect(() => {
    if (isSheetOpen && isSheetZoomed) {
      document.documentElement.style.setProperty('--header-height', '0px');
      return;
    }
    const el = headerRef.current;
    if (!el) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty('--header-height', `${el.offsetHeight}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentSong, isSheetOpen, isSheetZoomed]);

  // When viewing a song: navbar has left arrow back button, song title / notes, and sheet toggle
  if (currentSong) {
    // Hide header completely when zoomed into sheet music for maximum reading space
    if (isSheetOpen && isSheetZoomed) {
      return null;
    }

    const rawNotes = currentSong?.notes;
    const notesList = Array.isArray(rawNotes)
      ? rawNotes.filter((n) => typeof n === 'string' && n.trim().length > 0)
      : typeof rawNotes === 'string' && rawNotes.trim().length > 0
      ? [rawNotes.trim()]
      : [];
    const hasNotes = notesList.length > 0;
    const showNotesInHeader = isSheetOpen && hasNotes;

    return (
      <header
        ref={headerRef}
        className={`sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 sm:px-6 transition-all duration-200 min-h-[64px] sm:min-h-[71px] flex items-center ${
          isSheetOpen && isSheetZoomed
            ? 'shadow-[0_10px_35px_rgba(0,0,0,0.12)] dark:shadow-none'
            : ''
        }`}
      >
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={onBackToSongs}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white transition active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
              title="Back to Songs"
              aria-label="Back to Songs"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {showNotesInHeader ? (
              <div className="min-w-0 flex-1 py-0.5">
                <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 shadow-sm transition-all text-xs sm:text-sm text-amber-950/90 dark:text-amber-200/90 font-medium leading-snug max-h-20 overflow-y-auto space-y-1">
                  {notesList.map((line, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-['Oswald',sans-serif] uppercase font-bold text-lg sm:text-2xl tracking-wide text-slate-900 dark:text-white truncate">
                    {currentSong.title}
                  </h1>
                  {currentSong.key && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono font-semibold border border-blue-200 dark:border-blue-500/30 shrink-0">
                      {currentSong.key}
                    </span>
                  )}
                </div>
                {(currentSong.artist || currentSong.composer) && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate -mt-0.5">
                    {currentSong.artist || currentSong.composer}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Catalogue view header
  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 sm:px-6 transition-colors duration-200 min-h-[64px] sm:min-h-[71px] flex items-center"
    >
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <img 
            src="/logo.png" 
            alt="Hope Harmony" 
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0" 
          />
          <h1 className="font-['Oswald',sans-serif] uppercase font-bold text-lg sm:text-2xl tracking-wide text-slate-900 dark:text-white truncate">
            Hope Harmony
          </h1>
        </div>

        <button
          onClick={onToggleTheme}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white transition active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" />
          ) : (
            <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          )}
        </button>
      </div>
    </header>
  );
}
