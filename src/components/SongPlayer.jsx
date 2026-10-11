import React, { useState } from 'react';
import SectionSelector from './SectionSelector';
import FocusSelector from './FocusSelector';
import Mixer from './Mixer';
import PlaybackBar from './PlaybackBar';
import SheetMusicModal from './SheetMusicModal';
import { useStemPlayer } from '../hooks/useStemPlayer';

export default function SongPlayer({ song, onBackToSongs }) {
  const [activeSectionId, setActiveSectionId] = useState(
    song.sections?.[0]?.id || ''
  );

  // Sheet Music Modal state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetPage, setSheetPage] = useState(1);
  const [sheetNumPages, setSheetNumPages] = useState(1);

  const activeSection =
    song.sections?.find((s) => s.id === activeSectionId) || song.sections?.[0];

  const player = useStemPlayer(activeSection);

  const handleSelectSection = (newSection) => {
    setActiveSectionId(newSection.id);
  };

  // Support string or array format for sheetMusic / pdf
  const rawSheetMusic = song.sheetMusic || song.pdf;
  const sheetMusicList = Array.isArray(rawSheetMusic)
    ? rawSheetMusic
    : rawSheetMusic
    ? [{ name: 'Sheet Music (PDF)', file: rawSheetMusic }]
    : [];

  const hasSheetMusic = sheetMusicList.length > 0;

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
        {/* 1. Section / Tempo Tabs */}
        <SectionSelector
          sections={song.sections}
          activeSectionId={activeSection?.id}
          onSelectSection={handleSelectSection}
        />

        {/* 2. Focus Part Selector */}
        {activeSection?.stems && (
          <FocusSelector
            stems={activeSection.stems}
            focusPart={player.focusPart}
            onSelectFocus={player.setFocusPart}
          />
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
