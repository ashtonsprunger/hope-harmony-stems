import React from 'react';

export default function SectionSelector({ sections, activeSectionId, onSelectSection }) {
  if (!sections || sections.length <= 1) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Genuine Lifted Top Tabs */}
      <div className="flex items-end gap-1.5 sm:gap-2 border-b-2 border-slate-300 dark:border-slate-700 px-1 sm:px-2">
        {sections.map((sec) => {
          const isActive = sec.id === activeSectionId;
          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec)}
              className={`relative px-6 sm:px-8 py-3 sm:py-3.5 font-bold text-sm sm:text-base transition-all rounded-t-2xl border-x-2 -mb-[2px] ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-4 border-t-blue-600 border-x-slate-300 dark:border-x-slate-700 border-b-2 border-b-white dark:border-b-slate-900 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-10 font-extrabold'
                  : 'bg-slate-100 hover:bg-slate-200/90 text-slate-600 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-400 border-t-2 border-t-slate-300/80 dark:border-t-slate-800 border-x-slate-300/80 dark:border-x-slate-800 border-b-2 border-b-slate-300 dark:border-b-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
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
