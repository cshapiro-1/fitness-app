"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Users,
  Award,
  Scale,
  Brain,
  MessageSquare,
  Lock,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";

interface CoachWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  isEmbedded?: boolean;
}

export function CoachWalkthroughModal({
  isOpen,
  onClose,
  onComplete,
  isEmbedded = false,
}: CoachWalkthroughModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen && !isEmbedded) return null;

  const slides = [
    {
      id: "pillar-1",
      badge: "Pillar 1 • The Core Philosophy",
      title: "You Are the Final Authority. AI is Your Co-Pilot.",
      icon: <ShieldCheck size={28} style={{ color: "#2563eb" }} />,
      headline: "AI proposes workouts, volume math, and periodization. You have 100% sign-off.",
      details: [
        "Clients pay for human accountability, empathy, and coaching expertise — not a generic chatbot.",
        "STRKYR's AI generates complete mesocycle frameworks and rep schemes in seconds, saving you 80% of admin time.",
        "Nothing is ever assigned to your athletes until you review, tweak, and give 1-click final approval.",
      ],
      diagram: (
        <div style={{ background: "#ffffff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px", marginTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>
            <span style={{ background: "#eff6ff", padding: "4px 8px", borderRadius: "6px" }}>⚡ AI Proposes Draft</span>
            <span>➔</span>
            <span style={{ background: "#dbeafe", padding: "4px 8px", borderRadius: "6px", color: "#1d4ed8" }}>👑 Coach Reviews &amp; Tweaks</span>
            <span>➔</span>
            <span style={{ background: "#dcfce7", padding: "4px 8px", borderRadius: "6px", color: "#15803d" }}>🎯 Athlete Receives Plan</span>
          </div>
        </div>
      ),
    },
    {
      id: "pillar-2",
      badge: "Pillar 2 • Rapid Programming",
      title: "Natural Language Free-Text Routine Generation",
      icon: <Zap size={28} style={{ color: "#d97706" }} />,
      headline: "Describe any workout in plain English — build complete splits in seconds.",
      details: [
        'Type natural directives: "4-day upper/lower hypertrophy split for Sarah, focus on glutes & hamstrings, dumbbell and cable only."',
        "AI parses target muscles, equipment constraints, warmups, and rep ranges automatically.",
        "One-click import into the Workout Builder for instant customization and client assignment.",
      ],
      diagram: (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", fontSize: "12px", color: "#334155" }}>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>💡 Natural Language Input:</div>
          <div style={{ fontStyle: "italic", background: "#ffffff", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
            &ldquo;3-day full body strength for a beginner client with low back sensitivity&rdquo;
          </div>
        </div>
      ),
    },
    {
      id: "pillar-3",
      badge: "Pillar 3 • In-Gym Floor Assistant",
      title: "24/7 Client Guidance with Coach Telemetry",
      icon: <Activity size={28} style={{ color: "#16a34a" }} />,
      headline: "Instant exercise regressions for athletes on the gym floor + real-time coach alerts.",
      details: [
        "When an athlete is in the gym and experiences joint tightness or an occupied machine, AI suggests safe substitutions.",
        "Real-Time Telemetry: All substitutions, notes, and pain flags log automatically to your Coach Dashboard.",
        "You stay 100% informed of your athletes' training without receiving 6:00 AM text messages.",
      ],
      diagram: (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px", fontSize: "12px", color: "#166534" }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>🔔 Real-Time Coach Dashboard Alert:</div>
          <div>&ldquo;Sarah swapped Barbell Back Squat for Leg Press today due to knee tightness.&rdquo;</div>
        </div>
      ),
    },
    {
      id: "pillar-4",
      badge: "Pillar 4 • Neural Analytics & Growth",
      title: "Automated Kinematics & Hands-Off Retention",
      icon: <Scale size={28} style={{ color: "#7c3aed" }} />,
      headline: "Automated progressive overload modeling, push/pull symmetry, and dunning.",
      details: [
        "Interactive Performance Intelligence: Evaluates structural balance, push-to-pull ratios, and 1RM fatigue curves.",
        "Automated Dunning & Invoicing: 2-day trial reminders, lapsed subscription recovery, and quarterly check-in surveys.",
        "Scale your roster from 5 to 50+ clients while maintaining bespoke, high-touch coaching quality.",
      ],
      diagram: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "8px", fontSize: "11px" }}>
            <span style={{ color: "#64748b", display: "block" }}>Push/Pull Symmetry</span>
            <strong style={{ color: "#2563eb" }}>1.05:1.0 (Optimal)</strong>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "8px", fontSize: "11px" }}>
            <span style={{ color: "#64748b", display: "block" }}>Progressive Velocity</span>
            <strong style={{ color: "#16a34a" }}>+9.8% 1RM Surge</strong>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  const content = (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <StrkyrLogo size={38} />
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {current.badge}
            </span>
            <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
              {current.title}
            </h3>
          </div>
        </div>
        {!isEmbedded && (
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Progress Dots */}
      <div style={{ display: "flex", gap: "6px" }}>
        {slides.map((s, idx) => (
          <div
            key={s.id}
            onClick={() => setCurrentSlide(idx)}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "2px",
              background: currentSlide === idx ? "#2563eb" : "#e2e8f0",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          />
        ))}
      </div>

      {/* Main Slide Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
          border: "1px solid #bfdbfe",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ background: "#ffffff", padding: "8px", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
            {current.icon}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e3a8a", lineHeight: 1.3 }}>
            {current.headline}
          </div>
        </div>

        <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#334155", lineHeight: 1.45 }}>
          {current.details.map((detail, dIdx) => (
            <li key={dIdx}>{detail}</li>
          ))}
        </ul>

        {current.diagram}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          disabled={currentSlide === 0}
          onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            color: currentSlide === 0 ? "#94a3b8" : "#475569",
            fontWeight: 700,
            fontSize: "13px",
            cursor: currentSlide === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>

        {currentSlide < slides.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => prev + 1)}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            }}
          >
            <span>Next Pillar ({currentSlide + 1}/4)</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onComplete) onComplete();
              else onClose();
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#ffffff",
              border: "none",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
            }}
          >
            <span>Complete Walkthrough &amp; Launch</span>
            <CheckCircle2 size={16} />
          </button>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          maxWidth: "580px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default CoachWalkthroughModal;
