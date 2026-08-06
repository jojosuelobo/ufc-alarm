/**
 * Synthesized alarm sound via the Web Audio API — no external audio file to
 * source/license. Browsers block audio until a real user gesture happens on
 * the page, so `unlockAudio()` must be called from an actual click/keypress
 * handler at some point before `playAlarmLoop()` is expected to be audible
 * (see components/NotificationBellButton.tsx and AlarmWatcher's one-time
 * window listener).
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  audioContext = new AudioContextClass();
  return audioContext;
}

export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
}

export interface AlarmLoopHandle {
  stop: () => void;
}

const TONE_HIGH_HZ = 940;
const TONE_LOW_HZ = 700;
const BEEP_INTERVAL_MS = 350;
const BEEP_ON_RATIO = 0.6;
const GAIN_LEVEL = 0.25;

/** Starts a looping two-tone "alarm clock" beep. Loops until `stop()` is called. */
export function playAlarmLoop(): AlarmLoopHandle {
  unlockAudio();
  const ctx = getAudioContext();
  if (!ctx) {
    return { stop: () => {} };
  }

  const oscillator = ctx.createOscillator();
  oscillator.type = "square";
  const gain = ctx.createGain();
  gain.gain.value = 0;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();

  let high = true;
  let offTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const beep = () => {
    const now = ctx.currentTime;
    gain.gain.setTargetAtTime(GAIN_LEVEL, now, 0.01);
    oscillator.frequency.setValueAtTime(high ? TONE_HIGH_HZ : TONE_LOW_HZ, now);
    high = !high;
    offTimeoutId = setTimeout(() => {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
    }, BEEP_INTERVAL_MS * BEEP_ON_RATIO);
  };

  beep();
  const intervalId = setInterval(beep, BEEP_INTERVAL_MS);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(intervalId);
      if (offTimeoutId) clearTimeout(offTimeoutId);

      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
      setTimeout(() => {
        try {
          oscillator.stop();
        } catch {
          // already stopped — fine
        }
        oscillator.disconnect();
        gain.disconnect();
      }, 50);
    },
  };
}
