"use client";

import React from "react";
import { X, Sparkles, Activity, Check, AlertTriangle, Wind, ListOrdered } from "lucide-react";

export interface AnatomyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  chartData?: {
    image: string;
    animationUrl?: string;
    thumbUrl?: string;
    equipment?: string;
    bodyPart?: string;
    muscleGroup?: string;
    title: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    biomechanicsCue: string;
    steps?: string[];
    commonMistakes?: string[];
    breathingPattern?: string;
  } | null;
  loading?: boolean;
}

export function AnatomyGuideModal({
  isOpen,
  onClose,
  exerciseName,
  chartData,
  loading = false,
}: AnatomyGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 110,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: "#f8fafc",
          padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "6px", borderRadius: "8px" }}>
              <Activity size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                  {exerciseName}
                </h3>
                {chartData?.equipment && (
                  <span style={{ fontSize: "10px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "2px 7px", borderRadius: "6px", fontWeight: 700, textTransform: "capitalize" }}>
                    {chartData.equipment}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Exercise Form &amp; Movement Guide</div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div className="spin-inline" style={{ width: "24px", height: "24px", margin: "0 auto 12px" }} />
            <span>Loading Movement Animation &amp; Form Guide...</span>
          </div>
        ) : chartData ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Animated Exercise Execution Demonstration Frame */}
            <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid #1e293b", background: "#020617", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "220px" }}>
              <img
                src={chartData.animationUrl || chartData.image}
                alt={chartData.title || exerciseName}
                style={{ width: "100%", maxHeight: "360px", objectFit: "contain", display: "block" }}
                onError={(e) => {
                  const currentSrc = (e.target as HTMLImageElement).src;
                  if (chartData.thumbUrl && currentSrc !== chartData.thumbUrl) {
                    (e.target as HTMLImageElement).src = chartData.thumbUrl;
                  } else if (chartData.image && currentSrc !== chartData.image) {
                    (e.target as HTMLImageElement).src = chartData.image;
                  } else {
                    (e.target as HTMLImageElement).src = "/exercise-animations/bench_press.gif";
                  }
                }}
              />
              <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", color: "#38bdf8", fontWeight: 700, letterSpacing: "0.5px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />
                <span>FORM DEMO</span>
              </div>
            </div>

            {/* Muscle Breakdown Badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(30, 41, 59, 0.6)", padding: "14px 16px", borderRadius: "12px", border: "1px solid #334155" }}>
              {/* Primary Agonists */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }} />
                  Primary Agonists (Cyan / Blue):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {chartData.primaryMuscles.map((m, idx) => (
                    <span key={idx} style={{ fontSize: "12px", fontWeight: 600, background: "rgba(56, 189, 248, 0.15)", color: "#bae6fd", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "3px 8px", borderRadius: "6px" }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Secondary Stabilizers */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#fb923c", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fb923c" }} />
                  Secondary Movers &amp; Synergists (Orange):
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {chartData.secondaryMuscles.map((m, idx) => (
                    <span key={idx} style={{ fontSize: "12px", fontWeight: 600, background: "rgba(251, 146, 60, 0.15)", color: "#fed7aa", border: "1px solid rgba(251, 146, 60, 0.3)", padding: "3px 8px", borderRadius: "6px" }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step-by-Step How-To Form Execution */}
            {chartData.steps && chartData.steps.length > 0 && (
              <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid #1e293b", padding: "16px", borderRadius: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#38bdf8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ListOrdered size={16} />
                  <span>Step-by-Step Proper Form Execution:</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {chartData.steps.map((step, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.45 }}>
                      <span style={{ background: "#2563eb", color: "#ffffff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, flexShrink: 0, marginTop: "1px" }}>
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Mistakes to Avoid */}
            {chartData.commonMistakes && chartData.commonMistakes.length > 0 && (
              <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", padding: "14px 16px", borderRadius: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#f87171", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <AlertTriangle size={14} />
                  <span>Common Form Mistakes to Avoid:</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {chartData.commonMistakes.map((mistake, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "#fca5a5", lineHeight: 1.4 }}>
                      <span style={{ color: "#ef4444", fontWeight: 800 }}>✕</span>
                      <span>{mistake}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breathing & Bracing Pattern */}
            {chartData.breathingPattern && (
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "12px 14px", borderRadius: "10px", fontSize: "12px", color: "#6ee7b7", display: "flex", alignItems: "center", gap: "8px", lineHeight: 1.4 }}>
                <Wind size={16} style={{ flexShrink: 0, color: "#10b981" }} />
                <div>
                  <b style={{ color: "#34d399" }}>🌬️ Breathing &amp; Bracing Pattern:</b> {chartData.breathingPattern}
                </div>
              </div>
            )}

            {/* Biomechanical Coaching Cue */}
            {chartData.biomechanicsCue && (
              <div style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid #334155", padding: "12px 14px", borderRadius: "10px", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.45 }}>
                <b style={{ color: "#38bdf8" }}>💡 Biomechanical Cue:</b> {chartData.biomechanicsCue}
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              Got It / Close Guide
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
