export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StrkyrLogo } from "@/components/StrkyrLogo";
import {
  Dumbbell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Timer,
  Zap,
  TrendingUp,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  Flame,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif", color: "#0f172a" }}>
      {/* Top Navigation */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <StrkyrLogo size={36} />
          <div>
            <span style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>STRKYR</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: "6px", marginLeft: "6px" }}>STUDIO</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a
            href="#release-notes"
            style={{ fontSize: "13px", fontWeight: 600, color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}
          >
            Release Notes
          </a>
          <Link
            href={session ? "/dashboard" : "/auth/signin"}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            }}
          >
            <span>{session ? "Open Dashboard" : "Sign In"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "64px 20px 48px", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "20px",
          }}
        >
          <Sparkles size={14} style={{ color: "#2563eb" }} />
          <span>STRKYR Coach Studio — Built Exclusively for Personal Trainers &amp; Strength Coaches</span>
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, color: "#0f172a", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: "16px" }}>
          The Complete Workout &amp; Athlete Management Platform for Trainers
        </h1>

        <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "#64748b", maxWidth: "680px", margin: "0 auto 32px", lineHeight: 1.6 }}>
          Prescribe periodized AI routines, calculate barbell plate math, master 3D anatomy cues, monitor athlete nutrition, and send 1-click client invite links with lifetime portal access.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href={session ? "/dashboard" : "/auth/signin"}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: 800,
              textDecoration: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
            }}
          >
            <span>{session ? "Enter Coach Studio" : "Start 30-Day Free Coach Trial"}</span>
            <ArrowRight size={16} />
          </Link>
          <a
            href="#pricing"
            className="btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "14px 22px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
            }}
          >
            <span>View Coach Studio Plans</span>
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {[
            {
              icon: <Search size={22} style={{ color: "#2563eb" }} />,
              title: "Workout History Search",
              desc: "Instant search and filter by workout name, exercise, muscle group, or coach cues across all logged sessions.",
            },
            {
              icon: <Zap size={22} style={{ color: "#8b5cf6" }} />,
              title: "AI Routine Builder",
              desc: "Generate periodized hypertrophy, strength, and calisthenics programs with warmups and coaching cues in 1 tap.",
            },
            {
              icon: <Activity size={22} style={{ color: "#059669" }} />,
              title: "Barbell Plate Math",
              desc: "Visual SVG barbell sleeve breakdown for 45, 35, 25, 10, 5, and 2.5 lb plates on Olympic and EZ-curl bars.",
            },
            {
              icon: <Timer size={22} style={{ color: "#d97706" }} />,
              title: "Gym Rest Countdown Timer",
              desc: "Built-in 60s, 90s, 120s, and 180s rest interval timers with audio/visual feedback between heavy sets.",
            },
            {
              icon: <TrendingUp size={22} style={{ color: "#dc2626" }} />,
              title: "Strength Analytics & 1RM PRs",
              desc: "Interactive SVG line charts, estimated 1RM calculations, 8-week volume tonnage, and adherence streak tracking.",
            },
            {
              icon: <Smartphone size={22} style={{ color: "#0284c7" }} />,
              title: "Native Mobile (iOS & Android)",
              desc: "Capacitor 7.0 native packaging with live Over-The-Air (OTA) sync for instant feature updates.",
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>{f.title}</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RELEASE NOTES / CHANGELOG SECTION */}
      <section id="release-notes" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "64px 20px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              <CheckCircle2 size={13} />
              <span>Official Release Changelog</span>
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 8px 0" }}>
              Release Notes &amp; Updates
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              Track all new features, enhancements, and performance optimizations deployed to FitCoach.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Version 1.2.0 */}
            <div
              style={{
                border: "2px solid #3b82f6",
                borderRadius: "16px",
                background: "#ffffff",
                padding: "28px",
                boxShadow: "0 8px 20px -4px rgba(37,99,235,0.1)",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Version 1.2.0</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, background: "#2563eb", color: "#ffffff", padding: "2px 8px", borderRadius: "12px" }}>
                    Latest Live Release
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>August 2026</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px 0" }}>
                    🔍 Workout History Search &amp; Exercise Progression
                  </h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    Added instant search and multi-tiered filtering across both athlete and trainer history views. Filter by workout name, specific exercise, muscle group, or coach notes to see full historical load progression.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px 0" }}>
                    🤖 AI Periodized Routine Generator
                  </h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    Powered by AI routine engineering. Choose between Hypertrophy, Pure Strength, or Calisthenics with target split days, warmup progressions, and coaching cues imported into the workout builder with 1 tap.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px 0" }}>
                    🏋️ Visual Barbell Plate Math Calculator
                  </h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    Calculates exact barbell plate loading (45, 35, 25, 10, 5, 2.5 lbs) on Olympic (45 lb) and EZ-curl (25 lb) bars with an interactive SVG sleeve rendering.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px 0" }}>
                    ⏱️ Gym Floor Rest Countdown Timer
                  </h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    Integrated stopwatch timer with 60s, 90s, 120s, and 180s presets to track inter-set rest intervals directly on the gym floor.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px 0" }}>
                    📱 Native App Store (iOS) &amp; Google Play (Android) Packaging
                  </h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    Integrated Capacitor 7.0 native runtime with live Over-The-Air (OTA) server sync, high-resolution 1024x1024 master app icons, and mobile safe-area insets.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", margin: "0 0 4px 0" }}>
                    👤 Workout Attribution &amp; Schema Integrity
                  </h4>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                    Workouts are explicitly attributed to whoever logged them (<code style={{ background: "#eff6ff", padding: "1px 4px", borderRadius: "4px" }}>loggedByRole: &quot;TRAINER&quot; | &quot;CLIENT&quot;</code>) with historical attribution cleanup.
                  </p>
                </div>
              </div>
            </div>

            {/* Version 1.1.0 */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                background: "#f8fafc",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Version 1.1.0</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, background: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "12px" }}>
                    Changelog
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>August 2026</span>
              </div>

              <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#475569" }}>
                <li><b>Multi-Client Invite Links:</b> Secure 1-click token redemption allowing clients free lifetime portal access.</li>
                <li><b>Nutrition &amp; Supplement Stacks:</b> Set cutting/bulking calorie and macro targets with daily supplement stack adherence tracking.</li>
                <li><b>Interactive Analytics Suite:</b> Real-time SVG volume graphs, estimated 1RM calculations, and workout frequency heatmaps.</li>
                <li><b>Stripe Trainer Subscriptions:</b> Automated billing for trainers with customer self-service invoice and payment portal.</li>
              </ul>
            </div>

            {/* Version 1.0.0 */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                background: "#f8fafc",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Version 1.0.0</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, background: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "12px" }}>
                    Initial Release
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>July 2026</span>
              </div>

              <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#475569" }}>
                <li><b>Core Workout Logging Engine:</b> Multi-set, weight, and rep entry with automatic bodyweight exercise detection.</li>
                <li><b>Client Management:</b> Trainer roster management with notes, goals, and custom avatars.</li>
                <li><b>Authentication &amp; Security:</b> Google OAuth and master service account credential authentication.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section id="pricing" style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "64px 20px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e40af",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              <CreditCard size={13} />
              <span>Transparent Coach Pricing</span>
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 8px 0" }}>
              Scale Your Coaching Business with Zero Roster Limits
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              Start with a 30-day full access coach trial. Unlimited clients, workouts, and AI generation.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "48px" }}>
            {/* Free Trial */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>30-Day Coach Pass</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px 0" }}>Test full studio capabilities with real clients</p>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginBottom: "16px" }}>
                $0 <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>/ 30 days</span>
              </div>
              <ul style={{ margin: "0 0 20px 0", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#475569", flex: 1 }}>
                <li>Unlimited client roster management</li>
                <li>1-Click client invite links with free portal</li>
                <li>AI Periodized routine generation</li>
                <li>Interactive 3D muscle anatomy guides</li>
              </ul>
              <Link
                href="/auth/signin"
                style={{ textAlign: "center", padding: "10px", borderRadius: "8px", background: "#f1f5f9", color: "#334155", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
              >
                Start Coach Trial
              </Link>
            </div>

            {/* Coach Monthly */}
            <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>Coach Studio Monthly</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px 0" }}>Flexible month-to-month roster coaching</p>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginBottom: "16px" }}>
                $19 <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>/ month</span>
              </div>
              <ul style={{ margin: "0 0 20px 0", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#475569", flex: 1 }}>
                <li><b>Everything in Coach Pass</b></li>
                <li>Unlimited clients with zero per-seat fees</li>
                <li>Client nutrition &amp; supplement monitoring</li>
                <li>1RM Estimated Max &amp; Volume curves</li>
                <li>Instant 1-click athlete onboarding</li>
              </ul>
              <Link
                href="/dashboard"
                style={{ textAlign: "center", padding: "10px", borderRadius: "8px", background: "#f1f5f9", color: "#1e293b", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
              >
                Get Monthly ($19/mo)
              </Link>
            </div>

            {/* Coach Annual */}
            <div style={{ background: "#ffffff", border: "2px solid #2563eb", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 8px 24px rgba(37,99,235,0.12)" }}>
              <div style={{ position: "absolute", top: "-10px", right: "16px", background: "#2563eb", color: "#ffffff", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px" }}>
                BEST VALUE
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>Coach Studio Annual</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px 0" }}>Billed annually at $200/year ($16.67/month)</p>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginBottom: "16px" }}>
                $200 <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>/ year</span>
              </div>
              <ul style={{ margin: "0 0 20px 0", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#334155", flex: 1 }}>
                <li><b>All Coach Monthly Features</b></li>
                <li>Discounted annual billing</li>
                <li>Priority AI routine periodization</li>
                <li>Custom branded PDF workout exports</li>
                <li>Dedicated coach support</li>
              </ul>
              <Link
                href="/dashboard"
                style={{ textAlign: "center", padding: "12px", borderRadius: "10px", background: "#2563eb", color: "#ffffff", fontWeight: 800, fontSize: "13px", textDecoration: "none", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
              >
                Get Coach Annual ($200/yr)
              </Link>
            </div>

            {/* Founder Coach Lifetime */}
            <div style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)", border: "1px solid #fbbf24", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ display: "inline-block", background: "#fef3c7", color: "#b45309", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "8px", width: "fit-content", marginBottom: "6px" }}>
                FOUNDER COACH • VIP
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>Founder Coach Lifetime</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px 0" }}>Pay once, run your coaching business forever</p>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginBottom: "16px" }}>
                $299 <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>one-time</span>
              </div>
              <ul style={{ margin: "0 0 20px 0", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px", color: "#475569", flex: 1 }}>
                <li><b>Never pay monthly coach software fees again</b></li>
                <li>Unlimited clients forever</li>
                <li>All future coaching &amp; AI features</li>
                <li>Founder Coach verified badge</li>
              </ul>
              <Link
                href="/dashboard"
                style={{ textAlign: "center", padding: "10px", borderRadius: "8px", background: "#0f172a", color: "#ffffff", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}
              >
                Claim Lifetime ($299)
              </Link>
            </div>
          </div>

          {/* COACH SOFTWARE COMPARISON MATRIX */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", overflowX: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                Why Coaches Choose STRKYR Studio
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Comparison against legacy coaching and client management platforms.
              </p>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600 }}>Feature</th>
                  <th style={{ padding: "10px 12px", color: "#2563eb", fontWeight: 800, background: "#eff6ff", borderRadius: "8px 8px 0 0" }}>STRKYR Studio</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600 }}>Trainerize</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600 }}>TrueCoach</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600 }}>BridgeAthletic</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>Starting Price</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: "#16a34a", background: "#eff6ff" }}>$19.00/mo (Unlimited)</td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>$40.00/mo (Limited)</td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>$35.00/mo (Limited)</td>
                  <td style={{ padding: "10px 12px", color: "#64748b" }}>$80.00/mo</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>Client Roster Limits</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: "#16a34a", background: "#eff6ff" }}>Unlimited</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>5–30 Clients Max</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>Upcharges per Client</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>Upcharges per Athlete</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>AI Periodized Routine Builder</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 800, background: "#eff6ff" }}>✅ Yes (Instant)</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ No</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ No</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ Basic</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>3D Muscle Anatomy Guides</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 800, background: "#eff6ff" }}>✅ Yes (Interactive)</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ No</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ No</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ No</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>1-Click Athlete Invite Links</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 800, background: "#eff6ff" }}>✅ Yes (Free for athletes)</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a" }}>✅ Yes</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a" }}>✅ Yes</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a" }}>✅ Yes</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>Lifetime Coach Pass</td>
                  <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: 800, background: "#eff6ff" }}>✅ $299.00 (Founder)</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ None</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ None</td>
                  <td style={{ padding: "10px 12px", color: "#dc2626" }}>❌ None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "32px 20px", background: "#f8fafc", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            © {new Date().getFullYear()} STRKYR Fitness Portal. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
            <Link href="/privacy" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: "#64748b", textDecoration: "none" }}>Terms of Service</Link>
            <Link href="/onboarding" style={{ color: "#64748b", textDecoration: "none" }}>Role Switcher</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
