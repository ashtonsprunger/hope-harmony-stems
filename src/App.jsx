import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SongList from './components/SongList';
import SongPlayer from './components/SongPlayer';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [songsError, setSongsError] = useState(null);
  const songsRef = useRef([]);

  // Theme state: 'light' by default, persisted in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hopeharmony_theme') || 'light';
  });

  // Apply or remove 'dark' class on document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('hopeharmony_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Keep songsRef in sync
  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  // Handle mobile / Android back button and browser history navigation
  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setSelectedSong(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (songsRef.current.length > 0) {
        const matched = songsRef.current.find((s) => s.id === hash);
        if (matched) {
          setSelectedSong(matched);
        } else {
          setSelectedSong(null);
        }
      }
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  // Ensure history stack has the song catalogue root behind any directly loaded or reloaded song URL
  useEffect(() => {
    const rawHash = window.location.hash;
    const songId = rawHash.replace('#', '');
    if (songId) {
      try {
        // Transform the reloaded / entry history state into the catalogue root,
        // and push the current song on top so the mobile back button always pops to the song list
        window.history.replaceState({ appPage: 'list' }, '', window.location.pathname + window.location.search);
        window.history.pushState({ appPage: 'song', songId }, '', rawHash);
      } catch (e) {
        console.warn('History navigation setup failed', e);
      }
    }
  }, []);

  // Fetch songs.json on mount
  useEffect(() => {
    async function loadSongs() {
      try {
        setIsLoadingSongs(true);
        const res = await fetch('/songs.json');
        if (!res.ok) {
          throw new Error(`Failed to load songs.json (${res.status})`);
        }
        const data = await res.json();
        setSongs(data);
        songsRef.current = data;

        // Check if there is a hash matching a song id in the URL
        const hash = window.location.hash.replace('#', '');
        if (hash) {
          const matched = data.find((s) => s.id === hash);
          if (matched) {
            setSelectedSong(matched);
          }
        }
      } catch (err) {
        console.error('Error fetching songs.json:', err);
        setSongsError(err.message || 'Could not load songs.json');
      } finally {
        setIsLoadingSongs(false);
      }
    }

    loadSongs();
  }, []);

  // Handle song selection
  const handleSelectSong = (song) => {
    setSelectedSong(song);
    try {
      window.history.pushState({ appPage: 'song', songId: song.id }, '', '#' + song.id);
    } catch (e) {
      window.location.hash = song.id;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to song list
  const handleBackToSongs = () => {
    setSelectedSong(null);
    if (window.location.hash) {
      try {
        window.history.back();
      } catch (e) {
        try {
          window.history.replaceState({ appPage: 'list' }, '', window.location.pathname + window.location.search);
        } catch (err) {
          window.location.hash = '';
        }
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      <Header
        currentSong={selectedSong}
        onBackToSongs={handleBackToSongs}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {isLoadingSongs ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
            <p className="text-sm">Loading songs catalogue...</p>
          </div>
        ) : songsError ? (
          <div className="max-w-md mx-auto mt-16 p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Could Not Load Songs</h2>
            <p className="text-xs text-rose-600 dark:text-rose-300 mb-4">{songsError}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ensure <code className="text-blue-600 dark:text-blue-400 font-mono">public/songs.json</code> exists and is valid JSON.
            </p>
          </div>
        ) : selectedSong ? (
          <SongPlayer
            song={selectedSong}
            onBackToSongs={handleBackToSongs}
          />
        ) : (
          <SongList
            songs={songs}
            onSelectSong={handleSelectSong}
          />
        )}
      </main>
    </div>
  );
}
