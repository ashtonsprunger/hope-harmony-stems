import React from 'react';

export default function SectionSelector({ sections, activeSectionId, onSelectSection }) {
  if (!sections || sections.length <= 1) {
    return null;
  }

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {sections.map((sec) => {
          const isActive = sec.id === activeSectionId;
          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec)}
              className={`py-3 px-5 sm:px-6 font-bold text-sm sm:text-base whitespace-nowrap border-b-2 transition-all duration-150 -mb-px rounded-t-xl ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
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
