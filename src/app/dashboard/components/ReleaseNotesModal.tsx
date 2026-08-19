"use client";

import React from "react";
import { X, Sparkles, CheckCircle2, Search, Zap, Activity, Timer, Smartphone, ShieldCheck, Dumbbell } from "lucide-react";

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReleaseNotesModal({ isOpen, onClose }: ReleaseNotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="client-modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="client-modal-card"
        style={{ maxWidth: "620px", maxHeight: "88vh", overflowY: "auto", padding: "28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
              <Sparkles size={12} />
              <span>What&apos;s New in STRKYR Fitness</span>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Release Notes &amp; Updates
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Versions Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Version 1.2.0 */}
          <div style={{ border: "2px solid #3b82f6", borderRadius: "14px", padding: "18px", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>Version 1.2.0</span>
                <span style={{ fontSize: "10px", fontWeight: 700, background: "#2563eb", color: "#ffffff", padding: "2px 7px", borderRadius: "10px" }}>
                  Current Release
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>August 2026</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <Search size={18} style={{ color: "#2563eb", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Workout History Search &amp; Exercise Filter</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Search specific workouts or filter by individual exercises (e.g. Bench Press, Squat) to trace your historical weight and rep progression.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Zap size={18} style={{ color: "#8b5cf6", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>AI Routine Generator</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Build periodized hypertrophy, strength, or calisthenics routines with 1-click import into your coach workout builder.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Activity size={18} style={{ color: "#059669", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Barbell Plate Math Calculator</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Interactive visual barbell sleeve showing exact plate breakdown for 45, 35, 25, 10, 5, and 2.5 lb plates.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Timer size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Gym Rest Countdown Timer</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Quick 60s, 90s, 120s, and 180s rest timers directly in your athlete and coach dashboards.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Smartphone size={18} style={{ color: "#0284c7", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Native iOS &amp; Android App Store Packaging</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Capacitor 7.0 native runtime with over-the-air (OTA) sync and 1024x1024 master app icons.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Version 1.1.0 */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Version 1.1.0</span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>August 2026</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>Instant 1-click client portal invite links.</li>
              <li>Nutrition macros &amp; daily supplement stack tracking.</li>
              <li>Stripe billing and subscription portal for trainers.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: "24px", textAlign: "right" }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
