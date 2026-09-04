"use client";

import React, { useState, useMemo } from "react";
import { X, Sparkles, Dumbbell, Heart, Plus, Search, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import {
  MUSCLE_DEFINITIONS,
  MuscleGroupId,
} from "@/components/InteractiveBodyMap";
import { INITIAL_UNIFIED_EXERCISES } from "@/lib/unifiedExerciseLibrary";

const InteractiveBodyMap = dynamic(
  () => import("@/components/InteractiveBodyMap").then((mod) => mod.InteractiveBodyMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-[340px] aspect-[9/16] rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-500 animate-pulse font-bold">
        Loading 3D Anatomy Model...
      </div>
    ),
  }
);

interface InteractiveAnatomyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise?: (exerciseName: string, category?: string) => void;
  isDark?: boolean;
}

export function InteractiveAnatomyModal({
  isOpen,
  onClose,
  onSelectExercise,
  isDark = true,
}: InteractiveAnatomyModalProps) {
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleGroupId>("chest");
  const [hoveredMuscleId, setHoveredMuscleId] = useState<MuscleGroupId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"EXERCISES" | "STRETCHES">("EXERCISES");

  const selectedMuscle = MUSCLE_DEFINITIONS[selectedMuscleId];

  const filteredMovements = useMemo(() => {
    return INITIAL_UNIFIED_EXERCISES.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesPrimary = item.primaryMuscles.some((m) => m.toLowerCase().includes(q));
        return matchesName || matchesPrimary;
      }

      const catLower = selectedMuscle.category.toLowerCase();
      const idLower = selectedMuscle.id.toLowerCase();
      return (
        item.muscleGroup.toLowerCase().includes(catLower) ||
        item.primaryMuscles.some((m) => m.toLowerCase().includes(idLower))
      );
    });
  }, [selectedMuscle, searchQuery]);

  const strengthExercises = useMemo(() => {
    return filteredMovements.filter((m) => m.type === "EXERCISE");
  }, [filteredMovements]);

  const mobilityStretches = useMemo(() => {
    return filteredMovements.filter((m) => m.type === "STRETCH" || m.type === "MOBILITY");
  }, [filteredMovements]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-white">Anatomical Muscle &amp; Movement Selector</h2>
              <p className="text-xs text-slate-400">Click a muscle group on the body map to select targeted movements</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/60"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-2 overflow-y-auto mt-4">
          {/* Body Map Column */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <InteractiveBodyMap
              selectedMuscle={selectedMuscleId}
              onSelectMuscle={(id) => {
                setSelectedMuscleId(id);
                setSearchQuery("");
              }}
              hoveredMuscle={hoveredMuscleId}
              onHoverMuscle={setHoveredMuscleId}
              isDark={isDark}
            />

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-cyan-400">{selectedMuscle.name}: </span>
              <span className="text-slate-300">{selectedMuscle.primaryRole}</span>
            </div>
          </div>

          {/* Movements Column */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {/* Search and Tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-xl p-1 bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("EXERCISES")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "EXERCISES" ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Strength ({strengthExercises.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("STRETCHES")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "STRETCHES" ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Stretches ({mobilityStretches.length})
                </button>
              </div>

              <div className="relative flex-1 max-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                <input
                  type="text"
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
              {(activeTab === "EXERCISES" ? strengthExercises : mobilityStretches).map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {m.diagramUrl ? (
                      <img src={m.diagramUrl} alt={m.name} className="w-12 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800" />
                    ) : (
                      <div className="w-12 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                        3D
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">{m.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400">{m.equipment}</span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-cyan-400">{m.primaryMuscles[0]}</span>
                      </div>
                    </div>
                  </div>

                  {onSelectExercise && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectExercise(m.name, m.muscleGroup);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 text-xs font-bold border border-cyan-500/20 transition-all"
                    >
                      <Plus size={13} />
                      <span>Select</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
