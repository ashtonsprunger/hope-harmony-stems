import React, { useState, useEffect } from 'react';
import { StickyNote, Info, Music, Users, ArrowRight, ExternalLink, X } from 'lucide-react';
import FocusSelector from './FocusSelector';
import Mixer from './Mixer';
import PlaybackBar from './PlaybackBar';
import SheetMusicModal from './SheetMusicModal';
import { useStemPlayer } from '../hooks/useStemPlayer';
import { useMidiPlayer } from '../hooks/useMidiPlayer';

/**
 * Shared Player Workspace UI
 */
function SongPlayerWorkspace({
  song,
  activeSection,
  activeSectionId,
  onSelectSection,
  player,
  isSheetOpen,
  onToggleSheet,
  onCloseSheet,
  onSheetZoomChange,
  currentMeasure,
  currentBeat,
  timeSig,
  totalMeasures,
}) {
  // Support string or array format for sheetMusic / pdf
  const rawSheetMusic = song.sheetMusic || song.pdf;
  const sheetMusicList = Array.isArray(rawSheetMusic)
    ? rawSheetMusic
    : rawSheetMusic
    ? [{ name: 'Sheet Music (PDF)', file: rawSheetMusic }]
    : [];

  const hasSheetMusic = sheetMusicList.length > 0;
  const hasNotes = Boolean(
    song.notes &&
    (typeof song.notes === 'string' ? song.notes.trim().length > 0 : song.notes.length > 0)
  );

  const songKey = typeof song.key === 'string' ? song.key.trim() : '';
  const hasKey = songKey.length > 0;

  const lineupItems = React.useMemo(() => {
    const raw = song.lineup;
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
  }, [song.lineup]);

  const hasLineup = lineupItems.length > 0;
  const hasSongInfo = hasKey || hasLineup;

  const [sheetPage, setSheetPage] = useState(1);
  const [sheetNumPages, setSheetNumPages] = useState(1);

  const handlePrevPage = () => {
    setSheetPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setSheetPage((p) => Math.min(sheetNumPages, p + 1));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 pb-48 sm:pb-52">
      {/* Main Workspace Controls */}
      <div className="space-y-6">
        {/* Selectors Row: Part Focus */}
        {activeSection?.stems && (
          <div className="flex items-center">
            <FocusSelector
              stems={activeSection.stems}
              focusPart={player.focusPart}
              onSelectFocus={player.setFocusPart}
              label={song.partLabel || 'Part:'}
            />
          </div>
        )}

        {/* Stem Mixer */}
        <Mixer
          section={activeSection}
          focusPart={player.focusPart}
          stemVolumes={player.stemVolumes}
          onSingleStemVolumeChange={player.setSingleStemVolume}
          linkedHarmonyVolume={player.linkedHarmonyVolume}
          onLinkedHarmonyVolumeChange={player.setLinkedHarmonyVolume}
          beatVolume={player.beatVolume}
          onBeatVolumeChange={player.setBeatVolume}
          pianoVolume={player.pianoVolume}
          onPianoVolumeChange={player.setPianoVolume}
          mutedStates={player.mutedStates}
          onToggleMute={player.toggleMute}
        />

        {/* Song Notes Card */}
        {hasNotes && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 shadow-sm transition-colors">
            <div className="flex items-center gap-2 mb-2 text-amber-900 dark:text-amber-300">
              <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h3 className="font-bold text-base sm:text-lg">
                Notes
              </h3>
            </div>
            {Array.isArray(song.notes) ? (
              <div className="space-y-2 text-amber-950/80 dark:text-amber-200/80">
                {song.notes.map((note, index) => (
                  <p key={index} className="text-sm sm:text-base whitespace-pre-line leading-relaxed">
                    {note}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm sm:text-base text-amber-950/80 dark:text-amber-200/80 whitespace-pre-line leading-relaxed">
                {song.notes}
              </p>
            )}
          </div>
        )}

        {/* Song Info Card (Key & Vocal/Instrument Lineup) */}
        {hasSongInfo && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-bold text-base sm:text-lg">
                Song Info
              </h3>
            </div>

            {hasKey && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <Music className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Key:</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-sm font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30">
                  {songKey}
                </span>
              </div>
            )}

            {hasLineup && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Vocal / Instrument Lineup:</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {lineupItems.map((item, idx) => {
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
          </div>
        )}
      </div>

      {/* Sheet Music Modal */}
      {hasSheetMusic && (
        <SheetMusicModal
          isOpen={isSheetOpen}
          onClose={onCloseSheet}
          pdfUrl={sheetMusicList[0].file}
          songTitle={song.title}
          pageNumber={sheetPage}
          onNumPagesChange={setSheetNumPages}
          onZoomChange={onSheetZoomChange}
        />
      )}

      {/* Sticky Bottom Playback Bar */}
      <PlaybackBar
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        isLoading={player.isLoading}
        loadingError={player.loadingError}
        onTogglePlayPause={player.togglePlayPause}
        onSeek={player.seekTo}
        onQuickJump={player.quickJump}
        // Sheet music dock page navigation
        isSheetOpen={isSheetOpen}
        pageNumber={sheetPage}
        numPages={sheetNumPages}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        hasSheetMusic={hasSheetMusic}
        onToggleSheet={onToggleSheet}
        // Speed / section selector
        sections={song.sections}
        activeSectionId={activeSectionId}
        onSelectSection={onSelectSection}
        speedLabel={song.tempoLabel || song.sectionLabel || song.versionLabel || 'Speed:'}
        // Live Measure & Beat indicator
        currentMeasure={currentMeasure}
        currentBeat={currentBeat}
        timeSig={timeSig}
        totalMeasures={totalMeasures}
      />
    </div>
  );
}

/**
 * Audio Stem Player (untouched audio stems implementation)
 */
function StemSongPlayer({
  song,
  isSheetOpen,
  onToggleSheet,
  onCloseSheet,
  onSheetZoomChange,
}) {
  const [activeSectionId, setActiveSectionId] = useState(() => {
    try {
      const saved = localStorage.getItem(`hh_speed_${song.id}`);
      if (saved && song.sections?.some((s) => s.id === saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read saved speed from localStorage', e);
    }
    return song.sections?.[0]?.id || '';
  });

  const handleSelectSection = (newSection) => {
    setActiveSectionId(newSection.id);
    try {
      localStorage.setItem(`hh_speed_${song.id}`, newSection.id);
    } catch (e) {
      console.warn('Could not save speed to localStorage', e);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hh_speed_${song.id}`);
      if (saved && song.sections?.some((s) => s.id === saved)) {
        setActiveSectionId(saved);
        return;
      }
    } catch (e) {}
    setActiveSectionId(song.sections?.[0]?.id || '');
  }, [song.id]);

  const activeSection =
    song.sections?.find((s) => s.id === activeSectionId) || song.sections?.[0];

  const player = useStemPlayer(activeSection, song.id, song.sections);

  return (
    <SongPlayerWorkspace
      song={song}
      activeSection={activeSection}
      activeSectionId={activeSectionId}
      onSelectSection={handleSelectSection}
      player={player}
      isSheetOpen={isSheetOpen}
      onToggleSheet={onToggleSheet}
      onCloseSheet={onCloseSheet}
      onSheetZoomChange={onSheetZoomChange}
    />
  );
}

/**
 * MIDI Synthesizer Player (with FluidR3 Tack Piano, Woodblock, proportional speed scaling, and live measure/beat tracking)
 */
function MidiSongPlayer({
  song,
  isSheetOpen,
  onToggleSheet,
  onCloseSheet,
  onSheetZoomChange,
}) {
  const defaultStems = React.useMemo(() => {
    return song.stems || [
      { id: 'soprano', name: 'Soprano' },
      { id: 'alto', name: 'Alto' },
      { id: 'tenor', name: 'Tenor' },
      { id: 'bass', name: 'Bass' },
    ];
  }, [song.stems]);

  // Derive allowed speed options: from simple array `song.speeds` e.g. [1, 0.9, 0.8, 0.7, 0.6] or song.sections
  const speedOptions = React.useMemo(() => {
    if (Array.isArray(song.speeds) && song.speeds.length > 0) {
      return song.speeds.map((s) => {
        const num = typeof s === 'number' ? s : parseFloat(s);
        return {
          id: String(num),
          name: `${num}x`,
          speed: num,
          beat: 'beat',
          stems: defaultStems,
        };
      });
    }
    if (Array.isArray(song.sections) && song.sections.length > 0) {
      return song.sections;
    }
    // Default fallback speeds if not specified
    return [1, 0.9, 0.8, 0.7, 0.6].map((num) => ({
      id: String(num),
      name: `${num}x`,
      speed: num,
      beat: 'beat',
      stems: defaultStems,
    }));
  }, [song.speeds, song.sections, defaultStems]);

  const [activeSectionId, setActiveSectionId] = useState(() => {
    try {
      const saved = localStorage.getItem(`hh_speed_${song.id}`);
      if (saved && speedOptions.some((s) => s.id === saved)) {
        return saved;
      }
    } catch (e) {}
    return speedOptions[0]?.id || '1';
  });

  const handleSelectSection = (newSection) => {
    setActiveSectionId(newSection.id);
    try {
      localStorage.setItem(`hh_speed_${song.id}`, newSection.id);
    } catch (e) {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`hh_speed_${song.id}`);
      if (saved && speedOptions.some((s) => s.id === saved)) {
        setActiveSectionId(saved);
        return;
      }
    } catch (e) {}
    setActiveSectionId(speedOptions[0]?.id || '1');
  }, [song.id, speedOptions]);

  const activeSection =
    speedOptions.find((s) => s.id === activeSectionId) || speedOptions[0];

  const speed = activeSection?.speed !== undefined ? Number(activeSection.speed) : 1.0;

  const player = useMidiPlayer(activeSection, song.id, song.midiFile, speed);

  return (
    <SongPlayerWorkspace
      song={{ ...song, sections: speedOptions }}
      activeSection={activeSection}
      activeSectionId={activeSectionId}
      onSelectSection={handleSelectSection}
      player={player}
      isSheetOpen={isSheetOpen}
      onToggleSheet={onToggleSheet}
      onCloseSheet={onCloseSheet}
      onSheetZoomChange={onSheetZoomChange}
      currentMeasure={player.currentMeasure}
      currentBeat={player.currentBeat}
      timeSig={player.currentTimeSig}
      totalMeasures={player.totalMeasures}
    />
  );
}

/**
 * Song Order / Setlist View (for items with type === 'order')
 */
function parseOrderLineup(raw) {
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

function SongOrderView({ song, songs = [], onSelectSong }) {
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

  const rawItems = song?.items || song?.order || song?.songs || [];
  const orderEntries = React.useMemo(() => {
    const catalogue = (songs || []).filter((s) => {
      const t = typeof s?.type === 'string' ? s.type.trim().toLowerCase() : '';
      if (t === 'order' || t === 'setlist' || t === 'song-order' || t === 'program') return false;
      if (s.hidden === true || s.hidden === 'true') return false;
      return true;
    });

    const normalizeTitle = (str) =>
      String(str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    return (Array.isArray(rawItems) ? rawItems : []).map((entry, idx) => {
      const isObj = entry && typeof entry === 'object';
      const rawTitle = isObj ? entry.title || entry.name || '' : String(entry || '');
      const cleanTitle = rawTitle.trim();
      const normCleanTitle = normalizeTitle(cleanTitle);
      const rawId = isObj && entry.id ? String(entry.id).trim() : '';

      const matched =
        catalogue.find((s) => {
          if (rawId && s.id === rawId) return true;
          const sTitle = String(s.title || s.name || '').trim().toLowerCase();
          return cleanTitle && sTitle === cleanTitle.toLowerCase();
        }) ||
        catalogue.find((s) => {
          const sNorm = normalizeTitle(s.title || s.name || '');
          return normCleanTitle && sNorm === normCleanTitle;
        });

      const title = cleanTitle || matched?.title || matched?.name || `Song ${idx + 1}`;
      const key =
        (isObj && typeof entry.key === 'string' && entry.key.trim()) ||
        (typeof matched?.key === 'string' ? matched.key.trim() : '');
      const category =
        (isObj && typeof entry.category === 'string' && entry.category.trim()) ||
        (typeof matched?.category === 'string' ? matched.category.trim() : '');
      const lineup =
        isObj && parseOrderLineup(entry.lineup).length > 0
          ? parseOrderLineup(entry.lineup)
          : parseOrderLineup(matched?.lineup);
      const rawNotes = (isObj && entry.notes) || matched?.notes;
      const notes = Array.isArray(rawNotes)
        ? rawNotes.filter((n) => typeof n === 'string' && n.trim().length > 0)
        : typeof rawNotes === 'string' && rawNotes.trim().length > 0
        ? [rawNotes.trim()]
        : [];

      const explicitDetails =
        isObj && typeof (entry.details || entry.subtitle) === 'string'
          ? (entry.details || entry.subtitle).trim()
          : '';
      const details =
        explicitDetails ||
        (lineup.length > 0 ? lineup.join(' • ') : category);

      const isLink = Boolean(matched && (matched.type === 'link' || matched.url));
      const isPlayable = Boolean(
        matched &&
          !isLink &&
          matched.disabled !== true &&
          matched.disabled !== 'true'
      );
      const hasInfo = Boolean(
        key.length > 0 || lineup.length > 0 || (!isPlayable && notes.length > 0)
      );

      return {
        number: idx + 1,
        title,
        details,
        key,
        category,
        lineup,
        notes,
        hasInfo,
        isLink,
        isPlayable,
        matched,
        infoTarget: {
          title,
          category,
          key,
          lineup,
          notes,
        },
      };
    });
  }, [rawItems, songs]);

  const modalSongKey = infoModalSong?.key || '';
  const modalLineup = infoModalSong?.lineup || [];
  const modalNotes = infoModalSong?.notes || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 sm:px-6">
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-800/80">
        {orderEntries.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No songs in this song order.
          </div>
        ) : (
          orderEntries.map((item) => {
            const infoButton = item.hasInfo ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInfoModalSong(item.infoTarget);
                }}
                title={`View info for ${item.title}`}
                aria-label={`View info for ${item.title}`}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Info className="w-4 h-4" />
              </button>
            ) : null;

            const rowContent = (
              <>
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs sm:text-sm font-bold flex items-center justify-center shrink-0">
                    {item.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white ${
                          item.isPlayable || item.isLink
                            ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                            : ''
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.key && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono font-semibold border border-blue-200/60 dark:border-blue-500/30 shrink-0">
                          {item.key}
                        </span>
                      )}
                    </div>
                    {item.details && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {infoButton}
                  {item.isLink && (
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  )}
                  {item.isPlayable && (
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </>
            );

            if (item.isLink && item.matched?.url) {
              return (
                <a
                  key={item.number}
                  href={item.matched.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  {rowContent}
                </a>
              );
            }

            if (item.isPlayable && item.matched && onSelectSong) {
              return (
                <div
                  key={item.number}
                  onClick={() => onSelectSong(item.matched)}
                  className="group px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  {rowContent}
                </div>
              );
            }

            return (
              <div
                key={item.number}
                className="px-4 py-3 sm:px-5 sm:py-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-3"
              >
                {rowContent}
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
            aria-labelledby="order-song-info-modal-title"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {infoModalSong.category && (
                  <span className="inline-block font-['Oswald',sans-serif] uppercase tracking-wider text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                    {infoModalSong.category}
                  </span>
                )}
                <h3
                  id="order-song-info-modal-title"
                  className="text-lg font-bold text-slate-900 dark:text-white truncate"
                >
                  {infoModalSong.title}
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
                    {modalLineup.map((line, idx) => {
                      const colonIdx = line.indexOf(':');
                      if (colonIdx > 0) {
                        const role = line.slice(0, colonIdx).trim();
                        const rest = line.slice(colonIdx + 1).trim();
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
                          {line}
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

/**
 * Main SongPlayer component: delegates cleanly based on song.type or song.midiFile
 */
export default function SongPlayer(props) {
  const rawType = typeof props.song?.type === 'string' ? props.song.type.trim().toLowerCase() : '';
  const isOrder =
    rawType === 'order' ||
    rawType === 'setlist' ||
    rawType === 'song-order' ||
    rawType === 'program';
  if (isOrder) {
    return <SongOrderView {...props} />;
  }
  const isMidi = rawType === 'midi' || Boolean(props.song?.midiFile);
  if (isMidi) {
    return <MidiSongPlayer {...props} />;
  }
  return <StemSongPlayer {...props} />;
}
