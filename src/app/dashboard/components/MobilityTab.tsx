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
  CalendarPlus,
  Save,
  Send,
  UserCheck,
  Activity,
} from "lucide-react";
import { MOBILITY_ROUTINES, getMuscleGroupsFromWorkout } from "../utils/mobilityRoutines";
import { AnatomyGuideModal } from "./AnatomyGuideModal";

interface MobilityTabProps {
  recentWorkoutExercises?: { name: string; category?: string | null }[];
  clientId?: string;
  clientName?: string;
  clientsList?: Array<{ id: string; name: string }>;
  isTrainer?: boolean;
  onLogCompletedRoutine?: (workout: any) => void;
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

export function MobilityTab({
  recentWorkoutExercises,
  clientId,
  clientName,
  clientsList = [],
  isTrainer = false,
  onLogCompletedRoutine,
}: MobilityTabProps) {
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
  const [assigningRoutine, setAssigningRoutine] = useState<MobilityRoutine | null>(null);
  const [assignTargetClientId, setAssignTargetClientId] = useState<string>(clientId || (clientsList[0]?.id || ""));
  const [assignTiming, setAssignTiming] = useState<"PRE_WORKOUT" | "POST_WORKOUT" | "STANDALONE">("PRE_WORKOUT");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [logSavedSuccess, setLogSavedSuccess] = useState(false);

  // Anatomy Guide Modal State
  const [selectedAnatomyMovement, setSelectedAnatomyMovement] = useState<string | null>(null);
  const [anatomyChartData, setAnatomyChartData] = useState<any | null>(null);
  const [loadingAnatomy, setLoadingAnatomy] = useState(false);

  const handleOpenAnatomy = async (movementName: string) => {
    setSelectedAnatomyMovement(movementName);
    setLoadingAnatomy(true);
    try {
      const res = await fetch("/api/ai/anatomy-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName: movementName }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnatomyChartData(data.chart);
      }
    } catch {
      console.error("Failed to load anatomy chart");
    } finally {
      setLoadingAnatomy(false);
    }
  };

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
    setLogSavedSuccess(false);

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

  // Log completed recovery routine to workout history
  const handleSaveRecoveryToHistory = async () => {
    if (!activeRoutine) return;
    setIsSavingLog(true);
    try {
      const targetId = clientId || assignTargetClientId || (clientsList[0]?.id);
      if (!targetId) {
        alert("No client selected for workout logging.");
        setIsSavingLog(false);
        return;
      }

      const durMins = Math.max(1, Math.ceil(totalElapsedTime / 60));
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: targetId,
          status: "COMPLETED",
          startedAt: new Date(Date.now() - totalElapsedTime * 1000).toISOString(),
          completedAt: new Date().toISOString(),
          notes: `🧘 ${activeRoutine.name} (${durMins} min routine completed)`,
          exercises: activeRoutine.movements.map((m: any, idx: number) => ({
            name: m.name,
            order: idx,
            category: "BODYWEIGHT",
            isBodyweight: true,
            sets: [
              {
                weight: 0,
                reps: m.duration ?? m.durationSeconds ?? perStretchSeconds ?? 60,
                notes: m.cue || m.coachingCue || `${m.sides === "left_right" ? "Both sides" : "Completed"}`,
              },
            ],
          })),
        }),
      });

      if (res.ok) {
        const savedWorkout = await res.json();
        setLogSavedSuccess(true);
        if (onLogCompletedRoutine) onLogCompletedRoutine(savedWorkout);
      } else {
        alert("Failed to save recovery session to history.");
      }
    } catch {
      alert("Error saving recovery session.");
    } finally {
      setIsSavingLog(false);
    }
  };

  // Trainer assigns routine to a client
  const handleConfirmAssignRoutine = async () => {
    if (!assigningRoutine || !assignTargetClientId) return;
    try {
      const timingLabel = assignTiming === "PRE_WORKOUT" ? "🔥 Pre-Workout Warm-Up" : assignTiming === "POST_WORKOUT" ? "❄️ Post-Workout Cool-Down" : "🧘 Recovery Protocol";
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: assignTargetClientId,
          status: "PLANNED",
          notes: `${timingLabel}: ${assigningRoutine.name}`,
          exercises: assigningRoutine.movements.map((m: any, idx: number) => ({
            name: m.name,
            order: idx,
            category: "BODYWEIGHT",
            isBodyweight: true,
            sets: [
              {
                weight: 0,
                reps: m.duration ?? m.durationSeconds ?? 60,
                notes: m.cue || m.coachingCue || "",
              },
            ],
          })),
        }),
      });

      if (res.ok) {
        const assignedWorkout = await res.json();
        alert(`✓ Routine successfully assigned to client!`);
        setAssigningRoutine(null);
        if (onLogCompletedRoutine) onLogCompletedRoutine(assignedWorkout);
      } else {
        alert("Failed to assign routine to client.");
      }
    } catch {
      alert("Error assigning routine.");
    }
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
            <div style={{ textAlign: "center", padding: "30px 16px" }}>
              <div style={{ background: "#dcfce7", color: "#16a34a", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>Routine Complete! 🎉</h2>
              <p style={{ color: "#64748b", fontSize: "15px", marginBottom: "24px" }}>
                Total recovery time: <b>{formatTime(totalElapsedTime)}</b> ({activeRoutine.movements.length} stretches)
              </p>

              {/* Log to history notification or button */}
              {logSavedSuccess ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px", borderRadius: "10px", fontWeight: 700, fontSize: "14px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Check size={18} />
                  <span>Logged to Training History! Coach &amp; Client can view it.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveRecoveryToHistory}
                  disabled={isSavingLog}
                  style={{
                    ...styles.primaryButton,
                    width: "100%",
                    padding: "14px",
                    fontSize: "15px",
                    background: "#16a34a",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Save size={18} />
                  <span>{isSavingLog ? "Logging to History..." : "💾 Save & Log Recovery to History"}</span>
                </button>
              )}

              <button
                onClick={endRoutine}
                style={{ ...styles.primaryButton, width: "100%", padding: "12px", fontSize: "15px", background: logSavedSuccess ? "#2563eb" : "#f1f5f9", color: logSavedSuccess ? "#ffffff" : "#475569" }}
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
              <p style={{ fontSize: "15px", fontStyle: "italic", color: "#475569", maxWidth: "480px", margin: "0 auto 10px" }}>
                &ldquo;{moveCue}&rdquo;
              </p>
            )}

            <button
              type="button"
              onClick={() => handleOpenAnatomy(currentMove.name)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                color: "#0284c7",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(2,132,199,0.1)",
              }}
            >
              <Sparkles size={13} />
              <span>View 3D Muscle Anatomy Guide</span>
            </button>
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
        <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>Custom warm-ups, stretches, sauna, and guided timers with history logging.</p>
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
                  Exact ~{Math.max(2, Math.round((duration * 60) / perStretchSeconds))} unique stretches
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
                onAssign={isTrainer ? () => setAssigningRoutine(aiRoutine) : undefined}
                onOpenAnatomy={handleOpenAnatomy}
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
                onAssign={isTrainer ? () => setAssigningRoutine(routine) : undefined}
                onOpenAnatomy={handleOpenAnatomy}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Assign Routine Modal for Trainers */}
      {assigningRoutine && (
        <div style={modalStyles.overlay} onClick={() => setAssigningRoutine(null)}>
          <div style={modalStyles.card} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Assign Recovery Protocol to Client
              </h3>
              <button onClick={() => setAssigningRoutine(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{assigningRoutine.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  {assigningRoutine.movements?.length} movements · {assigningRoutine.durationBadge || `~${assigningRoutine.durationMinutes} min`}
                </div>
              </div>

              {clientsList.length > 0 && (
                <div>
                  <label style={styles.label}>Select Athlete / Client</label>
                  <select
                    value={assignTargetClientId}
                    onChange={(e) => setAssignTargetClientId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: 600 }}
                  >
                    {clientsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={styles.label}>Assignment Timing</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { id: "PRE_WORKOUT", label: "🔥 Pre-Workout Warm-Up (Before Lifting)" },
                    { id: "POST_WORKOUT", label: "❄️ Post-Workout Cool-Down (After Lifting)" },
                    { id: "STANDALONE", label: "🧘 Standalone Recovery Day Session" },
                  ].map((t) => (
                    <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="assignTiming"
                        checked={assignTiming === t.id}
                        onChange={() => setAssignTiming(t.id as any)}
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleConfirmAssignRoutine}
                style={{ ...styles.primaryButton, flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Send size={15} />
                <span>Confirm &amp; Assign to Client</span>
              </button>
              <button
                type="button"
                onClick={() => setAssigningRoutine(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "12px 16px", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {renderTimerModal()}

      {/* 3D Anatomy Muscle Guide Modal */}
      <AnatomyGuideModal
        isOpen={!!selectedAnatomyMovement}
        onClose={() => {
          setSelectedAnatomyMovement(null);
          setAnatomyChartData(null);
        }}
        exerciseName={selectedAnatomyMovement || ""}
        chartData={anatomyChartData}
        loading={loadingAnatomy}
      />
    </div>
  );
}

// Subcomponent for Routine Card
function RoutineCard({
  routine,
  isExpanded,
  onToggleExpand,
  onStart,
  onAssign,
  onOpenAnatomy,
}: {
  routine: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStart: () => void;
  onAssign?: () => void;
  onOpenAnatomy?: (name: string) => void;
}) {
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

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={onStart} style={{ ...styles.primaryButton, flex: 1, padding: "9px 12px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Play size={14} />
          <span>Start Timer</span>
        </button>

        {onAssign && (
          <button
            onClick={onAssign}
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            title="Assign this routine directly to a client"
          >
            <CalendarPlus size={14} />
            <span>Assign</span>
          </button>
        )}

        <button onClick={onToggleExpand} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "9px 12px", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="View movements">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {(routine.movements || []).map((m: any, i: number) => {
            const dur = m.duration ?? m.durationSeconds ?? 60;
            const cue = m.cue ?? m.coachingCue ?? "";
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f1f5f9", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{m.name}</div>
                  {cue && <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", marginTop: "2px" }}>&ldquo;{cue}&rdquo;</div>}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {onOpenAnatomy && (
                    <button
                      type="button"
                      onClick={() => onOpenAnatomy(m.name)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                        color: "#0284c7",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title="View 3D Anatomical Muscle Guide"
                    >
                      <Sparkles size={11} />
                      <span>Anatomy</span>
                    </button>
                  )}

                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", whiteSpace: "nowrap" }}>
                    {m.sides === "left_right" ? `${dur}s (${Math.floor(dur / 2)}s/side)` : `${dur}s`}
                  </div>
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
