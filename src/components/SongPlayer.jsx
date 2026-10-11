import React, { useState, useEffect, useCallback } from 'react';
import SectionSelector from './SectionSelector';
import FocusSelector from './FocusSelector';
import Mixer from './Mixer';
import PlaybackBar from './PlaybackBar';
import SheetMusicModal from './SheetMusicModal';
import { useStemPlayer } from '../hooks/useStemPlayer';

export default function SongPlayer({ song, onBackToSongs }) {
  // Speed / section initial state: check localStorage or 1st in list
  const [activeSectionId, setActiveSectionId] = useState(() => {
    try {
      const saved = localStorage.getItem(`hh_speed_${song.id}`);
      if (saved && song.sections?.some((s) => s.id === saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read saved speed from localStorage', e);
    }
    // Default is 1st in list always
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

  // Keep activeSectionId in sync if song changes
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

  const player = useStemPlayer(activeSection, song.id);

  // Support string or array format for sheetMusic / pdf
  const rawSheetMusic = song.sheetMusic || song.pdf;
  const sheetMusicList = Array.isArray(rawSheetMusic)
    ? rawSheetMusic
    : rawSheetMusic
    ? [{ name: 'Sheet Music (PDF)', file: rawSheetMusic }]
    : [];

  const hasSheetMusic = sheetMusicList.length > 0;

  // Sheet Music Modal state (remembered per song in localStorage)
  const [isSheetOpen, setIsSheetOpenState] = useState(() => {
    if (!hasSheetMusic) return false;
    try {
      const saved = localStorage.getItem(`hh_sheet_open_${song.id}`);
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  const setIsSheetOpen = useCallback((actionOrValue) => {
    setIsSheetOpenState((prev) => {
      const next = typeof actionOrValue === 'function' ? actionOrValue(prev) : actionOrValue;
      try {
        localStorage.setItem(`hh_sheet_open_${song.id}`, String(next));
      } catch (e) {}
      return next;
    });
  }, [song.id]);

  // Keep isSheetOpen in sync if song changes
  useEffect(() => {
    if (!hasSheetMusic) {
      setIsSheetOpenState(false);
      return;
    }
    try {
      const saved = localStorage.getItem(`hh_sheet_open_${song.id}`);
      setIsSheetOpenState(saved === 'true');
    } catch (e) {
      setIsSheetOpenState(false);
    }
  }, [song.id, hasSheetMusic]);

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
      {/* Main Workspace Controls (Always accessible when modal closed) */}
      <div className="space-y-6">
        {/* Selectors Row: Speed and Part */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <SectionSelector
            sections={song.sections}
            activeSectionId={activeSection?.id}
            onSelectSection={handleSelectSection}
            label={song.tempoLabel || song.sectionLabel || song.versionLabel || 'Speed:'}
          />

          {activeSection?.stems && (
            <FocusSelector
              stems={activeSection.stems}
              focusPart={player.focusPart}
              onSelectFocus={player.setFocusPart}
              label={song.partLabel || 'Part:'}
            />
          )}
        </div>

        {/* 3. Stem Mixer */}
        <Mixer
          section={activeSection}
          focusPart={player.focusPart}
          stemVolumes={player.stemVolumes}
          onSingleStemVolumeChange={player.setSingleStemVolume}
          linkedHarmonyVolume={player.linkedHarmonyVolume}
          onLinkedHarmonyVolumeChange={player.setLinkedHarmonyVolume}
          beatVolume={player.beatVolume}
          onBeatVolumeChange={player.setBeatVolume}
          mutedStates={player.mutedStates}
          onToggleMute={player.toggleMute}
        />
      </div>

      {/* 📄 Full-Width Non-Scrolling Sheet Music Modal */}
      {hasSheetMusic && (
        <SheetMusicModal
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          pdfUrl={sheetMusicList[0].file}
          songTitle={song.title}
          pageNumber={sheetPage}
          onNumPagesChange={setSheetNumPages}
        />
      )}

      {/* 4. Sticky Bottom Playback Bar (Always Visible + Built-in Page Turn Dock) */}
      <PlaybackBar
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        isLoading={player.isLoading}
        loadingError={player.loadingError}
        onTogglePlayPause={player.togglePlayPause}
        onSeek={player.seekTo}
        onQuickJump={player.quickJump}
        // Sheet music dock page navigation & toggle
        isSheetOpen={isSheetOpen}
        pageNumber={sheetPage}
        numPages={sheetNumPages}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        hasSheetMusic={hasSheetMusic}
        onToggleSheet={() => setIsSheetOpen((prev) => !prev)}
      />
    </div>
  );
}
