import React from 'react';
import { Target, SlidersHorizontal, Lock } from 'lucide-react';

export default function FocusSelector({ stems, focusPart, onSelectFocus }) {
  const focusedStemObj = stems.find((s) => s.id === focusPart);

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Select Focus Part
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          {focusPart === 'none' ? (
            <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <SlidersHorizontal className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              Independent mode: all parts unlinked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium">
              <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <strong>{focusedStemObj?.name}</strong> fixed at 100% max
            </span>
          )}
        </div>
      </div>

      {/* Segmented Button Group */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* 'None' Option */}
        <button
          onClick={() => onSelectFocus('none')}
          className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 border ${
            focusPart === 'none'
              ? 'bg-blue-600 text-white shadow-sm border-blue-500'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>None (Unlink)</span>
        </button>

        {/* Stem Options */}
        {stems.map((stem) => {
          const isSelected = focusPart === stem.id;
          return (
            <button
              key={stem.id}
              onClick={() => onSelectFocus(stem.id)}
              className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm border-blue-500 ring-2 ring-blue-400/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60'
              }`}
            >
              {isSelected && <Target className="w-3.5 h-3.5 text-blue-100 dark:text-blue-200 animate-pulse" />}
              <span>{stem.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
