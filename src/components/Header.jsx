import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Header({ currentSong, onBackToSongs, theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 sm:px-6 transition-colors duration-200">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div 
          onClick={onBackToSongs}
          className="cursor-pointer group flex items-center gap-2.5"
        >
          <img 
            src="/logo.png" 
            alt="Hope Harmony" 
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg drop-shadow-sm group-hover:scale-105 transition-transform" 
          />
          <div className="flex items-center gap-2">
            <span className="font-['Oswald',sans-serif] uppercase font-bold text-xl sm:text-2xl tracking-wide text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Hope Harmony
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-500/30">
              Stem Player
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentSong && (
            <button
              onClick={onBackToSongs}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-medium transition border border-slate-200 dark:border-slate-700/60"
            >
              ← Songs List
            </button>
          )}

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition font-medium text-xs sm:text-sm"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
