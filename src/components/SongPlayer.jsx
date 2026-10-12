import React, { useState, useEffect, useCallback } from 'react';
import { StickyNote } from 'lucide-react';
import FocusSelector from './FocusSelector';
import Mixer from './Mixer';
import PlaybackBar from './PlaybackBar';
import SheetMusicModal from './SheetMusicModal';
import { useStemPlayer } from '../hooks/useStemPlayer';

export default function SongPlayer({
  song,
  onBackToSongs,
  isSheetOpen,
  onToggleSheet,
  onCloseSheet,
  onSheetZoomChange,
}) {
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

  const player = useStemPlayer(activeSection, song.id, song.sections);

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

        {/* 4. Song Notes Card (Warm Rehearsal Callout) */}
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
      </div>

      {/* 📄 Full-Width Non-Scrolling Sheet Music Modal */}
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
        onSelectSection={handleSelectSection}
        speedLabel={song.tempoLabel || song.sectionLabel || song.versionLabel || 'Speed:'}
      />
    </div>
  );
}
