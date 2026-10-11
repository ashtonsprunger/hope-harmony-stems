import React from 'react';

export default function SectionSelector({ sections, activeSectionId, onSelectSection }) {
  if (!sections || sections.length <= 1) {
    return null;
  }

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-end gap-2 overflow-x-auto no-scrollbar px-1">
        {sections.map((sec) => {
          const isActive = sec.id === activeSectionId;
          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec)}
              className={`relative py-3 px-6 sm:px-8 font-bold text-sm sm:text-base whitespace-nowrap rounded-t-2xl transition-all duration-150 -mb-px ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-600 border-x border-slate-200 dark:border-slate-800 border-b border-b-white dark:border-b-slate-900 shadow-sm z-10'
                  : 'bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-950/80 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800/80'
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
