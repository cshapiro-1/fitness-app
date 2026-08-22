"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dumbbell,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Target,
  UserPlus,
  Briefcase,
  Zap,
  Flame,
  Award,
  Calendar,
} from "lucide-react";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState<number>(1);
  const [selectedPath, setSelectedPath] = useState<"INDIVIDUAL" | "TRAINER">("INDIVIDUAL");
  const [loading, setLoading] = useState(false);

  // Personal Journey State
  const [goal, setGoal] = useState("Hypertrophy & Muscle Growth");
  const [split, setSplit] = useState("Push / Pull / Legs (PPL)");
  const [frequency, setFrequency] = useState("4-5 Days / Week");
  const [experience, setExperience] = useState("Intermediate (1-3 years)");
  const [equipment, setEquipment] = useState("Full Commercial Gym");

  // Trainer Setup Form State
  const [coachName, setCoachName] = useState(session?.user?.name || "");
  const [specialty, setSpecialty] = useState("Hypertrophy & Strength");
  const [experienceYears, setExperienceYears] = useState("3-5 years");
  const [firstClientOption, setFirstClientOption] = useState<"sample" | "custom" | "skip">("sample");
  const [customClientName, setCustomClientName] = useState("");
  const [customClientEmail, setCustomClientEmail] = useState("");

  const handlePathChosen = (path: "INDIVIDUAL" | "TRAINER") => {
    setSelectedPath(path);
    setStep(2);
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      if (selectedPath === "INDIVIDUAL") {
        // Set user role as CLIENT (Athlete / Individual)
        await fetch("/api/user/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "CLIENT" }),
        });

        // Create or update personal athlete profile with fitness goals
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fitnessGoals: `${goal} | ${split} (${frequency})`,
            notes: `Experience: ${experience}. Equipment: ${equipment}.`,
          }),
        });
      } else {
        // Set user role as TRAINER
        await fetch("/api/user/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "TRAINER" }),
        });

        if (firstClientOption === "custom" && customClientName.trim()) {
          await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: customClientName.trim(),
              email: customClientEmail.trim() || undefined,
              fitnessGoals: `${specialty} Athlete`,
            }),
          });
        }
      }

      if (update) await update();
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "36px 32px",
          borderRadius: "20px",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
          maxWidth: "580px",
          width: "100%",
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: step >= s ? "32px" : "10px",
                height: "6px",
                borderRadius: "3px",
                background: step >= s ? "#2563eb" : "#e2e8f0",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* STEP 1: PATH SELECTION */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <Sparkles size={28} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                Welcome to STRKYR
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                Choose how you want to experience your fitness journey today.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              {/* Option A: Personal Fitness Journey (Hero) */}
              <div
                onClick={() => handlePathChosen("INDIVIDUAL")}
                style={{
                  border: "2px solid #2563eb",
                  background: "#f0f7ff",
                  borderRadius: "16px",
                  padding: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "16px",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    letterSpacing: "0.05em",
                  }}
                >
                  RECOMMENDED
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Flame size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Personal Workout Journey
                    </h3>
                  </div>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                    Design custom routines, track 1RM progressive overload, use visual plate math, and level up your physique.
                  </p>
                </div>
                <ArrowRight size={20} style={{ color: "#2563eb", alignSelf: "center" }} />
              </div>

              {/* Option B: Coach / Personal Trainer */}
              <div
                onClick={() => handlePathChosen("TRAINER")}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "#f1f5f9",
                    color: "#475569",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Briefcase size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>
                    Coach &amp; Trainer Studio
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                    Manage client rosters, send 1-click athlete invite links, assign periodized routines, and monitor adherence.
                  </p>
                </div>
                <ArrowRight size={20} style={{ color: "#94a3b8", alignSelf: "center" }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL JOURNEY SETUP */}
        {step === 2 && selectedPath === "INDIVIDUAL" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                Customize Your Training Path
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Tell us about your goals so we can tailor your workout experience.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "28px" }}>
              {/* Goal */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  🎯 Primary Fitness Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#ffffff" }}
                >
                  <option>Hypertrophy &amp; Muscle Growth</option>
                  <option>Pure Strength &amp; Powerlifting</option>
                  <option>Body Recomposition &amp; Fat Loss</option>
                  <option>Mobility, Longevity &amp; Calisthenics</option>
                </select>
              </div>

              {/* Split Preference */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  📅 Preferred Training Split
                </label>
                <select
                  value={split}
                  onChange={(e) => setSplit(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#ffffff" }}
                >
                  <option>Push / Pull / Legs (PPL)</option>
                  <option>Upper / Lower Split (4-Day)</option>
                  <option>Arnold Classic Bodypart Split</option>
                  <option>Full Body 3x per Week</option>
                </select>
              </div>

              {/* Weekly Frequency */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                    ⚡ Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option>3 Days / Week</option>
                    <option>4-5 Days / Week</option>
                    <option>6 Days / Week</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                    🏋️ Equipment
                  </label>
                  <select
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option>Full Commercial Gym</option>
                    <option>Home Barbell &amp; DBs</option>
                    <option>Bodyweight Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: "12px 18px",
                  borderRadius: "10px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <span>Continue to Preview</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: JOURNEY ACTIVATION & PRO TRIAL */}
        {step === 3 && selectedPath === "INDIVIDUAL" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <Award size={28} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                Your Fitness Journey is Ready
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                14-Day Free STRKYR Pro Membership Activated
              </p>
            </div>

            {/* Program Summary Card */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Personal Roadmap
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                {goal}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                {split} • {frequency} • {equipment}
              </div>
            </div>

            {/* Pro Features Pill List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {[
                "Unlimited Personal Workout Logging & History",
                "AI Routine Periodization Generator",
                "Interactive 3D Muscle Anatomy Guides",
                "Live Rest Stopwatch & Barbell Plate Math",
                "Strength PRs & Volume Tonnage Tracking",
              ].map((feat, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
                  <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={finishOnboarding}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff",
                border: "none",
                fontWeight: 800,
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
              }}
            >
              <span>{loading ? "Initializing Studio..." : "Start My Workout Journey"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* TRAINER SETUP WIZARD (If Trainer Selected) */}
        {step === 2 && selectedPath === "TRAINER" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                Coach Studio Setup
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Configure your coaching profile to start managing clients.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Coach / Studio Name
                </label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="e.g. Coach Collin"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Coaching Specialty
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Hypertrophy, Powerlifting, Weight Loss"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: "12px 18px",
                  borderRadius: "10px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                <span>{loading ? "Setting Up..." : "Launch Coach Studio"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}