import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function SectionSelector({
  sections,
  activeSectionId,
  onSelectSection,
  label = 'Speed:',
}) {
  if (!sections || sections.length <= 1) {
    return null;
  }

  // Ensure label has proper formatting
  const displayLabel = label.trim().endsWith(':') ? label.trim() : `${label.trim()}:`;

  const handleChange = (e) => {
    const selected = sections.find((s) => s.id === e.target.value);
    if (selected) {
      onSelectSection(selected);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="section-speed-select"
        className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 shrink-0"
      >
        {displayLabel}
      </label>

      <div className="relative inline-flex items-center">
        <select
          id="section-speed-select"
          value={activeSectionId}
          onChange={handleChange}
          className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base rounded-2xl py-2.5 sm:py-3 pl-4 pr-10 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
        >
          {sections.map((sec) => (
            <option
              key={sec.id}
              value={sec.id}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              {sec.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 dark:text-slate-400 absolute right-3 pointer-events-none" />
      </div>
    </div>
  );
}
