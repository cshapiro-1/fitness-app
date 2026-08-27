"use client";

import React, { useState, useMemo } from "react";
import {
  RotateCcw,
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  Scale,
  Calendar,
} from "lucide-react";
import { isDefaultBodyweight } from "../utils/exerciseLibrary";

export interface RepeatExerciseSet {
  weight: number | string;
  reps: number | string;
  notes?: string;
}

export interface RepeatExercise {
  name: string;
  category?: string;
  isBodyweight?: boolean;
  sets: RepeatExerciseSet[];
}

export interface RepeatWorkoutModalProps {
  isOpen: boolean;
  workout: {
    id?: string;
    notes?: string | null;
    completedAt?: string | null;
    createdAt?: string;
    exercises: Array<{
      name: string;
      category?: string;
      isBodyweight?: boolean;
      sets: Array<{
        weight: number | string;
        reps: number | string;
        notes?: string | null;
      }>;
    }>;
  } | null;
  athleteName?: string;
  onClose: () => void;
  onConfirmRepeat: (
    repeatedExercises: Array<{
      name: string;
      category: string;
      isBodyweight: boolean;
      sets: Array<{ weight: string; reps: string; notes: string }>;
    }>,
    mode: "same" | "overload" | "custom",
    increaseDescription: string
  ) => void;
}

type ProgressionMode = "same" | "overload" | "custom";

export function RepeatWorkoutModal({
  isOpen,
  workout,
  athleteName,
  onClose,
  onConfirmRepeat,
}: RepeatWorkoutModalProps) {
  const [mode, setMode] = useState<ProgressionMode>("overload");
  const [customDeltaLbs, setCustomDeltaLbs] = useState<number>(5);
  const [customDeltaPct, setCustomDeltaPct] = useState<number>(5);
  const [customType, setCustomType] = useState<"lbs" | "pct">("lbs");

  // Calculate adjusted exercises based on selected mode
  const calculatedExercises = useMemo(() => {
    if (!workout || !workout.exercises) return [];

    return workout.exercises.map((ex) => {
      const isBW = !!ex.isBodyweight || isDefaultBodyweight(ex.name);
      const exNameLower = ex.name.toLowerCase();

      // Determine default smart increase per exercise
      const isLowerBodyCompound =
        exNameLower.includes("squat") ||
        exNameLower.includes("deadlift") ||
        exNameLower.includes("leg press") ||
        exNameLower.includes("hack");

      const smartLbs = isLowerBodyCompound ? 10 : 5;

      const adjustedSets = ex.sets.map((s) => {
        const origWeight = typeof s.weight === "number" ? s.weight : parseFloat(s.weight) || 0;
        const origReps = typeof s.reps === "number" ? s.reps : parseInt(String(s.reps), 10) || 10;
        let newWeight = origWeight;
        let newReps = origReps;

        if (mode === "same" || isBW) {
          newWeight = origWeight;
        } else if (mode === "overload") {
          if (origWeight > 0) {
            // Apply standard progressive overload rounded to nearest 2.5/5 lbs
            if (origWeight >= 100) {
              newWeight = Math.round((origWeight + smartLbs) / 5) * 5;
            } else {
              newWeight = Math.round((origWeight + (isLowerBodyCompound ? 5 : 2.5)) / 2.5) * 2.5;
            }
          } else {
            // If bodyweight, add 1 rep target for progressive overload
            newReps = origReps + 1;
          }
        } else if (mode === "custom") {
          if (origWeight > 0) {
            if (customType === "lbs") {
              newWeight = Math.max(0, origWeight + customDeltaLbs);
            } else {
              const scaled = origWeight * (1 + customDeltaPct / 100);
              newWeight = Math.round(scaled / 2.5) * 2.5;
            }
          } else {
            newReps = origReps + 1;
          }
        }

        return {
          weight: isBW ? "0" : String(newWeight),
          reps: String(newReps),
          notes: s.notes || "",
          originalWeight: origWeight,
          originalReps: origReps,
        };
      });

      return {
        name: ex.name,
        category: ex.category || (isBW ? "BODYWEIGHT" : "STRENGTH"),
        isBodyweight: isBW,
        sets: adjustedSets,
      };
    });
  }, [workout, mode, customDeltaLbs, customDeltaPct, customType]);

  if (!isOpen || !workout) return null;

  const workoutDate = workout.completedAt
    ? new Date(workout.completedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Previous Session";

  const handleConfirm = () => {
    const formatted = calculatedExercises.map((ex) => ({
      name: ex.name,
      category: ex.category,
      isBodyweight: ex.isBodyweight,
      sets: ex.sets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        notes: s.notes,
      })),
    }));

    let desc = "Same weights & reps";
    if (mode === "overload") desc = "Smart Progressive Overload (+2.5 to +10 lbs)";
    else if (mode === "custom") {
      desc = customType === "lbs" ? `+${customDeltaLbs} lbs Overload` : `+${customDeltaPct}% Overload`;
    }

    onConfirmRepeat(formatted, mode, desc);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          maxWidth: "600px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "18px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#eff6ff",
                color: "#2563eb",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              <RotateCcw size={12} />
              <span>Repeat Workout</span>
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Repeat Session ({workoutDate})
            </h3>
            {athleteName && (
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Target Athlete: <strong>{athleteName}</strong>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Strategy Selector Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {/* Option 1: Overload */}
          <button
            type="button"
            onClick={() => setMode("overload")}
            style={{
              padding: "12px 10px",
              borderRadius: "12px",
              border: mode === "overload" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              background: mode === "overload" ? "#eff6ff" : "#ffffff",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <TrendingUp size={15} style={{ color: mode === "overload" ? "#2563eb" : "#64748b" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: mode === "overload" ? "#1d4ed8" : "#0f172a",
                }}
              >
                Progressive Overload
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "10px", color: "#64748b", lineHeight: "1.3" }}>
              +2.5 to +10 lbs smart incremental increase
            </p>
          </button>

          {/* Option 2: Same Weight */}
          <button
            type="button"
            onClick={() => setMode("same")}
            style={{
              padding: "12px 10px",
              borderRadius: "12px",
              border: mode === "same" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              background: mode === "same" ? "#eff6ff" : "#ffffff",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Scale size={15} style={{ color: mode === "same" ? "#2563eb" : "#64748b" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: mode === "same" ? "#1d4ed8" : "#0f172a",
                }}
              >
                Same Weights
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "10px", color: "#64748b", lineHeight: "1.3" }}>
              Exact duplicate of previously logged loads
            </p>
          </button>

          {/* Option 3: Custom */}
          <button
            type="button"
            onClick={() => setMode("custom")}
            style={{
              padding: "12px 10px",
              borderRadius: "12px",
              border: mode === "custom" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              background: mode === "custom" ? "#eff6ff" : "#ffffff",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Sparkles size={15} style={{ color: mode === "custom" ? "#2563eb" : "#64748b" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: mode === "custom" ? "#1d4ed8" : "#0f172a",
                }}
              >
                Custom Step
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "10px", color: "#64748b", lineHeight: "1.3" }}>
              Set custom +lbs or +% increment
            </p>
          </button>
        </div>

        {/* Custom Controls (When custom selected) */}
        {mode === "custom" && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Mode:</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => setCustomType("lbs")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "none",
                    background: customType === "lbs" ? "#2563eb" : "#e2e8f0",
                    color: customType === "lbs" ? "#fff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  + Lbs
                </button>
                <button
                  type="button"
                  onClick={() => setCustomType("pct")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "none",
                    background: customType === "pct" ? "#2563eb" : "#e2e8f0",
                    color: customType === "pct" ? "#fff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  + %
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {customType === "lbs" ? (
                [2.5, 5, 10, 15].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomDeltaLbs(val)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: customDeltaLbs === val ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                      background: customDeltaLbs === val ? "#eff6ff" : "#fff",
                      color: customDeltaLbs === val ? "#1d4ed8" : "#334155",
                      cursor: "pointer",
                    }}
                  >
                    +{val} lbs
                  </button>
                ))
              ) : (
                [2.5, 5, 7.5, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomDeltaPct(val)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: customDeltaPct === val ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                      background: customDeltaPct === val ? "#eff6ff" : "#fff",
                      color: customDeltaPct === val ? "#1d4ed8" : "#334155",
                      cursor: "pointer",
                    }}
                  >
                    +{val}%
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Preview of Adjusted Exercises */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Workout Preview ({calculatedExercises.length} Movements)</span>
            <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: 700 }}>
              {mode === "overload"
                ? "🚀 Progressive Overload Applied"
                : mode === "same"
                ? "Exact Previous Weights"
                : `+${customType === "lbs" ? `${customDeltaLbs} lbs` : `${customDeltaPct}%`}`}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "260px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {calculatedExercises.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    {idx + 1}. {ex.name}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: ex.isBodyweight ? "#16a34a" : "#2563eb",
                      background: ex.isBodyweight ? "#dcfce7" : "#eff6ff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {ex.isBodyweight ? "Bodyweight" : `${ex.sets.length} Sets`}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {ex.sets.map((st, sIdx) => {
                    const weightChanged = st.weight !== String(st.originalWeight);
                    return (
                      <div
                        key={sIdx}
                        style={{
                          background: weightChanged ? "#dbeafe" : "#ffffff",
                          border: weightChanged ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ color: "#64748b", fontWeight: 600 }}>S{sIdx + 1}:</span>
                        {ex.isBodyweight ? (
                          <strong style={{ color: "#0f172a" }}>{st.reps} reps</strong>
                        ) : (
                          <>
                            {weightChanged && (
                              <span style={{ color: "#64748b", textDecoration: "line-through" }}>
                                {st.originalWeight}
                              </span>
                            )}
                            <strong style={{ color: weightChanged ? "#1d4ed8" : "#0f172a" }}>
                              {st.weight} lbs
                            </strong>
                            <span style={{ color: "#475569" }}>× {st.reps}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            }}
          >
            <CheckCircle2 size={16} />
            <span>Apply &amp; Start Workout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RepeatWorkoutModal;
