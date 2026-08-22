"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Search, Dumbbell, Plus, Sparkles, HeartPulse, Activity, Zap, Check } from "lucide-react";
import { EXERCISE_LIBRARY, ExerciseDefinition, searchExercises } from "../utils/exerciseLibrary";
import { AnatomyGuideModal } from "./AnatomyGuideModal";

export interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string, category?: string) => void;
}

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Cardio",
  "Stretching",
  "Bodyweight",
  "Wellness",
];

const EQUIPMENT_TYPES = [
  "All",
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Kettlebell",
  "Cardio Machine",
  "Other",
];

export function ExerciseLibraryModal({
  isOpen,
  onClose,
  onSelectExercise,
}: ExerciseLibraryModalProps) {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");

  // Custom Exercise Creator State
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<string>("Chest");
  const [customEquipment, setCustomEquipment] = useState<string>("Barbell");
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);

  // Anatomy Guide Modal State
  const [selectedAnatomyExercise, setSelectedAnatomyExercise] = useState<string | null>(null);
  const [anatomyChartData, setAnatomyChartData] = useState<any | null>(null);
  const [loadingAnatomy, setLoadingAnatomy] = useState(false);

  const handleOpenAnatomy = async (e: React.MouseEvent, exerciseName: string) => {
    e.stopPropagation();
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fitcoach_custom_exercises");
      if (saved) {
        setCustomExercises(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const allExercises = useMemo(() => {
    return [...customExercises, ...EXERCISE_LIBRARY];
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allExercises.filter((ex) => {
      const matchesQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q);
      const matchesMuscle =
        !selectedMuscle || selectedMuscle === "All" || ex.muscleGroup === selectedMuscle;
      const matchesEquipment =
        !selectedEquipment || selectedEquipment === "All" || ex.equipment === selectedEquipment;
      return matchesQuery && matchesMuscle && matchesEquipment;
    });
  }, [allExercises, search, selectedMuscle, selectedEquipment]);

  const handleSaveCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEx: ExerciseDefinition = {
      name: customName.trim(),
      muscleGroup: customCategory as any,
      equipment: customEquipment as any,
    };

    const updated = [newEx, ...customExercises];
    setCustomExercises(updated);
    try {
      localStorage.setItem("fitcoach_custom_exercises", JSON.stringify(updated));
    } catch {}

    onSelectExercise(newEx.name, newEx.muscleGroup);
    setCustomName("");
    setShowCustomForm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="client-modal-backdrop" onClick={onClose}>
      <div
        className="client-modal-card"
        style={{ maxWidth: "700px", maxHeight: "88vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="client-modal-header" style={{ paddingBottom: "12px" }}>
          <div className="client-modal-header-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Dumbbell size={20} style={{ color: "#2563eb" }} />
              <h2 className="client-modal-title">Exercise &amp; Activity Library</h2>
            </div>
            <p className="client-modal-subtitle">
              Choose from 120+ standard exercises, cardio, stretching, and daily wellness targets — or create custom movements.
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Custom Exercise Creator Drawer */}
        {showCustomForm ? (
          <form
            onSubmit={handleSaveCustomExercise}
            style={{
              margin: "0 24px 16px 24px",
              padding: "16px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={15} />
                <span>Create Custom Exercise or Activity</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                style={{ background: "none", border: "none", color: "#166534", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Movement / Target Name *
                </label>
                <input
                  type="text"
                  className="client-modal-input"
                  placeholder="e.g. Deficit Trap Bar Deadlift or 10k Steps"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Category
                </label>
                <select
                  className="client-modal-input"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                >
                  {MUSCLE_GROUPS.filter((m) => m !== "All").map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Equipment
                </label>
                <select
                  className="client-modal-input"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                >
                  {EQUIPMENT_TYPES.filter((eq) => eq !== "All").map((eq) => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "6px 14px", fontSize: "12px" }}
              >
                Save &amp; Add Exercise
              </button>
            </div>
          </form>
        ) : null}

        {/* Search Bar & Create Custom Button */}
        <div style={{ padding: "0 24px 12px 24px", display: "flex", gap: "10px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            />
            <input
              type="text"
              className="client-modal-input"
              style={{ paddingLeft: "36px" }}
              placeholder="Search exercise by name or category (e.g. Bench, Running, 10k Steps)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus={!showCustomForm}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (search.trim()) setCustomName(search.trim());
              setShowCustomForm(true);
            }}
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={14} />
            <span>Custom Exercise</span>
          </button>
        </div>

        {/* Category Filters Bar */}
        <div style={{ padding: "0 24px 12px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedMuscle(group)}
                className={`btn-chip${selectedMuscle === group ? " active" : ""}`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
            Showing {filteredExercises.length} movements &amp; activities
          </div>

          {filteredExercises.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#64748b" }}>
                No movement found matching &quot;<b>{search}</b>&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCustomName(search.trim());
                  setShowCustomForm(true);
                }}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
              >
                <Plus size={14} />
                <span>Create &quot;{search || "Custom Movement"}&quot;</span>
              </button>
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <div
                key={ex.name}
                onClick={() => {
                  onSelectExercise(ex.name, ex.muscleGroup);
                  onClose();
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    {ex.name}
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "3px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        background:
                          ex.muscleGroup === "Cardio"
                            ? "#fef2f2"
                            : ex.muscleGroup === "Wellness"
                            ? "#ecfdf5"
                            : "#eff6ff",
                        color:
                          ex.muscleGroup === "Cardio"
                            ? "#dc2626"
                            : ex.muscleGroup === "Wellness"
                            ? "#059669"
                            : "#2563eb",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {ex.muscleGroup}
                    </span>
                    <span style={{ fontSize: "10px", background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "4px" }}>
                      {ex.equipment}
                    </span>
                    {ex.isCompound && (
                      <span style={{ fontSize: "10px", background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                        Compound
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={(e) => handleOpenAnatomy(e, ex.name)}
                    style={{
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      color: "#0284c7",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                    title="View 3D Anatomical Muscle Guide"
                  >
                    <Sparkles size={12} />
                    <span>Anatomy</span>
                  </button>

                  <button
                    type="button"
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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
    </div>
  );
}

export default ExerciseLibraryModal;
