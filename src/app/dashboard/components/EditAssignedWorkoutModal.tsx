"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Dumbbell, Save, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { isDefaultBodyweight } from "../utils/exerciseLibrary";
import { ExercisePickerDropdown } from "./ExercisePickerDropdown";

export interface EditAssignedWorkoutModalProps {
  isOpen: boolean;
  workout: any | null;
  onClose: () => void;
  onSaved: (updatedWorkout: any) => void;
}

export function EditAssignedWorkoutModal({
  isOpen,
  workout,
  onClose,
  onSaved,
}: EditAssignedWorkoutModalProps) {
  const [sessionDate, setSessionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = workout && (
    (workout.status || "").toUpperCase() === "COMPLETED" ||
    (!workout.status && (workout.completedAt || (workout.exercises && workout.exercises.length > 0)))
  );

  useEffect(() => {
    if (workout) {
      const rawDate = workout.completedAt || workout.startedAt || workout.createdAt;
      const initialDate = rawDate ? new Date(rawDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
      setSessionDate(initialDate);
      setNotes(workout.notes || "");
      setExercises(
        (workout.exercises || []).map((ex: any) => ({
          id: ex.id,
          name: ex.name || "",
          category: ex.category || (ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH"),
          isBodyweight: ex.isBodyweight || ex.category === "BODYWEIGHT" || isDefaultBodyweight(ex.name),
          sets: (ex.sets || []).map((s: any) => ({
            id: s.id,
            weight: s.weight !== undefined && s.weight !== null ? s.weight.toString() : "0",
            reps: s.reps !== undefined && s.reps !== null ? s.reps.toString() : "10",
            notes: s.notes || "",
          })),
        }))
      );
      setError(null);
    }
  }, [workout]);

  if (!isOpen || !workout) return null;

  const handleAddExercise = () => {
    setExercises((prev) => [
      ...prev,
      {
        name: "Barbell Bench Press",
        category: "STRENGTH",
        isBodyweight: false,
        sets: [
          { weight: "135", reps: "10", notes: "" },
          { weight: "135", reps: "10", notes: "" },
          { weight: "135", reps: "10", notes: "" },
        ],
      },
    ]);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateExerciseName = (idx: number, name: string) => {
    const isBW = isDefaultBodyweight(name);
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === idx
          ? {
              ...ex,
              name,
              isBodyweight: isBW,
              category: isBW ? "BODYWEIGHT" : "STRENGTH",
            }
          : ex
      )
    );
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              weight: lastSet ? lastSet.weight : "0",
              reps: lastSet ? lastSet.reps : "10",
              notes: "",
            },
          ],
        };
      })
    );
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const nextSets = ex.sets.filter((_: any, sI: number) => sI !== setIdx);
        return {
          ...ex,
          sets: nextSets.length ? nextSets : [{ weight: "0", reps: "10", notes: "" }],
        };
      })
    );
  };

  const handleUpdateSet = (exIdx: number, setIdx: number, field: string, val: string) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s: any, sI: number) => (sI === setIdx ? { ...s, [field]: val } : s)),
        };
      })
    );
  };

  const handleSave = async (markAsCompleted = false) => {
    if (!workout) return;
    if (markAsCompleted) setCompleting(true);
    else setSaving(true);
    setError(null);

    try {
      const parsedDate = sessionDate ? new Date(`${sessionDate}T12:00:00.000Z`).toISOString() : undefined;
      const targetStatus = isCompleted ? "COMPLETED" : markAsCompleted ? "COMPLETED" : "PLANNED";
      const targetCompletedAt = isCompleted || markAsCompleted ? parsedDate || new Date().toISOString() : undefined;

      const payload = {
        status: targetStatus,
        startedAt: parsedDate,
        completedAt: targetCompletedAt,
        notes: notes.trim() || null,
        exercises: exercises.map((ex, exIdx) => ({
          name: ex.name.trim() || "Exercise",
          category: ex.category || (ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH"),
          isBodyweight: !!ex.isBodyweight,
          order: exIdx,
          sets: ex.sets.map((s: any, sIdx: number) => ({
            order: sIdx,
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            notes: s.notes ? s.notes.trim() : null,
          })),
        })),
      };

      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update workout");
      }

      const updated = await res.json();
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
      setCompleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "650px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Dumbbell size={20} style={{ color: "#2563eb" }} />
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {isCompleted ? "Edit Logged Workout" : "Edit Planned Routine"}
              </h3>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                {isCompleted ? "Update recorded exercises, weights, reps, supersets, and date" : "Modify target exercises, weights, and sets"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Date & Title Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <Calendar size={12} style={{ color: "#2563eb" }} />
                Workout Date
              </label>
              <input
                type="date"
                className="input"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                style={{ width: "100%", fontSize: "13px", padding: "6px 10px" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Status
              </label>
              <div style={{ padding: "7px 12px", background: isCompleted ? "#f0fdf4" : "#eff6ff", border: `1px solid ${isCompleted ? "#bbf7d0" : "#bfdbfe"}`, borderRadius: "8px", fontSize: "12px", fontWeight: 700, color: isCompleted ? "#16a34a" : "#2563eb" }}>
                {isCompleted ? "✓ Completed History" : "📋 Planned / Assigned"}
              </div>
            </div>
          </div>

          {/* Routine Notes */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Session Notes / Instructions
            </label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on progressive overload on bench press..."
              style={{ width: "100%", fontSize: "13px", padding: "8px 12px" }}
            />
          </div>

          {/* Exercise List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                Exercises ({exercises.length})
              </label>
              <button
                type="button"
                onClick={handleAddExercise}
                className="btn-secondary"
                style={{ fontSize: "11px", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={13} />
                <span>Add Exercise</span>
              </button>
            </div>

            {exercises.map((ex, exIdx) => (
              <div
                key={ex.id || exIdx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <ExercisePickerDropdown
                    value={ex.name}
                    onSelectExercise={(name, isBW, cat) => {
                      setExercises((prev) =>
                        prev.map((item, i) =>
                          i === exIdx
                            ? {
                                ...item,
                                name,
                                isBodyweight: isBW,
                                category: cat,
                              }
                            : item
                        )
                      );
                    }}
                    placeholder="Search 120+ exercise library..."
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="btn-ghost-danger"
                    title="Remove exercise"
                    style={{ padding: "6px", borderRadius: "6px" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Sets Header & Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1.5fr auto", gap: "6px", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", padding: "0 4px" }}>
                    <span>Set</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>Notes / Superset</span>
                    <span></span>
                  </div>

                  {ex.sets.map((s: any, sIdx: number) => (
                    <div key={sIdx} style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1.5fr auto", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textAlign: "center" }}>
                        {sIdx + 1}
                      </span>
                      <input
                        type="number"
                        className="input"
                        value={s.weight}
                        onChange={(e) => handleUpdateSet(exIdx, sIdx, "weight", e.target.value)}
                        placeholder="0"
                        style={{ padding: "4px 8px", fontSize: "12px", textAlign: "center" }}
                      />
                      <input
                        type="number"
                        className="input"
                        value={s.reps}
                        onChange={(e) => handleUpdateSet(exIdx, sIdx, "reps", e.target.value)}
                        placeholder="10"
                        style={{ padding: "4px 8px", fontSize: "12px", textAlign: "center" }}
                      />
                      <input
                        type="text"
                        className="input"
                        value={s.notes || ""}
                        onChange={(e) => handleUpdateSet(exIdx, sIdx, "notes", e.target.value)}
                        placeholder="e.g. Superset..."
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(exIdx, sIdx)}
                        style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
                        title="Remove set"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    style={{
                      background: "transparent",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#2563eb",
                      cursor: "pointer",
                      marginTop: "4px",
                    }}
                  >
                    + Add Set
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "8px 14px" }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || completing}
              className="btn-primary"
              style={{
                fontSize: "12px",
                padding: "8px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Save size={14} />
              <span>{saving ? "Saving..." : isCompleted ? "Save Workout Updates" : "Save Changes"}</span>
            </button>

            {!isCompleted && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || completing}
                style={{
                  fontSize: "12px",
                  padding: "8px 16px",
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: saving || completing ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(22,163,74,0.3)",
                }}
              >
                <CheckCircle2 size={14} />
                <span>{completing ? "Logging..." : "✓ Log & Complete"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const EditWorkoutModal = EditAssignedWorkoutModal;
export default EditAssignedWorkoutModal;
