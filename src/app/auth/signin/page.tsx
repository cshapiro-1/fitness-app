"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SignInContent({
  hasGoogleCredentials,
  showFallbackLogin,
}: {
  hasGoogleCredentials: boolean;
  showFallbackLogin: boolean;
}) {
  const params = useSearchParams();
  const error = params.get("error");
  const [authError, setAuthError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/csrf")
      .then((response) => response.json())
      .then((data) => {
        if (active && data?.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const handleSignIn = async (provider: string, mode?: "trainer" | "client") => {
    setAuthError(null);

    if (provider === "google") {
      window.location.assign("/api/auth/signin/google?callbackUrl=%2Fdashboard");
      return;
    }

    if (!csrfToken) {
      setAuthError("Sign in failed. Try again.");
      return;
    }

    const response = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        csrfToken,
        mode: mode ?? "trainer",
        email: mode === "trainer" ? "trainer.local@local.test" : "client.local@local.test",
        password: "password",
        callbackUrl: "/dashboard",
      }),
      redirect: "manual",
    });

    const location = response.headers.get("location") ?? "/dashboard";
    if (response.status >= 400 || location.includes("/auth/signin")) {
      setAuthError("Sign in failed. Try again.");
      return;
    }

    window.location.assign(location);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💪</div>
        <h1 className="auth-title">Fitness Tracker</h1>
        <p className="auth-sub">Trainer dashboard for coaches and clients</p>
        {(error || authError) && <p className="auth-error">Sign in failed. Try again.</p>}

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Trainer access</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Sign up as a trainer first. After that, use trainer login to manage clients and workouts.</p>
          <button className="auth-btn" onClick={() => void handleSignIn("credentials", "trainer")}>
            Trainer login
          </button>
          <button className="auth-btn" onClick={() => void handleSignIn("google")}>
            Trainer sign up
          </button>
        </div>

        <div style={{ marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Client access</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Client login only works after a trainer has linked your account.</p>
          <button className="auth-btn" onClick={() => void handleSignIn("credentials", "client")}>
            Client login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const hasGoogleCredentials = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const showFallbackLogin = true;

  return (
    <Suspense fallback={<div className="auth-page" />}>
      <SignInContent hasGoogleCredentials={hasGoogleCredentials} showFallbackLogin={showFallbackLogin} />
    </Suspense>
  );
}
