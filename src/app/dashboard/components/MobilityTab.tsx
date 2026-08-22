"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Timer, Play, Pause, SkipForward, X, Sparkles, ChevronDown, ChevronUp, Flame, Heart, Dumbbell, RefreshCw } from "lucide-react";
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
  { id: "warmup", label: "Pre-Workout Warm-Up" },
  { id: "cooldown", label: "Post-Workout Cool-Down" },
  { id: "recovery", label: "Recovery Day" }
];
const DURATION_OPTIONS = [5, 10, 15, 20];

export function MobilityTab({ recentWorkoutExercises }: MobilityTabProps) {
  // AI Generator State
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [routineType, setRoutineType] = useState<string>("warmup");
  const [duration, setDuration] = useState<number>(10);
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
    setSelectedMuscles(prev => {
      const filtered = prev.filter(x => x !== "Full Body");
      if (filtered.includes(m)) return filtered.filter(x => x !== m);
      return [...filtered, m];
    });
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
          durationMinutes: duration
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiRoutine(data.routine);
      } else {
        alert("Failed to generate routine. Please try again.");
      }
    } catch (err) {
      alert("Error generating routine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startRoutine = (routine: MobilityRoutine) => {
    setActiveRoutine(routine);
    setCurrentMoveIndex(0);
    setRoutineComplete(false);
    setTotalElapsedTime(0);
    setIsPaused(false);
    
    if (routine.movements && routine.movements.length > 0) {
      const firstMove = routine.movements[0];
      setupMovement(firstMove);
    } else {
      setRoutineComplete(true);
    }
  };

  const setupMovement = (move: any) => {
    const dur = move.duration ?? move.durationSeconds ?? 30;
    if (move.sides === "left_right") {
      setCurrentSide("left");
      setTimeLeft(Math.floor(dur / 2));
    } else {
      setCurrentSide("none");
      setTimeLeft(dur);
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRoutine && !isPaused && !routineComplete && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        setTotalElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeRoutine, isPaused, routineComplete, timeLeft]);

  const handleTimerComplete = () => {
    if (!activeRoutine) return;
    const currentMove = activeRoutine.movements[currentMoveIndex];
    if (!currentMove) return;
    
    const moveDur = currentMove.duration ?? currentMove.durationSeconds ?? 30;

    if (currentMove.sides === "left_right" && currentSide === "left") {
      // Switch to right side
      setCurrentSide("right");
      setTimeLeft(Math.floor(moveDur / 2));
    } else {
      // Move to next movement
      advanceToNextMovement();
    }
  };

  const advanceToNextMovement = () => {
    if (!activeRoutine) return;
    if (currentMoveIndex + 1 < activeRoutine.movements.length) {
      const nextMove = activeRoutine.movements[currentMoveIndex + 1];
      setCurrentMoveIndex(currentMoveIndex + 1);
      setupMovement(nextMove);
    } else {
      setRoutineComplete(true);
    }
  };

  const skipMovement = () => {
    advanceToNextMovement();
  };

  const endRoutine = () => {
    setActiveRoutine(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Render Timer Modal
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
              <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Routine Complete! 🎉</h2>
              <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "32px" }}>
                Total time: {formatTime(totalElapsedTime)}
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

    const moveDur = (currentMove as any).duration ?? (currentMove as any).durationSeconds ?? 30;
    const moveCue = (currentMove as any).cue ?? (currentMove as any).coachingCue ?? "";
    const totalDurationForCurrentSide = currentSide !== "none" ? Math.floor(moveDur / 2) : moveDur;
    const progress = totalDurationForCurrentSide > 0 ? ((totalDurationForCurrentSide - timeLeft) / totalDurationForCurrentSide) * 100 : 0;

    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
              Movement {currentMoveIndex + 1} / {activeRoutine.movements.length}
            </span>
            <button onClick={endRoutine} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              {currentMove.name}
            </h2>
            {currentSide !== "none" && (
              <div style={{ display: "inline-block", background: "#eff6ff", color: "#2563eb", padding: "4px 12px", borderRadius: "16px", fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
                {currentSide === "left" ? "Left Side" : "Right Side"}
              </div>
            )}
            {moveCue && (
              <p style={{ fontSize: "18px", fontStyle: "italic", color: "#475569" }}>
                &ldquo;{moveCue}&rdquo;
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
            <div style={{
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: `conic-gradient(#2563eb ${progress}%, #e2e8f0 ${progress}%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}>
              <div style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <span style={{ fontSize: "64px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{ fontSize: "14px", color: "#64748b", marginTop: "8px", fontWeight: 600 }}>
                  <Timer size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  {formatTime(totalElapsedTime)} elapsed
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <button 
              onClick={() => setIsPaused(!isPaused)}
              style={{
                width: "64px", height: "64px", borderRadius: "50%", background: "#2563eb", color: "#ffffff",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
              }}
            >
              {isPaused ? <Play size={28} style={{ marginLeft: "4px" }} /> : <Pause size={28} />}
            </button>
            <button 
              onClick={skipMovement}
              style={{
                width: "64px", height: "64px", borderRadius: "50%", background: "#f1f5f9", color: "#475569",
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <SkipForward size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const routinesList = (MOBILITY_ROUTINES as unknown as MobilityRoutine[]) || [];

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Recovery &amp; Warm-Up</h1>
        <p style={{ color: "#64748b", fontSize: "16px" }}>Warm-ups, stretches, cool-downs, sauna, and wellness protocols</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* AI Custom Routine Generator Section */}
        <div style={styles.card}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "8px", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px" }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>AI Custom Routine</h2>
              <p style={{ color: "#64748b", fontSize: "14px" }}>Generate a personalized stretching routine based on your muscle groups</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
            {/* Muscles */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <label style={styles.label}>Target Muscle Groups</label>
                {autoDetected && (
                  <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Sparkles size={12} /> Auto-detected from last workout
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {MUSCLE_OPTIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => handleMuscleToggle(m)}
                    style={{
                      ...styles.pill,
                      background: selectedMuscles.includes(m) ? "#2563eb" : "#f1f5f9",
                      color: selectedMuscles.includes(m) ? "#ffffff" : "#475569",
                      borderColor: selectedMuscles.includes(m) ? "#2563eb" : "#e2e8f0"
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Type & Duration */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
              <div>
                <label style={styles.label}>Routine Type</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {TYPE_OPTIONS.map(opt => (
                    <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#334155", cursor: "pointer" }}>
                      <input 
                        type="radio" 
                        name="routineType" 
                        value={opt.id} 
                        checked={routineType === opt.id}
                        onChange={() => setRoutineType(opt.id)}
                        style={{ accentColor: "#2563eb" }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={styles.label}>Duration</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {DURATION_OPTIONS.map(mins => (
                    <label key={mins} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "#334155", cursor: "pointer" }}>
                      <input 
                        type="radio" 
                        name="routineDuration" 
                        value={mins} 
                        checked={duration === mins}
                        onChange={() => setDuration(mins)}
                        style={{ accentColor: "#2563eb" }}
                      />
                      {mins} min
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerateAI} 
              disabled={isGenerating}
              style={{ ...styles.primaryButton, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {isGenerating ? <RefreshCw size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={18} />}
              {isGenerating ? "Generating..." : "Generate Routine"}
            </button>
          </div>

          {/* AI Result */}
          {aiRoutine && (
            <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
              <RoutineCard 
                routine={aiRoutine} 
                isExpanded={expandedRoutineId === "ai"}
                onToggleExpand={() => setExpandedRoutineId(expandedRoutineId === "ai" ? null : "ai")}
                onStart={() => startRoutine(aiRoutine)}
              />
            </div>
          )}
        </div>

        {/* Pre-Defined Routines */}
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>Pre-Defined Routines</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {routinesList.map((routine, idx) => (
              <RoutineCard 
                key={routine.id || idx}
                routine={routine} 
                isExpanded={expandedRoutineId === (routine.id || idx.toString())}
                onToggleExpand={() => setExpandedRoutineId(expandedRoutineId === (routine.id || idx.toString()) ? null : (routine.id || idx.toString()))}
                onStart={() => startRoutine(routine)}
              />
            ))}
            {routinesList.length === 0 && (
              <p style={{ color: "#64748b", fontSize: "14px" }}>No pre-defined routines available.</p>
            )}
          </div>
        </div>
      </div>

      {renderTimerModal()}
    </div>
  );
}

// Subcomponent for Routine Card
function RoutineCard({ routine, isExpanded, onToggleExpand, onStart }: { routine: any, isExpanded: boolean, onToggleExpand: () => void, onStart: () => void }) {
  const durationLabel = routine.durationBadge || (routine.durationMinutes ? `~${routine.durationMinutes} min` : "");
  const muscles = routine.muscleGroups || routine.targetMuscleGroups || [];

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", background: "#ffffff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          {routine.icon && <span>{routine.icon}</span>}
          <span>{routine.name}</span>
        </h3>
        {durationLabel && (
          <span style={{ fontSize: "12px", fontWeight: 600, background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "12px" }}>
            {durationLabel}
          </span>
        )}
      </div>
      
      {routine.description && (
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>{routine.description}</p>
      )}

      {muscles.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
          {muscles.map((mg: string) => (
            <span key={mg} style={{ fontSize: "11px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "8px" }}>
              {mg}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onStart} style={{ ...styles.primaryButton, flex: 1, padding: "10px", fontSize: "14px" }}>
          Start Routine
        </button>
        <button onClick={onToggleExpand} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "10px", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {(routine.movements || []).map((m: any, i: number) => {
            const dur = m.duration ?? m.durationSeconds ?? 30;
            const cue = m.cue ?? m.coachingCue ?? "";
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{m.name}</div>
                  {cue && <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginTop: "2px" }}>{cue}</div>}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#2563eb", whiteSpace: "nowrap", marginLeft: "12px" }}>
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
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  label: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase" as const,
    display: "block",
    marginBottom: "8px"
  },
  pill: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s"
  }
};

const modalStyles = {
  overlay: {
    position: "fixed" as const,
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px"
  },
  card: {
    background: "#ffffff",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "480px",
    padding: "32px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
  }
};
