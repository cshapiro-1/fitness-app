"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Camera,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Calendar,
  CreditCard,
  Sparkles,
  Lock,
  Clock,
  ExternalLink,
  Save,
  Check,
} from "lucide-react";
import { SubscriptionInfo } from "./SubscriptionBanner";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
];

export interface TrainerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  subInfo: SubscriptionInfo | null;
  onProfileUpdated?: () => void;
}

export function TrainerProfileModal({
  isOpen,
  onClose,
  subInfo,
  onProfileUpdated,
}: TrainerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "billing">("profile");
  
  // Profile State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [fitnessGoals, setFitnessGoals] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Billing State
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [billingSuccessMsg, setBillingSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setProfileSuccess(false);
      setProfileError(null);
      setBillingSuccessMsg(null);
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        setImage(data.user.image || "");
        setPhone(data.user.phone || "");
        setNotes(data.user.notes || "");
        setFitnessGoals(data.user.fitnessGoals || "");
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          image: image.trim() || null,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
          fitnessGoals: fitnessGoals.trim() || null,
        }),
      });

      if (res.ok) {
        setProfileSuccess(true);
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        const data = await res.json();
        setProfileError(data.error || "Failed to update profile.");
      }
    } catch (err) {
      setProfileError("Network error while updating profile.");
    } finally {
      setSavingProfile(false);
    }
  };

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
        setBillingSuccessMsg(`Successfully renewed ${selectedPlan === "annual" ? "Annual ($200/yr)" : "Monthly ($20/mo)"} subscription!`);
        if (onProfileUpdated) onProfileUpdated();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to process subscription.");
      }
    } catch {
      alert("Billing error. Please try again.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="client-modal-backdrop" onClick={onClose}>
      <div
        className="client-modal-card"
        style={{ maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="client-modal-header" style={{ paddingBottom: "12px" }}>
          <div className="client-modal-header-info">
            <h2 className="client-modal-title">Trainer Profile & Billing</h2>
            <p className="client-modal-subtitle">
              Manage your personal coaching profile, avatar, and active subscription plan.
            </p>
          </div>
          <button className="client-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            padding: "0 24px",
            gap: "20px",
            background: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            style={{
              padding: "12px 4px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "profile" ? "2px solid #2563eb" : "2px solid transparent",
              color: activeTab === "profile" ? "#2563eb" : "#64748b",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <User size={15} />
            <span>Profile Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            style={{
              padding: "12px 4px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "billing" ? "2px solid #2563eb" : "2px solid transparent",
              color: activeTab === "billing" ? "#2563eb" : "#64748b",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CreditCard size={15} />
            <span>Billing & Subscription</span>
            {subInfo?.status === "active" ? (
              <span style={{ fontSize: "10px", background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>Active</span>
            ) : subInfo?.status === "trial" ? (
              <span style={{ fontSize: "10px", background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>Trial</span>
            ) : (
              <span style={{ fontSize: "10px", background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>Expired</span>
            )}
          </button>
        </div>

        {/* Tab Content: Profile Settings */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="client-modal-form" style={{ padding: "20px 24px" }}>
            {profileSuccess && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Check size={16} />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {profileError && <div className="client-modal-alert-error">{profileError}</div>}

            {/* Profile Picture Section */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {image ? (
                  <img
                    src={image}
                    alt={name || "Trainer Avatar"}
                    style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "2px solid #2563eb" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "#e2e8f0",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: 700,
                    }}
                  >
                    {name ? name.charAt(0).toUpperCase() : <User size={32} />}
                  </div>
                )}
                <label
                  htmlFor="trainer-avatar-upload"
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    background: "#2563eb",
                    color: "#ffffff",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                  title="Upload profile picture"
                >
                  <Camera size={13} />
                  <input
                    id="trainer-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>
                  Profile Picture
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                  Upload a photo or choose from preset coaching avatars:
                </div>
                
                {/* Preset Avatars */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  {PRESET_AVATARS.map((avatarUrl, idx) => (
                    <img
                      key={idx}
                      src={avatarUrl}
                      alt={`Preset ${idx + 1}`}
                      onClick={() => setImage(avatarUrl)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        border: image === avatarUrl ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        opacity: image === avatarUrl ? 1 : 0.75,
                        transition: "all 0.15s ease",
                      }}
                    />
                  ))}
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      style={{ background: "none", border: "none", fontSize: "11px", color: "#ef4444", cursor: "pointer", marginLeft: "4px" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="client-modal-fields-grid">
              <div className="client-modal-field">
                <label className="client-modal-label">
                  <User size={13} />
                  <span>Trainer Name *</span>
                </label>
                <input
                  type="text"
                  className="client-modal-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Coach Mike"
                  required
                />
              </div>

              <div className="client-modal-field">
                <label className="client-modal-label">
                  <Mail size={13} />
                  <span>Account Email</span>
                </label>
                <input
                  type="email"
                  className="client-modal-input"
                  value={email}
                  disabled
                  style={{ background: "#f1f5f9", cursor: "not-allowed", color: "#64748b" }}
                />
              </div>

              <div className="client-modal-field">
                <label className="client-modal-label">
                  <Phone size={13} />
                  <span>Contact Phone (Optional)</span>
                </label>
                <input
                  type="tel"
                  className="client-modal-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. (555) 123-4567"
                />
              </div>

              <div className="client-modal-field">
                <label className="client-modal-label">
                  <Camera size={13} />
                  <span>Custom Picture URL</span>
                </label>
                <input
                  type="url"
                  className="client-modal-input"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="client-modal-field client-modal-field-full">
                <label className="client-modal-label">
                  <span>Bio & Coaching Focus</span>
                </label>
                <textarea
                  className="client-modal-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Certified Strength & Conditioning Specialist with 8+ years coaching experience."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="client-modal-footer" style={{ marginTop: "20px" }}>
              <div />
              <div className="client-modal-action-group">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || loadingProfile}
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Save size={14} />
                  <span>{savingProfile ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Content: Billing & Subscription */}
        {activeTab === "billing" && (
          <div style={{ padding: "20px 24px" }}>
            {billingSuccessMsg && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <CheckCircle2 size={18} />
                <span>{billingSuccessMsg}</span>
              </div>
            )}

            {/* Current Status Overview Card */}
            <div
              style={{
                background: subInfo?.status === "active"
                  ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                  : subInfo?.status === "trial"
                  ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
                  : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                border: subInfo?.status === "active"
                  ? "1px solid #bbf7d0"
                  : subInfo?.status === "trial"
                  ? "1px solid #bfdbfe"
                  : "1px solid #fecaca",
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subInfo?.status === "active" ? "#166534" : subInfo?.status === "trial" ? "#1e40af" : "#991b1b" }}>
                    Current Membership
                  </div>
                  <h3 style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                    {subInfo?.status === "active"
                      ? "Trainer Pro Subscription"
                      : subInfo?.status === "trial"
                      ? "30-Day Free Trial"
                      : "Subscription Expired"}
                  </h3>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: subInfo?.status === "active" ? "#15803d" : subInfo?.status === "trial" ? "#2563eb" : "#dc2626",
                    color: "#ffffff",
                  }}
                >
                  {subInfo?.status === "active" ? (
                    <>
                      <ShieldCheck size={14} />
                      <span>Active Pro</span>
                    </>
                  ) : subInfo?.status === "trial" ? (
                    <>
                      <Clock size={14} />
                      <span>{subInfo.daysRemaining} Days Left</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Action Required</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px", color: "#334155", paddingTop: "8px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Billing Model: </span>
                  <b>Trainer-Only ($20/mo or $200/yr)</b>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Client Billing: </span>
                  <b style={{ color: "#16a34a" }}>100% Free For All Clients</b>
                </div>
              </div>
            </div>

            {/* Plan Selection Cards */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
                Select or Renew Subscription Plan
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {/* Monthly Plan */}
                <div
                  onClick={() => setSelectedPlan("monthly")}
                  style={{
                    border: selectedPlan === "monthly" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: selectedPlan === "monthly" ? "#f8faff" : "#ffffff",
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Monthly Plan</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>
                    $20 <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}>/month</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Billed monthly, cancel anytime</div>
                </div>

                {/* Annual Plan */}
                <div
                  onClick={() => setSelectedPlan("annual")}
                  style={{
                    border: selectedPlan === "annual" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: selectedPlan === "annual" ? "#f8faff" : "#ffffff",
                    borderRadius: "12px",
                    padding: "16px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "-9px",
                      right: "12px",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    SAVE $40/YR
                  </span>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Annual Plan</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "6px 0 2px 0" }}>
                    $200 <span style={{ fontSize: "12px", fontWeight: 500, color: "#64748b" }}>/year</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                    $16.67/mo equivalent
                  </div>
                </div>
              </div>
            </div>

            {/* Features Included List */}
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                What&apos;s included in your Trainer membership:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "#334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>Unlimited Client Profiles</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>Clients Use 100% Free</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>Interactive Workout Logging</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>1RM Estimation & Analytics</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>Direct Client Invite Links</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                  <span>Google Play & PWA Access</span>
                </div>
              </div>
            </div>

            {/* Subscribe Action Button */}
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loadingCheckout}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Zap size={16} />
              <span>
                {loadingCheckout
                  ? "Processing..."
                  : subInfo?.status === "active"
                  ? `Renew Subscription (${selectedPlan === "annual" ? "$200/year" : "$20/month"})`
                  : `Activate Pro Subscription (${selectedPlan === "annual" ? "$200/year" : "$20/month"})`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerProfileModal;
