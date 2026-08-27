"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Shield, Key, ArrowRight, UserCheck, AlertCircle, Sparkles } from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { GoogleIcon } from "@/components/GoogleIcon";

function getCleanCallbackUrl(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  if (raw.startsWith("/")) return raw;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/")) return decoded;
    if (/^https?:\/\/[a-zA-Z0-9.-]+/i.test(decoded)) {
      const parsed = new URL(decoded);
      if (parsed.pathname && parsed.pathname.startsWith("/")) {
        return parsed.pathname + (parsed.search || "");
      }
    }
  } catch {}
  return "/dashboard";
}

function SignInContent() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl = getCleanCallbackUrl(rawCallback);
  const isInviteFlow = callbackUrl.includes("/invite/");

  const authError = searchParams.get("error");

  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          padding: "2.5rem 2rem",
          borderRadius: "20px",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <StrkyrLogo size={64} />
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.25rem 0", letterSpacing: "-0.03em" }}>
            STRKYR
          </h1>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            STYRKR • COACH STUDIO
          </div>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
            Unified strength &amp; performance platform for coaches and athletes
          </p>
        </div>

        {/* Auth Notice / Error Banner */}
        {authError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "1.25rem",
              textAlign: "left",
            }}
          >
            <AlertCircle size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
            <span>
              {authError === "Callback"
                ? "Sign-in authorization session expired or domain mismatched. Please click Continue with Google below to proceed."
                : `Authentication notice: ${authError}`}
            </span>
          </div>
        )}

        {/* Invite Flow Alert Banner */}
        {isInviteFlow && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "1.25rem",
              textAlign: "left",
            }}
          >
            <Sparkles size={16} style={{ color: "#2563eb", flexShrink: 0 }} />
            <span>
              <b>Accepting Client Invite:</b> Sign in with Google to automatically connect your athlete portal to your coach.
            </span>
          </div>
        )}

        {/* IdP OAuth Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              padding: "13px 16px",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#1e293b",
              cursor: loadingGoogle ? "not-allowed" : "pointer",
              opacity: loadingGoogle ? 0.7 : 1,
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
              transition: "all 0.15s ease",
            }}
          >
            <GoogleIcon size={20} />
            <span>{loadingGoogle ? "Connecting..." : "Continue with Google"}</span>
          </button>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px", marginBottom: 0 }}>
            {isInviteFlow
              ? "Instant 1-click free client portal access"
              : "Secure passwordless authentication via Google."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8fafc" }} />}>
      <SignInContent />
    </Suspense>
  );
}