"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Dumbbell, Filter, Plus, Check } from "lucide-react";
import { EXERCISE_LIBRARY, ExerciseDefinition, searchExercises } from "../utils/exerciseLibrary";

export interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string) => void;
}

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"];
const EQUIPMENT_TYPES = ["All", "Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Kettlebell"];

export function ExerciseLibraryModal({
  isOpen,
  onClose,
  onSelectExercise,
}: ExerciseLibraryModalProps) {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");

  const filteredExercises = useMemo(() => {
    return searchExercises(search, selectedMuscle, selectedEquipment);
  }, [search, selectedMuscle, selectedEquipment]);

  if (!isOpen) return null;

  return (
    <div className="client-modal-backdrop" onClick={onClose}>
      <div
        className="client-modal-card"
        style={{ maxWidth: "680px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="client-modal-header" style={{ paddingBottom: "12px" }}>
          <div className="client-modal-header-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Dumbbell size={20} style={{ color: "#2563eb" }} />
              <h2 className="client-modal-title">Exercise Library</h2>
            </div>
            <p className="client-modal-subtitle">
              Browse 120+ standard movements or search by muscle group and equipment.
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "0 24px 12px 24px" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              className="client-modal-input"
              style={{ paddingLeft: "36px" }}
              placeholder="Search exercise by name or muscle (e.g. Bench Press, Squat, Lat Pulldown)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ padding: "0 24px 12px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Muscle Group Filters */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedMuscle(group)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: selectedMuscle === group ? "#2563eb" : "#f1f5f9",
                  color: selectedMuscle === group ? "#ffffff" : "#475569",
                  whiteSpace: "nowrap",
                }}
              >
                {group}
              </button>
            ))}
          </div>

          {/* Equipment Filters */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {EQUIPMENT_TYPES.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => setSelectedEquipment(eq)}
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: selectedEquipment === eq ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  cursor: "pointer",
                  background: selectedEquipment === eq ? "#eff6ff" : "#ffffff",
                  color: selectedEquipment === eq ? "#2563eb" : "#64748b",
                  whiteSpace: "nowrap",
                }}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px 24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
            Showing {filteredExercises.length} exercises
          </div>

          {filteredExercises.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b", fontSize: "13px" }}>
              No exercises match your search. You can still type any custom movement name directly!
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <div
                key={ex.name}
                onClick={() => {
                  onSelectExercise(ex.name);
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
                    <span style={{ fontSize: "10px", background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ExerciseLibraryModal;
