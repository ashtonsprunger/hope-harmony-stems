import React from 'react';
import { Play, Disc, Layers, FileText } from 'lucide-react';

export default function SongList({ songs, onSelectSong }) {
  const songList = songs || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      {/* Song Cards List */}
      <div className="space-y-4">
        {songList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <Disc className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-800 dark:text-slate-300 font-semibold">No songs available</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              Check your <code className="text-blue-600 dark:text-blue-400">songs.json</code> file to add songs.
            </p>
          </div>
        ) : (
          songList.map((song) => {
            const firstSection = song.sections?.[0];
            const partsCount = firstSection?.stems?.length || 0;
            const sectionsCount = song.sections?.length || 0;

            return (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {song.title}
                      </h2>
                      {song.key && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700/70">
                          {song.key}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {song.artist || 'Traditional'}
                    </p>

                    {song.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 italic">
                        {song.notes}
                      </p>
                    )}
                  </div>

                  {/* Badges & Play Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        {sectionsCount} {sectionsCount === 1 ? 'tempo' : 'tempos'}
                      </span>

                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
                        {partsCount} harmony {partsCount === 1 ? 'part' : 'parts'}
                      </span>

                      {(song.sheetMusic || song.pdf) && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 flex items-center gap-1 font-medium">
                          <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          PDF Score
                        </span>
                      )}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-600/30 group-hover:bg-blue-600 text-blue-600 dark:text-blue-300 group-hover:text-white flex items-center justify-center transition shadow-sm shrink-0">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
