"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Dumbbell,
  Users,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Compass,
  Timer,
  Activity,
  Heart,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";

export interface DashboardTourModalProps {
  role: "TRAINER" | "CLIENT";
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardTourModal({ role, isOpen, onClose }: DashboardTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const storageKey = role === "TRAINER" ? "strkyr_tour_seen_trainer" : "strkyr_tour_seen_client";

  const handleCloseTour = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch {}
    onClose();
  };

  const trainerSteps = [
    {
      id: "builder",
      tabName: "Workout Builder & AI Programming",
      title: "Design & Assign Workouts with AI Co-Pilot",
      icon: <Dumbbell size={24} style={{ color: "#2563eb" }} />,
      description: "Build custom workouts manually or use free-text AI generation (e.g. '4-day hypertrophy split for Sarah'). You have 100% final approval before assigning to your athletes.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>🏋️ Upper Power &amp; Hypertrophy</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>AI Drafted</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 8px", borderRadius: "6px" }}>
              <span>1. Barbell Bench Press</span>
              <strong style={{ color: "#334155" }}>4 sets x 6-8 reps</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 8px", borderRadius: "6px" }}>
              <span>2. Incline DB Press</span>
              <strong style={{ color: "#334155" }}>3 sets x 10-12 reps</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 8px", borderRadius: "6px" }}>
              <span>3. Barbell Bent-Over Row</span>
              <strong style={{ color: "#334155" }}>4 sets x 8-10 reps</strong>
            </div>
          </div>
          <div style={{ marginTop: "10px", textAlign: "right" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#ffffff", background: "#2563eb", padding: "4px 10px", borderRadius: "6px" }}>
              Assign to Client ➔
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "roster",
      tabName: "Client Roster & Instant Invites",
      title: "Manage Athlete Portals with 1-Click Invites",
      icon: <Users size={24} style={{ color: "#16a34a" }} />,
      description: "Switch seamlessly between athletes in the left sidebar. Generate instant 1-click invite links so your clients get instant, free access to their personalized athlete portal.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
            Active Athletes (Roster)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 10px", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>SC</div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a8a" }}>Sarah Connor</span>
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" }}>Active</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "8px 10px", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#64748b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>JW</div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>John Wick</span>
              </div>
              <span style={{ fontSize: "10px", color: "#64748b" }}>Assigned 2h ago</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "history",
      tabName: "Workout History & Session Replays",
      title: "Complete Session History with 1-Click Repeat",
      icon: <Calendar size={24} style={{ color: "#d97706" }} />,
      description: "Review logged sessions, set-by-set telemetry, RPE notes, and completed exercises. Re-run any past workout with a single click of the 'Repeat Workout' button.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Leg Day Hypertrophy • Aug 22</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>Completed</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", background: "#f8fafc", padding: "8px", borderRadius: "6px", fontSize: "11px", textAlign: "center" }}>
            <div><span style={{ color: "#64748b", display: "block" }}>Volume</span><b>18,450 lbs</b></div>
            <div><span style={{ color: "#64748b", display: "block" }}>Total Sets</span><b>22 sets</b></div>
            <div><span style={{ color: "#64748b", display: "block" }}>Top Lift</span><b>315 lb Squat</b></div>
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      tabName: "Kinematic Analytics & AI Insights",
      title: "Progressive Overload Modeling & Symmetry",
      icon: <TrendingUp size={24} style={{ color: "#7c3aed" }} />,
      description: "Track 1RM trajectory curves, volume distribution, and push/pull structural balance. Click '✨ AI Insights' anytime for neural training analysis and periodization advice.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Bench Press Progression (+9.8%)</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>Est. 1RM 260 lbs</span>
          </div>
          <div style={{ height: "40px", width: "100%", background: "#f8fafc", borderRadius: "6px", display: "flex", alignItems: "flex-end", padding: "4px", gap: "4px" }}>
            <div style={{ height: "40%", width: "20%", background: "#93c5fd", borderRadius: "2px" }} />
            <div style={{ height: "60%", width: "20%", background: "#60a5fa", borderRadius: "2px" }} />
            <div style={{ height: "75%", width: "20%", background: "#3b82f6", borderRadius: "2px" }} />
            <div style={{ height: "90%", width: "20%", background: "#2563eb", borderRadius: "2px" }} />
            <div style={{ height: "100%", width: "20%", background: "#1d4ed8", borderRadius: "2px" }} />
          </div>
        </div>
      ),
    },
  ];

  const clientSteps = [
    {
      id: "assigned",
      tabName: "Assigned Workouts",
      title: "Execute Coach-Assigned Workouts",
      icon: <Dumbbell size={24} style={{ color: "#2563eb" }} />,
      description: "Your coach prepares customized training sessions for you. View upcoming routines, warm-up instructions, and tap 'Start Workout' when you step onto the gym floor.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>Today: Lower Body Strength</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: "4px" }}>Assigned by Coach</span>
          </div>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 10px 0" }}>
            Focus on deep eccentric squats and explosive hip thrusts.
          </p>
          <div style={{ textAlign: "center", background: "#2563eb", color: "#ffffff", padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 800 }}>
            Start Workout ➔
          </div>
        </div>
      ),
    },
    {
      id: "logging",
      tabName: "In-Gym Set Logger & Rest Timer",
      title: "Track Weights, Reps & Rest in Real Time",
      icon: <Timer size={24} style={{ color: "#d97706" }} />,
      description: "Log your weights and reps with zero friction. Use the built-in rest stopwatch, view 3D muscle anatomy guides for perfect form, and calculate barbell plates instantly.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Set 1: Barbell Squat</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706" }}>⏱️ Rest 1:30</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#64748b", display: "block" }}>Weight</span>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>225 lbs</strong>
            </div>
            <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#64748b", display: "block" }}>Reps</span>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>8 reps</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "history",
      tabName: "Personal History & PR Celebrations",
      title: "Celebrate PRs & Strength Milestones",
      icon: <Award size={24} style={{ color: "#16a34a" }} />,
      description: "Every lift you complete is recorded with milestone tracking. Watch your volume surge and track personal records across all major movements over time.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Award size={18} style={{ color: "#16a34a" }} />
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#16a34a" }}>New Personal Record!</span>
          </div>
          <div style={{ fontSize: "12px", color: "#334155" }}>
            Barbell Deadlift: <b>365 lbs x 5 reps</b> (Estimated 1RM: 410 lbs)
          </div>
        </div>
      ),
    },
    {
      id: "recovery",
      tabName: "Recovery & Mobility Stretches",
      title: "Pre-Lift Warmups & Post-Lift Stretches",
      icon: <Heart size={24} style={{ color: "#ec4899" }} />,
      description: "Access curated pre-workout warmup routines and muscle-specific recovery stretches to keep your joints healthy, relieve soreness, and optimize athletic longevity.",
      mockup: (
        <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", display: "block", marginBottom: "6px" }}>
            Post-Workout Cooldown Protocol
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ fontSize: "11px", background: "#fdf2f8", color: "#db2777", padding: "4px 8px", borderRadius: "6px", fontWeight: 600 }}>Hamstrings (2 min)</span>
            <span style={{ fontSize: "11px", background: "#eff6ff", color: "#2563eb", padding: "4px 8px", borderRadius: "6px", fontWeight: 600 }}>Hip Flexors (2 min)</span>
          </div>
        </div>
      ),
    },
  ];

  const steps = role === "TRAINER" ? trainerSteps : clientSteps;
  const current = steps[currentStep];

  if (!isOpen) return null;

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
        if (e.target === e.currentTarget) handleCloseTour();
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          maxWidth: "560px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <StrkyrLogo size={36} />
            <div>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {role === "TRAINER" ? "Coach Studio Tour" : "Athlete Portal Tour"} • Step {currentStep + 1} of {steps.length}
              </span>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "17px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
                {current.tabName}
              </h3>
            </div>
          </div>
          <button
            onClick={handleCloseTour}
            style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {steps.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              style={{
                flex: 1,
                height: "4px",
                borderRadius: "2px",
                background: currentStep === idx ? "#2563eb" : currentStep > idx ? "#93c5fd" : "#e2e8f0",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </div>

        {/* Main Body */}
        <div
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ background: "#ffffff", padding: "6px", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
              {current.icon}
            </div>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1e3a8a" }}>
              {current.title}
            </h4>
          </div>

          <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.45, margin: "0 0 14px 0" }}>
            {current.description}
          </p>

          {/* Interactive Graphical Mockup */}
          {current.mockup}
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: currentStep === 0 ? "#94a3b8" : "#475569",
              fontWeight: 700,
              fontSize: "13px",
              cursor: currentStep === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
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
              <span>Next Feature ({currentStep + 1}/{steps.length})</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCloseTour}
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
              <span>Finish Tour &amp; Start Training</span>
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardTourModal;
