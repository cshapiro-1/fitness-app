"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Compass,
  ShieldCheck,
  Heart,
  Utensils,
  LogOut,
  User,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Layers,
  MessageSquare,
} from "lucide-react";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { signOut } from "next-auth/react";

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: "TRAINER" | "CLIENT";
  userName?: string;
  userImage?: string | null;
  isAdmin?: boolean;
  onOpenTour?: () => void;
  onOpenCoachGuide?: () => void;
  onOpenReleaseNotes?: () => void;
  onOpenProfile?: () => void;
  onOpenTextImport?: () => void;
  onNavigateTab?: (tab: "log" | "programs" | "history" | "analytics" | "mobility") => void;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  role,
  userName = "User",
  userImage,
  isAdmin = false,
  onOpenTour,
  onOpenCoachGuide,
  onOpenReleaseNotes,
  onOpenProfile,
  onOpenTextImport,
  onNavigateTab,
}: MobileNavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "82%",
          maxWidth: "320px",
          height: "100%",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.15)",
          animation: "slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <StrkyrLogo size={28} />
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
              {role === "TRAINER" ? "Coach Studio" : "Athlete Portal"}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            padding: "14px 16px",
            background: "#eff6ff",
            borderBottom: "1px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <UserAvatar src={userImage} name={userName} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName}
            </div>
            <div style={{ fontSize: "11px", color: "#3b82f6", fontWeight: 600 }}>
              {role === "TRAINER" ? "Master Trainer" : "Athlete"}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {/* Recovery */}
          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateTab("mobility");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Heart size={18} style={{ color: "#ec4899" }} />
              <span>Recovery &amp; Mobility</span>
            </button>
          ) : (
            <Link
              href="/recovery"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <Heart size={18} style={{ color: "#ec4899" }} />
              <span>Recovery &amp; Mobility</span>
            </Link>
          )}

          {/* Nutrition */}
          <Link
            href="/nutrition"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <Utensils size={18} style={{ color: "#16a34a" }} />
            <span>Nutrition &amp; Macros</span>
          </Link>

          {/* Import Workouts from SMS */}
          {onOpenTextImport && (
            <button
              onClick={() => {
                onClose();
                onOpenTextImport();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <MessageSquare size={18} style={{ color: "#2563eb" }} />
              <span>📱 Import from Text / SMS</span>
            </button>
          )}

          {/* App Tour */}
          {onOpenTour && (
            <button
              onClick={() => {
                onClose();
                onOpenTour();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Compass size={18} style={{ color: "#2563eb" }} />
              <span>Interactive App Tour</span>
            </button>
          )}

          {/* Coach AI Guide (For Trainers) */}
          {role === "TRAINER" && onOpenCoachGuide && (
            <button
              onClick={() => {
                onClose();
                onOpenCoachGuide();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <ShieldCheck size={18} style={{ color: "#2563eb" }} />
              <span>Coach AI Philosophy Guide</span>
            </button>
          )}

          {/* What's New */}
          {onOpenReleaseNotes && (
            <button
              onClick={() => {
                onClose();
                onOpenReleaseNotes();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Sparkles size={18} style={{ color: "#f59e0b" }} />
              <span>What&apos;s New &amp; Changelog</span>
            </button>
          )}

          {/* Trainer Profile / Settings */}
          {role === "TRAINER" && onOpenProfile && (
            <button
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <User size={18} style={{ color: "#475569" }} />
              <span>Studio &amp; Billing Profile</span>
            </button>
          )}

          {/* Switch Role */}
          <button
            type="button"
            onClick={async () => {
              onClose();
              const targetRole = role === "TRAINER" ? "CLIENT" : "TRAINER";
              try {
                await fetch("/api/user/role", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ role: targetRole }),
                });
                window.location.href = "/dashboard";
              } catch {
                window.location.href = "/dashboard";
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "none",
              background: "#f8fafc",
              color: "#1e293b",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <RotateCcw size={18} style={{ color: "#2563eb" }} />
            <span>{role === "TRAINER" ? "Switch to Athlete View" : "Switch to Coach Studio"}</span>
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#b91c1c",
                fontSize: "14px",
                fontWeight: 700,
                background: "#fef2f2",
              }}
            >
              <ShieldCheck size={18} style={{ color: "#dc2626" }} />
              <span>Super Admin Portal</span>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              background: "#ffffff",
              color: "#dc2626",
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileNavDrawer;
