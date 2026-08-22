"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Timer,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  Dumbbell,
  RefreshCw,
  CheckCircle2,
  Volume2,
  VolumeX,
  FastForward,
  Clock,
  Sliders,
  Check,
} from "lucide-react";
import { MOBILITY_ROUTINES, getMuscleGroupsFromWorkout } from "../utils/mobilityRoutines";

interface MobilityTabProps {
  recentWorkoutExercises?: { name: string; category?: string | null }[];
}

export interface MobilityMovement {
  name: string;
  duration?: number;
  durationSeconds?: number;
  cue?: string;
  coachingCue?: string;
  sides?: "left_right" | "both" | "none";
  category?: string;
}

export interface MobilityRoutine {
  id?: string;
  name: string;
  icon?: string;
  durationBadge?: string;
  durationMinutes?: number;
  description?: string;
  muscleGroups?: string[];
  targetMuscleGroups?: string[];
  movements: MobilityMovement[];
}

const MUSCLE_OPTIONS = ["Chest", "Back", "Shoulders", "Arms", "Core", "Legs", "Glutes", "Full Body"];
const TYPE_OPTIONS = [
  { id: "warmup", label: "🔥 Pre-Workout Warm-Up" },
  { id: "cooldown", label: "❄️ Post-Workout Cool-Down" },
  { id: "recovery", label: "🧘 Recovery & Mobility Protocol" },
];
const DURATION_OPTIONS = [5, 10, 15, 20, 30];
const PER_STRETCH_OPTIONS = [
  { seconds: 30, label: "30 sec (Quick Flow)" },
  { seconds: 45, label: "45 sec (Standard)" },
  { seconds: 60, label: "60 sec / 1 min (Deep Stretch)" },
  { seconds: 90, label: "90 sec (Extended Hold)" },
  { seconds: 120, label: "2 min (Long Form Recovery)" },
];

// Web Audio API chime synthesizer for timer completion
function playTimerChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch {
    // Audio context may be restricted by browser until user gesture
  }
}

export function MobilityTab({ recentWorkoutExercises }: MobilityTabProps) {
  // AI Generator State
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [routineType, setRoutineType] = useState<string>("warmup");
  const [duration, setDuration] = useState<number>(10);
  const [perStretchSeconds, setPerStretchSeconds] = useState<number>(60);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRoutine, setAiRoutine] = useState<MobilityRoutine | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  // UI State
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  // Timer State
  const [activeRoutine, setActiveRoutine] = useState<MobilityRoutine | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSide, setCurrentSide] = useState<"left" | "right" | "none">("none");
  const [routineComplete, setRoutineComplete] = useState(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [isWaitingManualDismiss, setIsWaitingManualDismiss] = useState(false);

  // Auto-detect muscles from recent workout
  useEffect(() => {
    if (recentWorkoutExercises && recentWorkoutExercises.length > 0 && selectedMuscles.length === 0 && !autoDetected) {
      const detected = getMuscleGroupsFromWorkout(recentWorkoutExercises);
      if (detected.length > 0) {
        setSelectedMuscles(detected);
        setAutoDetected(true);
      }
    }
  }, [recentWorkoutExercises, selectedMuscles.length, autoDetected]);

  const handleMuscleToggle = (m: string) => {
    if (m === "Full Body") {
      setSelectedMuscles(["Full Body"]);
      return;
    }
    setSelectedMuscles((prev) => {
      const filtered = prev.filter((x) => x !== "Full Body");
      if (filtered.includes(m)) return filtered.filter((x) => x !== m);
      return [...filtered, m];
    });
  };

  const handleSelectAllMuscles = () => {
    setSelectedMuscles(["Chest", "Back", "Shoulders", "Arms", "Core", "Legs", "Glutes"]);
  };

  const handleClearMuscles = () => {
    setSelectedMuscles([]);
    setAutoDetected(false);
  };

  const handleGenerateAI = async () => {
    if (selectedMuscles.length === 0) {
      alert("Please select at least one muscle group.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: "MOBILITY",
          muscleGroups: selectedMuscles,
          routineType,
          durationMinutes: duration,
          perStretchSeconds: perStretchSeconds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiRoutine(data.routine);
        setExpandedRoutineId("ai");
      } else {
        alert("Failed to generate routine. Please try again.");
      }
    } catch {
      alert("Error generating routine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const setupMovement = useCallback((move: any) => {
    const dur = move.duration ?? move.durationSeconds ?? perStretchSeconds ?? 60;
    if (move.sides === "left_right") {
      setCurrentSide("left");
      setTimeLeft(Math.floor(dur / 2));
    } else {
      setCurrentSide("none");
      setTimeLeft(dur);
    }
    setIsWaitingManualDismiss(false);
  }, [perStretchSeconds]);

  const startRoutine = (routine: MobilityRoutine) => {
    setActiveRoutine(routine);
    setCurrentMoveIndex(0);
    setRoutineComplete(false);
    setTotalElapsedTime(0);
    setIsPaused(false);
    setIsWaitingManualDismiss(false);

    if (routine.movements && routine.movements.length > 0) {
      const firstMove = routine.movements[0];
      setupMovement(firstMove);
    } else {
      setRoutineComplete(true);
    }
  };

  const advanceToNextMovement = useCallback(() => {
    if (!activeRoutine) return;
    if (currentMoveIndex + 1 < activeRoutine.movements.length) {
      const nextMove = activeRoutine.movements[currentMoveIndex + 1];
      setCurrentMoveIndex((prev) => prev + 1);
      setupMovement(nextMove);
    } else {
      setRoutineComplete(true);
      if (soundEnabled) playTimerChime();
    }
  }, [activeRoutine, currentMoveIndex, setupMovement, soundEnabled]);

  const handleTimerComplete = useCallback(() => {
    if (!activeRoutine) return;
    const currentMove = activeRoutine.movements[currentMoveIndex];
    if (!currentMove) return;

    if (soundEnabled) playTimerChime();

    if (autoAdvanceTimer) {
      const moveDur = currentMove.duration ?? currentMove.durationSeconds ?? perStretchSeconds ?? 60;
      if (currentMove.sides === "left_right" && currentSide === "left") {
        setCurrentSide("right");
        setTimeLeft(Math.floor(moveDur / 2));
      } else {
        advanceToNextMovement();
      }
    } else {
      // Manual dismiss mode: pause timer and wait for user to click next
      setIsWaitingManualDismiss(true);
      setIsPaused(true);
    }
  }, [activeRoutine, currentMoveIndex, currentSide, autoAdvanceTimer, soundEnabled, perStretchSeconds, advanceToNextMovement]);

  // Timer Interval Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRoutine && !isPaused && !routineComplete && timeLeft > 0 && !isWaitingManualDismiss) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        setTotalElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRoutine, isPaused, routineComplete, timeLeft, isWaitingManualDismiss, handleTimerComplete]);

  const handleManualDismissNext = () => {
    if (!activeRoutine) return;
    const currentMove = activeRoutine.movements[currentMoveIndex];
    if (!currentMove) return;

    const moveDur = currentMove.duration ?? currentMove.durationSeconds ?? perStretchSeconds ?? 60;
    setIsPaused(false);
    setIsWaitingManualDismiss(false);

    if (currentMove.sides === "left_right" && currentSide === "left") {
      setCurrentSide("right");
      setTimeLeft(Math.floor(moveDur / 2));
    } else {
      advanceToNextMovement();
    }
  };

  const skipMovement = () => {
    advanceToNextMovement();
  };

  const endRoutine = () => {
    setActiveRoutine(null);
    setIsWaitingManualDismiss(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Render Timer Modal Overlay
  const renderTimerModal = () => {
    if (!activeRoutine) return null;

    if (routineComplete) {
      return (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.card}>
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ background: "#dcfce7", color: "#16a34a", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <Sparkles size={32} />
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Routine Complete! 🎉</h2>
              <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "32px" }}>
                Total recovery time: {formatTime(totalElapsedTime)}
              </p>
              <button
                onClick={endRoutine}
                style={{ ...styles.primaryButton, width: "100%", padding: "14px", fontSize: "16px" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentMove = activeRoutine.movements[currentMoveIndex];
    if (!currentMove) return null;

    const moveDur = (currentMove as any).duration ?? (currentMove as any).durationSeconds ?? perStretchSeconds ?? 60;
    const moveCue = (currentMove as any).cue ?? (currentMove as any).coachingCue ?? "";
    const totalDurationForCurrentSide = currentSide !== "none" ? Math.floor(moveDur / 2) : moveDur;
    const progress = totalDurationForCurrentSide > 0 ? ((totalDurationForCurrentSide - timeLeft) / totalDurationForCurrentSide) * 100 : 0;

    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.card}>
          {/* Top Bar with Dismiss and Settings */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>
              Stretch {currentMoveIndex + 1} of {activeRoutine.movements.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "6px 10px", color: soundEnabled ? "#2563eb" : "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
                title={soundEnabled ? "Sound chime enabled" : "Sound muted"}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>{soundEnabled ? "Sound ON" : "Muted"}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoAdvanceTimer(!autoAdvanceTimer)}
                style={{ background: autoAdvanceTimer ? "#eff6ff" : "#f1f5f9", border: `1px solid ${autoAdvanceTimer ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: "8px", padding: "6px 10px", color: autoAdvanceTimer ? "#1d4ed8" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
                title="Toggle whether the timer auto-advances to the next stretch"
              >
                <FastForward size={14} />
                <span>{autoAdvanceTimer ? "Auto-Advance ON" : "Manual Dismiss"}</span>
              </button>

              <button onClick={endRoutine} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }} title="Exit timer">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Exercise Info */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              {currentMove.name}
            </h2>
            {currentSide !== "none" && (
              <div style={{ display: "inline-block", background: currentSide === "left" ? "#eff6ff" : "#f0fdf4", color: currentSide === "left" ? "#2563eb" : "#16a34a", padding: "4px 12px", borderRadius: "16px", fontSize: "13px", fontWeight: 700, marginBottom: "10px", border: `1px solid ${currentSide === "left" ? "#bfdbfe" : "#bbf7d0"}` }}>
                {currentSide === "left" ? "👈 Left Side" : "👉 Right Side"}
              </div>
            )}
            {moveCue && (
              <p style={{ fontSize: "15px", fontStyle: "italic", color: "#475569", maxWidth: "480px", margin: "0 auto" }}>
                &ldquo;{moveCue}&rdquo;
              </p>
            )}
          </div>

          {/* Circular Countdown Progress Timer */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
            <div style={{
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: isWaitingManualDismiss ? "#dcfce7" : `conic-gradient(#2563eb ${progress}%, #e2e8f0 ${progress}%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "background 0.3s ease",
            }}>
              <div style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontSize: "56px", fontWeight: 800, color: isWaitingManualDismiss ? "#16a34a" : "#0f172a", lineHeight: 1 }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", fontWeight: 600 }}>
                  <Timer size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  {formatTime(totalElapsedTime)} total
                </span>
              </div>
            </div>
          </div>

          {/* Manual Dismiss Notice or Playback Controls */}
          {isWaitingManualDismiss ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ color: "#16a34a", fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={18} />
                <span>Time&apos;s Up! Ready to switch?</span>
              </div>
              <button
                onClick={handleManualDismissNext}
                style={{
                  ...styles.primaryButton,
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  background: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                }}
              >
                <span>{currentMove.sides === "left_right" && currentSide === "left" ? "Switch to Right Side ⏭️" : "Dismiss & Next Stretch ⏭️"}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px" }}>
              <button
                onClick={() => setTimeLeft((t) => Math.max(0, t - 15))}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "44px", height: "44px", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}
                title="Subtract 15 seconds"
              >
                -15s
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                }}
                title={isPaused ? "Resume stretch" : "Pause stretch"}
              >
                {isPaused ? <Play size={26} style={{ marginLeft: "3px" }} /> : <Pause size={26} />}
              </button>

              <button
                onClick={() => setTimeLeft((t) => t + 15)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "44px", height: "44px", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}
                title="Add 15 seconds"
              >
                +15s
              </button>

              <button
                onClick={skipMovement}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Skip to next stretch"
              >
                <SkipForward size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const routinesList = (MOBILITY_ROUTINES as unknown as MobilityRoutine[]) || [];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>Recovery &amp; Warm-Up</h1>
        <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>Custom warm-ups, stretches, sauna, and guided timers.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* AI Custom Routine Generator Section */}
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "#eff6ff", padding: "10px", borderRadius: "10px", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>AI Custom Stretch &amp; Recovery Generator</h2>
              <p style={{ color: "#64748b", fontSize: "13px", margin: "2px 0 0 0" }}>Pick muscle groups, duration, and pacing to generate your guided routine.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
            {/* Step 1: Muscle Groups Selection */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <label style={styles.label}>1. Select Target Muscle Groups</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {autoDetected && (
                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Sparkles size={11} /> Auto-detected from last workout
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSelectAllMuscles}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Select All
                  </button>
                  <span style={{ color: "#cbd5e1" }}>·</span>
                  <button
                    type="button"
                    onClick={handleClearMuscles}
                    style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {MUSCLE_OPTIONS.map((m) => {
                  const isChecked = selectedMuscles.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMuscleToggle(m)}
                      style={{
                        ...styles.pill,
                        background: isChecked ? "#2563eb" : "#f8fafc",
                        color: isChecked ? "#ffffff" : "#334155",
                        borderColor: isChecked ? "#2563eb" : "#cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {isChecked && <Check size={13} />}
                      <span>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Protocol Type, Total Duration & Stretch Pacing */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              {/* Type */}
              <div>
                <label style={styles.label}>2. Protocol Type</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {TYPE_OPTIONS.map((opt) => (
                    <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="routineType"
                        value={opt.id}
                        checked={routineType === opt.id}
                        onChange={() => setRoutineType(opt.id)}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Total Duration */}
              <div>
                <label style={styles.label}>3. Total Routine Duration</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {DURATION_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: duration === mins ? "#2563eb" : "#cbd5e1",
                        background: duration === mins ? "#eff6ff" : "#ffffff",
                        color: duration === mins ? "#1d4ed8" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                  Estimated ~{Math.max(2, Math.round((duration * 60) / perStretchSeconds))} unique stretches
                </div>
              </div>

              {/* Pacing Per Stretch */}
              <div>
                <label style={styles.label}>4. Pacing per Stretch</label>
                <select
                  value={perStretchSeconds}
                  onChange={(e) => setPerStretchSeconds(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontWeight: 600,
                  }}
                >
                  {PER_STRETCH_OPTIONS.map((opt) => (
                    <option key={opt.seconds} value={opt.seconds}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Timer Auto-Advance Option */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                <input
                  type="checkbox"
                  checked={autoAdvanceTimer}
                  onChange={(e) => setAutoAdvanceTimer(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                />
                <span>Auto-advance timer when time expires (turn off for manual &ldquo;Next&rdquo; tap)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                />
                <span>Play completion sound</span>
              </label>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              style={{ ...styles.primaryButton, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px" }}
            >
              {isGenerating ? <RefreshCw size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={16} />}
              <span>{isGenerating ? "Generating Recovery Routine..." : `Generate ${duration}-Min Custom Routine`}</span>
            </button>
          </div>

          {/* AI Result Card */}
          {aiRoutine && (
            <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontWeight: 700, fontSize: "13px", marginBottom: "12px" }}>
                <CheckCircle2 size={16} />
                <span>Generated AI Routine Ready:</span>
              </div>
              <RoutineCard
                routine={aiRoutine}
                isExpanded={expandedRoutineId === "ai"}
                onToggleExpand={() => setExpandedRoutineId(expandedRoutineId === "ai" ? null : "ai")}
                onStart={() => startRoutine(aiRoutine)}
              />
            </div>
          )}
        </div>

        {/* Pre-Defined Routines Grid */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "14px" }}>
            Pre-Defined Recovery Protocols
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
            {routinesList.map((routine, idx) => (
              <RoutineCard
                key={routine.id || idx}
                routine={routine}
                isExpanded={expandedRoutineId === (routine.id || idx.toString())}
                onToggleExpand={() => setExpandedRoutineId(expandedRoutineId === (routine.id || idx.toString()) ? null : routine.id || idx.toString())}
                onStart={() => startRoutine(routine)}
              />
            ))}
          </div>
        </div>
      </div>

      {renderTimerModal()}
    </div>
  );
}

// Subcomponent for Routine Card
function RoutineCard({ routine, isExpanded, onToggleExpand, onStart }: { routine: any; isExpanded: boolean; onToggleExpand: () => void; onStart: () => void }) {
  const durationLabel = routine.durationBadge || (routine.durationMinutes ? `~${routine.durationMinutes} min` : "");
  const muscles = routine.muscleGroups || routine.targetMuscleGroups || [];

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          {routine.icon && <span>{routine.icon}</span>}
          <span>{routine.name}</span>
        </h3>
        {durationLabel && (
          <span style={{ fontSize: "11px", fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "3px 8px", borderRadius: "10px" }}>
            {durationLabel}
          </span>
        )}
      </div>

      {routine.description && (
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px", lineHeight: 1.4 }}>{routine.description}</p>
      )}

      {muscles.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
          {muscles.map((mg: string) => (
            <span key={mg} style={{ fontSize: "11px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "6px" }}>
              {mg}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={onStart} style={{ ...styles.primaryButton, flex: 1, padding: "9px", fontSize: "13px" }}>
          Start Routine
        </button>
        <button onClick={onToggleExpand} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "9px 12px", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="View exercises">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {(routine.movements || []).map((m: any, i: number) => {
            const dur = m.duration ?? m.durationSeconds ?? 60;
            const cue = m.cue ?? m.coachingCue ?? "";
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{m.name}</div>
                  {cue && <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", marginTop: "2px" }}>&ldquo;{cue}&rdquo;</div>}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", whiteSpace: "nowrap", marginLeft: "12px" }}>
                  {m.sides === "left_right" ? `${dur}s (Each Side)` : `${dur}s`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  label: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: "8px",
    letterSpacing: "0.5px",
  },
  pill: {
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
};

const modalStyles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "16px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
};
