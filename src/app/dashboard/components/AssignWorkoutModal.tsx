"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, Dumbbell, CalendarPlus, Check, AlertCircle } from "lucide-react";
import { Client, WorkoutSession, DraftExercise } from "../types";
import { isDefaultBodyweight } from "../utils/exerciseLibrary";

export interface AssignWorkoutModalProps {
  isOpen: boolean;
  workout: WorkoutSession | null;
  clients: Client[];
  selectedClientId: string;
  onClose: () => void;
  onAssigned: (newWorkout: WorkoutSession, targetClientId: string) => void;
}

export function AssignWorkoutModal({
  isOpen,
  workout,
  clients,
  selectedClientId,
  onClose,
  onAssigned,
}: AssignWorkoutModalProps) {
  const [targetClientId, setTargetClientId] = useState<string>(selectedClientId);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workout) {
      setTargetClientId(selectedClientId || (clients[0]?.id ?? ""));
      setScheduledDate("");
      const originalDate = workout.completedAt
        ? new Date(workout.completedAt).toLocaleDateString(undefined, { dateStyle: "medium" })
        : "";
      setNotes(
        workout.notes
          ? `${workout.notes} (Assigned from ${originalDate || "History"})`
          : `Assigned Routine (from ${originalDate || "History"})`
      );

      setExercises(
        (workout.exercises || []).map((ex) => ({
          name: ex.name,
          category: ex.category || (ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH"),
          isBodyweight: ex.isBodyweight || ex.category === "BODYWEIGHT" || isDefaultBodyweight(ex.name),
          sets: (ex.sets || []).map((s) => ({
            weight: s.weight?.toString() || "0",
            reps: s.reps?.toString() || "10",
            notes: s.notes || "",
          })),
        }))
      );
      setError(null);
    }
  }, [workout, selectedClientId, clients]);

  if (!isOpen || !workout) return null;

  const targetClient = clients.find((c) => c.id === targetClientId);

  const handleAssign = async () => {
    if (!targetClientId) {
      setError("Please select a target client.");
      return;
    }
    if (!exercises.length) {
      setError("Workout has no exercises to assign.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formattedNotes = scheduledDate
        ? `[Scheduled for ${scheduledDate}] ${notes.trim()}`
        : notes.trim();

      const payload = {
        clientId: targetClientId,
        status: "PLANNED",
        notes: formattedNotes || null,
        exercises: exercises.map((ex, exIndex) => ({
          name: ex.name,
          order: exIndex,
          isBodyweight: !!ex.isBodyweight,
          category: ex.category || (ex.isBodyweight ? "BODYWEIGHT" : "STRENGTH"),
          sets: ex.sets.map((s, sIndex) => ({
            order: sIndex,
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            notes: s.notes || null,
          })),
        })),
      };

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to assign workout");
      }

      const saved = await res.json();
      onAssigned(saved, targetClientId);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to assign routine.");
    } finally {
      setSaving(false);
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "580px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarPlus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                Assign Workout to Client
              </h3>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Schedule this routine for upcoming training
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
        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selector */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Assign To Client
            </label>
            <div style={{ position: "relative" }}>
              <select
                className="input"
                value={targetClientId}
                onChange={(e) => setTargetClientId(e.target.value)}
                style={{ width: "100%", fontSize: "13px", padding: "8px 12px" }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Scheduled Date */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Scheduled Date (Optional)
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="date"
                className="input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{ flex: 1, fontSize: "13px", padding: "8px 12px" }}
              />
              <button
                type="button"
                onClick={() => {
                  const tmrw = new Date();
                  tmrw.setDate(tmrw.getDate() + 1);
                  setScheduledDate(tmrw.toISOString().split("T")[0]);
                }}
                className="btn-secondary"
                style={{ fontSize: "11px", padding: "8px 12px" }}
              >
                Tomorrow
              </button>
              {scheduledDate && (
                <button
                  type="button"
                  onClick={() => setScheduledDate("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notes / Instructions */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Coach Notes / Instructions
            </label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on pausing 2 seconds at the bottom..."
              style={{ width: "100%", fontSize: "13px", padding: "8px 12px" }}
            />
          </div>

          {/* Exercise Preview */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Exercises Included ({exercises.length})
            </label>
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "180px",
                overflowY: "auto",
              }}
            >
              {exercises.map((ex, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {i + 1}. {ex.name}
                  </span>
                  <span style={{ color: "#64748b", fontSize: "11px" }}>
                    {ex.sets.length} sets ({ex.sets.map((s) => `${s.weight}×${s.reps}`).join(", ")})
                  </span>
                </div>
              ))}
            </div>
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
          <button
            type="button"
            onClick={handleAssign}
            disabled={saving}
            className="btn-primary"
            style={{
              fontSize: "12px",
              padding: "8px 18px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CalendarPlus size={14} />
            <span>{saving ? "Assigning..." : `Assign to ${targetClient?.name || "Client"}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignWorkoutModal;
