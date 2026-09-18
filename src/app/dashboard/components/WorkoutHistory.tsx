"use client";

import React, { useState, useMemo } from "react";
import {
  Trash2, Calendar, Filter, RotateCcw, Copy, Check, MessageSquare, CalendarPlus, Edit3,
  Sparkles, AlertTriangle, Info, ChevronDown, ChevronUp, Dumbbell, TrendingUp, Award
} from "lucide-react";
import { WorkoutSession } from "../types";
import { getMuscleGroup, computeAnalytics, getWorkoutExerciseMilestones, calculate1RM } from "../utils/analytics";
import { isDefaultBodyweight } from "../utils/exerciseLibrary";

interface WorkoutHistoryProps {
  completedWorkouts: WorkoutSession[];
  loadingWorkouts: boolean;
  onDeleteWorkout: (id: string) => void;
  onRepeatWorkout?: (workout: WorkoutSession) => void;
  onAssignWorkout?: (workout: WorkoutSession) => void;
  onEditWorkout?: (workout: WorkoutSession) => void;
  onOpenTextImport?: () => void;
  clientName?: string;
  isSelfProfile?: boolean;
  onSwitchToSelfProfile?: () => void;
}

const MUSCLE_GROUPS = ["ALL", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"];

export function WorkoutHistory({
  completedWorkouts,
  loadingWorkouts,
  onDeleteWorkout,
  onRepeatWorkout,
  onAssignWorkout,
  onEditWorkout,
  onOpenTextImport,
  clientName,
  isSelfProfile = false,
  onSwitchToSelfProfile,
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

  const milestonesMap = useMemo(() => getWorkoutExerciseMilestones(completedWorkouts), [completedWorkouts]);

  const [collapsedWorkoutIds, setCollapsedWorkoutIds] = useState<Set<string>>(new Set());
  const [collapsedExerciseIds, setCollapsedExerciseIds] = useState<Set<string>>(new Set());

  const toggleWorkoutCollapse = (id: string) => {
    setCollapsedWorkoutIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExerciseCollapse = (workoutId: string, exerciseId: string) => {
    const key = `${workoutId}-${exerciseId}`;
    setCollapsedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const areAllWorkoutsCollapsed = useMemo(() => {
    if (filteredWorkouts.length === 0) return false;
    return filteredWorkouts.every((w) => collapsedWorkoutIds.has(w.id));
  }, [filteredWorkouts, collapsedWorkoutIds]);

  const toggleAllWorkouts = () => {
    if (areAllWorkoutsCollapsed) {
      setCollapsedWorkoutIds(new Set());
    } else {
      setCollapsedWorkoutIds(new Set(filteredWorkouts.map((w) => w.id)));
    }
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

      {/* Profile Context Banner */}
      {clientName && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: isSelfProfile ? "#eff6ff" : "#f8fafc",
            border: isSelfProfile ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: 700, color: isSelfProfile ? "#1d4ed8" : "#334155" }}>
              {isSelfProfile ? "👤 Viewing Your Personal Workout History" : `📋 Viewing History for ${clientName}`}
            </span>
            <span style={{ color: "#64748b" }}>({completedWorkouts.length} session{completedWorkouts.length !== 1 ? "s" : ""})</span>
          </div>

          {!isSelfProfile && onSwitchToSelfProfile && (
            <button
              type="button"
              onClick={onSwitchToSelfProfile}
              style={{
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Switch to My Workouts →
            </button>
          )}
        </div>
      )}

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
        <div className="empty-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "28px 16px" }}>
          <span>
            {hasActiveFilters
              ? "No workouts found matching the selected dates, exercises, or notes."
              : isSelfProfile
              ? "No personal workouts logged yet. Start a session in the Workout Logger to build your training history!"
              : `No workouts logged yet for ${clientName || "this client"}.`}
          </span>
          {!hasActiveFilters && !isSelfProfile && onSwitchToSelfProfile && (
            <button
              type="button"
              onClick={onSwitchToSelfProfile}
              className="btn-primary"
              style={{ fontSize: "12px", padding: "6px 14px", marginTop: "4px" }}
            >
              View My Personal Workouts
            </button>
          )}
        </div>
      )}

      {!loadingWorkouts && filteredWorkouts.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px", marginBottom: "2px" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
            {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? "s" : ""} logged
          </span>
          <button
            type="button"
            onClick={toggleAllWorkouts}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#2563eb",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "4px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title={areAllWorkoutsCollapsed ? "Expand all workouts" : "Collapse all workouts"}
          >
            {areAllWorkoutsCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            <span>{areAllWorkoutsCollapsed ? "Expand All Workouts" : "Collapse All Workouts"}</span>
          </button>
        </div>
      )}

      <div className="history-list">
        {filteredWorkouts.map((workout) => {
          const isWorkoutCollapsed = collapsedWorkoutIds.has(workout.id);
          const totalWorkoutVolume = workout.exercises.reduce(
            (sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + s.weight * s.reps, 0),
            0
          );
          const totalWorkoutSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

          return (
            <div key={workout.id} className="history-card">
              {/* Header row with Date, Status, and Collapse Toggle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: isWorkoutCollapsed ? "6px" : "8px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => toggleWorkoutCollapse(workout.id)}
                title={isWorkoutCollapsed ? "Click to expand workout" : "Click to collapse workout"}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <Calendar size={14} style={{ color: "#2563eb", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                      {workout.completedAt
                        ? new Date(workout.completedAt).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                    {workout.completedAt && (
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                        · {new Date(workout.completedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                  </div>

                  <div className="history-meta" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                    <span>{workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""} ({totalWorkoutSets} sets)</span>
                    {totalWorkoutVolume > 0 && (
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                        · {totalWorkoutVolume.toLocaleString()} lbs volume
                      </span>
                    )}
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

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {workout.deletedAt ? (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "3px 7px", borderRadius: "6px", display: "inline-block" }}>
                      🗑️ DELETED
                    </span>
                  ) : (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 7px", borderRadius: "6px", display: "inline-block" }}>
                      ✓ Finished
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWorkoutCollapse(workout.id);
                    }}
                    aria-label={isWorkoutCollapsed ? "Expand workout" : "Collapse workout"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isWorkoutCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                  </button>
                </div>
              </div>

              {isWorkoutCollapsed ? (
                /* Collapsed Workout Summary & Toolbar */
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                    {workout.exercises.map((ex) => (
                      <span
                        key={ex.id}
                        style={{
                          fontSize: "11px",
                          background: "#f8fafc",
                          color: "#334155",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                          fontWeight: 600,
                        }}
                      >
                        {ex.name} <span style={{ color: "#64748b", fontWeight: 500 }}>({ex.sets.length})</span>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", background: "#f8fafc", padding: "5px 8px", borderRadius: "6px", border: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {onEditWorkout && !workout.deletedAt && (
                        <button
                          onClick={() => onEditWorkout(workout)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#ffffff",
                            color: "#0f172a",
                            border: "1px solid #cbd5e1",
                            padding: "3px 7px",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                          title="Edit exercises, weights, sets, or date for this workout"
                        >
                          <Edit3 size={11} style={{ color: "#2563eb" }} />
                          <span>Edit</span>
                        </button>
                      )}

                      {onRepeatWorkout && (
                        <button
                          onClick={() => onRepeatWorkout(workout)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            padding: "3px 7px",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                          title="Load this workout into the builder"
                        >
                          <RotateCcw size={11} />
                          <span>Repeat</span>
                        </button>
                      )}

                      {onAssignWorkout && !workout.deletedAt && (
                        <button
                          className="btn-primary"
                          onClick={() => onAssignWorkout(workout)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 7px",
                            borderRadius: "5px",
                            cursor: "pointer",
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                          }}
                          title="Assign or schedule this workout to a client"
                        >
                          <CalendarPlus size={11} />
                          <span>Assign</span>
                        </button>
                      )}

                      <button
                        onClick={() => copyWorkoutToClipboard(workout)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: copiedId === workout.id ? "#dcfce7" : "#ffffff",
                          color: copiedId === workout.id ? "#16a34a" : "#475569",
                          border: "1px solid",
                          borderColor: copiedId === workout.id ? "#bbf7d0" : "#cbd5e1",
                          padding: "3px 7px",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                        title="Copy full workout to clipboard"
                      >
                        {copiedId === workout.id ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedId === workout.id ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>

                    {!workout.deletedAt && (
                      <button className="btn-ghost-danger" onClick={() => onDeleteWorkout(workout.id)} title="Delete workout" style={{ padding: "3px 6px", borderRadius: "5px", marginLeft: "auto" }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Expanded Workout Details */
                <>
                  {/* Actions Toolbar - Never overflows */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", background: "#f8fafc", padding: "6px 10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid #f1f5f9", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {/* Edit Workout Button */}
                      {onEditWorkout && !workout.deletedAt && (
                        <button
                          onClick={() => onEditWorkout(workout)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#ffffff",
                            color: "#0f172a",
                            border: "1px solid #cbd5e1",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          title="Edit exercises, weights, sets, or date for this workout"
                        >
                          <Edit3 size={12} style={{ color: "#2563eb" }} />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Repeat Workout Button */}
                      {onRepeatWorkout && (
                        <button
                          onClick={() => onRepeatWorkout(workout)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#ffffff",
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

                      {/* Assign / Schedule Routine for Client */}
                      {onAssignWorkout && !workout.deletedAt && (
                        <button
                          className="btn-primary"
                          onClick={() => onAssignWorkout(workout)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            background: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                          }}
                          title="Assign or schedule this past workout to a client"
                        >
                          <CalendarPlus size={12} />
                          <span>Assign to Client</span>
                        </button>
                      )}

                      {/* Copy Entire Day's Workout Button */}
                      <button
                        onClick={() => copyWorkoutToClipboard(workout)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: copiedId === workout.id ? "#dcfce7" : "#ffffff",
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
                    </div>

                    {!workout.deletedAt && (
                      <button className="btn-ghost-danger" onClick={() => onDeleteWorkout(workout.id)} title="Delete workout" style={{ padding: "4px 8px", borderRadius: "6px", marginLeft: "auto" }}>
                        <Trash2 size={13} />
                      </button>
                    )}
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
                    const milestone = milestonesMap.get(workout.id)?.get(exercise.name.trim());

                    const exVolume = exercise.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
                    const topWeight = Math.max(...exercise.sets.map((s) => s.weight), 0);
                    const topReps = Math.max(...exercise.sets.map((s) => s.reps), 0);
                    const top1RM = exercise.sets.reduce((max, s) => Math.max(max, calculate1RM(s.weight, s.reps)), 0);

                    const isExCollapsed = collapsedExerciseIds.has(`${workout.id}-${exercise.id}`);

                    return (
                      <div
                        key={exercise.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: isExCollapsed ? "10px 14px" : "14px 16px",
                          marginTop: "12px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Exercise Header - Clickable with Chevron */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: isExCollapsed ? "0" : "12px",
                            borderBottom: isExCollapsed ? "none" : "1px solid #f1f5f9",
                            paddingBottom: isExCollapsed ? "0" : "8px",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                          onClick={() => toggleExerciseCollapse(workout.id, exercise.id)}
                          title={isExCollapsed ? "Click to expand exercise" : "Click to collapse exercise"}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <Dumbbell size={16} style={{ color: "#2563eb" }} />
                            <span style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{exercise.name}</span>
                            {isBW && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  background: "#f0fdf4",
                                  color: "#166534",
                                  border: "1px solid #bbf7d0",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                }}
                                title="Bodyweight / Resistance Exercise"
                              >
                                Bodyweight
                              </span>
                            )}
                            {(exercise as any).supersetGroup && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  background: "#f5f3ff",
                                  color: "#7c3aed",
                                  border: "1px solid #ddd6fe",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                Superset {(exercise as any).supersetGroup}
                              </span>
                            )}
                            {(exercise as any).restSeconds && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  background: "#f8fafc",
                                  color: "#64748b",
                                  border: "1px solid #e2e8f0",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                ⏱️ {(exercise as any).restSeconds}s rest
                              </span>
                            )}
                            {isExCollapsed && (
                              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginLeft: "4px" }}>
                                · {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
                                {topWeight > 0 ? ` · Top: ${topWeight} lbs${topReps > 0 ? ` × ${topReps}` : ""}` : ""}
                                {exVolume > 0 ? ` · Vol: ${exVolume.toLocaleString()} lbs` : ""}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: "6px" }}>
                              {mg}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExerciseCollapse(workout.id, exercise.id);
                              }}
                              aria-label={isExCollapsed ? "Expand exercise" : "Collapse exercise"}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "24px",
                                height: "24px",
                                borderRadius: "4px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                                color: "#475569",
                                cursor: "pointer",
                              }}
                            >
                              {isExCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                            </button>
                          </div>
                        </div>

                        {!isExCollapsed && (
                          /* 2-Column Responsive Layout: Sets on Left, AI Results on Right */
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", alignItems: "stretch" }}>
                            {/* Left Column: Set List with Inline PR Badges */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {exercise.sets.map((setEntry) => {
                                const isPRSet = milestone && setEntry.weight === milestone.currentWeight;

                                return (
                                  <div
                                    key={setEntry.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      background: isPRSet ? "#fefce8" : "#f8fafc",
                                      border: `1px solid ${isPRSet ? "#fde047" : "#e2e8f0"}`,
                                      padding: "7px 12px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span style={{ fontWeight: 700, color: "#64748b", width: "42px" }}>
                                        Set {setEntry.order + 1}
                                      </span>
                                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                        {isBW ? (
                                          setEntry.weight > 0 ? (
                                            <>
                                              <b>BW + {setEntry.weight} lbs</b> × <b>{setEntry.reps} reps</b>
                                            </>
                                          ) : (
                                            <>
                                              <b>Bodyweight</b> × <b>{setEntry.reps} reps</b>
                                            </>
                                          )
                                        ) : (
                                          <>
                                            <b>{setEntry.weight} lbs</b> × <b>{setEntry.reps} reps</b>
                                          </>
                                        )}
                                      </span>
                                      {setEntry.notes && (
                                        <span style={{ color: "#64748b", fontStyle: "italic", fontSize: "11px" }}>
                                          &ldquo;{setEntry.notes}&rdquo;
                                        </span>
                                      )}
                                    </div>

                                    {/* Inline Personal Record Badge */}
                                    {isPRSet && (
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "3px",
                                          fontSize: "10px",
                                          fontWeight: 800,
                                          background: "#fef3c7",
                                          color: "#92400e",
                                          border: "1px solid #fde68a",
                                          padding: "2px 7px",
                                          borderRadius: "5px",
                                          letterSpacing: "0.02em",
                                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                        }}
                                        title={`New Personal Record! ${milestone.badgeText}${milestone.diffWeight ? ` (+${milestone.diffWeight} lbs)` : ""}`}
                                      >
                                        <Award size={11} style={{ color: "#ca8a04" }} />
                                        <span>{milestone.badgeText}</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right Column: AI Performance Analysis & Smart Coach Cues */}
                            <div
                              style={{
                                background: milestone ? "linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)" : "#f8fafc",
                                border: `1px solid ${milestone ? "#fef08a" : "#e2e8f0"}`,
                                borderRadius: "8px",
                                padding: "10px 14px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <Sparkles size={14} style={{ color: milestone ? "#d97706" : "#2563eb" }} />
                                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: milestone ? "#92400e" : "#1e40af" }}>
                                    AI Performance Analysis
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
                                  <span>Vol: {exVolume.toLocaleString()} lbs</span>
                                  {top1RM > 0 && <span>· Est. 1RM: {top1RM} lbs</span>}
                                </div>
                              </div>

                              {/* Main Insight Message */}
                              <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>
                                {milestone
                                  ? milestone.celebrationText
                                  : `Successfully completed ${exercise.sets.length} working sets at ${topWeight} lbs (${topReps} peak reps). Total volume load: ${exVolume.toLocaleString()} lbs.`}
                              </p>

                              {/* AI Coach Cue */}
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: milestone ? "#b45309" : "#334155",
                                  fontWeight: 500,
                                  background: milestone ? "rgba(255,255,255,0.7)" : "#ffffff",
                                  border: `1px solid ${milestone ? "rgba(253, 230, 138, 0.5)" : "#e2e8f0"}`,
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                }}
                              >
                                💡 <b>Coach Cue:</b>{" "}
                                {milestone
                                  ? `Progressive overload confirmed on ${exercise.name}. Linear capacity is increasing—maintain form and cadence.`
                                  : `Solid load execution on ${exercise.name}. Aim to add 1 rep or +2.5–5 lbs next session.`}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}