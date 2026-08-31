import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TIMER_SOUND_OPTIONS,
  playTimerSound,
  startAlarmLoop,
  stopAlarmLoop,
  prewarmAudio,
  playCountdownTick,
  playTimerCompletionBeep,
  setAudioContextForTesting,
  TimerSoundId
} from "@/lib/soundAlert";

describe("Rest Timer Harsh Multi-Ringtone & Repeat Alarm Suite", () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockAudioContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockOscillator = {
      type: "sawtooth",
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
        setValueCurveAtTime: vi.fn(),
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
    stopAlarmLoop();
    setAudioContextForTesting(null);
    vi.useRealTimers();
  });

  it("should define all 7 harsh ring tone options with distinct names and icons", () => {
    expect(TIMER_SOUND_OPTIONS.length).toBe(7);
    const soundIds = TIMER_SOUND_OPTIONS.map((s) => s.id);
    expect(soundIds).toContain("air_horn");
    expect(soundIds).toContain("emergency_alarm");
    expect(soundIds).toContain("industrial_buzzer");
    expect(soundIds).toContain("boxing_bell");
    expect(soundIds).toContain("referee_whistle");
    expect(soundIds).toContain("digital_panic");
    expect(soundIds).toContain("chime");

    TIMER_SOUND_OPTIONS.forEach((s) => {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.icon.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    });
  });

  it("should synthesize Gym Air Horn (air_horn) without error", () => {
    expect(() => playTimerSound("air_horn")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Emergency Siren (emergency_alarm) without error", () => {
    expect(() => playTimerSound("emergency_alarm")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Shot Clock Buzzer (industrial_buzzer) without error", () => {
    expect(() => playTimerSound("industrial_buzzer")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Triple Heavy Boxing Bell (boxing_bell) without error", () => {
    expect(() => playTimerSound("boxing_bell")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Screeching Whistle (referee_whistle) with flutter modulation", () => {
    expect(() => playTimerSound("referee_whistle")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Digital Panic Beeps (digital_panic) without error", () => {
    expect(() => playTimerSound("digital_panic")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should synthesize Sharp Power Chime (chime) without error", () => {
    expect(() => playTimerSound("chime")).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it("should start repeating alarm loop and continuously sound until stopAlarmLoop is called", () => {
    const stopFn = startAlarmLoop("air_horn", 1500);
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();

    const callCountBefore = mockAudioContext.createOscillator.mock.calls.length;

    // Fast-forward 1.5s -> should trigger 2nd repeat blast
    vi.advanceTimersByTime(1500);
    expect(mockAudioContext.createOscillator.mock.calls.length).toBeGreaterThan(callCountBefore);

    // Fast-forward another 1.5s -> should trigger 3rd repeat blast
    vi.advanceTimersByTime(1500);

    // Stop alarm
    stopFn();

    const callCountAfterStop = mockAudioContext.createOscillator.mock.calls.length;
    // Fast-forward more -> no more blasts should happen
    vi.advanceTimersByTime(3000);
    expect(mockAudioContext.createOscillator.mock.calls.length).toBe(callCountAfterStop);
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
