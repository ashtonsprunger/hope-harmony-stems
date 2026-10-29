import React, { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';
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
 * Main SongPlayer component: delegates cleanly based on song.type or song.midiFile
 */
export default function SongPlayer(props) {
  const isMidi = props.song?.type === 'midi' || Boolean(props.song?.midiFile);
  if (isMidi) {
    return <MidiSongPlayer {...props} />;
  }
  return <StemSongPlayer {...props} />;
}
