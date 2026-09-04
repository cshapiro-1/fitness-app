"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ArrowLeft,
  Search,
  Dumbbell,
  Sparkles,
  CalendarPlus,
  Heart,
  ShieldAlert,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  X,
  Layers,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  MUSCLE_DEFINITIONS,
  MuscleGroupId,
} from "@/components/InteractiveBodyMap";
import { INITIAL_UNIFIED_EXERCISES } from "@/lib/unifiedExerciseLibrary";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { UserAvatar } from "@/components/UserAvatar";

const InteractiveBodyMap = dynamic(
  () => import("@/components/InteractiveBodyMap").then((mod) => mod.InteractiveBodyMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-[290px] sm:max-w-[340px] aspect-[4/5] sm:aspect-[9/14] rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center gap-3 p-6 text-center animate-pulse">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-sm">
          <Sparkles size={20} className="animate-spin" style={{ animationDuration: "4s" }} />
        </div>
        <p className="text-xs font-black text-slate-800 dark:text-white tracking-wide">Initializing 3D Anatomy Engine</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Mounting WebGL canvas &amp; models...</p>
      </div>
    ),
  }
);

export default function AnatomyExplorerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleGroupId>("chest");
  const [hoveredMuscleId, setHoveredMuscleId] = useState<MuscleGroupId | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"EXERCISES" | "STRETCHES">("EXERCISES");
  const [mobileTab, setMobileTab] = useState<"MAP" | "MOVEMENTS">("MAP");
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string>("ALL");
  const [isDark, setIsDark] = useState(false);

  // Sync theme with STRKYR app theme state
  useEffect(() => {
    document.title = "Anatomy & Kinesiology Explorer | STRKYR";
    try {
      const savedTheme = localStorage.getItem("strkyr_theme_dark");
      let activeDark = false;
      if (savedTheme !== null) {
        activeDark = savedTheme === "true";
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        activeDark = true;
      }
      setIsDark(activeDark);
      document.documentElement.classList.toggle("dark", activeDark);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("strkyr_theme_dark", String(next));
      document.documentElement.classList.toggle("dark", next);
    } catch {}
  };

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
          name: `${selectedMuscle.shortLabel} Session`,
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
    <div
      className={`app ${isDark ? "dark-theme" : ""}`}
      style={{
        minHeight: "100vh",
        background: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#f8fafc" : "#0f172a",
      }}
    >
      {/* Unified STRKYR Header */}
      <header
        className="header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: isDark ? "#1e293b" : "#ffffff",
          borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          padding: "0 16px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Header Left: Dashboard Return + STRKYR Brand + Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/dashboard"
            className="nav-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 600,
              padding: "6px 10px",
              borderRadius: "8px",
            }}
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="hide-mobile">Dashboard</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "inherit" }}>
              <StrkyrLogo size={22} />
              <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "-0.02em" }}>STRKYR</span>
            </Link>
            <span style={{ color: isDark ? "#475569" : "#cbd5e1" }}>/</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 700, fontSize: "13px", color: isDark ? "#94a3b8" : "#475569" }}>
              <Sparkles size={13} style={{ color: "#2563eb" }} />
              <span className="truncate max-w-[120px] sm:max-w-none">Anatomy Explorer</span>
            </div>
          </div>
        </div>

        {/* Header Right: Section Nav + Theme Toggle + User Avatar / Sign Out */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Link
            href="/recovery"
            className="nav-btn hide-mobile"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}
          >
            <Heart size={14} style={{ color: "#10b981" }} />
            <span>Recovery</span>
          </Link>

          <Link
            href="/nutrition"
            className="nav-btn hide-mobile"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}
          >
            <span>Nutrition</span>
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            className="nav-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ padding: "6px 9px" }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Profile / Sign Out */}
          {session?.user && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <UserAvatar src={session.user.image} name={session.user.name || "User"} size={26} />
              <button
                type="button"
                className="nav-btn nav-btn-danger hide-mobile"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                title="Sign out"
                style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 8px" }}
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Studio Container */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 12px 64px", width: "100%" }} className="flex flex-col gap-4 sm:gap-6">
        {/* Mobile View Mode Switcher (Visible on mobile screens < lg) */}
        <div className="lg:hidden flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            data-testid="mobile-tab-map"
            onClick={() => setMobileTab("MAP")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "MAP"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Sparkles size={14} />
            <span>3D Body Map</span>
          </button>
          <button
            type="button"
            data-testid="mobile-tab-movements"
            onClick={() => setMobileTab("MOVEMENTS")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "MOVEMENTS"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Dumbbell size={14} />
            <span>Movements ({strengthExercises.length + mobilityStretches.length})</span>
          </button>
        </div>

        {/* Hero Control Bar: Search & Quick Muscle Action Dispatchers */}
        <div
          className={`flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl transition-all ${
            isDark
              ? "bg-slate-900 border border-slate-800 shadow-xl"
              : "bg-white border border-slate-200 shadow-sm"
          }`}
        >
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              data-testid="anatomy-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search muscle, exercise, or cue..."
              className={`w-full pl-9 pr-4 py-1.5 sm:py-2 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                isDark
                  ? "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Muscle Focus Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              data-testid="btn-start-workout"
              onClick={handleStartWorkout}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Dumbbell size={13} />
              <span>Start {selectedMuscle.shortLabel}</span>
            </button>

            <button
              type="button"
              data-testid="btn-start-recovery"
              onClick={handleStartRecovery}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs border transition-all ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              <Heart size={13} className="text-emerald-500" />
              <span>Recovery</span>
            </button>

            <button
              type="button"
              data-testid="btn-add-planner"
              onClick={handleAddToPlanner}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl font-bold text-xs border transition-all ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              <CalendarPlus size={13} className="text-amber-500" />
              <span className="hide-mobile">Add to Program</span>
              <span className="sm:hidden">Program</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Interactive Anatomical Body Map & Muscle Detail Card */}
          <div className={`lg:col-span-5 flex-col gap-4 ${mobileTab === "MAP" ? "flex" : "hidden lg:flex"}`}>
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

            {/* Mobile Quick Action Link to Switch to Movements */}
            <button
              type="button"
              onClick={() => setMobileTab("MOVEMENTS")}
              className="lg:hidden w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-between shadow-sm transition-all"
            >
              <span>View {selectedMuscle.shortLabel} Exercises ({filteredMovements.length})</span>
              <ChevronRight size={16} />
            </button>

            {/* Selected Muscle Deep Anatomical Card */}
            <div
              className={`p-4 sm:p-5 rounded-3xl transition-all ${
                isDark
                  ? "bg-slate-900 border border-slate-800 shadow-xl"
                  : "bg-white border border-slate-200 shadow-sm"
              } flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-500/50" />
                  <h3 className="text-sm font-black tracking-wide uppercase">{selectedMuscle.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  {selectedMuscle.category}
                </span>
              </div>

              {/* Sub-muscles List */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedMuscle.subMuscles.map((sub, i) => (
                  <span
                    key={i}
                    className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                      isDark
                        ? "bg-slate-800 text-slate-300 border-slate-700/60"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {sub}
                  </span>
                ))}
              </div>

              {/* Functional Kinesiology Role */}
              <div
                className={`text-xs mt-1.5 leading-relaxed p-3 rounded-2xl border ${
                  isDark
                    ? "bg-slate-950/70 text-slate-300 border-slate-800"
                    : "bg-blue-50/40 text-slate-700 border-blue-100"
                }`}
              >
                <span className="font-bold text-blue-600 dark:text-cyan-400">Primary Biomechanical Function: </span>
                {selectedMuscle.primaryRole}
              </div>

              {/* Posture & Tightness Indicator */}
              <div
                className={`text-xs leading-relaxed p-3 rounded-2xl border flex items-start gap-2.5 ${
                  isDark
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                    : "bg-amber-50/80 text-amber-800 border-amber-200"
                }`}
              >
                <ShieldAlert size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-600 dark:text-amber-400">Common Imbalance &amp; Tightness: </span>
                  {selectedMuscle.commonTightness}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Movement Catalog (Exercises & Stretches) */}
          <div className={`lg:col-span-7 flex-col gap-4 ${mobileTab === "MOVEMENTS" ? "flex" : "hidden lg:flex"}`}>
            {/* Catalog Navigation Tabs */}
            <div
              className={`flex items-center justify-between p-1.5 rounded-2xl border ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-testid="tab-exercises"
                  onClick={() => setActiveTab("EXERCISES")}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "EXERCISES"
                      ? "bg-blue-600 text-white shadow-sm"
                      : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Dumbbell size={13} />
                  <span>Strength ({strengthExercises.length})</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-stretches"
                  onClick={() => setActiveTab("STRETCHES")}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "STRETCHES"
                      ? "bg-blue-600 text-white shadow-sm"
                      : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Heart size={13} />
                  <span>Stretches ({mobilityStretches.length})</span>
                </button>
              </div>

              {/* Equipment Filter Selector */}
              <select
                aria-label="Filter movements by equipment"
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl border focus:outline-none transition-all ${
                  isDark
                    ? "bg-slate-950 text-slate-200 border-slate-800 focus:border-blue-500"
                    : "bg-slate-50 text-slate-700 border-slate-200 focus:border-blue-500"
                }`}
              >
                <option value="ALL">All Gear</option>
                <option value="Barbell">Barbell</option>
                <option value="Dumbbell">Dumbbell</option>
                <option value="Cable">Cable</option>
                <option value="Machine">Machine</option>
                <option value="Bodyweight">Bodyweight</option>
              </select>
            </div>

            {/* Movements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-h-[750px] overflow-y-auto pr-1">
              {(activeTab === "EXERCISES" ? strengthExercises : mobilityStretches).map((movement, idx) => (
                <div
                  key={idx}
                  data-testid={`movement-card-${movement.normalizedName}`}
                  className={`group relative rounded-2xl border transition-all duration-200 p-3 sm:p-4 flex flex-col justify-between ${
                    isDark
                      ? "bg-slate-900/90 border-slate-800 hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10"
                      : "bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex flex-row md:flex-col gap-3">
                    {/* Compact Diagram Thumbnail on Mobile / Video on Desktop */}
                    <div
                      data-testid={`diagram-thumbnail-${movement.normalizedName}`}
                      title="Click to inspect 3D biomechanics diagram"
                      onClick={() => setSelectedPreviewImage(movement.diagramUrl || null)}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-full md:aspect-video rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden shrink-0 cursor-pointer group-hover:border-blue-500/40 transition-all"
                    >
                      {movement.diagramUrl ? (
                        <img
                          src={movement.diagramUrl}
                          alt={movement.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                          3D Visual
                        </div>
                      )}
                      <span className="hidden md:inline-block absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-cyan-400 backdrop-blur-sm border border-slate-800">
                        View 3D
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title & Equipment */}
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <h4 className={`text-xs font-bold leading-snug transition-colors line-clamp-1 ${isDark ? "text-white group-hover:text-blue-400" : "text-slate-900 group-hover:text-blue-600"}`}>
                          {movement.name}
                        </h4>
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border ${
                            isDark
                              ? "bg-slate-800 text-slate-300 border-slate-700/60"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {movement.equipment}
                        </span>
                      </div>

                      {/* Target Muscle Tags */}
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {movement.primaryMuscles.map((pm, pmi) => (
                          <span
                            key={pmi}
                            className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                          >
                            {pm}
                          </span>
                        ))}
                      </div>

                      {/* Biomechanical Cue */}
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 leading-relaxed mb-2">
                        {movement.biomechanicsCue}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className={`flex items-center justify-between pt-2 border-t text-[11px] ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    <span className="text-slate-400 font-medium text-[10px]">{movement.breathingPattern ? "Form Verified" : "Unified"}</span>
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
                      className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <span>Add to Workout</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {(activeTab === "EXERCISES" ? strengthExercises : mobilityStretches).length === 0 && (
                <div
                  className={`col-span-full py-12 text-center rounded-2xl border ${
                    isDark
                      ? "text-slate-500 bg-slate-900/40 border-slate-800/60"
                      : "text-slate-500 bg-slate-50 border-slate-200"
                  }`}
                >
                  <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No movements found matching query.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try selecting another muscle or clearing the search filter.</p>
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-2xl w-full max-h-[88vh] rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden border flex flex-col ${
              isDark
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                Medical 3D Kinesiology &amp; Biomechanical Diagram
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className={`p-1.5 rounded-xl border transition-all ${
                  isDark
                    ? "bg-slate-800 text-slate-400 hover:text-white border-slate-700"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                }`}
              >
                <X size={16} />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={selectedPreviewImage} alt="3D Anatomy" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
