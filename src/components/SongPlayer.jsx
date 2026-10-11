import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import SectionSelector from './SectionSelector';
import FocusSelector from './FocusSelector';
import Mixer from './Mixer';
import PlaybackBar from './PlaybackBar';
import { useStemPlayer } from '../hooks/useStemPlayer';

export default function SongPlayer({ song, onBackToSongs }) {
  const [activeSectionId, setActiveSectionId] = useState(
    song.sections?.[0]?.id || ''
  );

  const activeSection =
    song.sections?.find((s) => s.id === activeSectionId) || song.sections?.[0];

  const player = useStemPlayer(activeSection);

  const handleSelectSection = (newSection) => {
    setActiveSectionId(newSection.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 pb-36">
      {/* Top Navigation & Song Details */}
      <div className="mb-6">
        <button
          onClick={onBackToSongs}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Songs</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {song.title}
              </h1>
              {song.key && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono font-semibold border border-blue-200 dark:border-blue-500/30">
                  {song.key}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {song.artist || 'Traditional'}
            </p>
          </div>

          {song.notes && (
            <div className="text-xs text-slate-600 dark:text-slate-400 sm:text-right max-w-xs italic bg-slate-50 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/80">
              {song.notes}
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Controls */}
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

      {/* 4. Sticky Bottom Playback Bar */}
      <PlaybackBar
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        isLoading={player.isLoading}
        loadingError={player.loadingError}
        onTogglePlayPause={player.togglePlayPause}
        onSeek={player.seekTo}
        onQuickJump={player.quickJump}
      />
    </div>
  );
}
