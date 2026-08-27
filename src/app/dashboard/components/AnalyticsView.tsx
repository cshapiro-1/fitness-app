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
} from "lucide-react";
import {
  DashboardAnalytics,
  ExerciseTrendPoint,
  ExerciseAnalytics,
  ACWRData,
  SymmetryData,
  IntensityDistribution,
  MultiLiftComparison,
} from "../utils/analytics";

interface AnalyticsViewProps {
  analytics: DashboardAnalytics;
}

type LineMetricType = "topWeight" | "estimatedOneRepMax" | "totalVolume";
type BarMetricType = "maxWeight" | "maxEstimated1RM" | "totalVolume" | "totalSets" | "sessions";

// ==========================================
// 2. ACWR Fatigue & Readiness Gauge Card
// ==========================================
function ACWRGaugeCard({ acwr }: { acwr?: ACWRData }) {
  if (!acwr) return null;

  const zoneColors = {
    deload: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", badge: "#3b82f6", label: "Deload / Active Recovery" },
    optimal: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", badge: "#16a34a", label: "Sweet Spot (Optimal Overload)" },
    overreaching: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", badge: "#d97706", label: "Functional Overreaching" },
    danger: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c", badge: "#dc2626", label: "Injury Risk Spike (>1.5)" },
  };

  const currentZone = zoneColors[acwr.zone] || zoneColors.optimal;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} style={{ color: "#2563eb" }} />
          <div>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Workload &amp; Fatigue Readiness (ACWR)
            </h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Acute (7-Day) vs. Chronic (28-Day Normalized) Workload</span>
          </div>
        </div>
        <span
          style={{
            background: currentZone.bg,
            border: `1px solid ${currentZone.border}`,
            color: currentZone.text,
            fontSize: "11px",
            fontWeight: 800,
            padding: "4px 10px",
            borderRadius: "8px",
            textTransform: "uppercase",
          }}
        >
          {currentZone.label}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "14px" }}>
        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>ACWR Ratio</span>
          <div style={{ fontSize: "24px", fontWeight: 900, color: currentZone.text, marginTop: "2px" }}>
            {acwr.ratio.toFixed(2)}
          </div>
          <span style={{ fontSize: "10px", color: "#64748b" }}>Target: 0.80 – 1.30</span>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Acute Load (7-Day)</span>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
            {acwr.acuteLoad.toLocaleString()} <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 400 }}>lbs</span>
          </div>
          <span style={{ fontSize: "10px", color: "#64748b" }}>Recent fatigue load</span>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, display: "block" }}>Chronic Load (28-Day / 4)</span>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
            {acwr.chronicLoad.toLocaleString()} <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 400 }}>lbs</span>
          </div>
          <span style={{ fontSize: "10px", color: "#64748b" }}>Fitness adaptation baseline</span>
        </div>
      </div>

      {/* Visual ACWR Spectrum Bar */}
      <div style={{ position: "relative", height: "10px", background: "#f1f5f9", borderRadius: "5px", overflow: "hidden", marginBottom: "10px" }}>
        <div style={{ position: "absolute", left: "0%", width: "40%", height: "100%", background: "#93c5fd" }} title="Deload (<0.8)" />
        <div style={{ position: "absolute", left: "40%", width: "25%", height: "100%", background: "#4ade80" }} title="Sweet Spot (0.8–1.3)" />
        <div style={{ position: "absolute", left: "65%", width: "15%", height: "100%", background: "#facc15" }} title="Overreaching (1.3–1.5)" />
        <div style={{ position: "absolute", left: "80%", width: "20%", height: "100%", background: "#f87171" }} title="Danger Zone (>1.5)" />
      </div>

      <div style={{ fontSize: "12px", color: currentZone.text, background: currentZone.bg, border: `1px solid ${currentZone.border}`, padding: "8px 12px", borderRadius: "8px", fontWeight: 600 }}>
        🎯 <b>Prescription:</b> {acwr.recommendation}
      </div>
    </div>
  );
}

// ========================================================
// 3. Kinesiological Muscle Symmetry & Spider Radar Chart
// ========================================================
function MuscleSymmetryRadar({ symmetry }: { symmetry?: SymmetryData }) {
  if (!symmetry) return null;

  const width = 320;
  const height = 240;
  const center = { x: 160, y: 120 };
  const radius = 80;

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
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Compass size={18} style={{ color: "#7c3aed" }} />
          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
            Kinesiological Symmetry &amp; Spider Radar
          </h4>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: "340px", height: "auto" }}>
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
          <path d={polygonPath} fill="rgba(124, 58, 237, 0.2)" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" />

          {/* Data Vertex Dots and Labels */}
          {coords.map((c, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const lx = center.x + (radius + 20) * Math.cos(angle);
            const ly = center.y + (radius + 14) * Math.sin(angle);

            return (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r="4" fill="#7c3aed" stroke="#ffffff" strokeWidth="1.5" />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#475569"
                >
                  {c.label.split(" ")[0]} ({c.pct}%)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Clinical Ratios Summary */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
          <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Push : Pull Ratio</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{symmetry.pushToPullRatio} : 1.0</div>
            <div style={{ fontSize: "10px", color: symmetry.pushToPullRatio >= 0.9 && symmetry.pushToPullRatio <= 1.3 ? "#16a34a" : "#d97706", fontWeight: 600 }}>
              {symmetry.pushToPullRatio >= 0.9 && symmetry.pushToPullRatio <= 1.3 ? "✓ Ideal Balance" : "⚠️ Needs Balance"}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Quad : Hamstring</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{symmetry.quadToHamRatio} : 1.0</div>
            <div style={{ fontSize: "10px", color: symmetry.quadToHamRatio >= 0.9 && symmetry.quadToHamRatio <= 1.4 ? "#16a34a" : "#d97706", fontWeight: 600 }}>
              {symmetry.quadToHamRatio >= 0.9 && symmetry.quadToHamRatio <= 1.4 ? "✓ Healthy Knee Ratio" : "⚠️ Hamstring Attention"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================================
// 4. Intensity Zone Distribution Component
// ========================================================
function IntensityTierDistribution({ intensity }: { intensity?: IntensityDistribution }) {
  if (!intensity) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sliders size={18} style={{ color: "#0891b2" }} />
          <div>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Working Intensity Zone Distribution
            </h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>% of Working Sets across Neuromuscular Load Tiers</span>
          </div>
        </div>
      </div>

      {/* Segmented Intensity Bar */}
      <div style={{ width: "100%", height: "20px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden", display: "flex", marginBottom: "14px" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#0284c7" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }} />
            Zone 1 (&lt;70% 1RM)
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#0369a1", marginTop: "4px" }}>
            {intensity.zone1Percent}% <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b" }}>({intensity.zone1Count} sets)</span>
          </div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>Warmup &amp; Base Accumulation</div>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#1d4ed8" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
            Zone 2 (70%–84% 1RM)
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#1e40af", marginTop: "4px" }}>
            {intensity.zone2Percent}% <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b" }}>({intensity.zone2Count} sets)</span>
          </div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>Hypertrophy &amp; Strength Threshold</div>
        </div>

        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#b91c1c" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} />
            Zone 3 (&ge;85% 1RM)
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#991b1b", marginTop: "4px" }}>
            {intensity.zone3Percent}% <span style={{ fontSize: "11px", fontWeight: 500, color: "#64748b" }}>({intensity.zone3Count} sets)</span>
          </div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>Neuromuscular Peaking &amp; Max Power</div>
        </div>
      </div>
    </div>
  );
}

// ========================================================
// 5. Multi-Lift Normalized Comparative Growth Curve
// ========================================================
function MultiLiftProgressionChart({ multiLift }: { multiLift?: MultiLiftComparison }) {
  if (!multiLift || multiLift.availableLifts.length === 0 || multiLift.timeline.length < 2) return null;

  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 25, right: 35, bottom: 45, left: 55 };

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
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} style={{ color: "#ea580c" }} />
          <div>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Multi-Lift Normalized Strength Growth (% Progression)
            </h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Comparative compound progression curves from baseline</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {multiLift.availableLifts.map((lift, i) => (
            <div key={lift} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[i % colors.length] }} />
              <span>{lift}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto", minWidth: "320px" }}>
          {/* Background grid */}
          {[0, 1, 2, 3].map((i) => {
            const tick = Math.round(yMin + (i / 3) * (yMax - yMin));
            const y = svgHeight - padding.bottom - ((tick - yMin) / (yMax - yMin || 1)) * (svgHeight - padding.top - padding.bottom);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
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
                <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {liftPoints.map((c, idx) => (
                  <circle key={idx} cx={c.x} cy={c.y} r="3.5" fill={color} stroke="#ffffff" strokeWidth="1.5" />
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
              <text key={idx} x={x} y={svgHeight - 12} textAnchor="middle" fontSize="10" fill="#64748b">
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
// 6. Interactive SVG Single Exercise Line Chart
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
// 7. Interactive Muscle Group Bar Chart
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
// 8. Main AnalyticsView Component
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

  const activeExercise: ExerciseAnalytics | undefined = useMemo(() => {
    const found = filteredExercises.find((ex) => ex.name === selectedExerciseName);
    return found || filteredExercises[0] || analytics.exercises[0];
  }, [filteredExercises, selectedExerciseName, analytics.exercises]);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with Title and Muscle Group Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={22} style={{ color: "#2563eb" }} />
          <h3 className="section-title" style={{ margin: 0, fontSize: "18px" }}>STRKYR Strength &amp; Performance Command Center</h3>
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
          {/* SECTION: ACWR READINESS & KINESIOLOGICAL SPIDER RADAR     */}
          {/* ========================================================= */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            <ACWRGaugeCard acwr={analytics.acwr} />
            <MuscleSymmetryRadar symmetry={analytics.symmetry} />
          </div>

          {/* ========================================================= */}
          {/* SECTION: INTENSITY DISTRIBUTION & MULTI-LIFT COMPARISON   */}
          {/* ========================================================= */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            <IntensityTierDistribution intensity={analytics.intensity} />
            {analytics.multiLift && analytics.multiLift.timeline.length >= 2 && (
              <MultiLiftProgressionChart multiLift={analytics.multiLift} />
            )}
          </div>

          {/* ========================================================= */}
          {/* SECTION: MUSCLE GROUP EXERCISE COMPARISON BAR CHART       */}
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
          {/* SECTION: EXERCISE PROGRESSION LINE CHART & 1RM TIERS      */}
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
          {/* SECTION: PR HALL OF FAME                                  */}
          {/* ========================================================= */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Award size={18} style={{ color: "#eab308" }} />
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Personal Record Hall of Fame</h4>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
              {analytics.overall.heaviestSet && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fefce8", border: "1px solid #fef08a", padding: "10px 14px", borderRadius: "8px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#854d0e", fontWeight: 700 }}>🏆 Heaviest Absolute Set</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{analytics.overall.heaviestSet.exercise}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#854d0e" }}>{analytics.overall.heaviestSet.weight} lbs</div>
                    <div style={{ fontSize: "10px", color: "#a16207" }}>× {analytics.overall.heaviestSet.reps} reps</div>
                  </div>
                </div>
              )}

              {analytics.overall.best1RM && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: "8px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#1d4ed8", fontWeight: 700 }}>⚡ Peak Est. 1-Rep Max</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{analytics.overall.best1RM.exercise}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#1d4ed8" }}>{analytics.overall.best1RM.estimated1RM} lbs</div>
                    <div style={{ fontSize: "10px", color: "#2563eb" }}>({analytics.overall.best1RM.weight} lbs × {analytics.overall.best1RM.reps})</div>
                  </div>
                </div>
              )}

              {analytics.overall.highestRepSet && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#166534", fontWeight: 700 }}>🔁 High-Rep Endurance PR</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{analytics.overall.highestRepSet.exercise}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#166534" }}>{analytics.overall.highestRepSet.reps} reps</div>
                    <div style={{ fontSize: "10px", color: "#15803d" }}>@ {analytics.overall.highestRepSet.weight} lbs</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}