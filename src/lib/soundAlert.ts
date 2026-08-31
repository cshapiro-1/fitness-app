/**
 * Robust Cross-Platform Web Audio & Sound Generator
 * Generates crisp gym countdown beeps, ring tones, and completion buzzers without external audio asset dependencies.
 * Satisfies iOS Safari & Android Chrome autoplay policies by pre-warming AudioContext on user interaction.
 */

export type TimerSoundId =
  | "chime"
  | "boxing_bell"
  | "digital_beep"
  | "victory_fanfare"
  | "retro_arcade"
  | "deep_gong"
  | "referee_whistle";

export interface TimerSoundOption {
  id: TimerSoundId;
  name: string;
  description: string;
  icon: string;
}

export const TIMER_SOUND_OPTIONS: TimerSoundOption[] = [
  { id: "chime", name: "Energy Chime", description: "Crisp major arpeggio chime", icon: "✨" },
  { id: "boxing_bell", name: "Boxing Bell", description: "Heavy metallic gym bell ring", icon: "🥊" },
  { id: "digital_beep", name: "Digital Watch", description: "Triple staccato sport beep", icon: "⏱️" },
  { id: "victory_fanfare", name: "Victory Fanfare", description: "Triumphant synth chord flourish", icon: "🎺" },
  { id: "retro_arcade", name: "Retro Arcade", description: "8-bit power-up frequency sweep", icon: "👾" },
  { id: "deep_gong", name: "Deep Gong", description: "Low resonant gong vibration", icon: "🧘" },
  { id: "referee_whistle", name: "Referee Whistle", description: "High-pitch dual whistle chirp", icon: "📣" },
];

let globalAudioCtx: AudioContext | null = null;

export function setAudioContextForTesting(ctx: AudioContext | null): void {
  globalAudioCtx = ctx;
}

export function getAudioContext(): AudioContext | null {
  if (globalAudioCtx) return globalAudioCtx;
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
 * Pre-warm the audio context on user gesture (e.g. clicking start timer, preset button, etc.)
 */
export function prewarmAudio(): void {
  getAudioContext();
}

/**
 * Trigger haptic vibration feedback on supported mobile devices
 */
export function triggerHapticFeedback(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {}
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = "sine"
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * 1. Energy Chime: Ascending Major Triad (A5 -> C6 -> E6)
 */
function playAscendingChime(ctx: AudioContext, now: number): void {
  playTone(ctx, 880, now, 0.12, 0.35, "sine");
  playTone(ctx, 1046.5, now + 0.14, 0.12, 0.35, "sine");
  playTone(ctx, 1318.5, now + 0.28, 0.45, 0.45, "sine");
}

/**
 * 2. Boxing Bell: Rich metallic ring with resonant overtones
 */
function playBoxingBell(ctx: AudioContext, now: number): void {
  const frequencies = [440, 880, 1320, 1760, 2200];
  const volumes = [0.45, 0.3, 0.2, 0.12, 0.08];

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volumes[idx], now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  });
}

/**
 * 3. Digital Watch: 3 rapid high-pitched staccato sports watch beeps
 */
function playDigitalBeep(ctx: AudioContext, now: number): void {
  const beeps = [0, 0.12, 0.24, 0.36];
  beeps.forEach((offset) => {
    playTone(ctx, 1864.66, now + offset, 0.07, 0.35, "square");
  });
}

/**
 * 4. Victory Fanfare: Triumphant 4-note brass/synth power chords
 */
function playVictoryFanfare(ctx: AudioContext, now: number): void {
  const notes = [
    { freq: 523.25, time: 0, dur: 0.12 },     // C5
    { freq: 659.25, time: 0.12, dur: 0.12 },  // E5
    { freq: 783.99, time: 0.24, dur: 0.14 },  // G5
    { freq: 1046.5, time: 0.38, dur: 0.55 },  // C6 (Triumphant Hold)
  ];

  notes.forEach((n) => {
    playTone(ctx, n.freq, now + n.time, n.dur, 0.38, "triangle");
    playTone(ctx, n.freq * 1.002, now + n.time, n.dur, 0.2, "sine");
  });
}

/**
 * 5. Retro Arcade: Classic 8-bit fast ascending frequency ramp
 */
function playRetroArcade(ctx: AudioContext, now: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}

/**
 * 6. Deep Gong: Warm low-frequency meditation gong with long slow decay
 */
function playDeepGong(ctx: AudioContext, now: number): void {
  const harmonics = [196, 293.66, 392, 587.33];
  harmonics.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.4 / (idx + 1), now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.65);
  });
}

/**
 * 7. Referee Whistle: High-pitch dual whistle chirp with flutter modulation
 */
function playRefereeWhistle(ctx: AudioContext, now: number): void {
  const whistleFreqs = [2600, 2850];
  whistleFreqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Modulator for whistle flutter
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(25, now);
    lfoGain.gain.setValueAtTime(30, now);
    lfo.connect(osc.frequency);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
    gain.gain.setValueAtTime(0.25, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.35);
    osc.stop(now + 0.35);
  });
}

/**
 * Main function to play selected timer sound
 */
export function playTimerSound(soundId: TimerSoundId = "chime"): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (soundId) {
      case "boxing_bell":
        playBoxingBell(ctx, now);
        break;
      case "digital_beep":
        playDigitalBeep(ctx, now);
        break;
      case "victory_fanfare":
        playVictoryFanfare(ctx, now);
        break;
      case "retro_arcade":
        playRetroArcade(ctx, now);
        break;
      case "deep_gong":
        playDeepGong(ctx, now);
        break;
      case "referee_whistle":
        playRefereeWhistle(ctx, now);
        break;
      case "chime":
      default:
        playAscendingChime(ctx, now);
        break;
    }

    triggerHapticFeedback();
  } catch (err) {
    console.error("Failed to play timer sound:", err);
  }
}

/**
 * Backward-compatible completion beep
 */
export function playTimerCompletionBeep(): void {
  const savedSound = typeof window !== "undefined"
    ? (localStorage.getItem("strkyr_timer_sound") as TimerSoundId) || "chime"
    : "chime";
  playTimerSound(savedSound);
}

/**
 * Short subtle click / tick for countdown intervals
 */
export function playCountdownTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 659.25, now, 0.06, 0.15, "sine");
  } catch {}
}
