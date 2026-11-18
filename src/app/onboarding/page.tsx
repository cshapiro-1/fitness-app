"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Dumbbell,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Target,
  UserPlus,
  Briefcase,
  Zap,
  Award,
  Link2,
  ChevronRight,
  Mail,
  Flame,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { CoachWalkthroughModal } from "@/app/dashboard/components/CoachWalkthroughModal";

type RoleSelection = "CLIENT" | "TRAINER" | null;

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const [selectedRole, setSelectedRole] = useState<RoleSelection>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Common User State
  const [fullName, setFullName] = useState(session?.user?.name || "");

  // Athlete State
  const [athleteStep, setAthleteStep] = useState<number>(1);
  const [fitnessGoal, setFitnessGoal] = useState("Hypertrophy & Muscle Building");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate (1-3 yrs)");
  const [coachConnectType, setCoachConnectType] = useState<"none" | "token" | "email">("none");
  const [coachInviteCode, setCoachInviteCode] = useState("");
  const [coachEmail, setCoachEmail] = useState("");

  // Coach Setup Form State
  const [coachStep, setCoachStep] = useState<number>(1);
  const [studioName, setStudioName] = useState("");
  const [specialty, setSpecialty] = useState("Hypertrophy & Strength");
  const [experienceYears, setExperienceYears] = useState("3-5 years");
  const [firstClientOption, setFirstClientOption] = useState<"custom" | "skip">("custom");
  const [customClientName, setCustomClientName] = useState("");
  const [customClientEmail, setCustomClientEmail] = useState("");

  // Finish Athlete Onboarding
  const finishAthleteOnboarding = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "CLIENT",
          name: fullName.trim() || undefined,
          fitnessGoals: `${fitnessGoal} (${experienceLevel})`,
          inviteCode: coachConnectType === "token" && coachInviteCode.trim() ? coachInviteCode.trim() : undefined,
          coachEmail: coachConnectType === "email" && coachEmail.trim() ? coachEmail.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to complete athlete setup");
      }

      if (update) await update();
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong. Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  // Finish Coach Onboarding
  const finishCoachOnboarding = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      // 1. Set role as TRAINER and initialize personal tracking client profile
      await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "TRAINER" }),
      });

      // 2. Update coach profile details
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim() || undefined,
          fitnessGoals: `Specialty: ${specialty}. Experience: ${experienceYears}.${studioName ? ` Studio: ${studioName}` : ""}`,
          notes: `Master Coach Profile`,
          hasCompletedOnboarding: true,
          hasSeenTour: true,
        }),
      });

      // 3. Create first real client if specified
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

      if (update) await update();
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to complete coach setup");
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
          maxWidth: selectedRole === null ? "640px" : "600px",
          width: "100%",
          transition: "max-width 0.2s ease",
        }}
      >
        {/* Logo and Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <StrkyrLogo size={52} />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
            Welcome to STRKYR Fitness
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            {selectedRole === null
              ? "Choose your account type to personalize your experience."
              : selectedRole === "CLIENT"
              ? "Athlete Portal Setup — Tailored for your gym workouts and strength progression."
              : "Coach Studio Setup — Periodized programming, client rosters, and personal tracking."}
          </p>
        </div>

        {errorMessage && (
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
            {errorMessage}
          </div>
        )}

        {/* STEP 0: ROLE SELECTION */}
        {selectedRole === null && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              How do you plan to use STRKYR?
            </div>

            {/* Role Option 1: Athlete / Trainee */}
            <div
              onClick={() => setSelectedRole("CLIENT")}
              style={{
                border: "2px solid #e2e8f0",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px 18px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.background = "#f8faff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Dumbbell size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>I&apos;m an Athlete / Trainee</span>
                  <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px" }}>
                    Free Portal
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px 0", lineHeight: 1.4 }}>
                  Log workouts on the gym floor, calculate barbell plates, track personal strength PRs, and connect with your coach.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>⚡ Fast Gym Floor Logger</span>
                  <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>🏋️ Barbell Loading Calculator</span>
                  <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>📈 PR Growth Curves</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", alignSelf: "center", color: "#2563eb" }}>
                <ChevronRight size={20} />
              </div>
            </div>

            {/* Role Option 2: Coach / Personal Trainer */}
            <div
              onClick={() => setSelectedRole("TRAINER")}
              style={{
                border: "2px solid #e2e8f0",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px 18px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.background = "#f8faff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "#ffffff";
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#faf5ff",
                  color: "#9333ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Users size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>I&apos;m a Coach / Personal Trainer</span>
                  <span style={{ background: "#f3e8ff", color: "#7e22ce", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px" }}>
                    Coach Studio
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px 0", lineHeight: 1.4 }}>
                  Build periodized routines, manage athlete rosters, review client workout logs, and track your own personal training.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>📋 Mesocycle Builder</span>
                  <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>🔗 1-Click Client Invites</span>
                  <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>⚡ Dedicated Personal Workout Mode</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", alignSelf: "center", color: "#9333ea" }}>
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        )}

        {/* ----------------- ATHLETE ONBOARDING FLOW ----------------- */}
        {selectedRole === "CLIENT" && (
          <div>
            {/* Step Indicator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  if (athleteStep === 1) setSelectedRole(null);
                  else setAthleteStep(1);
                }}
                style={{ background: "transparent", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
              >
                <ArrowLeft size={14} />
                <span>{athleteStep === 1 ? "Change Role" : "Back"}</span>
              </button>

              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    style={{
                      width: athleteStep >= s ? "28px" : "10px",
                      height: "6px",
                      borderRadius: "3px",
                      background: athleteStep >= s ? "#2563eb" : "#e2e8f0",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Athlete Step 1: Goals & Experience */}
            {athleteStep === 1 && (
              <div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    Your Fitness Goals
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    Tell us what you want to achieve so we can tailor your gym floor analytics and tracking.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Collin Shapiro"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Primary Training Focus
                    </label>
                    <select
                      value={fitnessGoal}
                      onChange={(e) => setFitnessGoal(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#ffffff", boxSizing: "border-box" }}
                    >
                      <option>Hypertrophy &amp; Muscle Building</option>
                      <option>Raw Strength &amp; 1RM Powerlifting</option>
                      <option>Athletic Performance &amp; Explosiveness</option>
                      <option>Body Recomposition &amp; Fat Loss</option>
                      <option>General Health, Mobility &amp; Longevity</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Training Experience
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#ffffff", boxSizing: "border-box" }}
                    >
                      <option>Beginner (Less than 1 year)</option>
                      <option>Intermediate (1-3 years)</option>
                      <option>Advanced (3+ years)</option>
                      <option>Competitive Athlete</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAthleteStep(2)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                  }}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Athlete Step 2: Connect with Coach or Solo */}
            {athleteStep === 2 && (
              <div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    Connect with Your Coach
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    Are you training under a personal trainer, or lifting solo?
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  {/* Option 1: Solo Athlete */}
                  <div
                    onClick={() => setCoachConnectType("none")}
                    style={{
                      border: coachConnectType === "none" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: coachConnectType === "none" ? "#eff6ff" : "#ffffff",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Zap size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>I&apos;m Training Solo</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Track your personal workouts and PRs without a coach. You can link later.</div>
                    </div>
                    {coachConnectType === "none" && <CheckCircle2 size={18} style={{ color: "#2563eb" }} />}
                  </div>

                  {/* Option 2: Enter Coach Invite Code / Token */}
                  <div
                    onClick={() => setCoachConnectType("token")}
                    style={{
                      border: coachConnectType === "token" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: coachConnectType === "token" ? "#eff6ff" : "#ffffff",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Link2 size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>I Have a Coach Invite Link or Code</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Redeem an invite code provided by your coach.</div>
                    </div>
                    {coachConnectType === "token" && <CheckCircle2 size={18} style={{ color: "#2563eb" }} />}
                  </div>

                  {coachConnectType === "token" && (
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginTop: "2px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                        Paste Invite Code or Full Link
                      </label>
                      <input
                        type="text"
                        value={coachInviteCode}
                        onChange={(e) => setCoachInviteCode(e.target.value)}
                        placeholder="e.g. strkyr.fit/invite/abc123xyz"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  )}

                  {/* Option 3: Connect by Coach Email */}
                  <div
                    onClick={() => setCoachConnectType("email")}
                    style={{
                      border: coachConnectType === "email" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: coachConnectType === "email" ? "#eff6ff" : "#ffffff",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mail size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Connect by Coach Email</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Search your coach by their registered email address.</div>
                    </div>
                    {coachConnectType === "email" && <CheckCircle2 size={18} style={{ color: "#2563eb" }} />}
                  </div>

                  {coachConnectType === "email" && (
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginTop: "2px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                        Coach Email Address
                      </label>
                      <input
                        type="email"
                        value={coachEmail}
                        onChange={(e) => setCoachEmail(e.target.value)}
                        placeholder="e.g. chisailor87@gmail.com"
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={finishAthleteOnboarding}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                    opacity: loading ? 0.8 : 1,
                  }}
                >
                  <span>{loading ? "Setting Up Portal..." : "Enter Athlete Portal 🚀"}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------- COACH ONBOARDING FLOW ----------------- */}
        {selectedRole === "TRAINER" && (
          <div>
            {/* Step Indicator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  if (coachStep === 1) setSelectedRole(null);
                  else setCoachStep(coachStep - 1);
                }}
                style={{ background: "transparent", border: "none", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
              >
                <ArrowLeft size={14} />
                <span>{coachStep === 1 ? "Change Role" : "Back"}</span>
              </button>

              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    style={{
                      width: coachStep >= s ? "28px" : "10px",
                      height: "6px",
                      borderRadius: "3px",
                      background: coachStep >= s ? "#2563eb" : "#e2e8f0",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Coach Step 1: Profile & Studio */}
            {coachStep === 1 && (
              <div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    Coach Studio Setup
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    Configure your coaching studio to prescribe workouts and manage athletes.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Coach Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jose Dildine"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Studio / Brand Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="e.g. STRKYR Performance Studio"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        Primary Specialty
                      </label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff", boxSizing: "border-box" }}
                      >
                        <option>Hypertrophy &amp; Strength</option>
                        <option>Powerlifting &amp; 1RM Peak</option>
                        <option>Body Transformation &amp; Cut</option>
                        <option>Mobility &amp; Athletic Performance</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        Experience
                      </label>
                      <select
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff", boxSizing: "border-box" }}
                      >
                        <option>1-2 years</option>
                        <option>3-5 years</option>
                        <option>6-10 years</option>
                        <option>10+ years</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCoachStep(2)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
                  }}
                >
                  <span>Continue to Client Setup</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Coach Step 2: Add First Client & Personal Tracking Note */}
            {coachStep === 2 && (
              <div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                    Add Your First Client
                  </h2>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    Every client gets an automatic 1-click invite link with free athlete portal access.
                  </p>
                </div>

                {/* Personal Workout Tracking Notice */}
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ color: "#16a34a" }}><Zap size={18} /></div>
                  <div style={{ fontSize: "12px", color: "#166534" }}>
                    <b>Personal Workouts Included:</b> We&apos;ve also created a private <b>&quot;My Personal Workouts&quot;</b> profile so you can log your own training without affecting client rosters.
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  {/* Option A: Custom Real Client */}
                  <div
                    onClick={() => setFirstClientOption("custom")}
                    style={{
                      border: firstClientOption === "custom" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: firstClientOption === "custom" ? "#f0f7ff" : "#ffffff",
                      borderRadius: "12px",
                      padding: "16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                      <UserPlus size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Add Athlete Now</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Create client profile and generate instant invite link</div>
                    </div>
                    {firstClientOption === "custom" && <CheckCircle2 size={18} style={{ color: "#2563eb" }} />}
                  </div>

                  {firstClientOption === "custom" && (
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginTop: "4px" }}>
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Athlete Full Name</label>
                        <input
                          type="text"
                          value={customClientName}
                          onChange={(e) => setCustomClientName(e.target.value)}
                          placeholder="e.g. Collin Shapiro"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Athlete Email (Optional)</label>
                        <input
                          type="email"
                          value={customClientEmail}
                          onChange={(e) => setCustomClientEmail(e.target.value)}
                          placeholder="e.g. athlete@example.com"
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Option B: Skip for now */}
                  <div
                    onClick={() => setFirstClientOption("skip")}
                    style={{
                      border: firstClientOption === "skip" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      background: firstClientOption === "skip" ? "#f0f7ff" : "#ffffff",
                      borderRadius: "12px",
                      padding: "16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                      <Users size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>I&apos;ll Add Clients Later</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Explore your studio dashboard and program workouts first</div>
                    </div>
                    {firstClientOption === "skip" && <CheckCircle2 size={18} style={{ color: "#2563eb" }} />}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setCoachStep(1)}
                    style={{ padding: "12px 18px", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoachStep(3)}
                    style={{ flex: 1, padding: "12px 20px", borderRadius: "10px", background: "#2563eb", color: "#ffffff", border: "none", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}
                  >
                    <span>Continue to Coach Walkthrough</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Coach Step 3: Coach Walkthrough & Finish */}
            {coachStep === 3 && (
              <div>
                <CoachWalkthroughModal
                  isOpen={true}
                  isEmbedded={true}
                  onClose={() => {}}
                  onComplete={finishCoachOnboarding}
                />

                {loading && (
                  <div style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "#2563eb", fontWeight: 700 }}>
                    Launching your Coach Studio...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
