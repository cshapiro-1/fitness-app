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
} from "lucide-react";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<"TRAINER" | "CLIENT">("TRAINER");
  const [loading, setLoading] = useState(false);

  // Trainer Setup Form State
  const [coachName, setCoachName] = useState(session?.user?.name || "");
  const [specialty, setSpecialty] = useState("Hypertrophy & Strength");
  const [experienceYears, setExperienceYears] = useState("3-5 years");
  const [firstClientOption, setFirstClientOption] = useState<"sample" | "custom" | "skip">("sample");
  const [customClientName, setCustomClientName] = useState("");
  const [customClientEmail, setCustomClientEmail] = useState("");

  const handleRoleChosen = (role: "TRAINER" | "CLIENT") => {
    setSelectedRole(role);
    if (role === "TRAINER") {
      setStep(2); // Go to Trainer Setup Wizard
    } else {
      // Direct Client Setup
      finishOnboarding("CLIENT");
    }
  };

  const finishOnboarding = async (role: "TRAINER" | "CLIENT") => {
    setLoading(true);
    try {
      // 1. Update User Role
      await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      // 2. If Trainer with custom client, create that client
      if (role === "TRAINER" && firstClientOption === "custom" && customClientName.trim()) {
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

      // 3. Force NextAuth session refresh & navigate
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
          maxWidth: "560px",
          width: "100%",
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                height: "6px",
                width: step === s ? "32px" : "12px",
                background: step === s ? "#2563eb" : step > s ? "#10b981" : "#e2e8f0",
                borderRadius: "3px",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* STEP 1: Role Selection */}
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
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
                margin: "0 auto 16px auto",
              }}
            >
              <Sparkles size={28} />
            </div>

            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
              Welcome to FitCoach!
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 28px 0" }}>
              Choose your primary role to customize your workspace experience.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* TRAINER BUTTON */}
              <button
                type="button"
                onClick={() => handleRoleChosen("TRAINER")}
                disabled={loading}
                style={{
                  padding: "24px 16px",
                  background: "#eff6ff",
                  border: "2px solid #3b82f6",
                  borderRadius: "14px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                  }}
                >
                  <Dumbbell size={24} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px 0" }}>
                  I am a Trainer
                </h3>
                <p style={{ fontSize: "12px", color: "#3b82f6", margin: 0, lineHeight: 1.4 }}>
                  Manage clients, design AI routines & track PR analytics.
                </p>
              </button>

              {/* CLIENT BUTTON */}
              <button
                type="button"
                onClick={() => handleRoleChosen("CLIENT")}
                disabled={loading}
                style={{
                  padding: "24px 16px",
                  background: "#ffffff",
                  border: "2px solid #e2e8f0",
                  borderRadius: "14px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#f1f5f9",
                    color: "#475569",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px auto",
                  }}
                >
                  <Users size={24} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>
                  I am an Athlete
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                  View assigned workouts, log sets, and access nutrition.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Coach Profile & Business Specialization */}
        {step === 2 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Briefcase size={20} style={{ color: "#2563eb" }} />
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Coach Studio Setup
              </h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 20px 0" }}>
              Step 2 of 4: Tell us about your training practice.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Coach / Business Name
                </label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="e.g. Coach Jose Dildine"
                  className="input-field"
                  style={{ width: "100%", padding: "10px 12px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Primary Specialty
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", padding: "10px 12px" }}
                >
                  <option value="Hypertrophy & Strength">Hypertrophy & Strength (Bodybuilding / Powerbuilding)</option>
                  <option value="Powerlifting & Peak Strength">Powerlifting & 1RM Strength</option>
                  <option value="Athletic Performance">Athletic Performance & Functional Conditioning</option>
                  <option value="Weight Loss & Transformation">Weight Loss & Body Recomposition</option>
                  <option value="Calisthenics & Gymnastics">Calisthenics & Bodyweight Mastery</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Coaching Experience
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="input-field"
                  style={{ width: "100%", padding: "10px 12px" }}
                >
                  <option value="1-2 years">1–2 years (Emerging Coach)</option>
                  <option value="3-5 years">3–5 years (Experienced Trainer)</option>
                  <option value="5+ years">5+ years (Master Coach / Gym Owner)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary"
                  style={{ flex: 2, padding: "10px", justifyContent: "center", fontWeight: 700 }}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: First Client Setup */}
        {step === 3 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <UserPlus size={20} style={{ color: "#2563eb" }} />
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Add Your First Client
              </h2>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 20px 0" }}>
              Step 3 of 4: Setup your roster or start with a sample client.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                {
                  id: "sample",
                  title: "Start with Pre-Loaded Sample Client",
                  desc: "Includes sample routines, sets & PR tracking ready to explore.",
                  icon: "🚀",
                },
                {
                  id: "custom",
                  title: "Add a Real Client Now",
                  desc: "Enter their name and send them a free client portal invite link.",
                  icon: "👤",
                },
                {
                  id: "skip",
                  title: "Skip for Now",
                  desc: "Start with a clean studio workspace and add clients later.",
                  icon: "✨",
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setFirstClientOption(opt.id as any)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid",
                    borderColor: firstClientOption === opt.id ? "#2563eb" : "#e2e8f0",
                    background: firstClientOption === opt.id ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "22px" }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      {opt.desc}
                    </div>
                  </div>
                </div>
              ))}

              {firstClientOption === "custom" && (
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginTop: "4px" }}>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Client Full Name *
                    </label>
                    <input
                      type="text"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="input-field"
                      style={{ width: "100%", padding: "8px 10px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Client Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={customClientEmail}
                      onChange={(e) => setCustomClientEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="input-field"
                      style={{ width: "100%", padding: "8px 10px" }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="btn-primary"
                  style={{ flex: 2, padding: "10px", justifyContent: "center", fontWeight: 700 }}
                >
                  Review &amp; Launch <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Summary & Studio Launch */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "#f0fdf4",
                color: "#16a34a",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
              Your Studio is Ready!
            </h2>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 20px 0" }}>
              Here is a summary of your coach workspace configuration:
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "left",
                marginBottom: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Coach Name:</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{coachName || "Coach"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Specialty:</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>{specialty}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Experience:</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{experienceYears}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>Starting Setup:</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>
                  {firstClientOption === "sample"
                    ? "Sample Client Roster"
                    : firstClientOption === "custom"
                    ? `Client: ${customClientName || "New Client"}`
                    : "Clean Studio"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => finishOnboarding("TRAINER")}
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              }}
            >
              {loading ? (
                <>
                  <div className="spin-inline" /> Launching Studio...
                </>
              ) : (
                <>
                  <Zap size={18} /> Launch Coach Dashboard
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}