"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  Search,
  Dumbbell,
  Zap,
  Flame,
  Layers,
  BarChart2,
  PieChart,
  Target,
  Scale,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { DashboardAnalytics, ExerciseTrendPoint, ExerciseAnalytics } from "../utils/analytics";

interface AnalyticsViewProps {
  analytics: DashboardAnalytics;
}

type LineMetricType = "topWeight" | "estimatedOneRepMax" | "totalVolume";
type BarMetricType = "maxWeight" | "maxEstimated1RM" | "totalVolume" | "totalSets" | "sessions";

// ==========================================
// 1. Interactive SVG Line Chart (Progression)
// ==========================================
function ExerciseLineChart({ points, metric }: { points: ExerciseTrendPoint[]; metric: LineMetricType }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points || points.length === 0) return null;

  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 25, right: 35, bottom: 45, left: 55 };

  const values = points.map((p) => p[metric]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 10;

  const yMin = Math.max(0, Math.floor(minVal - range * 0.1));
  const yMax = Math.ceil(maxVal + range * 0.1);

  const coords = points.map((p, index) => {
    const x =
      points.length === 1
        ? (svgWidth + padding.left) / 2
        : padding.left + (index / (points.length - 1)) * (svgWidth - padding.left - padding.right);
    const y =
      svgHeight - padding.bottom - ((p[metric] - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
    return { x, y, point: p };
  });

  const pathD = coords.reduce((acc, c, i) => (i === 0 ? `M ${c.x},${c.y}` : `${acc} L ${c.x},${c.y}`), "");
  const areaD =
    coords.length > 1
      ? `${pathD} L ${coords[coords.length - 1].x},${svgHeight - padding.bottom} L ${coords[0].x},${svgHeight - padding.bottom} Z`
      : "";

  const yTicks = [0, 1, 2, 3].map((i) => Math.round(yMin + (i / 3) * (yMax - yMin)));

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto", minWidth: "320px" }}>
        {/* Background Grid Lines */}
        {yTicks.map((tick, i) => {
          const y = svgHeight - padding.bottom - ((tick - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{tick}</text>
            </g>
          );
        })}

        {/* Shaded Area Under Line */}
        {areaD && <path d={areaD} fill="url(#blue-gradient)" opacity="0.15" />}

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main Line */}
        {pathD && <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Data Points */}
        {coords.map((c, idx) => (
          <g key={idx}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hoveredIdx === idx ? "6" : "4"}
              fill={hoveredIdx === idx ? "#1d4ed8" : "#2563eb"}
              stroke="#ffffff"
              strokeWidth="2"
              style={{ cursor: "pointer", transition: "all 0.15s ease" }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {/* X Axis Date Label */}
            <text x={c.x} y={svgHeight - 12} textAnchor="middle" fontSize="10" fill="#64748b">
              {new Date(c.point.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIdx !== null && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "#0f172a",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 600, color: "#93c5fd" }}>
            {new Date(points[hoveredIdx].completedAt).toLocaleDateString()}
          </div>
          <div>Weight: <b>{points[hoveredIdx].topWeight} lbs</b> × {points[hoveredIdx].topReps} reps</div>
          <div>Est. 1RM: <b>{points[hoveredIdx].estimatedOneRepMax} lbs</b></div>
          <div>Session Volume: <b>{points[hoveredIdx].totalVolume.toLocaleString()} lbs</b></div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 2. Interactive SVG Bar Chart (Muscle Group Exercise Comparison)
// ========================================================
function MuscleGroupBarChart({
  exercises,
  metric,
  onSelectExercise,
  selectedExerciseName,
}: {
  exercises: ExerciseAnalytics[];
  metric: BarMetricType;
  onSelectExercise: (name: string) => void;
  selectedExerciseName: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!exercises || exercises.length === 0) {
    return <div className="empty-state" style={{ padding: "20px" }}>No exercises logged for this muscle group.</div>;
  }

  // Sort exercises by selected metric descending
  const sorted = [...exercises].sort((a, b) => b[metric] - a[metric]);
  const maxValue = Math.max(...sorted.map((e) => e[metric]), 1);

  const getMetricDisplay = (val: number, m: BarMetricType) => {
    if (m === "maxWeight" || m === "maxEstimated1RM") return `${val} lbs`;
    if (m === "totalVolume") return `${val.toLocaleString()} lbs`;
    if (m === "totalSets") return `${val} sets`;
    if (m === "sessions") return `${val} sessions`;
    return `${val}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {sorted.map((ex, idx) => {
        const val = ex[metric];
        const pct = Math.max(8, Math.round((val / maxValue) * 100));
        const isSelected = selectedExerciseName === ex.name;
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={ex.name}
            onClick={() => onSelectExercise(ex.name)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              padding: "6px 8px",
              borderRadius: "8px",
              background: isSelected ? "#eff6ff" : isHovered ? "#f8fafc" : "transparent",
              border: `1px solid ${isSelected ? "#bfdbfe" : "transparent"}`,
              transition: "all 0.15s ease",
            }}
            title="Click to view full progression graph below"
          >
            {/* Top Label Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? "#1d4ed8" : "#0f172a" }}>
                  {ex.name}
                </span>
                <span style={{ fontSize: "10px", color: "#64748b", background: "#f1f5f9", padding: "1px 5px", borderRadius: "4px" }}>
                  {ex.muscleGroup}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "12px", color: isSelected ? "#2563eb" : "#334155" }}>
                {getMetricDisplay(val, metric)}
              </div>
            </div>

            {/* Visual Bar Track */}
            <div style={{ width: "100%", height: "14px", background: "#f1f5f9", borderRadius: "7px", overflow: "hidden", position: "relative" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: isSelected
                    ? "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)"
                    : "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)",
                  borderRadius: "7px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 3. Main AnalyticsView Component
// ==========================================
export function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("All");
  const [barMetric, setBarMetric] = useState<BarMetricType>("maxWeight");
  const [chartMetric, setChartMetric] = useState<LineMetricType>("topWeight");
  const [searchQuery, setSearchQuery] = useState("");

  const muscleGroupOptions = useMemo(() => {
    const groups = ["All", ...analytics.muscleGroups.map((mg) => mg.name)];
    return Array.from(new Set(groups));
  }, [analytics.muscleGroups]);

  const filteredExercises = useMemo(() => {
    return analytics.exercises.filter((ex) => {
      const matchesGroup = selectedMuscleGroup === "All" || ex.muscleGroup === selectedMuscleGroup;
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [analytics.exercises, selectedMuscleGroup, searchQuery]);

  const [selectedExerciseName, setSelectedExerciseName] = useState<string>(
    filteredExercises[0]?.name || analytics.exercises[0]?.name || ""
  );

  // Keep selectedExercise in sync when filtering changes
  const activeExercise: ExerciseAnalytics | undefined = useMemo(() => {
    const found = filteredExercises.find((ex) => ex.name === selectedExerciseName);
    return found || filteredExercises[0] || analytics.exercises[0];
  }, [filteredExercises, selectedExerciseName, analytics.exercises]);

  // Push vs. Pull Symmetry calculation
  const symmetry = useMemo(() => {
    const pushMuscles = ["Chest", "Shoulders"];
    const pullMuscles = ["Back", "Arms"];
    const lowerMuscles = ["Legs"];

    let pushVol = 0;
    let pullVol = 0;
    let upperVol = 0;
    let lowerVol = 0;

    analytics.exercises.forEach((ex) => {
      if (pushMuscles.includes(ex.muscleGroup)) pushVol += ex.totalVolume;
      if (pullMuscles.includes(ex.muscleGroup)) pullVol += ex.totalVolume;
      if (lowerMuscles.includes(ex.muscleGroup)) lowerVol += ex.totalVolume;
      else upperVol += ex.totalVolume;
    });

    const pushPullRatio = pullVol > 0 ? (pushVol / pullVol).toFixed(2) : "1.00";
    const upperLowerRatio = lowerVol > 0 ? (upperVol / lowerVol).toFixed(2) : "1.00";

    return { pushVol, pullVol, upperVol, lowerVol, pushPullRatio, upperLowerRatio };
  }, [analytics.exercises]);

  // Volume distribution by muscle group
  const volumeDistribution = useMemo(() => {
    const total = analytics.overall.totalVolume || 1;
    return analytics.muscleGroups.map((mg) => ({
      name: mg.name,
      volume: mg.totalVolume,
      percent: Math.round((mg.totalVolume / total) * 100),
      sets: mg.totalSets,
    })).sort((a, b) => b.volume - a.volume);
  }, [analytics.muscleGroups, analytics.overall.totalVolume]);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with Title and Muscle Group Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={22} style={{ color: "#2563eb" }} />
          <h3 className="section-title" style={{ margin: 0, fontSize: "18px" }}>Performance Analytics &amp; Strength Intelligence</h3>
        </div>

        {/* Muscle Group Filter Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "4px" }}>
          {muscleGroupOptions.map((group) => (
            <button
              key={group}
              onClick={() => {
                setSelectedMuscleGroup(group);
                const firstInGroup = analytics.exercises.find((ex) => group === "All" || ex.muscleGroup === group);
                if (firstInGroup) setSelectedExerciseName(firstInGroup.name);
              }}
              style={{
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: selectedMuscleGroup === group ? "#2563eb" : "transparent",
                color: selectedMuscleGroup === group ? "#ffffff" : "#64748b",
                boxShadow: selectedMuscleGroup === group ? "0 1px 3px rgba(37,99,235,0.2)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {!analytics.workouts.length ? (
        <div className="empty-state">Log workouts to unlock progress graphs, muscle group charts, and strength analytics.</div>
      ) : (
        <>
          {/* Top Overall Summary Grid */}
          <div className="analytics-summary-grid">
            <div className="analytics-summary-card">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" }}>
                <Calendar size={14} /> Workouts
              </div>
              <span className="analytics-summary-value">{analytics.overall.totalWorkouts}</span>
            </div>

            <div className="analytics-summary-card">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" }}>
                <Dumbbell size={14} /> Total Sets
              </div>
              <span className="analytics-summary-value">{analytics.overall.totalSets}</span>
            </div>

            <div className="analytics-summary-card">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" }}>
                <Zap size={14} /> Total Volume
              </div>
              <span className="analytics-summary-value" style={{ fontSize: "20px" }}>
                {analytics.overall.totalVolume.toLocaleString()} <span style={{ fontSize: "12px", color: "#64748b" }}>lbs</span>
              </span>
            </div>

            <div className="analytics-summary-card">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" }}>
                <Flame size={14} /> Frequency
              </div>
              <span className="analytics-summary-value">{analytics.overall.weeklyAvgWorkouts} <span style={{ fontSize: "12px", color: "#64748b" }}>/wk</span></span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 1: MUSCLE GROUP EXERCISE COMPARISON BAR CHART     */}
          {/* ========================================================= */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart2 size={20} style={{ color: "#2563eb" }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                    {selectedMuscleGroup === "All" ? "All Logged Exercises" : `${selectedMuscleGroup} Exercises`} Comparison
                  </h4>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Showing {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} · Click any bar to open its timeline
                  </span>
                </div>
              </div>

              {/* Bar Metric Switcher */}
              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "3px", flexWrap: "wrap" }}>
                {(
                  [
                    { label: "Max Weight", value: "maxWeight" },
                    { label: "Est. 1RM", value: "maxEstimated1RM" },
                    { label: "Total Volume", value: "totalVolume" },
                    { label: "Sets", value: "totalSets" },
                    { label: "Sessions", value: "sessions" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setBarMetric(m.value)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: barMetric === m.value ? "#2563eb" : "transparent",
                      color: barMetric === m.value ? "#ffffff" : "#475569",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Render Horizontal SVG Bar Chart */}
            <MuscleGroupBarChart
              exercises={filteredExercises}
              metric={barMetric}
              selectedExerciseName={activeExercise?.name || ""}
              onSelectExercise={(name) => setSelectedExerciseName(name)}
            />
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: EXERCISE PROGRESSION LINE CHART & 1RM TIERS     */}
          {/* ========================================================= */}
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: "1 1 240px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Selected Exercise Progression Timeline
                </label>
                <select
                  className="input"
                  value={activeExercise?.name || ""}
                  onChange={(e) => setSelectedExerciseName(e.target.value)}
                  style={{ width: "100%", fontWeight: 600, fontSize: "14px", padding: "8px 12px" }}
                >
                  {filteredExercises.map((ex) => (
                    <option key={ex.name} value={ex.name}>
                      {ex.name} ({ex.muscleGroup}) — Max {ex.maxWeight} lbs
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Metric Switcher */}
              <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "4px" }}>
                {(
                  [
                    { label: "Top Weight", value: "topWeight" },
                    { label: "Est. 1RM", value: "estimatedOneRepMax" },
                    { label: "Session Volume", value: "totalVolume" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setChartMetric(m.value)}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: chartMetric === m.value ? "#2563eb" : "transparent",
                      color: chartMetric === m.value ? "#ffffff" : "#475569",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {activeExercise ? (
              <>
                {/* Exercise Line Chart */}
                <ExerciseLineChart points={activeExercise.trend} metric={chartMetric} />

                {/* Quick Stats Banner under Chart */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "16px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Max Logged Weight</span>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>{activeExercise.maxWeight} lbs</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Est. 1-Rep Max</span>
                    <strong style={{ fontSize: "16px", color: "#2563eb" }}>{activeExercise.maxEstimated1RM} lbs</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Total Volume</span>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>{activeExercise.totalVolume.toLocaleString()} lbs</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Strength Growth</span>
                    <strong style={{ fontSize: "16px", color: activeExercise.weightChangePercent >= 0 ? "#16a34a" : "#dc2626" }}>
                      {activeExercise.weightChangePercent > 0 ? `+${activeExercise.weightChangePercent}%` : `${activeExercise.weightChangePercent}%`}
                    </strong>
                  </div>
                </div>

                {/* 1RM Intensity Target Tiers */}
                {activeExercise.maxEstimated1RM > 0 && (
                  <div style={{ marginTop: "14px", background: "#ffffff", border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "10px 14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      🎯 Working Weight Intensity Tiers (Based on {activeExercise.maxEstimated1RM} lbs Est. 1RM):
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", textAlign: "center" }}>
                      <div style={{ background: "#fef2f2", padding: "6px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                        <div style={{ fontSize: "10px", color: "#991b1b", fontWeight: 700 }}>90% (Power/1-3 reps)</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#991b1b" }}>{Math.round(activeExercise.maxEstimated1RM * 0.9)} lbs</div>
                      </div>
                      <div style={{ background: "#eff6ff", padding: "6px", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                        <div style={{ fontSize: "10px", color: "#1d4ed8", fontWeight: 700 }}>80% (Strength/5-6 reps)</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#1d4ed8" }}>{Math.round(activeExercise.maxEstimated1RM * 0.8)} lbs</div>
                      </div>
                      <div style={{ background: "#f0fdf4", padding: "6px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                        <div style={{ fontSize: "10px", color: "#166534", fontWeight: 700 }}>70% (Hypertrophy/8-12 reps)</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#166534" }}>{Math.round(activeExercise.maxEstimated1RM * 0.7)} lbs</div>
                      </div>
                      <div style={{ background: "#f8fafc", padding: "6px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "10px", color: "#475569", fontWeight: 700 }}>60% (Endurance/15+ reps)</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#334155" }}>{Math.round(activeExercise.maxEstimated1RM * 0.6)} lbs</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">Select an exercise above to view its graph.</div>
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: PR HALL OF FAME & TRAINING SYMMETRY / BALANCE */}
          {/* ========================================================= */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {/* PR Hall of Fame */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Award size={18} style={{ color: "#eab308" }} />
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Personal Record Hall of Fame</h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {analytics.overall.heaviestSet && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fefce8", border: "1px solid #fef08a", padding: "8px 12px", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#854d0e", fontWeight: 700 }}>🏆 Heaviest Absolute Set</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{analytics.overall.heaviestSet.exercise}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#854d0e" }}>{analytics.overall.heaviestSet.weight} lbs</div>
                      <div style={{ fontSize: "10px", color: "#a16207" }}>× {analytics.overall.heaviestSet.reps} reps</div>
                    </div>
                  </div>
                )}

                {analytics.overall.best1RM && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 12px", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 700 }}>⚡ Peak Est. 1-Rep Max</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{analytics.overall.best1RM.exercise}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#1d4ed8" }}>{analytics.overall.best1RM.estimated1RM} lbs</div>
                      <div style={{ fontSize: "10px", color: "#2563eb" }}>({analytics.overall.best1RM.weight} lbs × {analytics.overall.best1RM.reps})</div>
                    </div>
                  </div>
                )}

                {analytics.overall.highestRepSet && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#166534", fontWeight: 700 }}>🔁 High-Rep Endurance PR</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{analytics.overall.highestRepSet.exercise}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#166534" }}>{analytics.overall.highestRepSet.reps} reps</div>
                      <div style={{ fontSize: "10px", color: "#15803d" }}>@ {analytics.overall.highestRepSet.weight} lbs</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Muscle Volume Distribution & Symmetry */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <PieChart size={18} style={{ color: "#2563eb" }} />
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Volume Distribution &amp; Balance</h4>
              </div>

              {/* Volume Distribution Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {volumeDistribution.map((item) => (
                  <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 600 }}>
                      <span style={{ color: "#334155" }}>{item.name}</span>
                      <span style={{ color: "#64748b" }}>{item.percent}% ({item.volume.toLocaleString()} lbs)</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${item.percent}%`, height: "100%", background: "#2563eb", borderRadius: "4px" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Push / Pull Symmetry Indicators */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Push : Pull Ratio</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{symmetry.pushPullRatio} : 1.0</div>
                  <div style={{ fontSize: "10px", color: "#16a34a" }}>Ideal: 1.0 - 1.2</div>
                </div>

                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Upper : Lower Ratio</div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{symmetry.upperLowerRatio} : 1.0</div>
                  <div style={{ fontSize: "10px", color: "#2563eb" }}>Balanced training</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}