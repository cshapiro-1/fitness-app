"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DraftWorkout, DraftSet, WorkoutSession } from "../types";
import { EXERCISE_OPTIONS } from "../constants";
import { RestTimer } from "./RestTimer";

interface WorkoutBuilderProps {
  activeWorkout: DraftWorkout | null;
  setActiveWorkout: React.Dispatch<React.SetStateAction<DraftWorkout | null>>;
  plannedWorkouts: WorkoutSession[];
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
  const totalDraftSets = useMemo(() => {
    if (!activeWorkout) return 0;
    return activeWorkout.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);
  }, [activeWorkout]);

  const addExerciseToWorkout = () => {
    if (!activeWorkout || !exercisePicker.trim()) return;
    setActiveWorkout((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: [...current.exercises, { name: exercisePicker.trim(), sets: [{ weight: "", reps: "", notes: "" }] }],
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
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === exerciseIndex
            ? { ...exercise, sets: [...exercise.sets, { weight: "", reps: "", notes: "" }] }
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

  return (
    <div className="card workout-builder-card">
      <h3 className="section-title">Workout Builder</h3>

      {!activeWorkout && (
        <div className="builder-empty">
          <p>Build a new workout or begin a saved workout plan.</p>
          <button className="btn-primary" onClick={onStartWorkout}>Create New Workout</button>
          {!!plannedWorkouts.length && (
            <div className="planned-list">
              <h4 className="planned-list-title">Planned Workouts</h4>
              {plannedWorkouts.map((plannedWorkout) => (
                <div key={plannedWorkout.id} className="planned-row">
                  <div>
                    <div className="planned-row-title">{plannedWorkout.status === "IN_PROGRESS" ? "In Progress" : "Planned"} — {plannedWorkout.exercises.length} exercises</div>
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

          

          <div className="exercise-picker">
            <input
              className="input"
              list="exercise-options"
              placeholder="Choose or type an exercise"
              value={exercisePicker}
              onChange={(event) => setExercisePicker(event.target.value)}
            />
            <datalist id="exercise-options">
              {EXERCISE_OPTIONS.map((exerciseName) => (
                <option key={exerciseName} value={exerciseName} />
              ))}
            </datalist>
            <button className="btn-primary" onClick={addExerciseToWorkout}>Add Exercise</button>
          </div>

          <div className="exercise-list">
            {!activeWorkout.exercises.length && <div className="empty-state">Add your first exercise to begin.</div>}
            {activeWorkout.exercises.map((exercise, exerciseIndex) => (
              <div className="exercise-card" key={`${exercise.name}-${exerciseIndex}`}>
                <div className="exercise-card-header">
                  <input
                    className="input"
                    list="exercise-options"
                    value={exercise.name}
                    onChange={(event) => updateExerciseName(exerciseIndex, event.target.value)}
                  />
                  <button className="btn-ghost-danger" onClick={() => removeExercise(exerciseIndex)} title="Remove exercise">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="set-list">
                  {exercise.sets.map((setEntry, setIndex) => (
                    <div className="set-row" key={`${exerciseIndex}-${setIndex}`}>
                      <div className="set-index">Set {setIndex + 1}</div>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Weight"
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
                        placeholder="Notes"
                        value={setEntry.notes}
                        onChange={(event) => updateSet(exerciseIndex, setIndex, "notes", event.target.value)}
                      />
                      <button className="btn-ghost-danger" onClick={() => removeSet(exerciseIndex, setIndex)} title="Remove set">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="btn-icon add-set-btn" onClick={() => addSet(exerciseIndex)}>
                  <Plus size={14} />
                  <span>Add Set</span>
                </button>
              </div>
            ))}
          </div>

          <RestTimer />

          <div className="workout-action-row">
            <button className="btn-icon" onClick={onSaveWorkoutPlan} disabled={savingPlan || savingWorkout}>
              <span>{savingPlan ? "Saving Plan..." : "Save Workout Plan"}</span>
            </button>
            <button className="btn-primary complete-btn" onClick={() => setIsCompleting(true)} disabled={savingWorkout || savingPlan}>
              {savingWorkout ? "Saving Workout..." : "Complete Workout"}
            </button>
          </div>
        
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
         <button className="btn-primary" onClick={() => { setIsCompleting(false); onCompleteWorkout(); }}>Save & Complete</button>
        </div>
       </div>
      </div>
     )}

    </>
      )}
    </div>
  );
}