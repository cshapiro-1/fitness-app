import React from "react";
import Link from "next/link";
import { FileText, Dumbbell, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Fitness Tracker & Workout Coach",
  description: "Terms of Service governing use of the Fitness Tracker & Workout Coach application and subscriptions.",
};

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#2563eb", fontWeight: 700, fontSize: "16px" }}>
            <Dumbbell size={20} />
            <span>STRKYR Fitness</span>
          </Link>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#64748b", textDecoration: "none" }}>
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 24px 60px" }}>
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "36px 32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "#2563eb" }}>
            <FileText size={28} />
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>Terms of Service</h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "28px" }}>Last updated: August 13, 2026</p>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Fitness Tracker &amp; Workout Coach (&quot;FitCoach&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
            </p>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>2. Health &amp; Fitness Liability Disclaimer</h2>
            <p>
              FitCoach is an informational and organizational tool for workout tracking and coach programming. <strong>We do not provide medical advice.</strong>
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li>Always consult a qualified healthcare physician or medical professional before starting any new exercise or strength training program.</li>
              <li>You acknowledge that physical exercise carries inherent risk of injury. You assume full responsibility for any physical injuries or damages sustained during workouts.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>3. Subscriptions, Pricing &amp; Renewals</h2>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Trainer Pro Monthly:</strong> $20.00 USD per month. Billed on a recurring monthly basis.</li>
              <li><strong>Trainer Pro Annual:</strong> $200.00 USD per year ($40/year discount). Billed annually.</li>
              <li><strong>Clients:</strong> Access to the client workout portal is <strong>100% free</strong> of charge.</li>
              <li><strong>Auto-Renewal:</strong> Subscriptions renew automatically at the end of each billing period unless cancelled prior to the renewal date.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time via your profile settings or your Google Play / App Store account settings. You will retain access until the end of your prepaid billing period.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>4. User Conduct &amp; Account Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials. You agree not to use the service for any illegal activities, spamming, or violating the privacy of others.
            </p>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>5. Account Termination &amp; Data Deletion</h2>
            <p>
              You may terminate your account at any time using the in-app <strong>Delete Account</strong> option. Upon termination, all personal workout data and associated client links are permanently deleted.
            </p>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>6. Contact Information</h2>
            <p>
              For billing inquiries or support:
              <br />
              <a href="mailto:support@fitnesscoach.app" style={{ color: "#2563eb", fontWeight: 600 }}>support@fitnesscoach.app</a>
            </p>
          </section>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", gap: "16px", fontSize: "13px", color: "#64748b" }}>
            <Link href="/privacy" style={{ color: "#2563eb", textDecoration: "none" }}>Privacy Policy</Link>
            <span>•</span>
            <Link href="/dashboard" style={{ color: "#2563eb", textDecoration: "none" }}>Fitness Dashboard</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
