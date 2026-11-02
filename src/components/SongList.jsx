import React, { useState, useMemo, useEffect } from 'react';
import { Disc, ArrowRight, ExternalLink, ChevronDown, Info, X, Music, Users, StickyNote, ListOrdered } from 'lucide-react';

function isOrderItem(song) {
  const t = typeof song?.type === 'string' ? song.type.trim().toLowerCase() : '';
  return t === 'order' || t === 'setlist' || t === 'song-order' || t === 'program';
}

function getOrderItems(song) {
  const raw = song?.items || song?.order || song?.songs;
  return Array.isArray(raw) ? raw : [];
}

function getSongKey(song) {
  return typeof song?.key === 'string' ? song.key.trim() : '';
}

function getSongLineup(song) {
  const raw = song?.lineup;
  if (!raw) return [];
  if (typeof raw === 'string') {
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const label = item.role || item.part || item.instrument || item.name || '';
          const val = item.people || item.person || item.player || item.vocalist || item.value || '';
          if (label && val) return `${label}: ${val}`;
          return label || val || '';
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([_, val]) => Boolean(val && String(val).trim().length > 0))
      .map(([k, val]) => `${k}: ${Array.isArray(val) ? val.join(', ') : String(val).trim()}`);
  }
  return [];
}

function hasSongInfo(song) {
  return getSongKey(song).length > 0 || getSongLineup(song).length > 0;
}

export default function SongList({ songs, onSelectSong }) {
  const [openCategories, setOpenCategories] = useState({});
  const [infoModalSong, setInfoModalSong] = useState(null);

  useEffect(() => {
    if (!infoModalSong) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setInfoModalSong(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [infoModalSong]);

  const toggleCategory = (catKey) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const songList = useMemo(() => {
    return (songs || []).filter((song) => {
      if (song.hidden === true || song.hidden === 'true') return false;
      if (song.hide === true || song.hide === 'true') return false;
      if (song.visible === false || song.visible === 'false') return false;
      if (song.disabled === true || song.disabled === 'true') return false;
      return true;
    });
  }, [songs]);

  // Place 'order' items at the very top above the songs, followed by category cards, then uncategorized songs
  const displayBlocks = useMemo(() => {
    const orderBlocks = [];
    const categoryBlocks = [];
    const categoryGroups = new Map();
    const uncategorizedSongs = [];

    songList.forEach((song, idx) => {
      if (isOrderItem(song)) {
        orderBlocks.push({
          type: 'order',
          key: `order-${song.id || song.title || song.name || idx}`,
          song,
          idx,
        });
        return;
      }

      const rawCat = typeof song.category === 'string' ? song.category.trim() : '';
      if (!rawCat) {
        uncategorizedSongs.push({ song, idx });
        return;
      }

      const catKey = rawCat.toLowerCase();
      if (!categoryGroups.has(catKey)) {
        const group = {
          type: 'category',
          key: catKey,
          name: rawCat,
          songs: [],
        };
        categoryGroups.set(catKey, group);
        categoryBlocks.push(group);
      }
      categoryGroups.get(catKey).songs.push({ song, idx });
    });

    if (uncategorizedSongs.length > 0) {
      categoryBlocks.push({
        type: 'uncategorized',
        key: 'uncategorized-all',
        songs: uncategorizedSongs,
      });
    }

    return [...orderBlocks, ...categoryBlocks];
  }, [songList]);

  const renderSongRow = (song, idx) => {
    const isDisabled = song.disabled === true || song.disabled === 'true';
    const isLink = song.type === 'link' || Boolean(song.url);
    const displayName = song.name || song.title;
    const itemKey = song.id || song.name || song.title || idx;
    const showInfoBtn = hasSongInfo(song);

    const infoButton = showInfoBtn ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setInfoModalSong(song);
        }}
        title={`View info for ${displayName}`}
        aria-label={`View info for ${displayName}`}
        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
      >
        <Info className="w-4 h-4" />
      </button>
    ) : null;

    if (isDisabled) {
      return (
        <div
          key={itemKey}
          aria-disabled="true"
          className="px-4 py-3 sm:px-5 sm:py-3.5 min-h-[3.5rem] sm:min-h-[3.75rem] bg-slate-50/80 dark:bg-slate-950/40 flex items-center justify-between gap-3"
        >
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
            {displayName}
          </span>
          {infoButton}
        </div>
      );
    }

    if (isLink) {
      return (
        <a
          key={itemKey}
          href={song.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
        >
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
            {displayName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {infoButton}
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </a>
      );
    }

    return (
      <div
        key={itemKey}
        onClick={() => onSelectSong(song)}
        className="group px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
      >
        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
          {displayName}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {infoButton}
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

  const modalSongKey = infoModalSong ? getSongKey(infoModalSong) : '';
  const modalLineup = infoModalSong ? getSongLineup(infoModalSong) : [];
  const modalNotes = infoModalSong?.notes
    ? Array.isArray(infoModalSong.notes)
      ? infoModalSong.notes.filter((n) => typeof n === 'string' && n.trim().length > 0)
      : typeof infoModalSong.notes === 'string' && infoModalSong.notes.trim().length > 0
      ? [infoModalSong.notes.trim()]
      : []
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 sm:px-6">
      {/* Song List Blocks */}
      <div className="space-y-3.5 sm:space-y-4">
        {songList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <Disc className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-800 dark:text-slate-300 font-semibold">No songs available</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
              Check your <code className="text-blue-600 dark:text-blue-400">songs.json</code> file to add songs.
            </p>
          </div>
        ) : (
          displayBlocks.map((block) => {
            if (block.type === 'order') {
              const item = block.song;
              const displayName = item.title || item.name || 'Song Order';
              const orderItems = getOrderItems(item);
              return (
                <div
                  key={block.key}
                  onClick={() => onSelectSong(item)}
                  className="group rounded-2xl bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden px-4 py-3 sm:px-5 sm:py-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <ListOrdered className="w-4 h-4" />
                    </div>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {orderItems.length > 0 && (
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {orderItems.length}
                      </span>
                    )}
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            }

            if (block.type === 'category') {
              const isOpen = !!openCategories[block.key];
              return (
                <div
                  key={`cat-${block.key}`}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(block.key)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-200/70 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <h2 className="font-['Oswald',sans-serif] uppercase tracking-wider text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                      {block.name}
                    </h2>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {block.songs.length}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform duration-300 ease-in-out ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="divide-y divide-slate-200/60 dark:divide-slate-800/80 border-t border-slate-200 dark:border-slate-800">
                        {block.songs.map(({ song, idx }) => renderSongRow(song, idx))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={block.key}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-800/80"
              >
                {block.songs.map(({ song, idx }) => renderSongRow(song, idx))}
              </div>
            );
          })
        )}
      </div>

      {/* Song Info Modal */}
      {infoModalSong && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setInfoModalSong(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="song-info-modal-title"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {infoModalSong.category && (
                  <span className="inline-block font-['Oswald',sans-serif] uppercase tracking-wider text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                    {infoModalSong.category}
                  </span>
                )}
                <h3
                  id="song-info-modal-title"
                  className="text-lg font-bold text-slate-900 dark:text-white truncate"
                >
                  {infoModalSong.name || infoModalSong.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInfoModalSong(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalSongKey && (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <Music className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Key:</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-sm font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30">
                    {modalSongKey}
                  </span>
                </div>
              )}

              {modalLineup.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Vocal / Instrument Lineup:</span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {modalLineup.map((item, idx) => {
                      const colonIdx = item.indexOf(':');
                      if (colonIdx > 0) {
                        const role = item.slice(0, colonIdx).trim();
                        const rest = item.slice(colonIdx + 1).trim();
                        return (
                          <li
                            key={idx}
                            className="text-sm sm:text-base text-slate-800 dark:text-slate-200 flex flex-wrap items-baseline gap-1.5"
                          >
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {role}:
                            </span>
                            <span className="text-slate-700 dark:text-slate-300">{rest}</span>
                          </li>
                        );
                      }
                      return (
                        <li
                          key={idx}
                          className="text-sm sm:text-base text-slate-700 dark:text-slate-300"
                        >
                          {item}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {modalNotes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-300">
                    <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Notes</span>
                  </div>
                  {modalNotes.map((note, idx) => (
                    <p
                      key={idx}
                      className="text-sm text-amber-950/80 dark:text-amber-200/80 whitespace-pre-line leading-relaxed"
                    >
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
