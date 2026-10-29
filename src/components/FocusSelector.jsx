import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function FocusSelector({
  stems,
  focusPart,
  onSelectFocus,
  label = 'Part:',
}) {
  if (!stems || stems.length === 0) {
    return null;
  }

  // Ensure label has proper formatting with colon
  const displayLabel = label.trim().endsWith(':') ? label.trim() : `${label.trim()}:`;
  const isPartSelected = focusPart && focusPart !== 'none';

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="focus-part-select"
        className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 shrink-0"
      >
        {displayLabel}
      </label>

      <div className="relative inline-flex items-center">
        <select
          id="focus-part-select"
          value={focusPart}
          onChange={(e) => onSelectFocus(e.target.value)}
          className={`appearance-none font-bold text-sm sm:text-base rounded-2xl py-2.5 sm:py-3 pl-4 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all border ${
            isPartSelected
              ? 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {/* Individual stem parts first */}
          {stems.map((stem) => (
            <option
              key={stem.id}
              value={stem.id}
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              {stem.name}
            </option>
          ))}

          {/* 'All Parts' option last in the list */}
          <option
            value="none"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
          >
            All Parts
          </option>
        </select>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 absolute right-3 pointer-events-none ${
            isPartSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
          }`}
        />
      </div>
    </div>
  );
}
