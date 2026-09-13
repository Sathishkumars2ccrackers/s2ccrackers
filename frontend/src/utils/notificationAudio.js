// Web Audio API Synthesizer for Rich Festive Order Chimes
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Retrieve Sound Preferences from LocalStorage
export const getSoundSettings = () => {
  try {
    const enabled = localStorage.getItem('s2c_admin_sound_enabled') !== 'false';
    const volume = parseFloat(localStorage.getItem('s2c_admin_sound_volume') || '0.8');
    return { enabled, volume: isNaN(volume) ? 0.8 : Math.max(0, Math.min(1, volume)) };
  } catch {
    return { enabled: true, volume: 0.8 };
  }
};

// Save Sound Preferences to LocalStorage
export const saveSoundSettings = ({ enabled, volume }) => {
  try {
    if (enabled !== undefined) {
      localStorage.setItem('s2c_admin_sound_enabled', enabled ? 'true' : 'false');
    }
    if (volume !== undefined) {
      localStorage.setItem('s2c_admin_sound_volume', String(volume));
    }
  } catch (e) {
    console.error('Failed to save sound settings:', e);
  }
};

/**
 * Play a synthesized multi-harmonic festive alert chime
 * Distinct C5 - E5 - G5 - C6 rising harmonic chime with warm reverb-like decay
 */
export const playOrderAlertChime = (overrideVolume = null) => {
  const settings = getSoundSettings();
  if (!settings.enabled && overrideVolume === null) return;

  const vol = overrideVolume !== null ? overrideVolume : settings.volume;
  if (vol <= 0) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol * 0.35, now);
    masterGain.connect(ctx.destination);

    // Harmonic chord notes for festival celebration
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.8 },   // C5
      { freq: 659.25, time: 0.12, dur: 0.8 },  // E5
      { freq: 783.99, time: 0.24, dur: 0.9 },  // G5
      { freq: 1046.50, time: 0.36, dur: 1.4 }, // C6 (Bright finish)
      { freq: 1318.51, time: 0.48, dur: 1.2 }, // E6 sparkle
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm, bell-like tone
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.8, now + n.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.dur);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.1);
    });
  } catch (err) {
    console.warn('Audio playback not permitted or AudioContext error:', err.message);
  }
};

/**
 * Play shorter test sound
 */
export const playTestChime = () => {
  const settings = getSoundSettings();
  playOrderAlertChime(settings.volume);
};
