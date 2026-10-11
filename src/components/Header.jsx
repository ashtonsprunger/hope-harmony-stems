import React, { useEffect } from 'react';
import { Sun, Moon, ArrowLeft, FileText } from 'lucide-react';

export default function Header({
  currentSong,
  onBackToSongs,
  theme,
  onToggleTheme,
  hasSheetMusic,
  isSheetOpen,
  onToggleSheet,
}) {
  // Update document --header-height dynamically so modals and overlays can sit right under it
  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [currentSong]);

  // When viewing a song: navbar has left arrow back button, song title, and composer info
  if (currentSong) {
    return (
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 sm:px-6 transition-colors duration-200 min-h-[64px] sm:min-h-[71px] flex items-center">
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
          </div>

          {hasSheetMusic && (
            <button
              onClick={onToggleSheet}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border font-bold text-xs sm:text-sm active:scale-95 transition shadow-sm shrink-0 ${
                isSheetOpen
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-600/25 ring-2 ring-blue-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700'
              }`}
              title={isSheetOpen ? 'Hide Sheet Music' : 'View Sheet Music'}
            >
              <FileText className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isSheetOpen ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              <span className="hidden sm:inline">Sheet Music</span>
              <span className="sm:hidden">Sheet</span>
            </button>
          )}
        </div>
      </header>
    );
  }

  // Catalogue view header
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 sm:px-6 transition-colors duration-200 min-h-[64px] sm:min-h-[71px] flex items-center">
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
