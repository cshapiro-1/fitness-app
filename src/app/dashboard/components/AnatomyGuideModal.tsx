"use client";

import React from "react";
import { X, Sparkles, Activity, Check, Info } from "lucide-react";

export interface AnatomyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  chartData?: {
    image: string;
    title: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    biomechanicsCue: string;
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
          maxWidth: "580px",
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
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
                {exerciseName}
              </h3>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>3D Medical Anatomical Muscle Recruitment</div>
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
            <span>Rendering 3D Muscle Anatomy Chart...</span>
          </div>
        ) : chartData ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* High-Res Muscle Anatomy Illustration */}
            <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid #1e293b", background: "#020617" }}>
              <img
                src={chartData.image}
                alt={chartData.title}
                style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }}
              />
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

            {/* Biomechanical Coaching Cue */}
            {chartData.biomechanicsCue && (
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid #1e293b", padding: "12px 14px", borderRadius: "10px", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.45 }}>
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
              Close Visual Guide
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
