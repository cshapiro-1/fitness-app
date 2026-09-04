"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Dumbbell,
  Sparkles,
  Play,
  CalendarPlus,
  Flame,
  Activity,
  Heart,
  ShieldAlert,
  Layers,
  ChevronRight,
  Info,
  Sliders,
  CheckCircle2,
  X,
} from "lucide-react";
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
      <div className="w-full max-w-[360px] aspect-[9/16] rounded-3xl bg-slate-900/90 border-2 border-slate-800/80 shadow-2xl flex flex-col items-center justify-center gap-3 p-6 text-center animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
          <Sparkles size={22} className="animate-spin" style={{ animationDuration: "4s" }} />
        </div>
        <p className="text-xs font-black text-white tracking-wide">Initializing 3D Anatomy Engine</p>
        <p className="text-[11px] text-slate-400 font-medium">Mounting GPU WebGL canvas &amp; kinesiology models...</p>
      </div>
    ),
  }
);

export default function AnatomyExplorerPage() {
  const router = useRouter();
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleGroupId>("chest");
  const [hoveredMuscleId, setHoveredMuscleId] = useState<MuscleGroupId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"EXERCISES" | "STRETCHES" | "ANATOMY">("EXERCISES");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string>("ALL");

  const selectedMuscle = MUSCLE_DEFINITIONS[selectedMuscleId];

  // Helper matching logic between unified exercise library and selected muscle group
  const filteredMovements = useMemo(() => {
    return INITIAL_UNIFIED_EXERCISES.filter((item) => {
      // 1. Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesPrimary = item.primaryMuscles.some((m) => m.toLowerCase().includes(q));
        const matchesSecondary = item.secondaryMuscles.some((m) => m.toLowerCase().includes(q));
        const matchesCategory = item.muscleGroup.toLowerCase().includes(q);
        if (!matchesName && !matchesPrimary && !matchesSecondary && !matchesCategory) {
          return false;
        }
      } else {
        // 2. Muscle Group Match when no search query
        const groupLower = selectedMuscle.name.toLowerCase();
        const catLower = selectedMuscle.category.toLowerCase();
        const idLower = selectedMuscle.id.toLowerCase();

        const matchesMuscle =
          item.muscleGroup.toLowerCase().includes(catLower) ||
          item.primaryMuscles.some((m) => {
            const mLower = m.toLowerCase();
            return (
              mLower.includes(idLower) ||
              selectedMuscle.subMuscles.some((sub) => mLower.includes(sub.toLowerCase().split(" ")[0]))
            );
          });

        if (!matchesMuscle) return false;
      }

      // Equipment Filter
      if (equipmentFilter !== "ALL" && item.equipment !== equipmentFilter) {
        return false;
      }

      return true;
    });
  }, [selectedMuscle, searchQuery, equipmentFilter]);

  const strengthExercises = useMemo(() => {
    return filteredMovements.filter((m) => m.type === "EXERCISE");
  }, [filteredMovements]);

  const mobilityStretches = useMemo(() => {
    return filteredMovements.filter((m) => m.type === "STRETCH" || m.type === "MOBILITY");
  }, [filteredMovements]);

  // Action: Launch live workout focused on selected muscle
  const handleStartWorkout = () => {
    const exerciseNames = strengthExercises.slice(0, 5).map((e) => e.name);
    try {
      localStorage.setItem(
        "strkyr_draft_muscle_workout",
        JSON.stringify({
          name: `${selectedMuscle.name.split(" ")[0]} Power & Hypertrophy Session`,
          targetMuscle: selectedMuscle.name,
          exercises: exerciseNames,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error(e);
    }
    router.push(`/dashboard?action=new_muscle_workout&muscle=${selectedMuscleId}`);
  };

  // Action: Launch recovery session focused on selected muscle
  const handleStartRecovery = () => {
    router.push(`/recovery?focus=${selectedMuscleId}`);
  };

  // Action: Send exercises to program planner
  const handleAddToPlanner = () => {
    router.push(`/dashboard?tab=programs&addMuscleFocus=${selectedMuscleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-semibold text-xs border border-slate-700/60"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles size={16} />
            </span>
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-white bg-clip-text text-transparent">
              Interactive Anatomy &amp; Kinesiology Explorer
            </h1>
          </div>
        </div>

        {/* Global Navigation Links */}
        <div className="flex items-center gap-2">
          <Link
            href="/recovery"
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs font-bold border border-slate-700/60"
          >
            Recovery &amp; Mobility
          </Link>
          <Link
            href="/nutrition"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-xs font-bold border border-slate-700/60"
          >
            Nutrition &amp; Macros
          </Link>
        </div>
      </header>

      {/* Main Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
        {/* Search Bar & Stats Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              data-testid="anatomy-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search muscle, movement, or tendon (e.g., Pecs, Hamstrings, QL)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Muscle Focus Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              data-testid="btn-start-workout"
              onClick={handleStartWorkout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              <Dumbbell size={14} />
              <span>Start {selectedMuscle.name.split(" ")[0]} Workout</span>
            </button>

            <button
              type="button"
              data-testid="btn-start-recovery"
              onClick={handleStartRecovery}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700/80 transition-all"
            >
              <Heart size={14} className="text-emerald-400" />
              <span>Targeted Recovery</span>
            </button>

            <button
              type="button"
              data-testid="btn-add-planner"
              onClick={handleAddToPlanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700/80 transition-all"
            >
              <CalendarPlus size={14} className="text-amber-400" />
              <span>Add to Program</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Anatomical Body Map */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <InteractiveBodyMap
              selectedMuscle={selectedMuscleId}
              onSelectMuscle={(id) => {
                setSelectedMuscleId(id);
                setSearchQuery("");
              }}
              hoveredMuscle={hoveredMuscleId}
              onHoverMuscle={setHoveredMuscleId}
              isDark={true}
            />

            {/* Selected Muscle Deep Anatomical Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
                  <h3 className="text-sm font-black tracking-wide text-white uppercase">{selectedMuscle.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {selectedMuscle.category}
                </span>
              </div>

              {/* Sub-muscles */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedMuscle.subMuscles.map((sub, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    {sub}
                  </span>
                ))}
              </div>

              {/* Functional Kinesiology Role */}
              <div className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="font-bold text-cyan-400">Primary Biomechanical Function: </span>
                {selectedMuscle.primaryRole}
              </div>

              {/* Posture & Tightness Indicator */}
              <div className="text-xs text-amber-300/90 leading-relaxed bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 flex items-start gap-2">
                <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400">Common Imbalance &amp; Tightness: </span>
                  {selectedMuscle.commonTightness}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Movement Catalog (Exercises & Stretches) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Catalog Navigation Tabs */}
            <div className="flex items-center justify-between p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-testid="tab-exercises"
                  onClick={() => setActiveTab("EXERCISES")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "EXERCISES"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Dumbbell size={14} />
                  <span>Targeted Strength ({strengthExercises.length})</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-stretches"
                  onClick={() => setActiveTab("STRETCHES")}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "STRETCHES"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Heart size={14} />
                  <span>Mobility &amp; Stretches ({mobilityStretches.length})</span>
                </button>
              </div>

              {/* Equipment Filter Selector */}
              <select
                aria-label="Filter movements by equipment"
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="bg-slate-950 text-slate-300 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Equipment</option>
                <option value="Barbell">Barbell</option>
                <option value="Dumbbell">Dumbbell</option>
                <option value="Cable">Cable</option>
                <option value="Machine">Machine</option>
                <option value="Bodyweight">Bodyweight</option>
              </select>
            </div>

            {/* Movements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[750px] overflow-y-auto pr-1">
              {(activeTab === "EXERCISES" ? strengthExercises : mobilityStretches).map((movement, idx) => (
                <div
                  key={idx}
                  data-testid={`movement-card-${movement.normalizedName}`}
                  className="group relative rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 p-4 flex flex-col justify-between shadow-lg hover:shadow-cyan-500/10"
                >
                  <div>
                    {/* 3D Anatomy Diagram Preview */}
                    <div
                      onClick={() => setSelectedPreviewImage(movement.diagramUrl || null)}
                      className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden mb-3 cursor-pointer group-hover:border-cyan-500/30 transition-all"
                    >
                      {movement.diagramUrl ? (
                        <img
                          src={movement.diagramUrl}
                          alt={movement.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                          3D Anatomy Visual
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-cyan-400 backdrop-blur-sm border border-slate-800">
                        View 3D
                      </span>
                    </div>

                    {/* Title & Equipment */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {movement.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 shrink-0 border border-slate-700/60">
                        {movement.equipment}
                      </span>
                    </div>

                    {/* Target Muscle Tags */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {movement.primaryMuscles.map((pm, pmi) => (
                        <span
                          key={pmi}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        >
                          {pm}
                        </span>
                      ))}
                    </div>

                    {/* Biomechanical Cue */}
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {movement.biomechanicsCue}
                    </p>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400 font-medium">{movement.breathingPattern ? "Form Verified" : "Unified"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem(
                            "strkyr_direct_exercise_pick",
                            JSON.stringify({
                              name: movement.name,
                              category: movement.muscleGroup,
                            })
                          );
                          router.push("/dashboard");
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>Add to Workout</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {(activeTab === "EXERCISES" ? strengthExercises : mobilityStretches).length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                  <Dumbbell className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-bold text-slate-400">No movements found matching query.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Try selecting another muscle or clearing the search filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Expanded 3D Anatomy Diagram Modal */}
      {selectedPreviewImage && (
        <div
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700/60"
            >
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              Medical 3D Kinesiology &amp; Biomechanical Diagram
            </h3>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={selectedPreviewImage} alt="3D Anatomy" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
