import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock matchMedia for jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
  writable: true,
});

// Mock Notification API
class MockNotification {
  static permission = "granted";
  static requestPermission = vi.fn().mockResolvedValue("granted");
  constructor(public title: string, public options?: any) {}
}
(global as any).Notification = MockNotification;
(window as any).Notification = MockNotification;

// Mock Web Audio API
class MockAudioContext {
  createOscillator() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      type: "sine",
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
    };
  }
  get destination() {
    return {};
  }
  get currentTime() {
    return 0;
  }
  close = vi.fn().mockResolvedValue(undefined);
}
(global as any).AudioContext = MockAudioContext;
(window as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;
