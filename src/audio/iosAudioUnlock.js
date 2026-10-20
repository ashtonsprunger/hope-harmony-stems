/**
 * iOS / Mobile Safari Web Audio Unlock & Silent Mode Switch Bypass
 *
 * Why this is needed on iPhone:
 * 1. By default, iOS Safari classifies Web Audio API (`AudioContext`) under the
 *    "Ambient / Ringer" audio session (`AVAudioSessionCategoryAmbient`), which is
 *    completely muted whenever the iPhone's physical Ring/Silent switch (or Action
 *    Button Silent Mode) is turned ON—even while `audioCtx.currentTime` ticks normally.
 * 2. Setting `navigator.audioSession.type = 'playback'` (iOS 16.4+) AND playing a
 *    tiny silent HTML5 `<audio>` element inside a user gesture forces iOS WebKit
 *    to switch the page's hardware audio session to `AVAudioSessionCategoryPlayback`
 *    (just like Spotify or YouTube), ignoring the Silent switch.
 * 3. iOS Safari also puts `AudioContext` into `'suspended'` or `'interrupted'` states
 *    that require synchronous unlocking + resuming inside a user gesture before
 *    `AudioBufferSourceNode.start()` will produce audible output.
 */

const registeredContexts = new Set();
const unlockedContexts = new WeakSet();
let silentAudioEl = null;
let silentWavUri = null;
let globalListenersAttached = false;

function isIosOrSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Android/i.test(ua);
  return isIOS || isSafari;
}

/**
 * Generates a 0.25-second 8000Hz 16-bit mono digital-silence WAV data URI.
 * All PCM samples are 0x0000 so it produces zero audible noise/clicks.
 */
function getSilentWavDataUri() {
  if (silentWavUri) return silentWavUri;

  const sampleRate = 8000;
  const numSamples = 2000; // 0.25s
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit PCM
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  silentWavUri = 'data:audio/wav;base64,' + btoa(binary);
  return silentWavUri;
}

/**
 * Configures W3C AudioSession API (iOS 16.4+) to 'playback' so Web Audio
 * ignores the iPhone Ring/Silent switch.
 */
export function setPlaybackAudioSession() {
  if (typeof navigator !== 'undefined' && 'audioSession' in navigator && navigator.audioSession) {
    try {
      if (navigator.audioSession.type !== 'playback') {
        navigator.audioSession.type = 'playback';
      }
    } catch (e) {
      // Ignore if browser disallows setting audioSession.type
    }
  }
}

/**
 * Triggers a hidden HTML5 <audio> element with pure digital silence.
 * Forces iOS Safari / WKWebView into AVAudioSessionCategoryPlayback even on
 * older iOS versions or in-app browsers where navigator.audioSession is unavailable.
 */
function triggerSilentHtml5Audio() {
  if (typeof document === 'undefined' || !isIosOrSafari()) return;

  try {
    if (!silentAudioEl) {
      const audio = document.createElement('audio');
      audio.setAttribute('x-webkit-airplay', 'deny');
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.preload = 'auto';
      audio.loop = true;
      // Must NOT be muted or volume=0, otherwise WebKit keeps session on Ambient
      audio.muted = false;
      audio.volume = 0.01;
      audio.src = getSilentWavDataUri();
      audio.style.display = 'none';
      document.body.appendChild(audio);
      silentAudioEl = audio;
    }

    if (silentAudioEl.paused) {
      const playPromise = silentAudioEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Plays a 1-sample silent Web Audio buffer on the AudioContext to satisfy
 * WebKit's user-gesture unlock requirement.
 */
function playSilentWebAudioTick(ctx) {
  if (!ctx) return;
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    if (typeof source.start === 'function') {
      source.start(0);
    } else if (typeof source.noteOn === 'function') {
      source.noteOn(0);
    }
    unlockedContexts.add(ctx);
  } catch (e) {
    // Ignore
  }
}

/**
 * Synchronously initiates iOS audio session + AudioContext unlock inside a user gesture,
 * and returns a Promise that resolves once the AudioContext is running.
 */
export function unlockAudioContext(ctx) {
  setPlaybackAudioSession();
  triggerSilentHtml5Audio();

  if (!ctx) return Promise.resolve();

  registeredContexts.add(ctx);

  // Always play a 1-sample silent tick on first unlock or whenever context is not running
  if (!unlockedContexts.has(ctx) || ctx.state !== 'running') {
    playSilentWebAudioTick(ctx);
  }

  if (ctx.state === 'running') {
    return Promise.resolve();
  }

  // Synchronously invoke ctx.resume() while still inside the user gesture call stack
  try {
    const resumePromise = ctx.resume();
    if (resumePromise && typeof resumePromise.then === 'function') {
      return Promise.race([
        resumePromise.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    }
  } catch (e) {
    // Ignore
  }

  return Promise.resolve();
}

/**
 * Registers an AudioContext so that any touch/click anywhere in the document
 * proactively unlocks it before the user even finishes tapping Play.
 */
export function registerAudioContextForUnlock(ctx) {
  if (!ctx) return;
  registeredContexts.add(ctx);
  setPlaybackAudioSession();
  ensureGlobalUnlockListeners();
}

/**
 * Attaches global passive user-gesture listeners to unlock registered AudioContexts
 * and set iOS playback session on the very first touchstart / touchend / click.
 */
export function ensureGlobalUnlockListeners() {
  if (globalListenersAttached || typeof window === 'undefined') return;
  globalListenersAttached = true;

  const handleUserGesture = () => {
    setPlaybackAudioSession();
    triggerSilentHtml5Audio();

    registeredContexts.forEach((ctx) => {
      if (ctx.state === 'closed') {
        registeredContexts.delete(ctx);
        return;
      }
      if (!unlockedContexts.has(ctx) || ctx.state !== 'running') {
        playSilentWebAudioTick(ctx);
        if (ctx.state !== 'running') {
          try {
            const p = ctx.resume();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } catch (e) {}
        }
      }
    });
  };

  const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
  events.forEach((evt) => {
    window.addEventListener(evt, handleUserGesture, { capture: true, passive: true });
  });
}
