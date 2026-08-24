"use client";

import React, { useState, useMemo } from "react";
import { Trash2, Calendar, Filter, RotateCcw, Copy, Check, MessageSquare } from "lucide-react";
import { WorkoutSession } from "../types";
import { getMuscleGroup } from "../utils/analytics";
import { isDefaultBodyweight } from "../utils/exerciseLibrary";

interface WorkoutHistoryProps {
  completedWorkouts: WorkoutSession[];
  loadingWorkouts: boolean;
  onDeleteWorkout: (id: string) => void;
  onRepeatWorkout?: (workout: WorkoutSession) => void;
  onOpenTextImport?: () => void;
}

const MUSCLE_GROUPS = ["ALL", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"];

export function WorkoutHistory({
  completedWorkouts,
  loadingWorkouts,
  onDeleteWorkout,
  onRepeatWorkout,
  onOpenTextImport,
}: WorkoutHistoryProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("ALL");
  const [selectedExercise, setSelectedExercise] = useState<string>("ALL");
  const [notesSearch, setNotesSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all unique exercises from the client's history
  const allExercises = useMemo(() => {
    const exerciseSet = new Set<string>();
    completedWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => exerciseSet.add(ex.name));
    });
    return Array.from(exerciseSet).sort((a, b) => a.localeCompare(b));
  }, [completedWorkouts]);

  // Filter exercises dropdown based on selected muscle group hierarchy
  const availableExercises = useMemo(() => {
    if (selectedMuscleGroup === "ALL") return allExercises;
    return allExercises.filter((exName) => getMuscleGroup(exName) === selectedMuscleGroup);
  }, [allExercises, selectedMuscleGroup]);

  // Reset selected exercise if it doesn't belong to the newly selected muscle group
  const handleMuscleGroupChange = (group: string) => {
    setSelectedMuscleGroup(group);
    if (group !== "ALL" && selectedExercise !== "ALL") {
      const isExInGroup = allExercises.find((e) => e === selectedExercise && getMuscleGroup(e) === group);
      if (!isExInGroup) setSelectedExercise("ALL");
    }
  };

  // Quick Date Presets
  const applyDatePreset = (days: number | null) => {
    if (days === null) {
      setStartDate("");
      setEndDate("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // Copy entire day's workout to clipboard
  const copyWorkoutToClipboard = (workout: WorkoutSession) => {
    const dateStr = workout.completedAt
      ? new Date(workout.completedAt).toLocaleDateString(undefined, { dateStyle: "full" })
      : "Workout";

    let text = `💪 Workout - ${dateStr}\n`;
    if (workout.notes) {
      text += `Notes: ${workout.notes}\n`;
    }
    text += `\n`;

    workout.exercises.forEach((ex) => {
      const mg = getMuscleGroup(ex.name);
      text += `• ${ex.name} (${mg}):\n`;
      ex.sets.forEach((setEntry, i) => {
        text += `   Set ${i + 1}: ${setEntry.weight} lbs × ${setEntry.reps} reps${setEntry.notes ? ` (${setEntry.notes})` : ""}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text.trim());
    setCopiedId(workout.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter workouts by date range, muscle group/exercise hierarchy, and multi-field search; SORTED BY DATE DESCENDING
  const filteredWorkouts = useMemo(() => {
    const query = notesSearch.trim().toLowerCase();

    return completedWorkouts
      .map((workout) => {
        const workoutDate = new Date(workout.completedAt || workout.startedAt || workout.createdAt);

        // Date Range Check
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (workoutDate < start) return null;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (workoutDate > end) return null;
        }

        // Multi-field Search Check (checks session notes, exercise name, and set notes)
        if (query) {
          const sessionNotesMatch = workout.notes?.toLowerCase().includes(query);
          const exerciseNameMatch = workout.exercises.some((ex) =>
            ex.name.toLowerCase().includes(query)
          );
          const setNotesMatch = workout.exercises.some((ex) =>
            ex.sets.some((s) => s.notes?.toLowerCase().includes(query))
          );
          if (!sessionNotesMatch && !exerciseNameMatch && !setNotesMatch) return null;
        }

        // Exercise & Muscle Group Hierarchy Check
        const matchingExercises = workout.exercises.filter((exercise) => {
          const mg = getMuscleGroup(exercise.name);
          if (selectedMuscleGroup !== "ALL" && mg !== selectedMuscleGroup) {
            return false;
          }
          if (selectedExercise !== "ALL" && exercise.name !== selectedExercise) {
            return false;
          }
          if (query && !workout.notes?.toLowerCase().includes(query)) {
            const exMatch = exercise.name.toLowerCase().includes(query);
            const setMatch = exercise.sets.some((s) => s.notes?.toLowerCase().includes(query));
            if (!exMatch && !setMatch) return false;
          }
          return true;
        });

        if (workout.exercises.length === 0 && selectedMuscleGroup === "ALL" && selectedExercise === "ALL") {
          return {
            ...workout,
            exercises: [],
          };
        }
        if (matchingExercises.length === 0) return null;

        return {
          ...workout,
          exercises: matchingExercises,
        };
      })
      .filter((w): w is WorkoutSession => w !== null)
      .sort((a, b) => {
        const timeA = new Date(a.completedAt || a.startedAt || a.createdAt).getTime();
        const timeB = new Date(b.completedAt || b.startedAt || b.createdAt).getTime();
        return timeB - timeA; // Ensure strictly descending order
      });
  }, [completedWorkouts, startDate, endDate, selectedMuscleGroup, selectedExercise, notesSearch]);

  const totalFilteredSets = useMemo(() => {
    return filteredWorkouts.reduce((sum, w) => sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0), 0);
  }, [filteredWorkouts]);

  const hasActiveFilters = startDate || endDate || selectedMuscleGroup !== "ALL" || selectedExercise !== "ALL" || notesSearch.trim() !== "";

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedMuscleGroup("ALL");
    setSelectedExercise("ALL");
    setNotesSearch("");
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 className="section-title" style={{ margin: 0 }}>Workout History</h3>
          {onOpenTextImport && (
            <button
              type="button"
              onClick={onOpenTextImport}
              className="btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#2563eb", borderColor: "#bfdbfe", background: "#eff6ff", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
              title="Backfill past workouts from Android SMS or text messages"
            >
              <MessageSquare size={13} />
              <span>Import from Text Messages</span>
            </button>
          )}
        </div>

        {/* Quick Date Presets */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "4px" }}>
          {[
            { label: "All Time", days: null },
            { label: "30 Days", days: 30 },
            { label: "90 Days", days: 90 },
            { label: "6 Months", days: 180 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyDatePreset(preset.days)}
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 500,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: (!startDate && !endDate && preset.days === null) ? "#ffffff" : "transparent",
                color: "#0f172a",
                boxShadow: (!startDate && !endDate && preset.days === null) ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
          <Filter size={14} style={{ color: "#2563eb" }} /> Filter Workouts
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
          {/* Start Date */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", display: "block", marginBottom: "3px" }}>Start Date</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", fontSize: "12px", padding: "6px 8px" }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", display: "block", marginBottom: "3px" }}>End Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: "100%", fontSize: "12px", padding: "6px 8px" }}
            />
          </div>

          {/* Muscle Group Hierarchy Filter */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", display: "block", marginBottom: "3px" }}>Muscle Group</label>
            <select
              className="input"
              value={selectedMuscleGroup}
              onChange={(e) => handleMuscleGroupChange(e.target.value)}
              style={{ width: "100%", fontSize: "12px", padding: "6px 8px" }}
            >
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {mg === "ALL" ? "All Muscle Groups" : mg}
                </option>
              ))}
            </select>
          </div>

          {/* Exercise Hierarchy Filter */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", display: "block", marginBottom: "3px" }}>Specific Exercise</label>
            <select
              className="input"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              style={{ width: "100%", fontSize: "12px", padding: "6px 8px" }}
            >
              <option value="ALL">All Exercises</option>
              {availableExercises.map((exName) => (
                <option key={exName} value={exName}>
                  {exName}
                </option>
              ))}
            </select>
          </div>

          {/* Notes Search Filter */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", display: "block", marginBottom: "3px" }}>Search Notes</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. felt strong, smooth..."
              value={notesSearch}
              onChange={(e) => setNotesSearch(e.target.value)}
              style={{ width: "100%", fontSize: "12px", padding: "6px 8px" }}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px dashed #cbd5e1" }}>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Showing <b>{filteredWorkouts.length}</b> session{filteredWorkouts.length !== 1 ? "s" : ""} ({totalFilteredSets} sets)
            </span>
            <button
              onClick={clearFilters}
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: 500 }}
            >
              <RotateCcw size={12} /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {loadingWorkouts && <div className="empty-state">Loading history...</div>}

      {!loadingWorkouts && !filteredWorkouts.length && (
        <div className="empty-state">
          {hasActiveFilters ? "No workouts found matching the selected dates, exercises, or notes." : "No workouts logged yet"}
        </div>
      )}

      <div className="history-list">
        {filteredWorkouts.map((workout) => (
          <div key={workout.id} className="history-card">
            <div className="history-card-header">
              <div>
                <div className="history-date">
                  <Calendar size={13} style={{ display: "inline", marginRight: "5px", color: "#2563eb" }} />
                  {workout.completedAt ? new Date(workout.completedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-"}
                </div>
                <div className="history-meta" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                  <span>{workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""} included</span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      background: workout.loggedByRole === "CLIENT" ? "#eff6ff" : "#f8fafc",
                      color: workout.loggedByRole === "CLIENT" ? "#1d4ed8" : "#475569",
                      border: `1px solid ${workout.loggedByRole === "CLIENT" ? "#bfdbfe" : "#e2e8f0"}`,
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {workout.loggedByRole === "CLIENT"
                      ? `👤 Logged by Client${workout.loggedByName ? ` (${workout.loggedByName})` : ""}`
                      : `🏋️ Logged by Coach${workout.loggedByName ? ` (${workout.loggedByName})` : ""}`}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* Repeat Workout Button */}
                {onRepeatWorkout && (
                  <button
                    onClick={() => onRepeatWorkout(workout)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    title="Load this workout into the builder with pre-filled weights"
                  >
                    <RotateCcw size={12} />
                    <span>Repeat</span>
                  </button>
                )}

                {/* Copy Entire Day's Workout Button */}
                <button
                  onClick={() => copyWorkoutToClipboard(workout)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: copiedId === workout.id ? "#dcfce7" : "#f1f5f9",
                    color: copiedId === workout.id ? "#16a34a" : "#475569",
                    border: "1px solid",
                    borderColor: copiedId === workout.id ? "#bbf7d0" : "#cbd5e1",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Copy full workout to clipboard"
                >
                  {copiedId === workout.id ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedId === workout.id ? "Copied!" : "Copy Session"}</span>
                </button>

                {!workout.deletedAt && (
                  <button className="btn-ghost-danger" onClick={() => onDeleteWorkout(workout.id)} title="Delete workout">
                    <Trash2 size={13} />
                  </button>
                )}
                {workout.deletedAt && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "2px 6px", borderRadius: "4px" }}>
                    🗑️ DELETED
                  </span>
                )}
              </div>
            </div>

            {workout.deletedAt && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#991b1b",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <Trash2 size={13} style={{ color: "#dc2626", flexShrink: 0 }} />
                <span>
                  Workout deleted by <b>{workout.deletedByName || "User"}</b> on{" "}
                  {new Date(workout.deletedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
            )}

            {workout.notes && <div className="history-notes">{workout.notes}</div>}

            {workout.exercises.map((exercise) => {
              const mg = getMuscleGroup(exercise.name);
              const isBW = exercise.isBodyweight || exercise.category === "BODYWEIGHT" || isDefaultBodyweight(exercise.name);

              return (
                <div key={exercise.id} className="history-exercise">
                  <div className="history-exercise-name" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{exercise.name}</span>
                      {isBW && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            background: "#f0fdf4",
                            color: "#166534",
                            border: "1px solid #bbf7d0",
                            padding: "1px 5px",
                            borderRadius: "4px",
                          }}
                          title="Bodyweight / Body Resistance Exercise"
                        >
                          Bodyweight
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 500, background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "4px" }}>
                      {mg}
                    </span>
                  </div>
                  <div className="history-set-list">
                    {exercise.sets.map((setEntry) => (
                      <div key={setEntry.id} className="history-set-row">
                        <span>Set {setEntry.order + 1}</span>
                        <span>
                          {exercise.category === "STRETCHING" || exercise.name.toLowerCase().includes("stretch") || exercise.name.toLowerCase().includes("warm") || exercise.name.toLowerCase().includes("pose") || exercise.name.toLowerCase().includes("roll") ? (
                            <><b>{setEntry.reps}s</b> hold / duration</>
                          ) : isBW ? (
                            setEntry.weight > 0 ? (
                              <><b>BW + {setEntry.weight} lbs</b> × {setEntry.reps} reps</>
                            ) : (
                              <><b>BW</b> × {setEntry.reps} reps</>
                            )
                          ) : (
                            <><b>{setEntry.weight} lbs</b> × {setEntry.reps} reps</>
                          )}
                        </span>
                        <span>{setEntry.notes || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}