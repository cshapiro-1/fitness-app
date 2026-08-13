"use client";

import React, { useState } from "react";
import { Clock, ShieldCheck, Zap, CheckCircle2, Lock } from "lucide-react";

export interface SubscriptionInfo {
  hasAccess: boolean;
  status: "trial" | "active" | "expired";
  daysRemaining: number;
}

interface SubscriptionBannerProps {
  subInfo: SubscriptionInfo | null;
  onSubscribed?: () => void;
}

export function SubscriptionBanner({ subInfo, onSubscribed }: SubscriptionBannerProps) {
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  if (!subInfo) return null;

  const handleSubscribe = async () => {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
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
      {subInfo.status === "trial" && (
        <div style={{ background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)", color: "#ffffff", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 500 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={15} />
            <span><b>30-Day Free Trial:</b> You have <b>{subInfo.daysRemaining} days remaining</b> with unlimited clients & workouts.</span>
          </div>
          <button
            onClick={() => setShowPaywallModal(true)}
            style={{ background: "#ffffff", color: "#2563eb", border: "none", padding: "4px 12px", borderRadius: "6px", fontWeight: 600, fontSize: "11px", cursor: "pointer" }}
          >
            Upgrade Now ($10/mo)
          </button>
        </div>
      )}

      {subInfo.status === "expired" && (
        <div style={{ background: "#fee2e2", borderBottom: "1px solid #fca5a5", color: "#b91c1c", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock size={15} />
            <span>Your 30-Day Free Trial has ended. Upgrade your subscription to continue managing clients.</span>
          </div>
          <button
            onClick={() => setShowPaywallModal(true)}
            style={{ background: "#dc2626", color: "#ffffff", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
          >
            Unlock Account
          </button>
        </div>
      )}

      {subInfo.status === "active" && (
        <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", color: "#15803d", padding: "6px 16px", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 500 }}>
          <ShieldCheck size={14} />
          <span><b>Pro Trainer Plan Active:</b> Unlimited Clients & Analytics ({subInfo.daysRemaining} days remaining)</span>
        </div>
      )}

      {/* Subscription Paywall Modal */}
      {(showPaywallModal || !subInfo.hasAccess) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "16px", width: "420px", maxWidth: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <Zap size={32} style={{ color: "#2563eb", marginBottom: "8px" }} />
              <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>Trainer Pro Subscription</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Unlock full platform access for your fitness coaching business.</p>
            </div>

            {/* Plan Switcher */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
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
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "4px 0" }}>$10 <span style={{ fontSize: "12px", fontWeight: 400 }}>/mo</span></div>
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
                <span style={{ position: "absolute", top: "-8px", right: "10px", background: "#16a34a", color: "#ffffff", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>SAVE $20</span>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Annual</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "4px 0" }}>$100 <span style={{ fontSize: "12px", fontWeight: 400 }}>/yr</span></div>
                <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600 }}>$8.33 / mo equivalent</div>
              </div>
            </div>

            <ul style={{ paddingLeft: 0, listStyle: "none", margin: "0 0 20px 0", fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> Unlimited Client Profiles</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> Unlimited Workout Plans & Logging</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> Full Analytics, 1RM Estimation & Muscle Breakdown</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} style={{ color: "#16a34a" }} /> Client Invite Text Links</li>
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
              {loadingCheckout ? "Redirecting to Checkout..." : `Subscribe ${selectedPlan === "annual" ? "$100/yr" : "$10/mo"}`}
            </button>

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