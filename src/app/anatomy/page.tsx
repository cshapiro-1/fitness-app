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
      {/* Main Studio Container */}
      <main className="anatomy-container">
        {/* Mobile View Mode Switcher (Visible on screens <= 1024px) */}
        <div className="anatomy-mobile-switcher">
          <button
            type="button"
            data-testid="mobile-tab-map"
            onClick={() => setMobileTab("MAP")}
            className={`anatomy-mobile-tab ${mobileTab === "MAP" ? "active" : ""}`}
          >
            <Sparkles size={14} />
            <span>3D Body Map</span>
          </button>
          <button
            type="button"
            data-testid="mobile-tab-movements"
            onClick={() => setMobileTab("MOVEMENTS")}
            className={`anatomy-mobile-tab ${mobileTab === "MOVEMENTS" ? "active" : ""}`}
          >
            <Dumbbell size={14} />
            <span>Movements ({strengthExercises.length + mobilityStretches.length})</span>
          </button>
        </div>

        {/* Hero Control Bar: Search & Quick Muscle Action Dispatchers */}
        <div className="anatomy-hero-bar">
          {/* Search Input */}
          <div className="anatomy-search-wrap">
            <Search className="anatomy-search-icon" size={15} />
            <input
              type="text"
              data-testid="anatomy-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search muscle, exercise, or cue..."
              className="anatomy-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="anatomy-search-clear"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Muscle Focus Action Header Buttons */}
          <div className="anatomy-actions">
            <button
              type="button"
              data-testid="btn-start-workout"
              onClick={handleStartWorkout}
              className="btn-primary"
              style={{ fontSize: "12px", padding: "8px 14px" }}
            >
              <Dumbbell size={13} />
              <span>Start {selectedMuscle.shortLabel}</span>
            </button>

            <button
              type="button"
              data-testid="btn-start-recovery"
              onClick={handleStartRecovery}
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <Heart size={13} style={{ color: "#10b981" }} />
              <span>Recovery</span>
            </button>

            <button
              type="button"
              data-testid="btn-add-planner"
              onClick={handleAddToPlanner}
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "8px 12px" }}
            >
              <CalendarPlus size={13} style={{ color: "#f59e0b" }} />
              <span>Add to Program</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split Studio Layout */}
        <div className="anatomy-grid">
          {/* Left Column: Interactive Anatomical Body Map & Muscle Detail Card */}
          <div
            className="anatomy-left-col"
            style={{
              display: typeof window !== "undefined" && window.innerWidth <= 1024 && mobileTab !== "MAP" ? "none" : "flex",
            }}
          >
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
              className="btn-primary hide-desktop"
              style={{
                width: "100%",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            >
              <span>View {selectedMuscle.shortLabel} Exercises ({filteredMovements.length})</span>
              <ChevronRight size={16} />
            </button>

            {/* Selected Muscle Deep Anatomical Card */}
            <div className="anatomy-details-card">
              <div className="anatomy-details-header">
                <div className="anatomy-details-title">
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                  <span>{selectedMuscle.name}</span>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: "20px",
                    background: isDark ? "rgba(37,99,235,0.2)" : "#eff6ff",
                    color: isDark ? "#93c5fd" : "#1d4ed8",
                    border: isDark ? "1px solid rgba(37,99,235,0.4)" : "1px solid #bfdbfe",
                  }}
                >
                  {selectedMuscle.category}
                </span>
              </div>

              {/* Sub-muscles List */}
              <div className="anatomy-details-submuscles">
                {selectedMuscle.subMuscles.map((sub, i) => (
                  <span key={i} className="anatomy-submuscle-tag">
                    {sub}
                  </span>
                ))}
              </div>

              {/* Functional Kinesiology Role */}
              <div className="anatomy-role-box">
                <span style={{ fontWeight: 700, display: "block", marginBottom: "2px" }}>Primary Biomechanical Function:</span>
                {selectedMuscle.primaryRole}
              </div>

              {/* Posture & Tightness Indicator */}
              <div className="anatomy-tightness-box">
                <ShieldAlert size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ fontWeight: 700, display: "block", marginBottom: "2px" }}>Common Imbalance &amp; Tightness:</span>
                  {selectedMuscle.commonTightness}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Movement Catalog (Exercises & Stretches) */}
          <div
            className="anatomy-right-col"
            style={{
              display: typeof window !== "undefined" && window.innerWidth <= 1024 && mobileTab !== "MOVEMENTS" ? "none" : "flex",
            }}
          >
            {/* Catalog Navigation Tabs */}
            <div className="anatomy-catalog-header">
              <div className="anatomy-catalog-tabs">
                <button
                  type="button"
                  data-testid="tab-exercises"
                  onClick={() => setActiveTab("EXERCISES")}
                  className={`anatomy-catalog-tab ${activeTab === "EXERCISES" ? "active" : ""}`}
                >
                  <Dumbbell size={13} />
                  <span>Strength ({strengthExercises.length})</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-stretches"
                  onClick={() => setActiveTab("STRETCHES")}
                  className={`anatomy-catalog-tab ${activeTab === "STRETCHES" ? "active" : ""}`}
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
                className="anatomy-equipment-select"
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
            <div className="anatomy-movements-grid">
              {(activeTab === "EXERCISES" ? strengthExercises : mobilityStretches).map((movement, idx) => (
                <div
                  key={idx}
                  data-testid={`movement-card-${movement.normalizedName}`}
                  className="anatomy-movement-card"
                >
                  <div className="anatomy-card-top">
                    {/* Compact Diagram Thumbnail */}
                    <div
                      data-testid={`diagram-thumbnail-${movement.normalizedName}`}
                      title="Click to inspect 3D biomechanics diagram"
                      onClick={() => setSelectedPreviewImage(movement.diagramUrl || null)}
                      className="anatomy-thumb-wrap"
                    >
                      {movement.diagramUrl ? (
                        <img
                          src={movement.diagramUrl}
                          alt={movement.name}
                          className="anatomy-thumb-img"
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "10px" }}>
                          3D Visual
                        </div>
                      )}
                    </div>

                    <div className="anatomy-card-info">
                      {/* Title & Equipment */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
                        <h4 className="anatomy-movement-name">
                          {movement.name}
                        </h4>
                        <span className="anatomy-badge anatomy-badge-gear">
                          {movement.equipment}
                        </span>
                      </div>

                      {/* Target Muscle Tags */}
                      <div className="anatomy-movement-badges">
                        {movement.primaryMuscles.map((pm, pmi) => (
                          <span key={pmi} className="anatomy-badge anatomy-badge-muscle">
                            {pm}
                          </span>
                        ))}
                      </div>

                      {/* Biomechanical Cue */}
                      <p className="anatomy-cue-text">
                        {movement.biomechanicsCue}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="anatomy-card-actions">
                    <span style={{ color: "var(--text-3)", fontSize: "10px", fontWeight: 600 }}>
                      {movement.breathingPattern ? "Form Verified" : "Unified"}
                    </span>
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
                      className="anatomy-btn-add"
                    >
                      <span>Add to Workout</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {(activeTab === "EXERCISES" ? strengthExercises : mobilityStretches).length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "48px 16px",
                    textAlign: "center",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-2)",
                  }}
                >
                  <Dumbbell style={{ width: "32px", height: "32px", margin: "0 auto 8px", opacity: 0.4 }} />
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>No movements found matching query.</p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "4px" }}>Try selecting another muscle or clearing the search filter.</p>
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
          className="anatomy-modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anatomy-modal-content"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
                Medical 3D Kinesiology &amp; Biomechanical Diagram
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className="btn-secondary"
                style={{ padding: "5px 8px", borderRadius: "8px" }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ aspectRatio: "16 / 9", width: "100%", borderRadius: "12px", overflow: "hidden", background: "#070b14", border: "1px solid #1e293b" }}>
              <img src={selectedPreviewImage} alt="3D Anatomy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
