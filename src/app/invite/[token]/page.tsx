export const dynamic = "force-dynamic";

import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Dumbbell, ShieldCheck, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  const session = await getServerSession(authOptions);

  if (!token || token === "undefined") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "420px", padding: "32px 24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            ✕
          </div>
          <h2 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>Invalid Invite Link</h2>
          <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.5, margin: "0 0 20px 0" }}>
            This invite link is missing or malformed. Please ask your trainer to generate a fresh invite link.
          </p>
          <Link href="/auth/signin" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none", padding: "8px 16px", fontSize: "13px" }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Look up client profile by invite token
  const client = await prisma.client.findFirst({
    where: { inviteToken: token },
    include: {
      user: {
        select: { name: true, image: true },
      },
    },
  });

  if (!client) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "420px", padding: "32px 24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            ✕
          </div>
          <h2 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>Expired or Unknown Invite Link</h2>
          <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.5, margin: "0 0 20px 0" }}>
            We couldn&apos;t find an active client profile for this link. Please ask your trainer for a new invite.
          </p>
          <Link href="/auth/signin" className="btn-secondary" style={{ display: "inline-flex", textDecoration: "none", padding: "8px 16px", fontSize: "13px" }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // If user is already logged in, link their account and activate client portal
  if (session?.user?.id) {
    // 1. Update client status
    await prisma.client.update({
      where: { id: client.id },
      data: {
        email: session.user.email || undefined,
        inviteStatus: "ACCEPTED",
      },
    });

    // 2. Set user role to CLIENT and link clientProfileId
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: "CLIENT",
        clientProfileId: client.id,
      },
    });

    redirect("/dashboard");
  }

  // If not logged in yet, show branded invitation portal card
  const trainerName = client.user?.name || "Your Coach";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "460px", width: "100%", background: "#ffffff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "32px 28px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)", textAlign: "center" }}>
        
        {/* App & Coach Branding */}
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff", marginBottom: "16px", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
          <Dumbbell size={28} />
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, marginBottom: "12px" }}>
          <Sparkles size={12} />
          <span>100% Free Lifetime Client Access</span>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
          Welcome, {client.name}!
        </h1>

        <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, margin: "0 0 24px 0" }}>
          <b>{trainerName}</b> has invited you to their coaching portal. Access your assigned workouts, 1RM strength records, nutrition macros, and daily supplements.
        </p>

        {/* Benefits Checklist */}
        <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px 16px", textAlign: "left", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
            <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>Custom workout routines assigned by your coach</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
            <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>Weight &amp; rep tracking with 1RM strength analytics</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
            <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>Cutting/Bulking nutrition targets &amp; daily supplement stack</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/auth/signin?callbackUrl=/invite/${token}`}
          className="btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
            borderRadius: "10px",
          }}
        >
          <span>Accept Invite &amp; Sign In</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}