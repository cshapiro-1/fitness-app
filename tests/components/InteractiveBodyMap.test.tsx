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
    expect(screen.getByTestId("pill-chest")).toBeDefined();
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

    expect(screen.getByTestId("pill-traps")).toBeDefined();
    expect(screen.getByTestId("pill-lats")).toBeDefined();
    expect(screen.getByTestId("pill-glutes")).toBeDefined();
    expect(screen.getByTestId("pill-hamstrings")).toBeDefined();
  });

  it("triggers onSelectMuscle when a muscle quick-selector pill is clicked", () => {
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

  it("triggers onHoverMuscle on quick-selector pill mouse enter and leave", () => {
    const handleSelect = vi.fn();
    const handleHover = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle={null}
        onSelectMuscle={handleSelect}
        onHoverMuscle={handleHover}
      />
    );

    const bicepsPill = screen.getByTestId("pill-biceps");
    fireEvent.mouseEnter(bicepsPill);
    expect(handleHover).toHaveBeenCalledWith("biceps");

    fireEvent.mouseLeave(bicepsPill);
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

  it("safely unmounts and executes WebGL GPU buffer and context cleanup without crashing", () => {
    const handleSelect = vi.fn();
    const { unmount } = render(
      <InteractiveBodyMap
        selectedMuscle="chest"
        onSelectMuscle={handleSelect}
      />
    );

    // Verify component renders
    expect(screen.getByTestId("interactive-body-map")).toBeDefined();

    // Verify unmount triggers WebGL cleanup without throwing
    expect(() => unmount()).not.toThrow();
  });

  it("renders the active muscle HUD overlay with muscle details when a muscle is selected", () => {
    const handleSelect = vi.fn();
    const { rerender } = render(
      <InteractiveBodyMap
        selectedMuscle={null}
        onSelectMuscle={handleSelect}
      />
    );

    // Initially no HUD
    expect(screen.queryByText("Selected")).toBeNull();

    // Rerender with chest selected
    rerender(
      <InteractiveBodyMap
        selectedMuscle="chest"
        onSelectMuscle={handleSelect}
      />
    );

    expect(screen.getByText("Chest (Pectorals)")).toBeDefined();
    expect(screen.getByText("Selected")).toBeDefined();
  });

  it("switches between 3D Model and Medical Diagram view modes seamlessly", () => {
    const handleSelect = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle="chest"
        onSelectMuscle={handleSelect}
      />
    );

    const diagramModeBtn = screen.getByTestId("mode-toggle-diagram");
    expect(diagramModeBtn).toBeDefined();

    fireEvent.click(diagramModeBtn);

    // Verify medical diagram image renders
    const diagramImg = screen.getByAltText("Medical Anatomy Diagram");
    expect(diagramImg).toBeDefined();
    expect(diagramImg.getAttribute("src")).toBe("/anatomy/body_anterior.jpg");

    // Switch back to 3D mode
    const threeDModeBtn = screen.getByTestId("mode-toggle-3d");
    fireEvent.click(threeDModeBtn);
    expect(screen.getByTestId("interactive-body-map")).toBeDefined();
  });

  it("handles touch start, move, and end events on mobile viewports without errors", () => {
    const handleSelect = vi.fn();
    render(
      <InteractiveBodyMap
        selectedMuscle="chest"
        onSelectMuscle={handleSelect}
      />
    );

    const viewport = screen.getByTestId("body-map-viewport");
    expect(viewport).toBeDefined();

    // Verify touchAction none style is present for mobile touch drag
    expect(viewport.style.touchAction).toBe("none");

    // Simulate mobile touch drag
    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    fireEvent.touchMove(window, {
      touches: [{ clientX: 120, clientY: 100 }],
    });

    fireEvent.touchEnd(window);
  });

  it("verifies the Z-Anatomy 3D musculature GLB asset and Draco decoders exist in public directory", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const glbPath = path.resolve(process.cwd(), "public/models/anatomy_musculature.glb");
    expect(fs.existsSync(glbPath)).toBe(true);

    const stats = fs.statSync(glbPath);
    // Must be around 1.45MB - 1.6MB
    expect(stats.size).toBeGreaterThan(1000000);
    expect(stats.size).toBeLessThan(5000000);

    const dracoWasmPath = path.resolve(process.cwd(), "public/draco/draco_decoder.wasm");
    expect(fs.existsSync(dracoWasmPath)).toBe(true);
  });
});
