"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Dumbbell, Users } from "lucide-react";

export default function OnboardingPage() {
  const { update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const selectRole = async (role: "TRAINER" | "CLIENT") => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        // MAGIC LINE: Forces NextAuth to pull the new role from the database instantly
        await update(); 
        router.push("/dashboard");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update role");
        setLoading(false);
      }
    } catch (err) {
      alert("Network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "sans-serif" }}>
      <div style={{ background: "#ffffff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", textAlign: "center", maxWidth: "500px" }}>
        <h1 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "8px" }}>Welcome to Fitness Tracker!</h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>How will you be using the platform?</p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          {/* TRAINER BUTTON */}
          <button
            onClick={() => selectRole("TRAINER")}
            disabled={loading}
            style={{ flex: "1 1 200px", padding: "24px", background: "#eff6ff", border: "2px solid #3b82f6", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.2s" }}
          >
            <Dumbbell size={32} style={{ color: "#2563eb", margin: "0 auto 12px auto" }} />
            <h3 style={{ fontSize: "18px", color: "#1e40af", margin: "0 0 4px 0" }}>I am a Trainer</h3>
            <p style={{ fontSize: "12px", color: "#3b82f6", margin: 0 }}>I want to manage clients and create workouts.</p>
          </button>

          {/* CLIENT BUTTON */}
          <button
            onClick={() => selectRole("CLIENT")}
            disabled={loading}
            style={{ flex: "1 1 200px", padding: "24px", background: "#f8fafc", border: "2px solid #cbd5e1", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 0.2s" }}
          >
            <Users size={32} style={{ color: "#475569", margin: "0 auto 12px auto" }} />
            <h3 style={{ fontSize: "18px", color: "#334155", margin: "0 0 4px 0" }}>I am a Client</h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>I want to view my assigned workouts.</p>
          </button>
        </div>
      </div>
    </div>
  );
}