"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export function InviteAcceptor({
  clientName,
  trainerName,
}: {
  clientName: string;
  trainerName: string;
}) {
  const { update } = useSession();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const syncAndRedirect = async () => {
      try {
        if (update) {
          await update();
        }
      } catch (err) {
        console.error("Session update error:", err);
      } finally {
        timer = setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1200);
      }
    };

    syncAndRedirect();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [update]);

  const handleManualEnter = () => {
    setRedirecting(true);
    window.location.href = "/dashboard";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "460px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "36px 28px",
          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#f0fdf4",
            color: "#16a34a",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            border: "2px solid #bbf7d0",
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 700,
            marginBottom: "14px",
          }}
        >
          <Sparkles size={12} />
          <span>Account Connected</span>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
          Invite Accepted, {clientName}!
        </h1>

        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, margin: "0 0 24px 0" }}>
          Your athlete account has been linked to <b>{trainerName}</b>. Loading your custom workouts and training plan...
        </p>

        <button
          onClick={handleManualEnter}
          disabled={redirecting}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "14px 20px",
            fontSize: "14px",
            fontWeight: 700,
            justifyContent: "center",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          }}
        >
          <span>Entering Workout Portal...</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
