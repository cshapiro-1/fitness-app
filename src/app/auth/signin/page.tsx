"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Shield, Key, ArrowRight, UserCheck, AlertCircle, Sparkles } from "lucide-react";

function getCleanCallbackUrl(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/dashboard";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {}
  if (decoded.startsWith("/")) return decoded;
  try {
    const parsed = new URL(decoded, "https://strkyr.fit");
    if (parsed.pathname && parsed.pathname.startsWith("/")) {
      return parsed.pathname + (parsed.search || "");
    }
  } catch {
    return "/dashboard";
  }
  return "/dashboard";
}

function SignInContent() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl = getCleanCallbackUrl(rawCallback);
  const isInviteFlow = callbackUrl.includes("/invite/");

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingService, setLoadingService] = useState(false);
  const [showServiceLogin, setShowServiceLogin] = useState(false);
  const [serviceEmail, setServiceEmail] = useState("service@fitcoach.pro");
  const [servicePassword, setServicePassword] = useState("FitCoachAdmin2026!");
  const [serviceError, setServiceError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    await signIn("google", { callbackUrl });
  };

  const handleServiceSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingService(true);
    setServiceError("");

    try {
      const res = await signIn("credentials", {
        email: serviceEmail,
        password: servicePassword,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setServiceError("Invalid service account credentials.");
      } else if (res?.url) {
        window.location.href = res.url;
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setServiceError("Failed to sign in with service account.");
    } finally {
      setLoadingService(false);
    }
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
        <div style={{ marginBottom: "1.5rem" }}>
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
              margin: "0 auto 1rem auto",
              fontSize: "28px",
            }}
          >
            💪
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem 0", letterSpacing: "-0.02em" }}>
            STRKYR Fitness
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
            Unified platform for coaches and athletes
          </p>
        </div>

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

        {/* Google Sign In Button (Hero) */}
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle || loadingService}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              padding: "12px 16px",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#1e293b",
              cursor: loadingGoogle ? "not-allowed" : "pointer",
              opacity: loadingGoogle ? 0.7 : 1,
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ width: "20px", height: "20px", flexShrink: 0 }}>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>{loadingGoogle ? "Connecting..." : "Continue with Google"}</span>
          </button>
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", marginBottom: 0 }}>
            {isInviteFlow ? "Instant 1-click free client portal access" : "Recommended for athlete and client accounts."}
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "1.25rem",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          <span>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>

        {/* Service Account Toggle / Form */}
        {!showServiceLogin ? (
          <button
            type="button"
            onClick={() => setShowServiceLogin(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#334155",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Shield size={14} style={{ color: "#2563eb" }} />
            <span>Master Service Account Login (Admin / Trainer)</span>
          </button>
        ) : (
          <form
            onSubmit={handleServiceSignIn}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <Shield size={16} style={{ color: "#2563eb" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                Service Account Login
              </span>
            </div>

            {serviceError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "12px",
                }}
              >
                <AlertCircle size={13} />
                <span>{serviceError}</span>
              </div>
            )}

            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                Service Email
              </label>
              <input
                type="email"
                value={serviceEmail}
                onChange={(e) => setServiceEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "4px" }}>
                Password / Access Key
              </label>
              <input
                type="password"
                value={servicePassword}
                onChange={(e) => setServicePassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loadingService}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: loadingService ? "not-allowed" : "pointer",
                opacity: loadingService ? 0.7 : 1,
              }}
            >
              <span>{loadingService ? "Authenticating..." : "Sign in as Service Admin"}</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => setShowServiceLogin(false)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "11px",
                marginTop: "10px",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              Cancel & Return
            </button>
          </form>
        )}
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