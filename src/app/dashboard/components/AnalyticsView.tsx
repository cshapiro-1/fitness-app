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
  Target,
  ChevronRight,
  Info,
  ShieldAlert,
  Activity,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Disc,
  Scale,
  BatteryCharging,
  Trophy,
} from "lucide-react";
import {
  DashboardAnalytics,
  ExerciseTrendPoint,
  ExerciseAnalytics,
  ACWRData,
  SymmetryData,
  IntensityDistribution,
  MultiLiftComparison,
  PlateauInsight,
} from "../utils/analytics";
import {
  calculatePlates,
  PLATE_COLORS,
  PlateBreakdown,
} from "../utils/plateCalculator";

interface AnalyticsViewProps {
  analytics: DashboardAnalytics;
}

type AnalyticsSubTab = "today" | "trajectory" | "readiness";
type LineMetricType = "topWeight" | "estimatedOneRepMax" | "totalVolume";
type BarMetricType = "maxWeight" | "maxEstimated1RM" | "totalVolume" | "totalSets" | "sessions";

// ==========================================
// 1. ACWR Readiness Battery Card
// ==========================================
function ACWRGaugeCard({ acwr }: { acwr?: ACWRData }) {
  if (!acwr) return null;

  const zoneColors = {
    deload: {
      bg: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
      badge: "#3b82f6",
      label: "Deload / Active Recovery",
      batteryPercent: 35,
      batteryColor: "#60a5fa",
    },
    optimal: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#15803d",
      badge: "#16a34a",
      label: "Prime Zone (Optimal Overload)",
      batteryPercent: 88,
      batteryColor: "#22c55e",
    },
    overreaching: {
      bg: "#fffbeb",
      border: "#fde68a",
      text: "#b45309",
      badge: "#d97706",
      label: "Functional Overreaching",
      batteryPercent: 70,
      batteryColor: "#f59e0b",
    },
    danger: {
      bg: "#fef2f2",
      border: "#fecaca",
      text: "#b91c1c",
      badge: "#dc2626",
      label: "Injury Risk Spike (>1.5)",
      batteryPercent: 15,
      batteryColor: "#ef4444",
    },
  };

  const currentZone = zoneColors[acwr.zone] || zoneColors.optimal;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: currentZone.bg, border: `1px solid ${currentZone.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={20} style={{ color: currentZone.text }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Workload &amp; Recovery Readiness
            </h4>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Acute (7-Day) vs. Chronic (28-Day) Fatigue Engine</span>
          </div>
        </div>

        <span
          style={{
            background: currentZone.bg,
            border: `1px solid ${currentZone.border}`,
            color: currentZone.text,
            fontSize: "12px",
            fontWeight: 800,
            padding: "5px 12px",
            borderRadius: "999px",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {currentZone.label}
        </span>
      </div>

      {/* Visual Battery Meter */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <BatteryCharging size={18} style={{ color: currentZone.batteryColor }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Gym Readiness Status</span>
          </div>
          <span style={{ fontSize: "15px", fontWeight: 900, color: currentZone.text }}>
            ACWR {acwr.ratio.toFixed(2)}
          </span>
        </div>

        {/* Segmented Readiness Spectrum */}
        <div style={{ height: "14px", background: "#e2e8f0", borderRadius: "7px", overflow: "hidden", position: "relative", display: "flex" }}>
          <div style={{ width: "35%", height: "100%", background: "#93c5fd" }} title="Deload (<0.8)" />
          <div style={{ width: "35%", height: "100%", background: "#4ade80" }} title="Prime Sweet Spot (0.8–1.3)" />
          <div style={{ width: "15%", height: "100%", background: "#facc15" }} title="Overreaching (1.3–1.5)" />
          <div style={{ width: "15%", height: "100%", background: "#f87171" }} title="Danger Zone (>1.5)" />

          {/* Indicator Marker */}
          {(() => {
            const clampedRatio = Math.max(0.4, Math.min(2.0, acwr.ratio));
            const pct = Math.round(((clampedRatio - 0.4) / 1.6) * 100);
            return (
              <div
                style={{
                  position: "absolute",
                  left: `calc(${pct}% - 4px)`,
                  top: 0,
                  width: "8px",
                  height: "100%",
                  background: "#0f172a",
                  borderRadius: "2px",
                  boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                }}
              />
            );
          })()}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
          <span>Recovery</span>
          <span style={{ color: "#16a34a" }}>Prime Overload (0.8–1.3)</span>
          <span>Fatigued</span>
        </div>
      </div>

      {/* 2-Column Workload Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Acute (7-Day)</span>
          <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>
            {acwr.acuteLoad.toLocaleString()} <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>lbs</span>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Current fatigue load</span>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Chronic (28-Day Avg)</span>
          <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>
            {acwr.chronicLoad.toLocaleString()} <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>lbs</span>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Fitness adaptation baseline</span>
        </div>
      </div>

      {/* Actionable Coach Prescription */}
      <div
        style={{
          fontSize: "13px",
          color: currentZone.text,
          background: currentZone.bg,
          border: `1px solid ${currentZone.border}`,
          padding: "12px 14px",
          borderRadius: "10px",
          fontWeight: 600,
          lineHeight: "1.4",
        }}
      >
        🎯 <b>Coach Recommendation:</b> {acwr.recommendation}
      </div>
    </div>
  );
}

// ========================================================
// 2. Kinesiological Muscle Symmetry & Spider Radar Chart
// ========================================================
function MuscleSymmetryRadar({ symmetry }: { symmetry?: SymmetryData }) {
  if (!symmetry) return null;

  const width = 320;
  const height = 240;
  const center = { x: 160, y: 120 };
  const radius = 75;

  const points = symmetry.radarPoints;
  const numPoints = points.length;
  const angleStep = (Math.PI * 2) / numPoints;

  // Compute vertices for polygon
  const coords = points.map((p, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (p.normalizedPercent / 100) * radius;
    const x = center.x + r * Math.cos(angle);
    const y = center.y + r * Math.sin(angle);
    return { x, y, label: p.label, pct: p.normalizedPercent, value: p.value };
  });

  const polygonPath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x},${c.y}`).join(" ") + " Z";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f5f3ff", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Compass size={20} style={{ color: "#7c3aed" }} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
            Muscular Balance &amp; Kinetic Symmetry
          </h4>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Anterior / Posterior &amp; Joint Health Ratios</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: "320px", height: "auto" }}>
          {/* Radar background grid webs */}
          {[0.25, 0.5, 0.75, 1.0].map((level, lvlIdx) => {
            const webCoords = points.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = radius * level;
              return `${center.x + r * Math.cos(angle)},${center.y + r * Math.sin(angle)}`;
            });
            return (
              <polygon
                key={lvlIdx}
                points={webCoords.join(" ")}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={level < 1 ? "2 2" : "none"}
              />
            );
          })}

          {/* Spokes */}
          {points.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);
            return <line key={i} x1={center.x} y1={center.y} x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" />;
          })}

          {/* Filled Volume Polygon */}
          <path d={polygonPath} fill="rgba(124, 58, 237, 0.25)" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" />

          {/* Data Vertex Dots and Labels */}
          {coords.map((c, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const lx = center.x + (radius + 22) * Math.cos(angle);
            const ly = center.y + (radius + 14) * Math.sin(angle);

            return (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r="4.5" fill="#7c3aed" stroke="#ffffff" strokeWidth="1.5" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#334155"
                >
                  {c.label.split(" ")[0]} ({c.pct}%)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Clinical Ratios Summary */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Push : Pull Ratio</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>
              {symmetry.pushToPullRatio} : 1.0
            </div>
            <div style={{ fontSize: "11px", color: symmetry.pushToPullRatio >= 0.9 && symmetry.pushToPullRatio <= 1.3 ? "#16a34a" : "#d97706", fontWeight: 700, marginTop: "2px" }}>
              {symmetry.pushToPullRatio >= 0.9 && symmetry.pushToPullRatio <= 1.3 ? "✓ Ideal Balance" : "⚠️ Push/Pull Imbalance"}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Quad : Hamstring</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>
              {symmetry.quadToHamRatio} : 1.0
            </div>
            <div style={{ fontSize: "11px", color: symmetry.quadToHamRatio >= 0.9 && symmetry.quadToHamRatio <= 1.4 ? "#16a34a" : "#d97706", fontWeight: 700, marginTop: "2px" }}>
              {symmetry.quadToHamRatio >= 0.9 && symmetry.quadToHamRatio <= 1.4 ? "✓ Knee Joint Healthy" : "⚠️ Hamstring Focus Needed"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================================
// 3. Intensity Zone Distribution Component
// ========================================================
function IntensityTierDistribution({ intensity }: { intensity?: IntensityDistribution }) {
  if (!intensity) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ecfeff", border: "1px solid #a5f3fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sliders size={20} style={{ color: "#0891b2" }} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
            Working Load Intensity Split
          </h4>
          <span style={{ fontSize: "12px", color: "#64748b" }}>% of Working Sets across Neuromuscular Thresholds</span>
        </div>
      </div>

      {/* Segmented Intensity Bar */}
      <div style={{ width: "100%", height: "20px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden", display: "flex" }}>
        {intensity.zone1Percent > 0 && (
          <div
            style={{ width: `${intensity.zone1Percent}%`, background: "#38bdf8", height: "100%" }}
            title={`Zone 1 (<70%): ${intensity.zone1Percent}%`}
          />
        )}
        {intensity.zone2Percent > 0 && (
          <div
            style={{ width: `${intensity.zone2Percent}%`, background: "#2563eb", height: "100%" }}
            title={`Zone 2 (70–84%): ${intensity.zone2Percent}%`}
          />
        )}
        {intensity.zone3Percent > 0 && (
          <div
            style={{ width: `${intensity.zone3Percent}%`, background: "#dc2626", height: "100%" }}
            title={`Zone 3 (85%+): ${intensity.zone3Percent}%`}
          />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#0284c7" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }} />
              Zone 1 (&lt;70% 1RM)
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Warmup &amp; Base Accumulation</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0369a1" }}>{intensity.zone1Percent}%</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{intensity.zone1Count} sets</div>
          </div>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#1d4ed8" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
              Zone 2 (70%–84% 1RM)
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Hypertrophy &amp; Strength Threshold</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#1e40af" }}>{intensity.zone2Percent}%</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{intensity.zone2Count} sets</div>
          </div>
        </div>

        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#b91c1c" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
              Zone 3 (&ge;85% 1RM)
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Neuromuscular Peaking &amp; Power</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#991b1b" }}>{intensity.zone3Percent}%</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{intensity.zone3Count} sets</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================================
// 4. Multi-Lift Normalized Comparative Growth Curve
// ========================================================
function MultiLiftProgressionChart({ multiLift }: { multiLift?: MultiLiftComparison }) {
  if (!multiLift || multiLift.availableLifts.length === 0 || multiLift.timeline.length < 2) return null;

  const svgWidth = 500;
  const svgHeight = 220;
  const padding = { top: 25, right: 25, bottom: 45, left: 50 };

  const colors = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed"];

  // Find all values to determine Y scale
  const allGrowths: number[] = [];
  multiLift.timeline.forEach((pt) => {
    multiLift.availableLifts.forEach((lift) => {
      if (typeof pt[lift] === "number") {
        allGrowths.push(pt[lift] as number);
      }
    });
  });

  const minVal = Math.min(0, ...allGrowths);
  const maxVal = Math.max(10, ...allGrowths);
  const range = maxVal - minVal || 10;
  const yMin = Math.floor(minVal - range * 0.1);
  const yMax = Math.ceil(maxVal + range * 0.1);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff7ed", border: "1px solid #ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={20} style={{ color: "#ea580c" }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Compound Lift Strength Growth
            </h4>
            <span style={{ fontSize: "12px", color: "#64748b" }}>% Progression curves relative to baseline</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {multiLift.availableLifts.map((lift, i) => (
            <div key={lift} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700 }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[i % colors.length] }} />
              <span>{lift}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto" }}>
          {/* Background grid */}
          {[0, 1, 2, 3].map((i) => {
            const tick = Math.round(yMin + (i / 3) * (yMax - yMin));
            const y = svgHeight - padding.bottom - ((tick - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#64748b">
                  {tick > 0 ? `+${tick}%` : `${tick}%`}
                </text>
              </g>
            );
          })}

          {/* 0% Baseline */}
          {(() => {
            const zeroY = svgHeight - padding.bottom - ((0 - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
            return <line x1={padding.left} y1={zeroY} x2={svgWidth - padding.right} y2={zeroY} stroke="#94a3b8" strokeWidth="1.5" />;
          })()}

          {/* Lines for each compound lift */}
          {multiLift.availableLifts.map((lift, liftIdx) => {
            const liftPoints = multiLift.timeline
              .map((pt, index) => {
                if (typeof pt[lift] !== "number") return null;
                const x =
                  multiLift.timeline.length === 1
                    ? (svgWidth + padding.left) / 2
                    : padding.left + (index / (multiLift.timeline.length - 1)) * (svgWidth - padding.left - padding.right);
                const y =
                  svgHeight - padding.bottom - (((pt[lift] as number) - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
                return { x, y, val: pt[lift] as number, date: pt.date };
              })
              .filter(Boolean) as Array<{ x: number; y: number; val: number; date: string }>;

            if (liftPoints.length === 0) return null;

            const pathD = liftPoints.reduce((acc, c, i) => (i === 0 ? `M ${c.x},${c.y}` : `${acc} L ${c.x},${c.y}`), "");
            const color = colors[liftIdx % colors.length];

            return (
              <g key={lift}>
                <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {liftPoints.map((c, idx) => (
                  <circle key={idx} cx={c.x} cy={c.y} r="4" fill={color} stroke="#ffffff" strokeWidth="1.5" />
                ))}
              </g>
            );
          })}

          {/* Dates on X Axis */}
          {multiLift.timeline.map((pt, idx) => {
            const x =
              multiLift.timeline.length === 1
                ? (svgWidth + padding.left) / 2
                : padding.left + (idx / (multiLift.timeline.length - 1)) * (svgWidth - padding.left - padding.right);
            return (
              <text key={idx} x={x} y={svgHeight - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">
                {new Date(pt.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ==========================================
// 5. Interactive Touch-Optimized Single Exercise Line Chart
// ==========================================
function ExerciseLineChart({
  points,
  metric,
}: {
  points: ExerciseTrendPoint[];
  metric: LineMetricType;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(points.length > 0 ? points.length - 1 : null);

  if (!points || points.length === 0) return null;

  const svgWidth = 480;
  const svgHeight = 220;
  const padding = { top: 25, right: 25, bottom: 45, left: 50 };

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
  const activePoint = selectedIdx !== null && points[selectedIdx] ? points[selectedIdx] : points[points.length - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto" }}>
          {/* Background Grid Lines */}
          {yTicks.map((tick, i) => {
            const y = svgHeight - padding.bottom - ((tick - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#64748b">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Shaded Area Under Line */}
          {areaD && <path d={areaD} fill="url(#mobile-blue-gradient)" opacity="0.18" />}

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="mobile-blue-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main Line */}
          {pathD && <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data Points with Generous Touch Tap Targets */}
          {coords.map((c, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <g
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                style={{ cursor: "pointer" }}
              >
                {/* Large Invisible Tap Target for Phone Fingers */}
                <circle cx={c.x} cy={c.y} r="18" fill="transparent" />

                {/* Visible Data Dot */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isSelected ? "7" : "4.5"}
                  fill={isSelected ? "#1d4ed8" : "#2563eb"}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? "2.5" : "2"}
                  style={{ transition: "all 0.15s ease" }}
                />

                {/* Selected Indicator Pulse Ring */}
                {isSelected && (
                  <circle cx={c.x} cy={c.y} r="12" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6" />
                )}

                {/* X Axis Date Label */}
                <text
                  x={c.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isSelected ? "800" : "600"}
                  fill={isSelected ? "#1d4ed8" : "#64748b"}
                >
                  {new Date(c.point.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pinned Mobile Inspection Card (Tap any point to inspect) */}
      {activePoint && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "12px 14px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Session Date</span>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#1d4ed8" }}>
              {new Date(activePoint.completedAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
              Top Set: <b>{activePoint.topWeight} lbs</b> × {activePoint.topReps} reps
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Est. 1RM &amp; Volume</span>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>
              {activePoint.estimatedOneRepMax} <span style={{ fontSize: "11px", color: "#64748b" }}>lbs 1RM</span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              {activePoint.totalVolume.toLocaleString()} lbs vol ({activePoint.setCount} sets)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 6. Interactive Muscle Group Bar Chart
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
  if (!exercises || exercises.length === 0) {
    return <div className="empty-state" style={{ padding: "20px" }}>No exercises logged for this muscle group.</div>;
  }

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
      {sorted.map((ex) => {
        const val = ex[metric];
        const pct = Math.max(10, Math.round((val / maxValue) * 100));
        const isSelected = selectedExerciseName === ex.name;

        return (
          <div
            key={ex.name}
            onClick={() => onSelectExercise(ex.name)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              cursor: "pointer",
              padding: "10px 12px",
              borderRadius: "12px",
              background: isSelected ? "#eff6ff" : "#f8fafc",
              border: `1.5px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: isSelected ? 800 : 700, fontSize: "14px", color: isSelected ? "#1d4ed8" : "#0f172a" }}>
                  {ex.name}
                </span>
                <span style={{ fontSize: "11px", color: "#64748b", background: isSelected ? "#dbeafe" : "#e2e8f0", padding: "2px 6px", borderRadius: "6px", fontWeight: 600 }}>
                  {ex.muscleGroup}
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: isSelected ? "#2563eb" : "#334155" }}>
                {getMetricDisplay(val, metric)}
              </div>
            </div>

            <div style={{ width: "100%", height: "12px", background: "#e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: isSelected
                    ? "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)"
                    : "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)",
                  borderRadius: "6px",
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

// ========================================================
// 7. Gym-Floor 1RM & Target Plate Calculator Card
// ========================================================
function GymFloorPlateCalculator({
  exercise,
}: {
  exercise: ExerciseAnalytics;
}) {
  const [selectedPercentage, setSelectedPercentage] = useState<number>(80);
  const [barWeight, setBarWeight] = useState<number>(45);

  const e1RM = exercise.maxEstimated1RM || exercise.maxWeight || 100;
  const targetWeight = Math.round((e1RM * (selectedPercentage / 100)) / 5) * 5; // Round to nearest 5 lbs

  const plateBreakdown: PlateBreakdown = useMemo(() => {
    return calculatePlates(targetWeight, barWeight);
  }, [targetWeight, barWeight]);

  const tiers = [
    { pct: 90, label: "Power", reps: "1–3 reps", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
    { pct: 80, label: "Strength", reps: "5–6 reps", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    { pct: 70, label: "Hypertrophy", reps: "8–12 reps", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
    { pct: 60, label: "Endurance", reps: "15+ reps", color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1.5px solid #cbd5e1",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={20} style={{ color: "#2563eb" }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Gym Floor 1RM &amp; Plate Target
            </h4>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Instant working set calculation for {exercise.name}</span>
          </div>
        </div>

        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "2px", gap: "2px" }}>
          {[
            { label: "45 lb Bar", weight: 45 },
            { label: "35 lb Bar", weight: 35 },
            { label: "0 lb / DB", weight: 0 },
          ].map((b) => (
            <button
              key={b.weight}
              onClick={() => setBarWeight(b.weight)}
              style={{
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: barWeight === b.weight ? "#2563eb" : "transparent",
                color: barWeight === b.weight ? "#ffffff" : "#64748b",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stat Strip for Active Exercise */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Est. 1-Rep Max</span>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#2563eb", marginTop: "2px" }}>
            {exercise.maxEstimated1RM} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>lbs</span>
          </div>
          <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
            {exercise.weightChangePercent > 0 ? `+${exercise.weightChangePercent}% all-time gain` : "Baseline calibrated"}
          </span>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>All-Time Top Set</span>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>
            {exercise.maxWeight} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>lbs</span>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
            {exercise.sessions} logged session{exercise.sessions !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Target Intensity Tier Tappable Buttons */}
      <div>
        <label style={{ fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
          Select Today's Target Intensity:
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {tiers.map((t) => {
            const isSelected = selectedPercentage === t.pct;
            const tierWeight = Math.round((e1RM * (t.pct / 100)) / 5) * 5;
            return (
              <button
                key={t.pct}
                onClick={() => setSelectedPercentage(t.pct)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 4px",
                  borderRadius: "10px",
                  border: isSelected ? `2px solid ${t.color}` : "1px solid #e2e8f0",
                  background: isSelected ? t.bg : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  minHeight: "68px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 800, color: t.color }}>{t.pct}%</span>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>{tierWeight}</span>
                <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 600 }}>{t.reps}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Barbell Loading Breakdown */}
      <div
        style={{
          background: "#0f172a",
          color: "#ffffff",
          borderRadius: "12px",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Disc size={18} style={{ color: "#60a5fa" }} />
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#e2e8f0" }}>Barbell Loading (Per Side)</span>
          </div>
          <span style={{ fontSize: "16px", fontWeight: 900, color: "#38bdf8" }}>
            {plateBreakdown.targetWeight} lbs Total
          </span>
        </div>

        {plateBreakdown.platesPerSide.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Load each side:</span>
            {plateBreakdown.platesPerSide.map((p, idx) => {
              const style = PLATE_COLORS[p.weight] || { bg: "#475569", border: "#334155", text: "#ffffff" };
              return (
                <div
                  key={idx}
                  style={{
                    background: style.bg,
                    color: style.text,
                    border: `1px solid ${style.border}`,
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "13px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {p.count > 1 ? `${p.count}× ` : ""}
                  {p.weight} lb
                </div>
              );
            })}
            <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "auto" }}>
              ({plateBreakdown.weightPerSide} lbs plates + {plateBreakdown.barWeight} lb bar)
            </span>
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>
            Empty bar or direct dumbbell weight ({plateBreakdown.targetWeight} lbs).
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================================
// 8. AI Plateau Breaker & Progressive Overload Card
// ========================================================
function PlateauInsightsFeed({ plateaus }: { plateaus?: PlateauInsight[] }) {
  if (!plateaus || plateaus.length === 0) {
    return (
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "14px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Sparkles size={22} style={{ color: "#16a34a", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#166534" }}>Consistent Progressive Overload</div>
          <div style={{ fontSize: "12px", color: "#15803d" }}>
            No stagnant lifts detected across your logged sessions. Maintain current volume and recovery.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {plateaus.map((p, idx) => {
        const isStalled = p.insightType === "plateau";
        return (
          <div
            key={idx}
            style={{
              background: isStalled ? "#fffbeb" : "#f0fdf4",
              border: `1.5px solid ${isStalled ? "#fde68a" : "#bbf7d0"}`,
              borderRadius: "14px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isStalled ? (
                  <AlertTriangle size={18} style={{ color: "#d97706" }} />
                ) : (
                  <Sparkles size={18} style={{ color: "#16a34a" }} />
                )}
                <span style={{ fontSize: "14px", fontWeight: 800, color: isStalled ? "#92400e" : "#166534" }}>
                  {isStalled ? `Plateau Alert: ${p.exercise}` : `Breakthrough: ${p.exercise}`}
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: isStalled ? "#fef3c7" : "#dcfce7",
                  color: isStalled ? "#b45309" : "#15803d",
                  textTransform: "uppercase",
                }}
              >
                {isStalled ? "Stalled Lift" : "Overload Success"}
              </span>
            </div>

            <div style={{ fontSize: "13px", color: isStalled ? "#78350f" : "#14532d", fontWeight: 500 }}>
              {p.message}
            </div>

            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: isStalled ? "#92400e" : "#166534",
                background: isStalled ? "#fef9c3" : "#ecfdf5",
                padding: "8px 12px",
                borderRadius: "8px",
                marginTop: "2px",
              }}
            >
              💡 <b>Actionable Cue:</b> {p.actionableCue}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 9. Main Revamped AnalyticsView Component
// ==========================================
export function AnalyticsView({ analytics }: AnalyticsViewProps) {
  const [subTab, setSubTab] = useState<AnalyticsSubTab>("today");
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

  const activeExercise: ExerciseAnalytics | undefined = useMemo(() => {
    const found = analytics.exercises.find((ex) => ex.name === selectedExerciseName);
    return found || analytics.exercises[0];
  }, [selectedExerciseName, analytics.exercises]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ========================================================= */}
      {/* STICKY FINGER-FRIENDLY SUB-NAV BAR (48px TOUCH TARGETS)   */}
      {/* ========================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "4px",
          gap: "4px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          position: "sticky",
          top: "60px",
          zIndex: 15,
        }}
      >
        <button
          onClick={() => setSubTab("today")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 4px",
            minHeight: "44px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: subTab === "today" ? "#2563eb" : "transparent",
            color: subTab === "today" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "13px",
            boxShadow: subTab === "today" ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <Zap size={16} />
          <span>Gym Floor</span>
        </button>

        <button
          onClick={() => setSubTab("trajectory")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 4px",
            minHeight: "44px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: subTab === "trajectory" ? "#2563eb" : "transparent",
            color: subTab === "trajectory" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "13px",
            boxShadow: subTab === "trajectory" ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <TrendingUp size={16} />
          <span>Lift Growth</span>
        </button>

        <button
          onClick={() => setSubTab("readiness")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 4px",
            minHeight: "44px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: subTab === "readiness" ? "#2563eb" : "transparent",
            color: subTab === "readiness" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "13px",
            boxShadow: subTab === "readiness" ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <Activity size={16} />
          <span>Readiness</span>
        </button>
      </div>

      {!analytics.workouts.length ? (
        <div className="card empty-state" style={{ padding: "30px 20px", textAlign: "center" }}>
          <Dumbbell size={36} style={{ color: "#94a3b8", margin: "0 auto 12px auto" }} />
          <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 800 }}>No Logged Workouts Yet</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Log training sessions to unlock 1RM estimates, plate targets, fatigue monitoring, and muscular symmetry analytics.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* SUB-TAB 1: ⚡ GYM FLOOR & TARGETS                         */}
          {/* ========================================================= */}
          {subTab === "today" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Top Overall Momentum Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", fontWeight: 700 }}>
                    <Calendar size={15} style={{ color: "#2563eb" }} /> Total Workouts
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>
                    {analytics.overall.totalWorkouts}
                  </div>
                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
                    🔥 {analytics.overall.weeklyAvgWorkouts} / week avg
                  </span>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", fontWeight: 700 }}>
                    <Zap size={15} style={{ color: "#eab308" }} /> Total Tonnage
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>
                    {analytics.overall.totalVolume.toLocaleString()} <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>lbs</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                    {analytics.overall.totalSets} total sets
                  </span>
                </div>
              </div>

              {/* Quick Exercise Selector for Gym Floor */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                  Select Lift for Gym Floor Targets:
                </label>
                <select
                  value={activeExercise?.name || ""}
                  onChange={(e) => setSelectedExerciseName(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    fontWeight: 700,
                    fontSize: "15px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#0f172a",
                  }}
                >
                  {analytics.exercises.map((ex) => (
                    <option key={ex.name} value={ex.name}>
                      {ex.name} ({ex.muscleGroup}) — Max {ex.maxWeight} lbs
                    </option>
                  ))}
                </select>
              </div>

              {/* Gym-Floor 1RM & Target Plate Calculator */}
              {activeExercise && <GymFloorPlateCalculator exercise={activeExercise} />}

              {/* AI Plateau Breaker & Progressive Overload Callouts */}
              <PlateauInsightsFeed plateaus={analytics.plateaus} />

              {/* PR Hall of Fame & Trophy Wall */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fefce8", border: "1px solid #fef08a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trophy size={20} style={{ color: "#ca8a04" }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                      PR Hall of Fame
                    </h4>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>All-time personal performance bests</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                  {analytics.overall.heaviestSet && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fefce8", border: "1px solid #fef08a", padding: "12px 14px", borderRadius: "12px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#854d0e", fontWeight: 800, textTransform: "uppercase" }}>🏆 Heaviest Absolute Set</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{analytics.overall.heaviestSet.exercise}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#854d0e" }}>{analytics.overall.heaviestSet.weight} lbs</div>
                        <div style={{ fontSize: "11px", color: "#a16207", fontWeight: 600 }}>× {analytics.overall.heaviestSet.reps} reps</div>
                      </div>
                    </div>
                  )}

                  {analytics.overall.best1RM && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "12px 14px", borderRadius: "12px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 800, textTransform: "uppercase" }}>⚡ Peak Est. 1-Rep Max</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{analytics.overall.best1RM.exercise}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#1d4ed8" }}>{analytics.overall.best1RM.estimated1RM} lbs</div>
                        <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600 }}>({analytics.overall.best1RM.weight} lbs × {analytics.overall.best1RM.reps})</div>
                      </div>
                    </div>
                  )}

                  {analytics.overall.highestRepSet && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "12px" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#166534", fontWeight: 800, textTransform: "uppercase" }}>🔁 High-Rep Endurance PR</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{analytics.overall.highestRepSet.exercise}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: "#166534" }}>{analytics.overall.highestRepSet.reps} reps</div>
                        <div style={{ fontSize: "11px", color: "#15803d", fontWeight: 600 }}>@ {analytics.overall.highestRepSet.weight} lbs</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUB-TAB 2: 📈 LIFT TRAJECTORY & CHARTS                    */}
          {/* ========================================================= */}
          {subTab === "trajectory" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Muscle Group Horizontal Filter Pills */}
              <div
                style={{
                  display: "flex",
                  overflowX: "auto",
                  paddingBottom: "4px",
                  gap: "6px",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {muscleGroupOptions.map((group) => {
                  const isSelected = selectedMuscleGroup === group;
                  return (
                    <button
                      key={group}
                      onClick={() => {
                        setSelectedMuscleGroup(group);
                        const firstInGroup = analytics.exercises.find((ex) => group === "All" || ex.muscleGroup === group);
                        if (firstInGroup) setSelectedExerciseName(firstInGroup.name);
                      }}
                      style={{
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        borderRadius: "20px",
                        border: "none",
                        cursor: "pointer",
                        background: isSelected ? "#2563eb" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#475569",
                        boxShadow: isSelected ? "0 2px 6px rgba(37,99,235,0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                        flexShrink: 0,
                        minHeight: "36px",
                      }}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>

              {/* Single Exercise Timeline Graph Card */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Selected Exercise Progression Curve
                    </label>
                    <select
                      value={activeExercise?.name || ""}
                      onChange={(e) => setSelectedExerciseName(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "44px",
                        fontWeight: 700,
                        fontSize: "14px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                      }}
                    >
                      {filteredExercises.map((ex) => (
                        <option key={ex.name} value={ex.name}>
                          {ex.name} ({ex.muscleGroup}) — Max {ex.maxWeight} lbs
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Line Metric Switcher */}
                  <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "3px", gap: "3px" }}>
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
                          flex: 1,
                          padding: "8px 4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          background: chartMetric === m.value ? "#2563eb" : "transparent",
                          color: chartMetric === m.value ? "#ffffff" : "#475569",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeExercise ? (
                  <ExerciseLineChart points={activeExercise.trend} metric={chartMetric} />
                ) : (
                  <div className="empty-state">Select an exercise above to view its graph.</div>
                )}
              </div>

              {/* Muscle Group Comparison Bar Chart */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BarChart2 size={20} style={{ color: "#2563eb" }} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {selectedMuscleGroup === "All" ? "All Logged Exercises" : `${selectedMuscleGroup} Exercises`}
                      </h4>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Showing {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} · Tap any row to select
                      </span>
                    </div>
                  </div>

                  {/* Bar Metric Switcher */}
                  <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "2px", gap: "2px", flexWrap: "wrap" }}>
                    {(
                      [
                        { label: "Max Weight", value: "maxWeight" },
                        { label: "Est. 1RM", value: "maxEstimated1RM" },
                        { label: "Volume", value: "totalVolume" },
                        { label: "Sets", value: "totalSets" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setBarMetric(m.value)}
                        style={{
                          padding: "5px 8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          background: barMetric === m.value ? "#2563eb" : "transparent",
                          color: barMetric === m.value ? "#ffffff" : "#475569",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <MuscleGroupBarChart
                  exercises={filteredExercises}
                  metric={barMetric}
                  selectedExerciseName={activeExercise?.name || ""}
                  onSelectExercise={(name) => setSelectedExerciseName(name)}
                />
              </div>

              {/* Multi-Lift Comparative Progression */}
              {analytics.multiLift && analytics.multiLift.timeline.length >= 2 && (
                <MultiLiftProgressionChart multiLift={analytics.multiLift} />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SUB-TAB 3: 🔋 READINESS & STRUCTURAL BALANCE              */}
          {/* ========================================================= */}
          {subTab === "readiness" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <ACWRGaugeCard acwr={analytics.acwr} />
              <MuscleSymmetryRadar symmetry={analytics.symmetry} />
              <IntensityTierDistribution intensity={analytics.intensity} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
