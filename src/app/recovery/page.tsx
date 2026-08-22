"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Sparkles, LogOut, User, Moon, Sun } from "lucide-react";
import { MobilityTab } from "../dashboard/components/MobilityTab";

export default function RecoveryPage() {
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.title = "Recovery & Warm-Up | STRKYR Fitness";
  }, []);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b", fontWeight: 600 }}>
          <div className="spin-inline" /> Loading Recovery Protocols...
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isDark ? "dark-theme" : ""}`} style={{ minHeight: "100vh", background: isDark ? "#0f172a" : "#f8fafc" }}>
      {/* Top Header */}
      <header className="header" style={{ position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid #e2e8f0" }}>
        <div className="header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/dashboard"
            className="nav-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600, padding: "6px 12px", borderRadius: "8px" }}
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563eb", fontWeight: 800, fontSize: "16px" }}>
            <span>🧘</span>
            <span>Recovery &amp; Warm-Up</span>
          </div>
        </div>

        <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/nutrition"
            className="nav-btn nav-btn-green"
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <span>🥗</span>
            <span className="hide-mobile">Nutrition &amp; Macros</span>
          </Link>

          {/* Theme Toggle */}
          <button
            type="button"
            className="nav-btn"
            onClick={() => setIsDark(!isDark)}
            title="Toggle theme"
            style={{ padding: "6px 10px" }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Sign Out */}
          <button
            type="button"
            className="nav-btn nav-btn-danger"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            title="Sign out"
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <LogOut size={14} />
            <span className="hide-mobile">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Recovery Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 16px 60px" }}>
        <MobilityTab />
      </main>
    </div>
  );
}
