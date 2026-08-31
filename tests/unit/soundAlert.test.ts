import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TIMER_SOUND_OPTIONS,
  playTimerSound,
  prewarmAudio,
  playCountdownTick,
  playTimerCompletionBeep,
  setAudioContextForTesting,
  TimerSoundId
} from "@/lib/soundAlert";

describe("Rest Timer Multi-Ringtone Sound Synthesis Suite", () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockAudioContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOscillator = {
      type: "sine",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      currentTime: 0,
      state: "running",
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => ({
        ...mockOscillator,
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      })),
      createGain: vi.fn(() => ({
        ...mockGain,
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      })),
      destination: {},
    };

    setAudioContextForTesting(mockAudioContext);
  });

  afterEach(() => {
    setAudioContextForTesting(null);
  });

  it("should define all 7 required ring tone options with distinct names and icons", () => {
    expect(TIMER_SOUND_OPTIONS.length).toBe(7);
    const soundIds = TIMER_SOUND_OPTIONS.map((s) => s.id);
    expect(soundIds).toContain("chime");
    expect(soundIds).toContain("boxing_bell");
    expect(soundIds).toContain("digital_beep");
    expect(soundIds).toContain("victory_fanfare");
    expect(soundIds).toContain("retro_arcade");
    expect(soundIds).toContain("deep_gong");
    expect(soundIds).toContain("referee_whistle");

    TIMER_SOUND_OPTIONS.forEach((s) => {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.icon.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    });
  });

  it("should synthesize Energy Chime (chime) tone without error", () => {
    expect(() => playTimerSound("chime")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Boxing Bell (boxing_bell) tone with resonant harmonics", () => {
    expect(() => playTimerSound("boxing_bell")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Digital Watch (digital_beep) staccato tone", () => {
    expect(() => playTimerSound("digital_beep")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Victory Fanfare (victory_fanfare) chord sequence", () => {
    expect(() => playTimerSound("victory_fanfare")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Retro Arcade (retro_arcade) frequency sweep", () => {
    expect(() => playTimerSound("retro_arcade")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Deep Gong (deep_gong) low frequency decay", () => {
    expect(() => playTimerSound("deep_gong")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Referee Whistle (referee_whistle) dual flutter tone", () => {
    expect(() => playTimerSound("referee_whistle")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should prewarm audio context on user gesture", () => {
    expect(() => prewarmAudio()).not.toThrow();
  });

  it("should play subtle countdown tick", () => {
    expect(() => playCountdownTick()).not.toThrow();
  });

  it("should play saved preference completion beep", () => {
    expect(() => playTimerCompletionBeep()).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });
});
