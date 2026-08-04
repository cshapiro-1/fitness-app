"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupMessage, setSignupMessage] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const hasGoogleCredentials = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);

  const submitTrainerSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim()) {
      setSignupError("Please add your name and email.");
      return;
    }

    setSignupError(null);
    setSignupMessage(null);

    const res = await fetch("/api/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: signupName.trim(), email: signupEmail.trim().toLowerCase() }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setSignupError(body?.error || "Unable to activate trainer access.");
      return;
    }

    setSignupMessage(body?.message || "Trainer signup complete. Your first month is free.");
    setSignupName("");
    setSignupEmail("");
  };
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
        <button className="auth-btn" onClick={() => signIn("dev-login", { callbackUrl: "/dashboard", redirect: true, mode: "trainer" })}>
          Continue as local trainer
        </button>
        <button className="auth-btn" onClick={() => signIn("dev-login", { callbackUrl: "/dashboard", redirect: true, mode: "client" })}>
          Continue as local client
        </button>

        <div style={{ marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Become a trainer</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>Start with 1 month free, then $10/month.</p>
          <input className="input" placeholder="Your name" value={signupName} onChange={(event) => setSignupName(event.target.value)} style={{ marginBottom: 8 }} />
          <input className="input" placeholder="Your email" value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} style={{ marginBottom: 8 }} />
          {signupError && <div style={{ color: "#b91c1c", fontSize: 12, marginBottom: 8 }}>{signupError}</div>}
          {signupMessage && <div style={{ color: "#15803d", fontSize: 12, marginBottom: 8 }}>{signupMessage}</div>}
          <button className="auth-btn" onClick={submitTrainerSignup}>Start trainer access</button>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <SignInContent />
    </Suspense>
  );
}
