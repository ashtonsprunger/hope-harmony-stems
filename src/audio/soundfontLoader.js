/**
 * SoundFont Loader and Audio DSP Setup for HopeHarmony MIDI Playback
 * Loads WebAudioFontPlayer, the JC Live Stage Grand piano soundfont,
 * and FluidR3 Acoustic Snare for the beat track.
 * Applies anti-clipping 3.5ms micro-attack ramp to eliminate digital distortion.
 */

let loadPromise = null;
let isEnvelopePatched = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    // If already in DOM, check if ready
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = (err) => reject(new Error(`Failed to load script ${src}: ${err}`));
    document.head.appendChild(script);
  });
}

function prepareSnarePreset(preset) {
  if (preset && preset.zones) {
    for (const z of preset.zones) {
      z.keyRangeLow = 0;
      z.keyRangeHigh = 127;
    }
  }
  return preset;
}

export async function ensureSoundfontLoaded() {
  if (typeof window === 'undefined') return null;

  if (window.WebAudioFontPlayer && window._tone_0000_JCLive_sf2_file && window._drum_38_0_FluidR3_GM_sf2_file) {
    patchEnvelopeIfNeeded();
    const snare = prepareSnarePreset(window._drum_38_0_FluidR3_GM_sf2_file);
    return {
      WebAudioFontPlayer: window.WebAudioFontPlayer,
      pianoPreset: window._tone_0000_JCLive_sf2_file,
      beatPreset: snare
    };
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      // Load WebAudioFontPlayer first
      if (!window.WebAudioFontPlayer) {
        await loadScript('/soundfonts/WebAudioFontPlayer.js');
      }

      // Load piano soundfont (JC Live Stage Grand) & snare soundfont in parallel
      await Promise.all([
        window._tone_0000_JCLive_sf2_file ? Promise.resolve() : loadScript('/soundfonts/0000_JCLive_sf2_file.js'),
        window._drum_38_0_FluidR3_GM_sf2_file ? Promise.resolve() : loadScript('/soundfonts/12838_0_FluidR3_GM_sf2_file.js')
      ]);

      patchEnvelopeIfNeeded();
      const snare = prepareSnarePreset(window._drum_38_0_FluidR3_GM_sf2_file);

      return {
        WebAudioFontPlayer: window.WebAudioFontPlayer,
        pianoPreset: window._tone_0000_JCLive_sf2_file,
        beatPreset: snare
      };
    })();
  }

  return loadPromise;
}

function patchEnvelopeIfNeeded() {
  if (isEnvelopePatched || !window.WebAudioFontPlayer) return;

  const originalSetupEnvelope = window.WebAudioFontPlayer.prototype.setupEnvelope;
  window.WebAudioFontPlayer.prototype.setupEnvelope = function (
    audioContext,
    envelope,
    zone,
    volume,
    when,
    sampleDuration,
    noteDuration
  ) {
    originalSetupEnvelope.call(this, audioContext, envelope, zone, volume, when, sampleDuration, noteDuration);

    // DSP Anti-Click: 3.5ms micro-attack curve eliminates step discontinuities
    try {
      envelope.gain.cancelScheduledValues(when);
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.linearRampToValueAtTime(volume * 0.9, when + 0.0035);
    } catch (e) {
      // AudioParam scheduling safety fallback
    }
  };

  isEnvelopePatched = true;
}
