"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X, Search, Dumbbell, Plus, Sparkles, HeartPulse, Activity, Zap, Check,
  Image, RefreshCw, ChevronRight, Eye, ShieldCheck
} from "lucide-react";
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

  // Diagram Generation & Approval State for Trainers
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [generatedDiagramData, setGeneratedDiagramData] = useState<any | null>(null);

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
    return searchExercises(search, selectedMuscle, selectedEquipment, allExercises);
  }, [allExercises, search, selectedMuscle, selectedEquipment]);

  // Trainer Step: Generate Anatomy Diagram for Custom Exercise before approving
  const handleGenerateDiagramForCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setIsGeneratingDiagram(true);
    try {
      const res = await fetch("/api/admin/anatomy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          muscleGroup: customCategory,
          equipment: customEquipment,
          type: customCategory === "Stretching" ? "STRETCH" : "EXERCISE",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setGeneratedDiagramData(result.data);
      } else {
        // Fallback default
        setGeneratedDiagramData({
          name: customName.trim(),
          muscleGroup: customCategory,
          equipment: customEquipment,
          diagramUrl: "/anatomy/squat.jpg",
          primaryMuscles: [customCategory],
          secondaryMuscles: [],
          biomechanicsCue: "Maintain strict posture, align joints with line of force, and control the range of motion.",
        });
      }
    } catch {
      setGeneratedDiagramData({
        name: customName.trim(),
        muscleGroup: customCategory,
        equipment: customEquipment,
        diagramUrl: "/anatomy/squat.jpg",
        primaryMuscles: [customCategory],
        secondaryMuscles: [],
        biomechanicsCue: "Maintain strict posture, align joints with line of force, and control the range of motion.",
      });
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // Trainer Step: Approve Anatomy Diagram & Persist
  const handleApproveAndSaveCustomExercise = async () => {
    if (!customName.trim()) return;

    const newEx: ExerciseDefinition = {
      name: customName.trim(),
      muscleGroup: customCategory as any,
      equipment: customEquipment as any,
    };

    // 1. Save to local list
    const updated = [newEx, ...customExercises];
    setCustomExercises(updated);
    try {
      localStorage.setItem("fitcoach_custom_exercises", JSON.stringify(updated));
    } catch {}

    // 2. Persist approved anatomy diagram to database
    try {
      if (generatedDiagramData) {
        await fetch("/api/admin/anatomy", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newEx.name,
            diagramStatus: "APPROVED",
            diagramUrl: generatedDiagramData.diagramUrl,
            biomechanicsCue: generatedDiagramData.biomechanicsCue,
            primaryMuscles: generatedDiagramData.primaryMuscles,
            secondaryMuscles: generatedDiagramData.secondaryMuscles,
          }),
        });
      }
    } catch (persistErr) {
      console.error("Failed to persist approved anatomy to DB:", persistErr);
    }

    onSelectExercise(newEx.name, newEx.muscleGroup);
    setCustomName("");
    setGeneratedDiagramData(null);
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
              Choose from 120+ standard exercises, cardio, stretching, and daily wellness targets — or create custom movements with validated anatomy diagrams.
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Custom Exercise Creator & Diagram Approval Step Drawer */}
        {showCustomForm ? (
          <div
            style={{
              margin: "0 24px 16px 24px",
              padding: "16px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={15} />
                <span>Create Custom Exercise or Stretch with Anatomy Diagram</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCustomForm(false);
                  setGeneratedDiagramData(null);
                }}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Step 1: Input Form */}
            {!generatedDiagramData ? (
              <form onSubmit={handleGenerateDiagramForCustom}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                      Movement / Stretch Name *
                    </label>
                    <input
                      type="text"
                      className="client-modal-input"
                      placeholder="e.g. Deficit Trap Bar Deadlift or Hamstring Stretch"
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
                    disabled={isGeneratingDiagram}
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {isGeneratingDiagram ? (
                      <>
                        <RefreshCw size={13} className="spin" />
                        <span>Generating Diagram...</span>
                      </>
                    ) : (
                      <>
                        <HeartPulse size={13} />
                        <span>Generate &amp; Review Anatomy Diagram</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Trainer Review & Approve Anatomy Diagram Modal */
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", marginTop: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={16} style={{ color: "#16a34a" }} />
                  <span>Review &amp; Approve Anatomy Diagram Before Adding</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "14px", marginBottom: "12px" }}>
                  <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", height: "130px" }}>
                    <img
                      src={generatedDiagramData.diagramUrl || "/anatomy/squat.jpg"}
                      alt={generatedDiagramData.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{generatedDiagramData.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Target: <strong style={{ color: "#1e3a8a" }}>{(generatedDiagramData.primaryMuscles || []).join(", ")}</strong>
                    </div>
                    <div style={{ fontSize: "11px", color: "#475569", marginTop: "6px", background: "#f8fafc", padding: "6px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <strong>Cue:</strong> {generatedDiagramData.biomechanicsCue}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setGeneratedDiagramData(null)}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                  >
                    Edit Info
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAndSaveCustomExercise}
                    style={{
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 800,
                      background: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
                    }}
                  >
                    <Check size={14} />
                    <span>✓ Approve Anatomy &amp; Add Movement</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
              placeholder="Search exercise or stretch by name or category (e.g. Bench, Pigeon, Running)..."
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
              setGeneratedDiagramData(null);
            }}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 14px", whiteSpace: "nowrap", fontSize: "12px" }}
          >
            <Plus size={15} />
            <span>Custom Movement</span>
          </button>
        </div>

        {/* Muscle Group Filter Pills */}
        <div
          style={{
            padding: "0 24px 8px 24px",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {MUSCLE_GROUPS.map((mg) => {
            const isSelected = selectedMuscle === mg;
            return (
              <button
                key={mg}
                type="button"
                onClick={() => setSelectedMuscle(mg)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  border: `1px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`,
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  color: isSelected ? "#2563eb" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {mg}
              </button>
            );
          })}
        </div>

        {/* Exercise List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px 24px" }}>
          {filteredExercises.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: "#94a3b8" }}>
              <Dumbbell size={32} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
              <p style={{ fontSize: "13px", fontWeight: 600 }}>No exercises found</p>
              <p style={{ fontSize: "11px" }}>Try searching for a different keyword or create a custom exercise above.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px" }}>
              {filteredExercises.map((ex) => (
                <div
                  key={ex.name}
                  onClick={() => {
                    onSelectExercise(ex.name, ex.muscleGroup);
                    onClose();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #f1f5f9",
                    background: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#bfdbfe";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#f1f5f9";
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2563eb",
                        flexShrink: 0,
                      }}
                    >
                      {ex.muscleGroup === "Cardio" ? (
                        <Activity size={16} />
                      ) : ex.muscleGroup === "Stretching" || ex.muscleGroup === "Wellness" ? (
                        <HeartPulse size={16} />
                      ) : (
                        <Dumbbell size={16} />
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                        {ex.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", display: "flex", gap: "6px", alignItems: "center" }}>
                        <span>{ex.muscleGroup}</span>
                        <span>•</span>
                        <span>{ex.equipment}</span>
                        {ex.secondaryMuscle && (
                          <>
                            <span>•</span>
                            <span style={{ color: "#94a3b8" }}>{ex.secondaryMuscle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {/* Visual 3D Anatomy Guide Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenAnatomy(e, ex.name)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#166534",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title="View 3D Anatomy & Form Breakdown"
                    >
                      <HeartPulse size={12} />
                      <span>Anatomy</span>
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3D Visual Anatomy Guide Modal */}
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
