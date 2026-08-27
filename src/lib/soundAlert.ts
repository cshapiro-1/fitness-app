/**
 * Robust Cross-Platform Web Audio & Sound Generator
 * Generates crisp gym countdown beeps and completion buzzers without external audio asset dependencies.
 * Satisfies iOS Safari & Android Chrome autoplay policies by pre-warming AudioContext on user interaction.
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!globalAudioCtx && AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx && globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch (e) {
    console.error("Failed to initialize AudioContext:", e);
    return null;
  }
}

/**
 * Pre-warm the audio context on user gesture (e.g. clicking start timer, plus button, etc.)
 */
export function prewarmAudio(): void {
  getAudioContext();
}

/**
 * Play a high-energy, crisp rest timer completion buzzer / chime sequence:
 * Ascending chime: A5 (880Hz) -> C6 (1046.5Hz) -> E6 (1318.5Hz) with quick resonance.
 */
export function playTimerCompletionBeep(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Beep 1
    playTone(ctx, 880, now, 0.12, 0.35);
    // Beep 2
    playTone(ctx, 1046.5, now + 0.14, 0.12, 0.35);
    // Beep 3 (Major Final)
    playTone(ctx, 1318.5, now + 0.28, 0.35, 0.45);

    // Haptic vibration feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch {}
    }
  } catch (err) {
    console.error("Timer beep error:", err);
  }
}

/**
 * Short subtle click / tick for countdown intervals
 */
export function playCountdownTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 659.25, now, 0.06, 0.2); // E5 short blip
  } catch {}
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.3
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}
