"use client";

import React, { useState } from "react";
import { Clock, ShieldCheck, Zap, CheckCircle2, Lock, User } from "lucide-react";

export interface SubscriptionInfo {
  hasAccess: boolean;
  status: "trial" | "active" | "expired";
  daysRemaining: number;
}

interface SubscriptionBannerProps {
  subInfo: SubscriptionInfo | null;
  onOpenProfile?: () => void;
  onSubscribed?: () => void;
}

export function SubscriptionBanner({ subInfo, onOpenProfile, onSubscribed }: SubscriptionBannerProps) {
  // If subscription status is expired, auto-prompt user with paywall modal on login
  const [showPaywallModal, setShowPaywallModal] = useState(subInfo?.status === "expired");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  if (!subInfo) return null;

  const isTrialEndingSoon = subInfo.status === "trial" && subInfo.daysRemaining <= 2;

  const handleSubscribe = async () => {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.url && (data.url.startsWith("http://") || data.url.startsWith("https://"))) {
        window.location.href = data.url;
        return;
      }
      if (data.success) {
        setShowPaywallModal(false);
        if (onSubscribed) onSubscribed();
        window.location.reload();
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to initiate checkout.");
      }
    } catch {
      alert("Checkout error. Please try again.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <>
      {/* Top Status Banner */}
      {subInfo.status === "trial" && isTrialEndingSoon && (
        <div style={{ background: "linear-gradient(90deg, #b45309 0%, #d97706 100%)", color: "#ffffff", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600, borderBottom: "1px solid #f59e0b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} />
            <span>
              <b>⚠️ Trial Ending Soon:</b> You have <b>{subInfo.daysRemaining} {subInfo.daysRemaining === 1 ? "day" : "days"} remaining</b>. Subscribe now to keep client assignments & AI programming active.
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a
              href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Trial%20Question"
              style={{ color: "#fef3c7", textDecoration: "underline", fontSize: "11px", marginRight: "4px" }}
            >
              Contact Support
            </a>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.4)", padding: "4px 10px", borderRadius: "6px", fontWeight: 600, fontSize: "11px", cursor: "pointer" }}
              >
                Profile & Billing
              </button>
            )}
            <button
              onClick={() => setShowPaywallModal(true)}
              style={{ background: "#ffffff", color: "#b45309", border: "none", padding: "4px 12px", borderRadius: "6px", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}
            >
              Subscribe ($19/mo)
            </button>
          </div>
        </div>
      )}

      {subInfo.status === "trial" && !isTrialEndingSoon && (
        <div style={{ background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)", color: "#ffffff", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 500 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={15} />
            <span><b>30-Day Free Trial:</b> You have <b>{subInfo.daysRemaining} days remaining</b>. Clients use 100% free with unlimited coaching workouts.</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a
              href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Coach%20Inquiry"
              style={{ color: "#bfdbfe", textDecoration: "underline", fontSize: "11px", marginRight: "4px" }}
            >
              Contact
            </a>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.4)", padding: "4px 10px", borderRadius: "6px", fontWeight: 600, fontSize: "11px", cursor: "pointer" }}
              >
                Profile & Billing
              </button>
            )}
            <button
              onClick={() => setShowPaywallModal(true)}
              style={{ background: "#ffffff", color: "#2563eb", border: "none", padding: "4px 12px", borderRadius: "6px", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}
            >
              Upgrade Now ($19/mo)
            </button>
          </div>
        </div>
      )}

      {subInfo.status === "expired" && (
        <div style={{ background: "#fee2e2", borderBottom: "1px solid #fca5a5", color: "#b91c1c", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock size={15} />
            <span>Your 30-Day Free Trial has ended. Please subscribe to continue managing clients and assigning workouts.</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a
              href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Reactivation"
              style={{ color: "#991b1b", textDecoration: "underline", fontSize: "11px", marginRight: "4px" }}
            >
              Contact Collin (collin.shapiro1@gmail.com)
            </a>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                style={{ background: "#ffffff", color: "#b91c1c", border: "1px solid #fca5a5", padding: "6px 12px", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
              >
                Profile & Billing
              </button>
            )}
            <button
              onClick={() => setShowPaywallModal(true)}
              style={{ background: "#dc2626", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
            >
              Unlock Account ($19/mo)
            </button>
          </div>
        </div>
      )}

      {subInfo.status === "active" && (
        <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", color: "#15803d", padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: 500 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} />
            <span><b>Trainer Pro Active:</b> Unlimited Clients & Workouts (Clients use free).</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a
              href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Subscriber%20Support"
              style={{ color: "#15803d", textDecoration: "underline", fontSize: "11px" }}
            >
              Contact Support
            </a>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                style={{ background: "#ffffff", color: "#15803d", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, fontSize: "10px", cursor: "pointer" }}
              >
                Manage Profile & Billing
              </button>
            )}
          </div>
        </div>
      )}

      {/* Paywall / Upgrade Modal */}
      {showPaywallModal && (
        <div className="client-modal-backdrop" style={{ zIndex: 1000, position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="client-modal-card" style={{ background: "#ffffff", padding: "28px", borderRadius: "16px", width: "440px", maxWidth: "480px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                <Zap size={24} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {subInfo.status === "expired" ? "Subscribe to STRKYR Studio" : "Upgrade to STRKYR Studio"}
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "6px 0 0 0" }}>
                {subInfo.status === "expired"
                  ? "Your trial has ended. Subscribe below to unlock your coach portal, client roster, and AI programming."
                  : "Empower your coaching business with unlimited athletes and AI programming."}
              </p>
            </div>

            {/* Plan Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div
                onClick={() => setSelectedPlan("monthly")}
                style={{
                  border: selectedPlan === "monthly" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  background: selectedPlan === "monthly" ? "#eff6ff" : "#ffffff",
                  padding: "14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "#64748b" }}>Monthly</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>$19 <span style={{ fontSize: "12px", fontWeight: 400 }}>/mo</span></div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>Billed monthly</div>
              </div>

              <div
                onClick={() => setSelectedPlan("annual")}
                style={{
                  border: selectedPlan === "annual" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  background: selectedPlan === "annual" ? "#eff6ff" : "#ffffff",
                  padding: "14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <span style={{ position: "absolute", top: "-8px", right: "10px", background: "#16a34a", color: "#ffffff", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px" }}>SAVE $28</span>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Annual Plan</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>$200 <span style={{ fontSize: "12px", fontWeight: 400 }}>/yr</span></div>
                <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600 }}>$16.67 / mo equivalent</div>
              </div>
            </div>

            <ul style={{ paddingLeft: 0, listStyle: "none", margin: "0 0 16px 0", fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> Unlimited Athlete Profiles & Free Client App Access</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> AI 3D Anatomy Visual Guides & Kinesiology for 120+ Exercises</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> On-The-Fly Natural Language AI Workout Generator</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> 1RM Progression Analytics & CSV Report Exports</li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loadingCheckout}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37,99,235,0.2)",
              }}
            >
              {loadingCheckout ? "Redirecting to Checkout..." : `Subscribe ${selectedPlan === "annual" ? "$200/yr" : "$19/mo"}`}
            </button>

            {/* Direct Founder Contact Link */}
            <div style={{ marginTop: "14px", padding: "10px 12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
              Need custom billing, team rates, or direct assistance?<br />
              <a href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Billing%20Support" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "underline" }}>
                Email Founder: collin.shapiro1@gmail.com
              </a>
            </div>

            {subInfo.hasAccess && (
              <button
                onClick={() => setShowPaywallModal(false)}
                style={{ width: "100%", background: "none", border: "none", marginTop: "10px", fontSize: "12px", color: "#64748b", cursor: "pointer" }}
              >
                Close for now
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}