import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  InteractiveBodyMap,
  MUSCLE_DEFINITIONS,
  MuscleGroupId,
} from "../../src/components/InteractiveBodyMap";
import { INITIAL_UNIFIED_EXERCISES } from "../../src/lib/unifiedExerciseLibrary";

describe("InteractiveBodyMap Component", () => {
  it("renders with Anterior view by default", () => {
    const handleSelect = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle="chest"
        onSelectMuscle={handleSelect}
      />
    );

    expect(screen.getByTestId("interactive-body-map")).toBeDefined();
    expect(screen.getByTestId("toggle-anterior")).toBeDefined();
    expect(screen.getByTestId("toggle-posterior")).toBeDefined();
    expect(screen.getByTestId("muscle-chest")).toBeDefined();
  });

  it("switches to Posterior view when clicking the posterior toggle", () => {
    const handleSelect = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle="lats"
        onSelectMuscle={handleSelect}
      />
    );

    const posteriorBtn = screen.getByTestId("toggle-posterior");
    fireEvent.click(posteriorBtn);

    expect(screen.getByTestId("muscle-lats")).toBeDefined();
    expect(screen.getByTestId("muscle-glutes")).toBeDefined();
    expect(screen.getByTestId("muscle-hamstrings")).toBeDefined();
  });

  it("triggers onSelectMuscle when a muscle region is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle={null}
        onSelectMuscle={handleSelect}
      />
    );

    const chestGroup = screen.getByTestId("muscle-chest");
    fireEvent.click(chestGroup);

    expect(handleSelect).toHaveBeenCalledWith("chest");
  });

  it("triggers onSelectMuscle when a quick-selector pill is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle="chest"
        onSelectMuscle={handleSelect}
      />
    );

    const quadPill = screen.getByTestId("pill-quads");
    fireEvent.click(quadPill);

    expect(handleSelect).toHaveBeenCalledWith("quads");
  });

  it("triggers onHoverMuscle on mouse enter and leave", () => {
    const handleSelect = vi.fn();
    const handleHover = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle={null}
        onSelectMuscle={handleSelect}
        onHoverMuscle={handleHover}
      />
    );

    const bicepsGroup = screen.getByTestId("muscle-biceps");
    fireEvent.mouseEnter(bicepsGroup);
    expect(handleHover).toHaveBeenCalledWith("biceps");

    fireEvent.mouseLeave(bicepsGroup);
    expect(handleHover).toHaveBeenCalledWith(null);
  });

  it("ensures all 16 muscle groups have complete anatomical and kinesiological definitions", () => {
    const keys = Object.keys(MUSCLE_DEFINITIONS) as MuscleGroupId[];
    expect(keys.length).toBeGreaterThanOrEqual(16);

    for (const key of keys) {
      const def = MUSCLE_DEFINITIONS[key];
      expect(def.id).toBe(key);
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.subMuscles.length).toBeGreaterThan(0);
      expect(def.primaryRole).toBeTruthy();
      expect(def.commonTightness).toBeTruthy();
    }
  });

  it("maps accurately to unified exercises and stretches in the library", () => {
    const chestExercises = INITIAL_UNIFIED_EXERCISES.filter(
      (e) => e.muscleGroup.toLowerCase() === "chest" || e.primaryMuscles.some((m) => m.toLowerCase().includes("pectoral"))
    );
    expect(chestExercises.length).toBeGreaterThanOrEqual(5);

    const backExercises = INITIAL_UNIFIED_EXERCISES.filter(
      (e) => e.muscleGroup.toLowerCase() === "back" || e.primaryMuscles.some((m) => m.toLowerCase().includes("lat") || m.toLowerCase().includes("erector"))
    );
    expect(backExercises.length).toBeGreaterThanOrEqual(5);

    const legExercises = INITIAL_UNIFIED_EXERCISES.filter(
      (e) => e.muscleGroup.toLowerCase() === "legs" || e.primaryMuscles.some((m) => m.toLowerCase().includes("quad") || m.toLowerCase().includes("hamstring"))
    );
    expect(legExercises.length).toBeGreaterThanOrEqual(10);
  });
});
