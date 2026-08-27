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

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [loadingService, setLoadingService] = useState(false);
  const [showServiceLogin, setShowServiceLogin] = useState(false);
  const [serviceEmail, setServiceEmail] = useState("service@fitcoach.pro");
  const [servicePassword, setServicePassword] = useState("FitCoachAdmin2026!");
  const [serviceError, setServiceError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    await signIn("google", { callbackUrl });
  };

  const handleAppleSignIn = async () => {
    setLoadingApple(true);
    await signIn("apple", { callbackUrl });
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

        {/* IdP OAuth Buttons (Google & Apple) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle || loadingApple || loadingService}
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
            <GoogleIcon size={20} />
            <span>{loadingGoogle ? "Connecting..." : "Continue with Google"}</span>
          </button>

          {/* Apple Sign In Button */}
          <button
            onClick={handleAppleSignIn}
            disabled={loadingGoogle || loadingApple || loadingService}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              borderRadius: "12px",
              border: "1px solid #0f172a",
              backgroundColor: "#0f172a",
              padding: "12px 16px",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#ffffff",
              cursor: loadingApple ? "not-allowed" : "pointer",
              opacity: loadingApple ? 0.7 : 1,
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 170 170" fill="currentColor" style={{ width: "18px", height: "18px", flexShrink: 0 }}>
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.05-7.66-7.79-11.89-14.23-6.73-10.23-12.18-21.98-16.34-35.25-4.16-13.28-6.24-25.75-6.24-37.42 0-14.68 3.73-27.17 11.2-37.46 7.46-10.3 17.06-15.54 28.79-15.75 4.8 0 10.1 1.25 15.9 3.74 5.8 2.5 9.7 3.84 11.71 4.02 1.62-.24 5.66-1.63 12.12-4.18 6.47-2.55 11.95-3.69 16.46-3.41 12.28.6 22.25 5.25 29.9 13.96-10.74 6.53-15.99 15.53-15.75 27 0 9.87 3.81 18.23 11.44 25.07 7.62 6.84 16.63 10.63 27.02 11.36-2.12 6.22-4.53 12.38-7.24 18.49zM119.22 33.64c0-7.35 2.65-14.24 7.96-20.67 5.3-6.43 11.87-10.75 19.7-12.97.22 1.5.33 2.78.33 3.84 0 7.37-2.78 14.52-8.35 21.46-5.56 6.94-12.3 11.19-20.21 12.75-.44-1.49-.66-2.96-.66-4.41z"/>
            </svg>
            <span>{loadingApple ? "Connecting..." : "Continue with Apple"}</span>
          </button>
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", marginBottom: 0 }}>
            {isInviteFlow ? "Instant 1-click free client portal access" : "Secure passwordless authentication via Google & Apple ID."}
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