import React from 'react';
import { Gauge, Activity } from 'lucide-react';

export default function SectionSelector({ sections, activeSectionId, onSelectSection }) {
  if (!sections || sections.length <= 1) {
    if (sections?.[0]) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 w-fit shadow-sm">
          <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Section: <strong className="text-slate-800 dark:text-slate-200">{sections[0].name}</strong></span>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <Gauge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        Tempo & Section Versions
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map((sec) => {
          const isActive = sec.id === activeSectionId;
          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm ${
                isActive
                  ? 'bg-blue-600 text-white shadow-blue-600/20 border border-blue-500'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <span>{sec.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
