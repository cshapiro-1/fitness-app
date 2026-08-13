"use client";

export const dynamic = "force-dynamic";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#ffffff",
          padding: "2.5rem 2rem",
          borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
          border: "1px solid #f3f4f6",
          textAlign: "center",
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "3rem", display: "inline-block", marginBottom: "0.5rem" }} role="img" aria-label="muscle">
            💪
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", margin: "0 0 0.5rem 0" }}>
            Fitness Tracker
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
            Trainer dashboard for coaches and clients
          </p>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Sign in or create an account
          </p>
        </div>

        {/* Google Sign In Button */}
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              padding: "12px 16px",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#374151",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              transition: "all 0.2s ease",
            }}
          >
            {/* Google SVG Logo with fixed width/height */}
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
            <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
          Coaches & clients sign in through the same Google portal.
        </p>
      </div>
    </div>
  );
}