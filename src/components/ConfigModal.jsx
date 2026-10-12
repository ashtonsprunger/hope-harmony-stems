import React, { useState } from 'react';
import { X, Copy, Check, FileJson, Folder, Sparkles } from 'lucide-react';

const SAMPLE_JSON = `[
  {
    "id": "my-song",
    "title": "My Song Title",
    "artist": "Composer Name",
    "key": "G Major",
    "hidden": false,
    "sections": [
      {
        "id": "full-tempo",
        "name": "Full Tempo (120 BPM)",
        "beat": "/audio/my-song/click.mp3",
        "stems": [
          { "id": "soprano", "name": "Soprano", "file": "/audio/my-song/soprano.mp3" },
          { "id": "alto", "name": "Alto", "file": "/audio/my-song/alto.mp3" },
          { "id": "tenor", "name": "Tenor", "file": "/audio/my-song/tenor.mp3" },
          { "id": "bass", "name": "Bass", "file": "/audio/my-song/bass.mp3" }
        ]
      }
    ]
  }
]`;

export default function ConfigModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SAMPLE_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">How to Add Your Songs</h2>
            <p className="text-xs text-slate-400">Configure stems simply by editing a JSON file</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <Folder className="w-4 h-4 text-purple-400" />
              <span>Step 1: Place Your Audio Files</span>
            </div>
            <p className="text-slate-400">
              Save your audio files (MP3, WAV, AAC, etc.) inside the <code className="text-purple-300 bg-slate-800 px-1.5 py-0.5 rounded">public/audio/</code> folder.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <FileJson className="w-4 h-4 text-purple-400" />
              <span>Step 2: Add Entry to <code className="text-purple-300">public/songs.json</code></span>
            </div>
            <p className="text-slate-400">
              Each song can have any number of sections (e.g., Performance Tempo, Practice Slow) and any number of harmony parts (SATB, SSA, 5-part, etc.). The <code className="text-purple-300">beat</code> track is optional, and you can set <code className="text-purple-300">"hidden": true</code> to hide a song from the catalogue!
            </p>

            <div className="relative mt-2">
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] sm:text-xs text-purple-200 overflow-x-auto font-mono">
                {SAMPLE_JSON}
              </pre>

              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-slate-300 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Zero Phase Drift Sync:</span>
              <p className="text-slate-400 text-xs mt-0.5">
                All tracks within a section are decoded into memory and synchronized with the browser's Web Audio API hardware clock, ensuring they never fall out of sync.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-purple-950/50"
          >
            Got it, Let's Rehearse!
          </button>
        </div>
      </div>
    </div>
  );
}
