"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent({
  hasGoogleCredentials,
  showFallbackLogin,
}: {
  hasGoogleCredentials: boolean;
  showFallbackLogin: boolean;
}) {
  const params = useSearchParams();
  const error = params.get("error");
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💪</div>
        <h1 className="auth-title">Fitness Tracker</h1>
        <p className="auth-sub">Trainer dashboard</p>
        {error && <p className="auth-error">Sign in failed. Try again.</p>}
        {hasGoogleCredentials ? (
          <button className="auth-btn" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        ) : null}
        {showFallbackLogin ? (
          <>
            <button className="auth-btn" onClick={() => signIn("dev-login", { callbackUrl: "/dashboard", redirect: true, mode: "trainer" })}>
              Continue as local trainer
            </button>
            <button className="auth-btn" onClick={() => signIn("dev-login", { callbackUrl: "/dashboard", redirect: true, mode: "client" })}>
              Continue as local client
            </button>
          </>
        ) : null}

        <div style={{ marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Become a trainer</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Start with 1 month free, then $10/month.</p>
          {hasGoogleCredentials ? (
            <button className="auth-btn" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
              Continue with Google as trainer
            </button>
          ) : (
            <button className="auth-btn" onClick={() => signIn("dev-login", { callbackUrl: "/dashboard", redirect: true, mode: "trainer" })}>
              Continue as trainer
            </button>
          )}
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
