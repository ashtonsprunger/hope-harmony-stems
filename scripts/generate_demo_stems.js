import fs from 'fs';
import path from 'path';

function createWavBuffer(samples, sampleRate = 44100) {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const buffer = Buffer.alloc(44 + samples.length * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, 44 + i * 2);
  }
  return buffer;
}

// Choral tone synthesis with warm vocal formants/harmonics
function synthesizeVoice(notes, bpm, sampleRate = 44100) {
  const beatSec = 60 / bpm;
  const totalBeats = notes.reduce((sum, n) => sum + n.beats, 0);
  const totalSamples = Math.floor(totalBeats * beatSec * sampleRate);
  const samples = new Float32Array(totalSamples);

  let currentSample = 0;

  for (const item of notes) {
    const noteDuration = item.beats * beatSec;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    const freq = item.freq;

    for (let i = 0; i < noteSamples; i++) {
      const globalIdx = currentSample + i;
      if (globalIdx >= totalSamples) break;

      if (freq === 0) {
        samples[globalIdx] = 0;
        continue;
      }

      const t = i / sampleRate;
      // ADSR envelope: smooth attack & gentle release for natural choral voice
      const attack = 0.08;
      const release = 0.12;
      let env = 1.0;
      if (t < attack) {
        env = Math.sin((t / attack) * (Math.PI / 2));
      } else if (t > noteDuration - release) {
        env = Math.sin(((noteDuration - t) / release) * (Math.PI / 2));
      }
      env = Math.max(0, env);

      // Subtle vibrato (5 Hz, 1.5% depth)
      const vibrato = Math.sin(2 * Math.PI * 5.0 * t) * (freq * 0.015);
      const effectiveFreq = freq + vibrato;

      // Add fundamental + warm harmonics for vocal timbre (Aah / Ooh choral sound)
      const phase1 = 2 * Math.PI * effectiveFreq * t;
      const phase2 = 2 * Math.PI * effectiveFreq * 2 * t;
      const phase3 = 2 * Math.PI * effectiveFreq * 3 * t;
      const phase4 = 2 * Math.PI * effectiveFreq * 4 * t;

      const voice = (
        0.55 * Math.sin(phase1) +
        0.25 * Math.sin(phase2) +
        0.12 * Math.sin(phase3) +
        0.05 * Math.sin(phase4)
      ) * env * 0.45;

      samples[globalIdx] = voice;
    }
    currentSample += noteSamples;
  }

  return samples;
}

// Metronome / beat track synthesis
function synthesizeBeat(bpm, totalBeats, sampleRate = 44100) {
  const beatSec = 60 / bpm;
  const totalSamples = Math.floor(totalBeats * beatSec * sampleRate);
  const samples = new Float32Array(totalSamples);

  for (let b = 0; b < totalBeats; b++) {
    const startSample = Math.floor(b * beatSec * sampleRate);
    const isDownbeat = (b % 4 === 0);
    const clickFreq = isDownbeat ? 1200 : 800;
    const clickDuration = 0.04; // 40ms percussive woodblock click
    const clickSamples = Math.floor(clickDuration * sampleRate);

    for (let i = 0; i < clickSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / sampleRate;
      const decay = Math.exp(-t * 90);
      const val = Math.sin(2 * Math.PI * clickFreq * t) * decay * (isDownbeat ? 0.6 : 0.35);
      samples[idx] = val;
    }
  }

  return samples;
}

// Chord progression: F -> Bb -> F -> C -> Dm -> Bb -> C7 -> F (8 measures, 4 beats each = 32 beats)
const SATB_PARTS = {
  soprano: [
    { freq: 349.23, beats: 4 }, // F4
    { freq: 466.16, beats: 4 }, // Bb4
    { freq: 440.00, beats: 4 }, // A4
    { freq: 523.25, beats: 4 }, // C5
    { freq: 587.33, beats: 4 }, // D5
    { freq: 466.16, beats: 4 }, // Bb4
    { freq: 523.25, beats: 4 }, // C5
    { freq: 698.46, beats: 4 }, // F5
  ],
  alto: [
    { freq: 261.63, beats: 4 }, // C4
    { freq: 293.66, beats: 4 }, // D4
    { freq: 261.63, beats: 4 }, // C4
    { freq: 261.63, beats: 4 }, // C4
    { freq: 293.66, beats: 4 }, // D4
    { freq: 293.66, beats: 4 }, // D4
    { freq: 329.63, beats: 4 }, // E4
    { freq: 349.23, beats: 4 }, // F4
  ],
  tenor: [
    { freq: 220.00, beats: 4 }, // A3
    { freq: 233.08, beats: 4 }, // Bb3
    { freq: 220.00, beats: 4 }, // A3
    { freq: 196.00, beats: 4 }, // G3
    { freq: 174.61, beats: 4 }, // F3
    { freq: 233.08, beats: 4 }, // Bb3
    { freq: 233.08, beats: 4 }, // Bb3 (in C7)
    { freq: 220.00, beats: 4 }, // A3
  ],
  bass: [
    { freq: 87.31, beats: 4 },  // F2
    { freq: 116.54, beats: 4 }, // Bb2
    { freq: 87.31, beats: 4 },  // F2
    { freq: 130.81, beats: 4 }, // C3
    { freq: 146.83, beats: 4 }, // D3
    { freq: 116.54, beats: 4 }, // Bb2
    { freq: 130.81, beats: 4 }, // C3
    { freq: 87.31, beats: 4 },  // F2
  ]
};

function generateSet(bpm, outDir) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Generating stems for BPM: ${bpm} -> ${outDir}`);

  for (const [part, notes] of Object.entries(SATB_PARTS)) {
    const samples = synthesizeVoice(notes, bpm);
    const wav = createWavBuffer(samples);
    const filePath = path.join(outDir, `${part}.wav`);
    fs.writeFileSync(filePath, wav);
    console.log(`  Wrote ${filePath} (${(wav.length / 1024).toFixed(1)} KB)`);
  }

  // Beat track
  const beatSamples = synthesizeBeat(bpm, 32);
  const beatWav = createWavBuffer(beatSamples);
  const beatPath = path.join(outDir, 'beat.wav');
  fs.writeFileSync(beatPath, beatWav);
  console.log(`  Wrote ${beatPath} (${(beatWav.length / 1024).toFixed(1)} KB)`);
}

generateSet(108, 'public/audio/amazing-grace/normal');
generateSet(78, 'public/audio/amazing-grace/slow');
console.log('All audio stems generated successfully!');
