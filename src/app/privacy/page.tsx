import React from "react";
import Link from "next/link";
import { Shield, Dumbbell, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Fitness Tracker & Workout Coach",
  description: "Privacy Policy explaining data handling, workout logging, and subscription privacy practices.",
};

export default function PrivacyPolicyPage() {
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
            <Shield size={28} />
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>Privacy Policy</h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "28px" }}>Last updated: August 13, 2026</p>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>1. Introduction & Overview</h2>
            <p>
              Fitness Tracker & Workout Coach (&quot;FitCoach&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy describes our practices regarding the collection, use, and disclosure of information when you use our web application, mobile applications, and services.
            </p>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>2. Information We Collect</h2>
            <p>We collect information necessary to provide workout logging, coaching, and subscription services:</p>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Account Information:</strong> Name, email address, profile photo (avatar), and contact details when you create an account via email or Google OAuth.</li>
              <li><strong>Fitness & Workout Data:</strong> Exercises performed, weight lifted, rep counts, workout session dates, notes, and trainer-assigned routines.</li>
              <li><strong>Billing & Payment Information:</strong> Payment processing is handled securely by our payment partners (Stripe and Google Play Billing). We do not store raw credit card numbers on our servers.</li>
              <li><strong>Technical Data:</strong> Device type, browser version, IP address, and application performance metrics for reliability.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>3. How We Use Your Information</h2>
            <ul style={{ paddingLeft: "20px" }}>
              <li>To provide, maintain, and personalize your workout logging and coaching dashboard.</li>
              <li>To calculate strength analytics, 1RM estimations, volume accumulation, and progress metrics.</li>
              <li>To allow trainers to assign workout routines to invited clients.</li>
              <li>To process subscriptions ($20/month or $200/year for trainers; free access for clients).</li>
              <li>To detect, prevent, and address technical issues or security threats.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>4. Data Sharing & Third Parties</h2>
            <p>
              We do <strong>never sell your personal or fitness data</strong>. We share data only with service providers strictly necessary to operate our service:
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>Hosting & Database:</strong> Vercel (Edge Hosting) and Neon (Serverless PostgreSQL).</li>
              <li><strong>Payment Processors:</strong> Stripe Inc. and Google Play Billing for in-app subscriptions.</li>
              <li><strong>Authentication:</strong> Google OAuth for single-sign-on verification.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>5. Account & Data Deletion (Your Rights)</h2>
            <p>
              You have full ownership of your data. You may permanently delete your account and all associated fitness logs, client profiles, and records at any time:
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>In-App Deletion:</strong> Open <em>Profile &amp; Billing</em> &rarr; Click <em>Delete Account &amp; Data</em>.</li>
              <li>Upon confirmation, all personal details, workout sessions, exercise history, and client records are permanently purged from our database immediately.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "24px", lineHeight: "1.7", fontSize: "14px", color: "#334155" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>6. Contact Us</h2>
            <p>
              If you have any questions regarding this Privacy Policy or your data, please contact our support team at:
              <br />
              <a href="mailto:support@fitnesscoach.app" style={{ color: "#2563eb", fontWeight: 600 }}>support@fitnesscoach.app</a>
            </p>
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
