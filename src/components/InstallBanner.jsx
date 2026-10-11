import React from 'react';
import { Download, X } from 'lucide-react';

export default function InstallBanner({ onInstall, onDismiss }) {
  return (
    <aside
      aria-label="Install Hope Harmony"
      className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/logo.png"
          alt="Hope Harmony"
          className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0 border border-slate-200 dark:border-slate-700 bg-white"
        />
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
            Install Hope Harmony
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Add to home screen for full screen
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onInstall}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        <button
          onClick={onDismiss}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Dismiss"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
