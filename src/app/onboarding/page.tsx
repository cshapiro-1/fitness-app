"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
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
  Award,
  Link2,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { CoachWalkthroughModal } from "@/app/dashboard/components/CoachWalkthroughModal";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Coach Setup Form State
  const [coachName, setCoachName] = useState(session?.user?.name || "");
  const [studioName, setStudioName] = useState("");
  const [specialty, setSpecialty] = useState("Hypertrophy & Strength");
  const [experienceYears, setExperienceYears] = useState("3-5 years");
  const [firstClientOption, setFirstClientOption] = useState<"custom" | "skip">("custom");
  const [customClientName, setCustomClientName] = useState("");
  const [customClientEmail, setCustomClientEmail] = useState("");

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Set role as TRAINER
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
          name: coachName.trim() || undefined,
          fitnessGoals: `Specialty: ${specialty}. Experience: ${experienceYears}.${studioName ? ` Studio: ${studioName}` : ""}`,
          notes: `Master Coach Profile`,
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
          maxWidth: "600px",
          width: "100%",
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: step >= s ? "36px" : "10px",
                height: "6px",
                borderRadius: "3px",
                background: step >= s ? "#2563eb" : "#e2e8f0",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* STEP 1: COACH PROFILE & STUDIO BRANDING */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                <StrkyrLogo size={52} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                Coach Studio Setup
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                Configure your coaching profile to start prescribing workouts and managing athlete rosters.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                  Coach Full Name
                </label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="e.g. Collin Shapiro"
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
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
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
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
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
              onClick={() => setStep(2)}
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

        {/* STEP 2: ADD FIRST CLIENT (REAL CLIENT OR SKIP) */}
        {step === 2 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                Add Your First Client
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Every client gets an automatic 1-click invite link with free athlete portal access.
              </p>
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
                      placeholder="e.g. Sarah Connor"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Athlete Email (Optional)</label>
                    <input
                      type="email"
                      value={customClientEmail}
                      onChange={(e) => setCustomClientEmail(e.target.value)}
                      placeholder="e.g. sarah@example.com"
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
                onClick={() => setStep(1)}
                style={{ padding: "12px 18px", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{ flex: 1, padding: "12px 20px", borderRadius: "10px", background: "#2563eb", color: "#ffffff", border: "none", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}
              >
                <span>Continue to Coach Walkthrough</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COACH-GOVERNED AI INTERACTIVE WALKTHROUGH */}
        {step === 3 && (
          <div>
            <CoachWalkthroughModal
              isOpen={true}
              isEmbedded={true}
              onClose={() => {}}
              onComplete={finishOnboarding}
            />

            {loading && (
              <div style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "#2563eb", fontWeight: 700 }}>
                Launching your Coach Studio...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}