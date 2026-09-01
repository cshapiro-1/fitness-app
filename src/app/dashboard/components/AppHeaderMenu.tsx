"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  ShieldCheck,
  Heart,
  Utensils,
  Sparkles,
  RotateCcw,
  User,
  CreditCard,
  Calculator,
  LogOut,
  ChevronDown,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { signOut } from "next-auth/react";

export interface AppHeaderMenuProps {
  role: "TRAINER" | "CLIENT";
  userName: string;
  userImage?: string | null;
  isAdmin?: boolean;
  onOpenTour: () => void;
  onOpenCoachGuide?: () => void;
  onOpenReleaseNotes: () => void;
  onOpenProfile?: () => void;
  onOpenPlateCalculator?: () => void;
  onOpenTextImport?: () => void;
  onSwitchToClientView?: () => void;
  onNavigateTab?: (tab: "log" | "programs" | "history" | "analytics" | "mobility") => void;
}

export function AppHeaderMenu({
  role,
  userName,
  userImage,
  isAdmin = false,
  onOpenTour,
  onOpenCoachGuide,
  onOpenReleaseNotes,
  onOpenProfile,
  onOpenPlateCalculator,
  onOpenTextImport,
  onSwitchToClientView,
  onNavigateTab,
}: AppHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      {/* Trigger Button: Clean Avatar + Name + Dropdown Indicator */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 10px 4px 4px",
          background: isOpen ? "#f1f5f9" : "transparent",
          border: "1px solid",
          borderColor: isOpen ? "#cbd5e1" : "transparent",
          borderRadius: "24px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        className="header-user-menu-btn"
        title="Open Studio Menu & Profile"
      >
        <UserAvatar src={userImage} name={userName} size={32} />
        <span
          className="hide-mobile"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#1e293b",
            maxWidth: "140px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {userName}
        </span>
        <ChevronDown size={14} style={{ color: "#64748b" }} />
      </button>

      {/* Desktop Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "280px",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "modalFadeIn 0.15s ease-out",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* User Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <UserAvatar src={userImage} name={userName} size={36} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                {role === "TRAINER" ? "Master Trainer" : "Athlete"}
              </div>
            </div>
          </div>

          {/* Menu Sections */}
          <div style={{ padding: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {/* Quick Tools Category */}
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", padding: "6px 10px 2px", letterSpacing: "0.05em" }}>
              Studio Tools
            </div>

            {onNavigateTab ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateTab("mobility");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
                className="dropdown-item"
              >
                <Heart size={16} style={{ color: "#ec4899" }} />
                <span>Recovery &amp; Mobility Hub</span>
              </button>
            ) : (
              <Link
                href="/recovery"
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
                className="dropdown-item"
              >
                <Heart size={16} style={{ color: "#ec4899" }} />
                <span>Recovery &amp; Mobility Hub</span>
              </Link>
            )}

            <Link
              href="/nutrition"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#334155",
                fontSize: "13px",
                fontWeight: 600,
              }}
              className="dropdown-item"
            >
              <Utensils size={16} style={{ color: "#16a34a" }} />
              <span>Nutrition &amp; Macros Planner</span>
            </Link>

            {onOpenPlateCalculator && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPlateCalculator();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
                className="dropdown-item"
              >
                <Calculator size={16} style={{ color: "#2563eb" }} />
                <span>Barbell Plate Calculator</span>
              </button>
            )}

            {onOpenTextImport && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenTextImport();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
                className="dropdown-item"
              >
                <MessageSquare size={16} style={{ color: "#8b5cf6" }} />
                <span>Import Text / SMS Workouts</span>
              </button>
            )}

            {/* Guides & Features Category */}
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", padding: "8px 10px 2px", letterSpacing: "0.05em", borderTop: "1px solid #f1f5f9", marginTop: "4px" }}>
              Guides &amp; Updates
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenTour();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
              className="dropdown-item"
            >
              <Compass size={16} style={{ color: "#2563eb" }} />
              <span>Interactive App Tour</span>
            </button>

            {role === "TRAINER" && onOpenCoachGuide && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCoachGuide();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
                className="dropdown-item"
              >
                <ShieldCheck size={16} style={{ color: "#2563eb" }} />
                <span>Coach AI Philosophy Guide</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenReleaseNotes();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
              className="dropdown-item"
            >
              <Sparkles size={16} style={{ color: "#f59e0b" }} />
              <span>What&apos;s New &amp; Changelog</span>
            </button>

            {/* Account & Roles */}
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", padding: "8px 10px 2px", letterSpacing: "0.05em", borderTop: "1px solid #f1f5f9", marginTop: "4px" }}>
              Account &amp; Settings
            </div>

            {role === "TRAINER" && onOpenProfile && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfile();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
                className="dropdown-item"
              >
                <CreditCard size={16} style={{ color: "#475569" }} />
                <span>Studio &amp; Billing Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
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
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                background: "#f8fafc",
                color: "#1e293b",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
              className="dropdown-item"
            >
              <RotateCcw size={16} style={{ color: "#2563eb" }} />
              <span>{role === "TRAINER" ? "Switch to Athlete View" : "Switch to Coach Studio"}</span>
            </button>

            {isAdmin && (
              <a
                href="/admin"
                onClick={() => setIsOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: "#b91c1c",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: "#fef2f2",
                }}
                className="dropdown-item"
              >
                <ShieldCheck size={16} style={{ color: "#dc2626" }} />
                <span>Super Admin Portal</span>
              </a>
            )}
          </div>

          {/* Sign Out Footer */}
          <div style={{ padding: "8px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #fecaca",
                background: "#ffffff",
                color: "#dc2626",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppHeaderMenu;
