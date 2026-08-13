"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, Award, Calendar, Search, Dumbbell, Zap, Flame, Layers } from "lucide-react";
import { DashboardAnalytics, ExerciseTrendPoint, ExerciseAnalytics } from "../utils/analytics";

interface AnalyticsViewProps {
  analytics: DashboardAnalytics;
}

type MetricType = "topWeight" | "estimatedOneRepMax" | "totalVolume";

// Interactive SVG Line Chart for a single exercise
function ExerciseLineChart({ points, metric }: { points: ExerciseTrendPoint[]; metric: MetricType }) {
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
    const x = points.length === 1 
      ? (svgWidth + padding.left) / 2 
      : padding.left + (index / (points.length - 1)) * (svgWidth - padding.left - padding.right);
    const y = svgHeight - padding.bottom - ((p[metric] - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
    return { x, y, point: p };
  });

  const pathD = coords.reduce((acc, c, i) => (i === 0 ? `M ${c.x},${c.y}` : `${acc} L ${c.x},${c.y}`), "");
  const areaD = coords.length > 1 
    ? `${pathD} L ${coords[coords.length - 1].x},${svgHeight - padding.bottom} L ${coords[0].x},${svgHeight - padding.bottom} Z`
    : "";

  const yTicks = [0, 1, 2, 3].map((i) => Math.round(yMin + (i / 3) * (yMax - yMin)));

  const metricLabel = metric === "topWeight" ? "Top Weight (lbs)" : metric === "estimatedOneRepMax" ? "Est. 1RM (lbs)" : "Volume (lbs)";

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

export function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>(
    analytics.exercises[0]?.name || ""
  );
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("All");
  const [chartMetric, setChartMetric] = useState<MetricType>("topWeight");
  const [searchQuery, setSearchQuery] = useState("");

  const activeExercise: ExerciseAnalytics | undefined = useMemo(() => {
    return analytics.exercises.find((ex) => ex.name === selectedExerciseName) || analytics.exercises[0];
  }, [analytics.exercises, selectedExerciseName]);

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

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={22} style={{ color: "#2563eb" }} />
          <h3 className="section-title" style={{ margin: 0, fontSize: "18px" }}>Performance Analytics</h3>
        </div>

        {/* Muscle Group Filter Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "4px" }}>
          {muscleGroupOptions.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedMuscleGroup(group)}
              style={{
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: selectedMuscleGroup === group ? "#ffffff" : "transparent",
                color: selectedMuscleGroup === group ? "#0f172a" : "#64748b",
                boxShadow: selectedMuscleGroup === group ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {!analytics.workouts.length ? (
        <div className="empty-state">Log workouts to unlock progress graphs and muscle group analytics.</div>
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
                <Flame size={14} /> Weekly Frequency
              </div>
              <span className="analytics-summary-value">{analytics.overall.weeklyAvgWorkouts} <span style={{ fontSize: "12px", color: "#64748b" }}>/wk</span></span>
            </div>
          </div>

          {/* Featured Exercise Line Chart Section */}
          <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: "1 1 220px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Select Exercise for Progress Graph
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

              {/* Metric Switcher */}
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
                      fontWeight: 500,
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginTop: "16px", background: "#f8fafc", padding: "12px", borderRadius: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Max Weight</span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{activeExercise.maxWeight} lbs</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Est. 1RM</span>
                    <strong style={{ fontSize: "15px", color: "#2563eb" }}>{activeExercise.maxEstimated1RM} lbs</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Total Volume</span>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{activeExercise.totalVolume.toLocaleString()} lbs</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Growth</span>
                    <strong style={{ fontSize: "15px", color: activeExercise.weightChangePercent >= 0 ? "#16a34a" : "#dc2626" }}>
                      {activeExercise.weightChangePercent > 0 ? `+${activeExercise.weightChangePercent}%` : `${activeExercise.weightChangePercent}%`}
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">Select an exercise above to view its graph.</div>
            )}
          </div>

          {/* Muscle Group Breakdown Cards */}
          <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Layers size={18} style={{ color: "#2563eb" }} />
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Exercises by Muscle Group ({filteredExercises.length})</h4>
            </div>

            <div className="analytics-grid">
              {filteredExercises.map((exercise) => {
                const isSelected = activeExercise?.name === exercise.name;
                return (
                  <div
                    key={exercise.name}
                    className="analytics-card"
                    style={{
                      border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedExerciseName(exercise.name)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <div className="analytics-exercise" style={{ fontSize: "15px", fontWeight: 600 }}>{exercise.name}</div>
                        <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569", fontWeight: 500 }}>
                          {exercise.muscleGroup}
                        </span>
                      </div>
                      {exercise.weightChangePercent !== 0 && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: exercise.weightChangePercent > 0 ? "#dcfce7" : "#fee2e2",
                            color: exercise.weightChangePercent > 0 ? "#15803d" : "#b91c1c",
                          }}
                        >
                          {exercise.weightChangePercent > 0 ? `+${exercise.weightChangePercent}%` : `${exercise.weightChangePercent}%`}
                        </span>
                      )}
                    </div>

                    <div className="analytics-stats" style={{ margin: "10px 0" }}>
                      <div className="stat">
                        <span className="stat-value">{exercise.maxWeight}</span>
                        <span className="stat-label">Max lbs</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value" style={{ color: "#2563eb" }}>{exercise.maxEstimated1RM}</span>
                        <span className="stat-label">Est 1RM</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{exercise.sessions}</span>
                        <span className="stat-label">Sessions</span>
                      </div>
                    </div>

                    <div className="analytics-metric-row" style={{ fontSize: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                      <span className="analytics-metric-label">Total Volume:</span>
                      <span className="analytics-metric-value">{exercise.totalVolume.toLocaleString()} lbs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}