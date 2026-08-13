export function playTimerDing(context: AudioContext | null) {
  if (!context) return;
  try {
    const playTone = (offsetSeconds: number, frequency: number) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const startAt = context.currentTime + offsetSeconds;
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gainNode.gain.setValueAtTime(0.001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.22, startAt + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + 0.22);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.24);
    };
    playTone(0, 880);
    playTone(0.26, 988);
  } catch {}
}