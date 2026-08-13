"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2, Dumbbell, History, Award, Timer, Copy, Sparkles } from "lucide-react";
import { DraftWorkout, DraftSet, WorkoutSession } from "../types";
import { RestTimer } from "./RestTimer";
import { ExerciseLibraryModal } from "./ExerciseLibraryModal";
import { EXERCISE_LIBRARY } from "../utils/exerciseLibrary";

interface WorkoutBuilderProps {
  activeWorkout: DraftWorkout | null;
  setActiveWorkout: React.Dispatch<React.SetStateAction<DraftWorkout | null>>;
  plannedWorkouts: WorkoutSession[];
  historyWorkouts?: WorkoutSession[];
  exercisePicker: string;
  setExercisePicker: (val: string) => void;
  savingWorkout: boolean;
  savingPlan: boolean;
  onStartWorkout: () => void;
  onBeginPlannedWorkout: (workout: WorkoutSession) => void;
  onSaveWorkoutPlan: () => void;
  onCompleteWorkout: () => void;
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
  onStartWorkout,
  onBeginPlannedWorkout,
  onSaveWorkoutPlan,
  onCompleteWorkout,
}: WorkoutBuilderProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);

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
    setActiveWorkout((current) => {
      const prevData = previousPerformanceMap[name.trim().toLowerCase()];
      const initialSets = prevData && prevData.sets.length > 0
        ? prevData.sets.map((ps) => ({ weight: ps.weight.toString(), reps: ps.reps.toString(), notes: "" }))
        : [{ weight: "", reps: "", notes: "" }];

      if (!current) {
        return {
          startedAt: new Date().toISOString(),
          notes: "",
          exercises: [{ name: name.trim(), sets: initialSets }],
        };
      }
      return {
        ...current,
        exercises: [...current.exercises, { name: name.trim(), sets: initialSets }],
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
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === exerciseIndex ? { ...exercise, name: value } : exercise,
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
                  <button className="btn-primary" onClick={() => onBeginPlannedWorkout(plannedWorkout)}>
                    {plannedWorkout.status === "IN_PROGRESS" ? "Resume Workout" : "Begin Workout"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeWorkout && (
        <>
          <div className="builder-top-row">
            <div className="workout-meta">
              <span>Started: {new Date(activeWorkout.startedAt).toLocaleTimeString()}</span>
              <span>Exercises: {activeWorkout.exercises.length}</span>
              <span>Sets: {totalDraftSets}</span>
            </div>
            <button className="btn-ghost-danger" onClick={() => setActiveWorkout(null)}>Discard Workout</button>
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
            <button className="btn-primary" onClick={() => addExerciseWithName(exercisePicker)}>Add</button>
            <button
              className="btn-secondary"
              onClick={() => setShowLibraryModal(true)}
              title="Open full exercise database"
              style={{ padding: "8px 12px" }}
            >
              <Dumbbell size={15} />
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
                  <div className="exercise-card-header">
                    <input
                      className="input"
                      list="exercise-options"
                      value={exercise.name}
                      onChange={(event) => updateExerciseName(exerciseIndex, event.target.value)}
                      style={{ fontWeight: 700, fontSize: "14px" }}
                    />
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

                  {/* Sets Rows */}
                  <div className="set-list">
                    {exercise.sets.map((setEntry, setIndex) => {
                      const numWeight = parseFloat(setEntry.weight) || 0;
                      const numReps = parseInt(setEntry.reps) || 0;
                      const est1RM = numReps > 1 ? Math.round(numWeight * (36 / (37 - Math.min(numReps, 36)))) : numWeight;
                      const isNewPR = est1RM > 0 && allTimePR > 0 && est1RM > allTimePR;

                      return (
                        <div className="set-row" key={`${exerciseIndex}-${setIndex}`} style={{ position: "relative" }}>
                          <div className="set-index" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>Set {setIndex + 1}</span>
                            {isNewPR && (
                              <span
                                style={{
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "2px",
                                }}
                                title={`New 1RM PR! Est: ${est1RM} lbs`}
                              >
                                <Award size={10} /> PR
                              </span>
                            )}
                          </div>

                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Lbs"
                            value={setEntry.weight}
                            onChange={(event) => updateSet(exerciseIndex, setIndex, "weight", event.target.value)}
                          />
                          <input
                            className="input"
                            type="number"
                            min="1"
                            placeholder="Reps"
                            value={setEntry.reps}
                            onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)}
                          />
                          <input
                            className="input"
                            placeholder="Notes (RPE, tempo)"
                            value={setEntry.notes}
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

                  <button className="btn-icon add-set-btn" onClick={() => addSet(exerciseIndex)}>
                    <Plus size={14} />
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
          <div className="workout-action-row">
            <button className="btn-icon" onClick={onSaveWorkoutPlan} disabled={savingPlan || savingWorkout}>
              <span>{savingPlan ? "Saving Plan..." : "Save Workout Plan"}</span>
            </button>
            <button className="btn-primary complete-btn" onClick={() => setIsCompleting(true)} disabled={savingWorkout || savingPlan}>
              {savingWorkout ? "Saving Workout..." : "Complete Workout"}
            </button>
          </div>

          {/* Completion Modal */}
          {isCompleting && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "#0f172a" }}>Finish Workout</h3>
                <label style={{ display: "block", marginBottom: "20px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "8px", display: "block" }}>Workout Notes (Optional)</span>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="How did this session feel?"
                    value={activeWorkout.notes}
                    onChange={(event) => setActiveWorkout((current) => current ? { ...current, notes: event.target.value } : current)}
                    style={{ width: "100%", padding: "10px", fontSize: "14px" }}
                  />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button className="btn-ghost-danger" onClick={() => setIsCompleting(false)}>Cancel</button>
                  <button className="btn-primary" onClick={() => { setIsCompleting(false); onCompleteWorkout(); }}>Save &amp; Complete</button>
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
    </div>
  );
}

export default WorkoutBuilder;