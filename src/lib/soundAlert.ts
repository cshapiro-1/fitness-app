/**
 * Robust Cross-Platform Web Audio & Sound Generator
 * Generates harsh, high-intensity gym alarm buzzers, claxons, bells, and sirens without external audio asset dependencies.
 * Satisfies iOS Safari & Android Chrome autoplay policies by pre-warming AudioContext on user interaction.
 * Supports continuous repeating alarm loops until explicitly dismissed by the user.
 */

export type TimerSoundId =
  | "air_horn"
  | "emergency_alarm"
  | "industrial_buzzer"
  | "boxing_bell"
  | "referee_whistle"
  | "digital_panic"
  | "chime";

export interface TimerSoundOption {
  id: TimerSoundId;
  name: string;
  description: string;
  icon: string;
}

export const TIMER_SOUND_OPTIONS: TimerSoundOption[] = [
  { id: "air_horn", name: "Gym Air Horn", description: "Loud piercing dual-tone stadium air horn", icon: "🚨" },
  { id: "emergency_alarm", name: "Emergency Siren", description: "Harsh alternating rapid alert siren", icon: "⚠️" },
  { id: "industrial_buzzer", name: "Shot Clock Buzzer", description: "Abrasive heavy gym buzzer overdrive", icon: "⚡" },
  { id: "boxing_bell", name: "Triple Boxing Bell", description: "3 rapid hard metallic ring strikes", icon: "🥊" },
  { id: "referee_whistle", name: "Piercing Whistle", description: "Screeching 3.5kHz dual referee blast", icon: "📣" },
  { id: "digital_panic", name: "Digital Panic Beeps", description: "High-pitch 2.4kHz urgent rapid pulses", icon: "⏱️" },
  { id: "chime", name: "Sharp Power Chime", description: "Punchy high-energy ascending arpeggio", icon: "✨" },
];

let globalAudioCtx: AudioContext | null = null;
let activeAlarmInterval: NodeJS.Timeout | null = null;

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
 * Trigger intense haptic vibration feedback on supported mobile devices
 */
export function triggerHapticFeedback(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([300, 150, 300, 150, 400]);
    } catch {}
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.5,
  type: OscillatorType = "sawtooth"
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/**
 * 1. Gym Air Horn: Loud, harsh multi-harmonic stadium blast
 */
function playAirHorn(ctx: AudioContext, now: number): void {
  const freqs = [466.16, 587.33, 700.0, 932.33]; // Bb4, D5, F5, Bb5 harsh chord
  freqs.forEach((freq, i) => {
    playTone(ctx, freq, now, 0.45, 0.45 / (i > 1 ? 1.5 : 1), "sawtooth");
    playTone(ctx, freq * 1.01, now, 0.45, 0.35 / (i > 1 ? 1.5 : 1), "square");
  });
}

/**
 * 2. Emergency Siren: Abrasive warbling emergency siren pulse
 */
function playEmergencyAlarm(ctx: AudioContext, now: number): void {
  for (let i = 0; i < 3; i++) {
    const start = now + i * 0.16;
    playTone(ctx, 1100, start, 0.08, 0.5, "sawtooth");
    playTone(ctx, 1650, start + 0.08, 0.08, 0.5, "square");
  }
}

/**
 * 3. Shot Clock Buzzer: Harsh overdriven gym buzzer
 */
function playIndustrialBuzzer(ctx: AudioContext, now: number): void {
  const subHarmonics = [140, 210, 280, 420, 560];
  subHarmonics.forEach((freq) => {
    playTone(ctx, freq, now, 0.65, 0.4, "square");
    playTone(ctx, freq * 1.02, now, 0.65, 0.35, "sawtooth");
  });
}

/**
 * 4. Triple Heavy Boxing Bell: 3 rapid loud metallic strikes
 */
function playBoxingBell(ctx: AudioContext, now: number): void {
  const strikes = [0, 0.18, 0.36];
  strikes.forEach((offset) => {
    const strikeTime = now + offset;
    const frequencies = [523.25, 1046.5, 1567.98, 2093.0];
    const volumes = [0.55, 0.4, 0.25, 0.15];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, strikeTime);

      gain.gain.setValueAtTime(0.0001, strikeTime);
      gain.gain.exponentialRampToValueAtTime(volumes[idx], strikeTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(strikeTime);
      osc.stop(strikeTime + 0.8);
    });
  });
}

/**
 * 5. Screeching Referee Whistle: Piercing 3.5kHz dual blast
 */
function playRefereeWhistle(ctx: AudioContext, now: number): void {
  const whistleFreqs = [3200, 3600];
  whistleFreqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(32, now);
    lfoGain.gain.setValueAtTime(50, now);
    lfo.connect(osc.frequency);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.45, now + 0.02);
    gain.gain.setValueAtTime(0.45, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.5);
    osc.stop(now + 0.5);
  });
}

/**
 * 6. Digital Panic Beeps: 4 high-pitched 2.4kHz urgent pulses
 */
function playDigitalPanic(ctx: AudioContext, now: number): void {
  const beeps = [0, 0.1, 0.2, 0.3];
  beeps.forEach((offset) => {
    playTone(ctx, 2400, now + offset, 0.06, 0.55, "square");
  });
}

/**
 * 7. Sharp Power Chime: High-energy loud arpeggio
 */
function playSharpPowerChime(ctx: AudioContext, now: number): void {
  playTone(ctx, 880, now, 0.12, 0.5, "triangle");
  playTone(ctx, 1174.66, now + 0.12, 0.12, 0.5, "triangle");
  playTone(ctx, 1567.98, now + 0.24, 0.5, 0.6, "sawtooth");
}

/**
 * Play a single shot of the selected sound
 */
export function playTimerSound(soundId: TimerSoundId = "air_horn"): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (soundId) {
      case "emergency_alarm":
        playEmergencyAlarm(ctx, now);
        break;
      case "industrial_buzzer":
        playIndustrialBuzzer(ctx, now);
        break;
      case "boxing_bell":
        playBoxingBell(ctx, now);
        break;
      case "referee_whistle":
        playRefereeWhistle(ctx, now);
        break;
      case "digital_panic":
        playDigitalPanic(ctx, now);
        break;
      case "chime":
        playSharpPowerChime(ctx, now);
        break;
      case "air_horn":
      default:
        playAirHorn(ctx, now);
        break;
    }

    triggerHapticFeedback();
  } catch (err) {
    console.error("Failed to play timer sound:", err);
  }
}

/**
 * Start repeating alarm sound continuously until explicitly dismissed via stopAlarmLoop()
 */
export function startAlarmLoop(soundId: TimerSoundId = "air_horn", intervalMs = 1500): () => void {
  stopAlarmLoop();

  // Play initial alarm sound immediately
  playTimerSound(soundId);

  // Loop repeating alarm
  activeAlarmInterval = setInterval(() => {
    playTimerSound(soundId);
  }, intervalMs);

  return stopAlarmLoop;
}

/**
 * Stop any currently repeating alarm loop
 */
export function stopAlarmLoop(): void {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
}

/**
 * Backward-compatible completion beep trigger
 */
export function playTimerCompletionBeep(): void {
  const savedSound = typeof window !== "undefined"
    ? (localStorage.getItem("strkyr_timer_sound") as TimerSoundId) || "air_horn"
    : "air_horn";
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
    playTone(ctx, 800, now, 0.05, 0.2, "sine");
  } catch {}
}
