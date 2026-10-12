import React from 'react';
import { Disc, ArrowRight } from 'lucide-react';

export default function SongList({ songs, onSelectSong }) {
  const songList = (songs || []).filter((song) => {
    if (song.hidden === true || song.hidden === 'true') return false;
    if (song.hide === true || song.hide === 'true') return false;
    if (song.visible === false || song.visible === 'false') return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      {/* Song Cards List */}
      <div className="space-y-3 sm:space-y-4">
        {songList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <Disc className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-800 dark:text-slate-300 font-semibold">No songs available</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              Check your <code className="text-blue-600 dark:text-blue-400">songs.json</code> file to add songs.
            </p>
          </div>
        ) : (
          songList.map((song) => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song)}
              className="group relative px-5 py-4 sm:px-6 sm:py-4.5 rounded-2xl bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between gap-4"
            >
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {song.title}
              </h2>

              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-slate-100 group-hover:bg-slate-200 text-slate-700 group-hover:text-slate-950 dark:bg-slate-800 dark:group-hover:bg-slate-700 dark:text-slate-200 dark:group-hover:text-white transition active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
              >
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
