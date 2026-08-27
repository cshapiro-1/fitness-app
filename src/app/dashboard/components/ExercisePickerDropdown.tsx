"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Dumbbell, Plus, Check, ChevronDown, Sparkles, X } from "lucide-react";
import { EXERCISE_LIBRARY, ExerciseDefinition, isDefaultBodyweight } from "../utils/exerciseLibrary";

export interface ExercisePickerDropdownProps {
  value: string;
  onSelectExercise: (name: string, isBodyweight: boolean, category: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const CATEGORIES = ["ALL", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Bodyweight", "Stretching"];

export function ExercisePickerDropdown({
  value,
  onSelectExercise,
  placeholder = "Select or search exercise...",
  className = "",
  style = {},
}: ExercisePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filteredExercises = useMemo(() => {
    const q = query.toLowerCase().trim();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchCat =
        selectedCategory === "ALL" ||
        ex.muscleGroup.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === "Bodyweight" && (ex.equipment === "Bodyweight" || ex.muscleGroup === "Bodyweight"));

      const matchQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q);

      return matchCat && matchQuery;
    });
  }, [query, selectedCategory]);

  const handleSelect = (ex: ExerciseDefinition) => {
    const isBW = ex.equipment === "Bodyweight" || isDefaultBodyweight(ex.name);
    const cat = isBW ? "BODYWEIGHT" : "STRENGTH";
    setQuery(ex.name);
    onSelectExercise(ex.name, isBW, cat);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (!query.trim()) return;
    const isBW = isDefaultBodyweight(query);
    const cat = isBW ? "BODYWEIGHT" : "STRENGTH";
    onSelectExercise(query.trim(), isBW, cat);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%", ...style }} className={className}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "8px 32px 8px 10px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
            fontWeight: 700,
            color: "#0f172a",
            background: "#ffffff",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            position: "absolute",
            right: "6px",
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Floating Searchable Exercise Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 99999,
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Category Chips Bar */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "8px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  border: selectedCategory === cat ? "1px solid #2563eb" : "1px solid #e2e8f0",
                  background: selectedCategory === cat ? "#eff6ff" : "#ffffff",
                  color: selectedCategory === cat ? "#1d4ed8" : "#475569",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Exercise List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {filteredExercises.length > 0 ? (
              filteredExercises.slice(0, 40).map((ex) => {
                const isSelected = ex.name.toLowerCase() === value.toLowerCase();
                const isBW = ex.equipment === "Bodyweight" || isDefaultBodyweight(ex.name);

                return (
                  <div
                    key={ex.name}
                    onClick={() => handleSelect(ex)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: isSelected ? "#eff6ff" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Dumbbell size={14} style={{ color: isSelected ? "#2563eb" : "#64748b" }} />
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? "#1d4ed8" : "#1e293b",
                        }}
                      >
                        {ex.name}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: isBW ? "#dcfce7" : "#f1f5f9",
                          color: isBW ? "#166534" : "#475569",
                        }}
                      >
                        {ex.muscleGroup}
                      </span>
                      {isSelected && <Check size={14} style={{ color: "#2563eb" }} />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "12px", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>
                  No exact preset match for <strong>"{query}"</strong>
                </p>
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={13} />
                  <span>Add "{query}" as Custom Exercise</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExercisePickerDropdown;
