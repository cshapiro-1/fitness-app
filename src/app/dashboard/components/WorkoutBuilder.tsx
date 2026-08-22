"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2, Dumbbell, History, Award, Timer, Copy, Sparkles, BookmarkPlus, CheckCircle2, Flame } from "lucide-react";
import { DraftWorkout, DraftSet, DraftExercise, WorkoutSession } from "../types";
import { RestTimer } from "./RestTimer";
import { ExerciseLibraryModal } from "./ExerciseLibraryModal";
import { AnatomyGuideModal } from "./AnatomyGuideModal";
import { EXERCISE_LIBRARY, isDefaultBodyweight } from "../utils/exerciseLibrary";
import { generateWorkoutSummary } from "../utils/aiWorkoutSummary";

interface WorkoutBuilderProps {
  activeWorkout: DraftWorkout | null;
  setActiveWorkout: React.Dispatch<React.SetStateAction<DraftWorkout | null>>;
  plannedWorkouts: WorkoutSession[];
  historyWorkouts?: WorkoutSession[];
  exercisePicker: string;
  setExercisePicker: (val: string) => void;
  savingWorkout: boolean;
  savingPlan: boolean;
  draftRestored?: boolean;
  onClearDraftNotice?: () => void;
  onStartWorkout: () => void;
  onBeginPlannedWorkout: (workout: WorkoutSession) => void;
  onSaveWorkoutPlan: () => void;
  onCompleteWorkout: () => void;
  onDiscardWorkout?: () => void;
  onDeleteWorkout?: (id: string) => void;
}

export function WorkoutBuilder({
  activeWorkout,
  setActiveWorkout,
  plannedWorkouts,
  historyWorkouts = [],
  exercisePicker,
  setExercisePicker,
  savingWorkout,
  savingPlan,
  draftRestored = false,
  onClearDraftNotice,
  onStartWorkout,
  onBeginPlannedWorkout,
  onSaveWorkoutPlan,
  onCompleteWorkout,
  onDiscardWorkout,
  onDeleteWorkout,
}: WorkoutBuilderProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);

  // Anatomy Guide Modal State
  const [selectedAnatomyExercise, setSelectedAnatomyExercise] = useState<string | null>(null);
  const [anatomyChartData, setAnatomyChartData] = useState<any | null>(null);
  const [loadingAnatomy, setLoadingAnatomy] = useState(false);

  const handleOpenAnatomyGuide = async (exerciseName: string) => {
    setSelectedAnatomyExercise(exerciseName);
    setLoadingAnatomy(true);
    try {
      const res = await fetch("/api/ai/anatomy-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseName }),
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

  const totalDraftSets = useMemo(() => {
    if (!activeWorkout) return 0;
    return activeWorkout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);
  }, [activeWorkout]);

  // Compute previous performance lookup per exercise
  const previousPerformanceMap = useMemo(() => {
    const map: Record<string, { sets: { weight: number; reps: number }[]; date: string; max1RM: number }> = {};

    const completed = [...historyWorkouts].filter((w) => w.status === "COMPLETED");
    completed.sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

    completed.forEach((w) => {
      w.exercises.forEach((ex) => {
        const normName = ex.name.trim().toLowerCase();
        if (!map[normName] && ex.sets.length > 0) {
          let max1RM = 0;
          const cleanSets = ex.sets.map((st) => {
            const est1RM = st.reps > 1 ? Math.round(st.weight * (36 / (37 - Math.min(st.reps, 36)))) : st.weight;
            if (est1RM > max1RM) max1RM = est1RM;
            return { weight: st.weight, reps: st.reps };
          });

          map[normName] = {
            sets: cleanSets,
            date: new Date(w.completedAt || w.createdAt).toLocaleDateString(),
            max1RM,
          };
        }
      });
    });

    return map;
  }, [historyWorkouts]);

  // All-time max 1RM per exercise
  const allTimePRMap = useMemo(() => {
    const map: Record<string, number> = {};
    historyWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const normName = ex.name.trim().toLowerCase();
        ex.sets.forEach((st) => {
          const est1RM = st.reps > 1 ? Math.round(st.weight * (36 / (37 - Math.min(st.reps, 36)))) : st.weight;
          if (!map[normName] || est1RM > map[normName]) {
            map[normName] = est1RM;
          }
        });
      });
    });
    return map;
  }, [historyWorkouts]);

  const addExerciseWithName = (name: string) => {
    if (!name.trim()) return;
    const isBW = isDefaultBodyweight(name);
    setActiveWorkout((current) => {
      const prevData = previousPerformanceMap[name.trim().toLowerCase()];
      const initialSets = prevData && prevData.sets.length > 0
        ? prevData.sets.map((ps) => ({ weight: ps.weight.toString(), reps: ps.reps.toString(), notes: "" }))
        : [{ weight: isBW ? "0" : "", reps: "", notes: "" }];

      const newEx: DraftExercise = {
        name: name.trim(),
        isBodyweight: isBW,
        category: isBW ? "BODYWEIGHT" : "STRENGTH",
        sets: initialSets,
      };

      if (!current) {
        return {
          startedAt: new Date().toISOString(),
          notes: "",
          exercises: [newEx],
        };
      }
      return {
        ...current,
        exercises: [...current.exercises, newEx],
      };
    });
    setExercisePicker("");
  };

  const removeExercise = (exerciseIndex: number) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return { ...current, exercises: current.exercises.filter((_, index) => index !== exerciseIndex) };
    });
  };

  const updateExerciseName = (exerciseIndex: number, value: string) => {
    const isBW = isDefaultBodyweight(value);
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === exerciseIndex
            ? {
                ...exercise,
                name: value,
                isBodyweight: exercise.isBodyweight !== undefined ? exercise.isBodyweight : isBW,
                category: exercise.isBodyweight ? "BODYWEIGHT" : (isBW ? "BODYWEIGHT" : "STRENGTH"),
              }
            : exercise,
        ),
      };
    });
  };

  const toggleExerciseBodyweight = (exerciseIndex: number, isBodyweight: boolean) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === exerciseIndex
            ? {
                ...exercise,
                isBodyweight,
                category: isBodyweight ? "BODYWEIGHT" : "STRENGTH",
              }
            : exercise,
        ),
      };
    });
  };

  const addSet = (exerciseIndex: number) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      const ex = current.exercises[exerciseIndex];
      const lastSet = ex.sets[ex.sets.length - 1];
      const defaultWeight = lastSet ? lastSet.weight : "";
      const defaultReps = lastSet ? lastSet.reps : "";

      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === exerciseIndex
            ? { ...exercise, sets: [...exercise.sets, { weight: defaultWeight, reps: defaultReps, notes: "" }] }
            : exercise,
        ),
      };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) => {
          if (index !== exerciseIndex) return exercise;
          const nextSets = exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex);
          return { ...exercise, sets: nextSets.length ? nextSets : [{ weight: "", reps: "", notes: "" }] };
        }),
      };
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof DraftSet, value: string) => {
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) => {
          if (index !== exerciseIndex) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.map((setEntry, currentSetIndex) =>
              currentSetIndex === setIndex ? { ...setEntry, [field]: value } : setEntry,
            ),
          };
        }),
      };
    });
  };

  const copyPreviousPerformance = (exerciseIndex: number, exerciseName: string) => {
    const prev = previousPerformanceMap[exerciseName.trim().toLowerCase()];
    if (!prev || prev.sets.length === 0) return;

    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, idx) => {
          if (idx !== exerciseIndex) return exercise;
          return {
            ...exercise,
            sets: prev.sets.map((ps) => ({ weight: ps.weight.toString(), reps: ps.reps.toString(), notes: "" })),
          };
        }),
      };
    });
  };

  const handleAddPreWorkoutWarmup = () => {
    const warmupMovements: DraftExercise[] = [
      { name: "Arm Circles & Hugs (Warm-Up)", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "30", notes: "Dynamic Warm-Up" }] },
      { name: "Inchworm to Cobra Walkout", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "45", notes: "Core & Shoulder Prep" }] },
      { name: "Thoracic Spine Rotations", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "30", notes: "T-Spine Mobility (Each Side)" }] },
      { name: "High Knees & Lateral Lunges", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "45", notes: "Hips & Cardio Warm-Up" }] },
    ];

    setActiveWorkout((current) => {
      if (!current) {
        return {
          startedAt: new Date().toISOString(),
          notes: "Includes Pre-Workout Dynamic Warm-Up",
          exercises: warmupMovements,
        };
      }
      return {
        ...current,
        notes: current.notes ? `${current.notes} (Pre-Workout Warm-Up Added)` : "Pre-Workout Warm-Up Added",
        exercises: [...warmupMovements, ...current.exercises],
      };
    });
  };

  const handleAddPostWorkoutCooldown = () => {
    const cooldownMovements: DraftExercise[] = [
      { name: "Doorway Pec & Chest Stretch", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "45", notes: "Chest & Anterior Shoulder (Each Side)" }] },
      { name: "Child's Pose with Lat Reach", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "45", notes: "Back & Spine Decompression" }] },
      { name: "Standing Hamstring Fold & Quads", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "45", notes: "Legs & Hips (Each Side)" }] },
      { name: "Pigeon Pose Glute Stretch", isBodyweight: true, category: "BODYWEIGHT", sets: [{ weight: "0", reps: "45", notes: "Glutes & Lower Back (Each Side)" }] },
    ];

    setActiveWorkout((current) => {
      if (!current) {
        return {
          startedAt: new Date().toISOString(),
          notes: "Includes Post-Workout Cool-Down",
          exercises: cooldownMovements,
        };
      }
      return {
        ...current,
        notes: current.notes ? `${current.notes} (Post-Workout Cool-Down Added)` : "Post-Workout Cool-Down Added",
        exercises: [...current.exercises, ...cooldownMovements],
      };
    });
  };

  return (
    <div className="card workout-builder-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 className="section-title" style={{ margin: 0 }}>Workout Builder</h3>
        <button
          type="button"
          onClick={() => setShowLibraryModal(true)}
          style={{
            background: "#eff6ff",
            color: "#2563eb",
            border: "1px solid #bfdbfe",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            cursor: "pointer",
          }}
        >
          <Dumbbell size={14} />
          <span>Browse 120+ Exercises</span>
        </button>
      </div>

      {!activeWorkout && (
        <div className="builder-empty">
          <p>Build a new workout or begin a saved workout plan.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="btn-primary" onClick={onStartWorkout}>Create New Workout</button>
            <button
              className="btn-secondary"
              onClick={() => setShowLibraryModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Dumbbell size={14} />
              <span>Exercise Library</span>
            </button>
          </div>

          {!!plannedWorkouts.length && (
            <div className="planned-list" style={{ marginTop: "24px" }}>
              <h4 className="planned-list-title">Planned Workouts</h4>
              {plannedWorkouts.map((plannedWorkout) => (
                <div key={plannedWorkout.id} className="planned-row">
                  <div>
                    <div className="planned-row-title">
                      {plannedWorkout.status === "IN_PROGRESS" ? "In Progress" : "Planned"} — {plannedWorkout.exercises.length} exercises
                    </div>
                    <div className="planned-row-meta">{new Date(plannedWorkout.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button className="btn-primary" onClick={() => onBeginPlannedWorkout(plannedWorkout)}>
                      {plannedWorkout.status === "IN_PROGRESS" ? "Resume Workout" : "Begin Workout"}
                    </button>
                    {onDeleteWorkout && (
                      <button
                        type="button"
                        className="btn-ghost-danger"
                        onClick={() => {
                          if (confirm("Delete this planned workout? This cannot be undone.")) {
                            onDeleteWorkout(plannedWorkout.id);
                          }
                        }}
                        title="Delete planned workout"
                        style={{ padding: "8px 10px", borderRadius: "8px" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeWorkout && (
        <>
          {draftRestored && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} style={{ color: "#16a34a" }} />
                <span>
                  <b>Draft Restored:</b> Recovered in-progress workout from your session backup.
                </span>
              </div>
              {onClearDraftNotice && (
                <button
                  type="button"
                  onClick={onClearDraftNotice}
                  className="btn-ghost"
                  style={{ padding: "2px 6px", fontSize: "11px", height: "auto" }}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          <div className="builder-top-row">
            <div className="workout-meta" style={{ alignItems: "center" }}>
              <span>Started: {new Date(activeWorkout.startedAt).toLocaleTimeString()}</span>
              <span>Exercises: {activeWorkout.exercises.length}</span>
              <span>Sets: {totalDraftSets}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#15803d",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}
                title="Progress is automatically saved to local session storage"
              >
                ✓ Auto-Saved
              </span>
            </div>
            <button
              type="button"
              className="btn-ghost-danger"
              onClick={onDiscardWorkout ? onDiscardWorkout : () => setActiveWorkout(null)}
              title="Discard this workout draft"
            >
              Discard Draft
            </button>
          </div>

          {/* Exercise Picker Row */}
          <div className="exercise-picker" style={{ display: "flex", gap: "8px" }}>
            <input
              className="input"
              list="exercise-options"
              placeholder="Choose or type an exercise (e.g. Bench Press, Squat)..."
              value={exercisePicker}
              onChange={(event) => setExercisePicker(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && exercisePicker.trim()) {
                  addExerciseWithName(exercisePicker);
                }
              }}
              style={{ flex: 1 }}
            />
            <datalist id="exercise-options">
              {EXERCISE_LIBRARY.map((ex) => (
                <option key={ex.name} value={ex.name} />
              ))}
            </datalist>
            <button className="btn-primary" onClick={() => addExerciseWithName(exercisePicker)}>
              <Plus size={14} />
              <span>Add</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowLibraryModal(true)}
              title="Open full exercise database"
            >
              <Dumbbell size={14} />
              <span>Library</span>
            </button>
          </div>

          {/* Quick Warm-Up & Cool-Down Protocols */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
            <button
              type="button"
              onClick={handleAddPreWorkoutWarmup}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #fed7aa",
                background: "#fff7ed",
                color: "#c2410c",
                cursor: "pointer",
              }}
              title="Insert dynamic warm-up movements at start of workout"
            >
              <Flame size={14} />
              <span>+ Add Warm-Up Routine (8 min)</span>
            </button>

            <button
              type="button"
              onClick={handleAddPostWorkoutCooldown}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#166534",
                cursor: "pointer",
              }}
              title="Insert static cool-down stretches at end of workout"
            >
              <span>🧘</span>
              <span>+ Add Cool-Down Stretches (10 min)</span>
            </button>
          </div>

          {/* Exercise List */}
          <div className="exercise-list">
            {!activeWorkout.exercises.length && (
              <div className="empty-state">
                Add your first exercise to begin logging sets.
              </div>
            )}
            {activeWorkout.exercises.map((exercise, exerciseIndex) => {
              const normName = exercise.name.trim().toLowerCase();
              const prev = previousPerformanceMap[normName];
              const allTimePR = allTimePRMap[normName] || 0;

              return (
                <div className="exercise-card" key={`${exercise.name}-${exerciseIndex}`}>
                  {/* Exercise Header */}
                  <div className="exercise-card-header" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <input
                      className="input"
                      list="exercise-options"
                      value={exercise.name}
                      onChange={(event) => updateExerciseName(exerciseIndex, event.target.value)}
                      style={{ fontWeight: 700, fontSize: "14px", flex: 1, minWidth: "180px" }}
                    />

                    {/* Body Resistance / Bodyweight Toggle Checkbox */}
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        background: exercise.isBodyweight ? "#f0fdf4" : "#f8fafc",
                        border: exercise.isBodyweight ? "1px solid #86efac" : "1px solid #e2e8f0",
                        color: exercise.isBodyweight ? "#166534" : "#64748b",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        userSelect: "none",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                      title="Check if this is a body resistance or bodyweight exercise (pushups, back extensions, pullups, jumping jacks, etc.)"
                    >
                      <input
                        type="checkbox"
                        checked={!!exercise.isBodyweight}
                        onChange={(e) => toggleExerciseBodyweight(exerciseIndex, e.target.checked)}
                        style={{ width: "15px", height: "15px", accentColor: "#16a34a", cursor: "pointer" }}
                      />
                      <span>Bodyweight / Resistance</span>
                    </label>

                    {/* 3D Anatomy Muscle Guide Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenAnatomyGuide(exercise.name)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "#f0f9ff",
                        border: "1px solid #bae6fd",
                        color: "#0284c7",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      title="View 3D Anatomical Muscle Recruitment Chart"
                    >
                      <Sparkles size={13} style={{ color: "#0284c7" }} />
                      <span>Anatomy Guide</span>
                    </button>

                    <button className="btn-ghost-danger" onClick={() => removeExercise(exerciseIndex)} title="Remove exercise">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Previous Performance Ghost Banner */}
                  {prev && (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        color: "#475569",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <History size={13} style={{ color: "#64748b" }} />
                        <span>
                          <b>Last Session ({prev.date}):</b>{" "}
                          {prev.sets.map((s, idx) => `${s.weight}×${s.reps}`).join(", ")} lbs
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyPreviousPerformance(exerciseIndex, exercise.name)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Copy size={11} />
                        <span>Copy Previous</span>
                      </button>
                    </div>
                  )}

                  {/* Set Header */}
                  <div className="set-row set-row-header">
                    <span className="set-header-cell">Set</span>
                    <span className="set-header-cell">
                      {exercise.isBodyweight ? "Added Wt (+lbs / 0 for BW)" : "Weight (lbs)"}
                    </span>
                    <span className="set-header-cell">Reps</span>
                    <span className="set-header-cell">Notes / Effort</span>
                    <span />
                  </div>

                  {/* Sets */}
                  <div className="set-list">
                    {exercise.sets.map((set, setIndex) => {
                      const curWeight = parseFloat(set.weight) || 0;
                      const curReps = parseInt(set.reps, 10) || 0;
                      const est1RM = curReps > 1 ? Math.round(curWeight * (36 / (37 - Math.min(curReps, 36)))) : curWeight;
                      const isNewPR = curWeight > 0 && (allTimePR === 0 ? curWeight > 0 : est1RM > allTimePR);

                      return (
                        <div className="set-row" key={`set-${setIndex}`}>
                          <span className="set-index">
                            Set {setIndex + 1}
                            {isNewPR && (
                              <span
                                title={`Estimated 1RM: ${est1RM} lbs (New PR!)`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "2px",
                                  marginLeft: "4px",
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                }}
                              >
                                <Award size={10} /> PR
                              </span>
                            )}
                          </span>

                          <input
                            className="input set-input"
                            type="number"
                            placeholder={exercise.isBodyweight ? "0 (BW)" : "lbs"}
                            value={set.weight}
                            onChange={(event) => updateSet(exerciseIndex, setIndex, "weight", event.target.value)}
                          />

                          <input
                            className="input"
                            type="number"
                            placeholder={prev?.sets[setIndex] ? prev.sets[setIndex].reps.toString() : "reps"}
                            value={set.reps}
                            onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)}
                          />

                          <input
                            className="input set-notes-input"
                            type="text"
                            placeholder="e.g. RPE 8, drop set"
                            value={set.notes}
                            onChange={(event) => updateSet(exerciseIndex, setIndex, "notes", event.target.value)}
                          />

                          {/* 1-Click Rest Trigger */}
                          <button
                            type="button"
                            onClick={() => setActiveRestSeconds(90)}
                            className="btn-secondary"
                            style={{ padding: "6px 8px", fontSize: "11px", borderRadius: "6px" }}
                            title="Start 90s Rest Timer"
                          >
                            <Timer size={13} />
                          </button>

                          <button className="btn-ghost-danger" onClick={() => removeSet(exerciseIndex, setIndex)} title="Remove set">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button className="btn-secondary add-set-btn" onClick={() => addSet(exerciseIndex)} style={{ width: "fit-content", padding: "6px 12px", fontSize: "12px", marginTop: "8px" }}>
                    <Plus size={13} />
                    <span>Add Set</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Rest Timer Widget */}
          {activeRestSeconds !== null && (
            <RestTimer initialSeconds={activeRestSeconds} onClose={() => setActiveRestSeconds(null)} />
          )}

          {/* Action Row */}
          <div className="workout-action-row" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button className="btn-secondary" onClick={onSaveWorkoutPlan} disabled={savingPlan || savingWorkout} style={{ padding: "10px 18px", fontSize: "13px" }}>
              <BookmarkPlus size={15} />
              <span>{savingPlan ? "Saving Plan..." : "Save Workout Plan"}</span>
            </button>
            <button
              className="btn-primary complete-btn"
              onClick={() => {
                const summaryRes = generateWorkoutSummary(activeWorkout);
                setActiveWorkout((current) => {
                  if (!current) return current;
                  // If notes are empty or already an AI summary, populate with fresh AI summary
                  return {
                    ...current,
                    notes: current.notes?.trim() ? current.notes : summaryRes.summary,
                  };
                });
                setIsCompleting(true);
              }}
              disabled={savingWorkout || savingPlan}
              style={{ padding: "10px 20px", fontSize: "13px" }}
            >
              <CheckCircle2 size={15} />
              <span>{savingWorkout ? "Saving Workout..." : "Complete Workout"}</span>
            </button>
          </div>

          {/* Completion Modal */}
          {isCompleting && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
              <div style={{ background: "#ffffff", padding: "24px", borderRadius: "14px", width: "100%", maxWidth: "460px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>Finish Workout</h3>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Sparkles size={12} /> AI Summary
                  </span>
                </div>

                <label style={{ display: "block", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Session Notes &amp; Highlights</span>
                    <button
                      type="button"
                      onClick={() => {
                        const summaryRes = generateWorkoutSummary(activeWorkout);
                        setActiveWorkout((current) => current ? { ...current, notes: summaryRes.summary } : current);
                      }}
                      className="btn-ghost-primary"
                      style={{ fontSize: "11px", padding: "2px 6px", display: "inline-flex", alignItems: "center", gap: "3px" }}
                      title="Regenerate AI workout summary"
                    >
                      <Sparkles size={11} />
                      <span>Regenerate AI Summary</span>
                    </button>
                  </div>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="AI Summary of your workout..."
                    value={activeWorkout.notes}
                    onChange={(event) => setActiveWorkout((current) => current ? { ...current, notes: event.target.value } : current)}
                    style={{ width: "100%", padding: "10px", fontSize: "13px", lineHeight: "1.45" }}
                  />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button className="btn-secondary" onClick={() => setIsCompleting(false)}>Cancel</button>
                  <button className="btn-success" onClick={() => { setIsCompleting(false); onCompleteWorkout(); }}>
                    <CheckCircle2 size={14} />
                    <span>Save &amp; Complete</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Exercise Library Modal */}
      <ExerciseLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onSelectExercise={(name) => addExerciseWithName(name)}
      />

      {/* 3D Anatomy Muscle Guide Modal */}
      <AnatomyGuideModal
        isOpen={!!selectedAnatomyExercise}
        onClose={() => {
          setSelectedAnatomyExercise(null);
          setAnatomyChartData(null);
        }}
        exerciseName={selectedAnatomyExercise || ""}
        chartData={anatomyChartData}
        loading={loadingAnatomy}
      />
    </div>
  );
}

export default WorkoutBuilder;