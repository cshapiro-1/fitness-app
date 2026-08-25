import React from "react";
import Link from "next/link";
import { Shield, Dumbbell, ArrowLeft, Lock, FileText, CheckCircle2, Download, Trash2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | STRKYR Fitness & Coaching",
  description: "Comprehensive Privacy Policy covering GDPR, CCPA/CPRA, US State Health Privacy Acts, and Data Portability.",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "840px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#2563eb", fontWeight: 800, fontSize: "17px" }}>
            <Dumbbell size={22} />
            <span>STRKYR Studio</span>
          </Link>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#64748b", textDecoration: "none" }}>
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "840px", margin: "40px auto", padding: "0 24px 80px" }}>
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "40px 36px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", color: "#2563eb" }}>
            <Shield size={32} />
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>Privacy Policy &amp; Data Rights</h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "28px" }}>
            Effective Date: August 24, 2026 · Compliant with GDPR (EU/UK), CCPA/CPRA, and US State Health Data Privacy Laws
          </p>

          {/* Quick Summary Banner */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 20px", marginBottom: "28px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e40af", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={16} />
              <span>Our Core Privacy Commitments</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#1e3a8a", lineHeight: "1.6" }}>
              <li><strong>Zero Data Selling:</strong> We NEVER sell, rent, or trade your personal, fitness, or workout data to advertisers or data brokers.</li>
              <li><strong>Full Data Ownership:</strong> You can download your complete personal and workout dataset in standard JSON format at any time.</li>
              <li><strong>Instant Permanent Deletion:</strong> You have the right to permanently purge your account, clients, and workout logs with 1 click.</li>
            </ul>
          </div>

          <section style={{ marginBottom: "28px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>1. Introduction</h2>
            <p>
              STRKYR Fitness (&quot;STRKYR&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides strength training, workout tracking, coach-athlete collaboration, and analytics tools. This Privacy Policy details our data collection, processing, and protection standards in accordance with the European Union / United Kingdom General Data Protection Regulation (<strong>GDPR</strong>), the California Consumer Privacy Act / California Privacy Rights Act (<strong>CCPA/CPRA</strong>), the Washington My Health My Data Act, and applicable US state privacy laws.
            </p>
          </section>

          <section style={{ marginBottom: "28px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>2. Categories of Information We Collect</h2>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Account &amp; Identity Data:</strong> Name, email address, profile avatar image, phone number (optional), and user role (Trainer or Client) provided directly or via Google OAuth.</li>
              <li><strong>Workout &amp; Fitness Activity Data:</strong> Logged exercises, weight (lbs/kg), reps, sets, RPE notes, coach workout assignments, session timestamps, and estimated 1-Rep Max (1RM) calculations.</li>
              <li><strong>Nutritional &amp; Supplement Preferences:</strong> Calorie/macro goals, supplement regimens, and hydration notes entered voluntarily by athletes or coaches.</li>
              <li><strong>Payment &amp; Subscription Data:</strong> Subscription status and plan tier processed securely via Stripe or Google Play Billing. STRKYR never stores raw payment card numbers.</li>
              <li><strong>Technical Logs:</strong> IP address, device type, browser telemetry, and performance metrics utilized exclusively for error diagnosis and platform stability.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>3. Lawful Basis for Processing (GDPR Article 6 &amp; 9)</h2>
            <p>We process your data under the following legal bases:</p>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Contractual Necessity:</strong> To deliver workout logging, coach-client program assignments, and analytics services as agreed in our Terms of Service.</li>
              <li><strong>Explicit Consent (Special Category / Health Data):</strong> You explicitly consent to the logging and calculation of your physical exercise metrics. You may revoke consent at any time by deleting your account.</li>
              <li><strong>Legitimate Interests:</strong> To maintain system security, prevent fraud, and optimize database responsiveness.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>4. US State Privacy Rights (CCPA / CPRA &amp; State Health Acts)</h2>
            <p>
              Under the California Consumer Privacy Act (CCPA/CPRA), Washington My Health My Data Act, Nevada SB 370, Virginia VCDPA, and Colorado CPA:
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Right to Know &amp; Access:</strong> You can request disclosure of specific categories of personal and health data collected.</li>
              <li><strong>Right to Delete:</strong> You can permanently erase all personal and fitness data held in our systems.</li>
              <li><strong>Right to Correct:</strong> You can rectify inaccurate personal or client information directly in your profile settings.</li>
              <li><strong>No Selling / Sharing of Personal Information:</strong> We do NOT sell personal data or share consumer health data with advertising networks.</li>
              <li><strong>Non-Discrimination:</strong> Exercising your privacy rights will never result in denied service, degraded features, or differing pricing.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>5. GDPR Rights (EU &amp; UK Residents)</h2>
            <p>EU and UK users possess comprehensive rights under Articles 12–23 of the GDPR:</p>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Right of Access (Art. 15) &amp; Portability (Art. 20):</strong> Download an exact machine-readable JSON copy of all workouts, client records, and profile details via <em>Profile &rarr; Download My Data</em>.</li>
              <li><strong>Right to Rectification (Art. 16):</strong> Modify inaccurate profile details instantly in your settings.</li>
              <li><strong>Right to Erasure / &quot;Right to be Forgotten&quot; (Art. 17):</strong> Instant and permanent deletion of your account and all associated client workout trees.</li>
              <li><strong>Right to Restriction &amp; Objection (Art. 18/21):</strong> Opt out of non-essential communications and analytics.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>6. How to Exercise Your Privacy Rights</h2>
            <p>We provide automated self-service controls directly within the application:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px", color: "#0f172a", marginBottom: "4px" }}>
                  <Download size={15} style={{ color: "#2563eb" }} />
                  <span>Data Export (Portability)</span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Navigate to <em>Profile &amp; Billing &rarr; Download My Data</em> to download a structured JSON archive of all your workouts.
                </p>
              </div>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px", color: "#0f172a", marginBottom: "4px" }}>
                  <Trash2 size={15} style={{ color: "#dc2626" }} />
                  <span>Account Erasure</span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  Navigate to <em>Profile &amp; Billing &rarr; Delete Account &amp; Data</em> to immediately purge all personal records from our database.
                </p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: "28px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>7. Data Protection Officer &amp; Contact</h2>
            <p>
              If you have any questions regarding your data rights, GDPR compliance, or data processing, please contact our Data Protection representative directly:
            </p>
            <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
              <strong>Collin Shapiro</strong> — Founder &amp; Privacy Officer<br />
              Email: <a href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Privacy%20Inquiry" style={{ color: "#2563eb", fontWeight: 600 }}>collin.shapiro1@gmail.com</a><br />
              Application Support: <a href="mailto:support@strkyr.fit" style={{ color: "#2563eb", fontWeight: 600 }}>support@strkyr.fit</a>
            </div>
          </section>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", gap: "16px", fontSize: "13px", color: "#64748b" }}>
            <Link href="/terms" style={{ color: "#2563eb", textDecoration: "none" }}>Terms of Service</Link>
            <span>•</span>
            <Link href="/dashboard" style={{ color: "#2563eb", textDecoration: "none" }}>Fitness Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
