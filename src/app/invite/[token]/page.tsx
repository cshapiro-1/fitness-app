export const dynamic = "force-dynamic";

import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Dumbbell, Sparkles, ArrowRight, CheckCircle2, UserCheck, ShieldAlert, LogOut } from "lucide-react";
import { InviteAcceptor } from "./InviteAcceptor";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  const rawToken = resolvedParams.token;
  const session = await getServerSession(authOptions);

  if (!rawToken || rawToken === "undefined") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "420px", padding: "32px 24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "20px" }}>
            ✕
          </div>
          <h2 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>Invalid Invite Link</h2>
          <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.5, margin: "0 0 20px 0" }}>
            This invite link is missing or malformed. Please ask your trainer to generate a fresh invite link.
          </p>
          <Link href="/auth/signin" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none", padding: "10px 18px", fontSize: "13px", borderRadius: "8px" }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const cleanToken = decodeURIComponent(rawToken).trim().replace(/[.,;:]+$/, "");
  const lowerToken = cleanToken.toLowerCase();

  // Multi-tier client lookup: matches inviteToken (case-insensitive) OR direct client id
  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { inviteToken: cleanToken },
        { inviteToken: lowerToken },
        { id: cleanToken },
        { id: lowerToken },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, image: true, email: true },
      },
    },
  });

  if (!client) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: "420px", padding: "32px 24px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "20px" }}>
            ✕
          </div>
          <h2 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>Invite Link Expired or Not Found</h2>
          <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.5, margin: "0 0 20px 0" }}>
            We couldn&apos;t find an active client profile for this link. Your coach may have generated a newer invite link or the client was already linked.
          </p>
          <Link href="/auth/signin" className="btn-secondary" style={{ display: "inline-flex", textDecoration: "none", padding: "10px 18px", fontSize: "13px", borderRadius: "8px" }}>
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const trainerName = client.user?.name || "Your Coach";

  // Handle Authenticated User (Athlete or Coach)
  const sessionUserId = (session?.user as any)?.id;
  const sessionUserEmail = session?.user?.email;

  if (sessionUserId || sessionUserEmail) {
    // Find matching database user
    const dbUser = sessionUserId
      ? await prisma.user.findUnique({ where: { id: sessionUserId } })
      : sessionUserEmail
      ? await prisma.user.findUnique({ where: { email: sessionUserEmail.toLowerCase().trim() } })
      : null;

    if (dbUser) {
      // If logged in user IS the coach who created this client profile
      if (client.userId === dbUser.id) {
        return (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
              padding: "20px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            <div
              style={{
                maxWidth: "480px",
                width: "100%",
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                padding: "36px 28px",
                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.07)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <Dumbbell size={28} />
              </div>

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
                  marginBottom: "14px",
                }}
              >
                <UserCheck size={12} />
                <span>Coach Mode Active</span>
              </div>

              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0" }}>
                You Are Viewing as Coach
              </h1>

              <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.5, margin: "0 0 20px 0" }}>
                You generated this invite for <b>{client.name}</b>. This link is valid and ready to be accepted by your athlete.
              </p>

              <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px", fontSize: "12px", color: "#475569", textAlign: "left", marginBottom: "20px" }}>
                <b>To test this invite as an athlete:</b>
                <ol style={{ margin: "6px 0 0 0", paddingLeft: "18px", lineHeight: 1.5 }}>
                  <li>Copy this URL and open it in an <b>Incognito / Private tab</b>.</li>
                  <li>Sign in with an athlete Google account.</li>
                </ol>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  href="/dashboard"
                  className="btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "12px 18px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textDecoration: "none",
                    borderRadius: "10px",
                  }}
                >
                  <span>Return to Coach Dashboard</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        );
      }

      // If logged in as athlete, link account and activate Client Portal
      const athleteEmail = dbUser.email || sessionUserEmail || client.email || undefined;

      try {
        // 1. Update client status and email
        await prisma.client.update({
          where: { id: client.id },
          data: {
            email: athleteEmail,
            inviteStatus: "ACCEPTED",
          },
        });
      } catch (err: any) {
        console.warn("Client email update warning:", err?.message);
        await prisma.client.update({
          where: { id: client.id },
          data: { inviteStatus: "ACCEPTED" },
        });
      }

      // 2. Unlink any previous user attached to this clientProfileId
      await prisma.user.updateMany({
        where: { clientProfileId: client.id, NOT: { id: dbUser.id } },
        data: { clientProfileId: null },
      });

      // 3. Set user role to CLIENT and link clientProfileId
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          role: "CLIENT",
          clientProfileId: client.id,
        },
      });

      return (
        <InviteAcceptor
          clientName={client.name}
          trainerName={trainerName}
        />
      );
    }
  }

  // If not authenticated yet, render the branded invite welcome card
  const callbackUrl = `/invite/${encodeURIComponent(cleanToken)}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "460px",
          width: "100%",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "36px 28px",
          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        {/* App & Coach Branding */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#ffffff",
            marginBottom: "16px",
            boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
          }}
        >
          <Dumbbell size={28} />
        </div>

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
            marginBottom: "14px",
          }}
        >
          <Sparkles size={12} />
          <span>100% Free Client Access</span>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
          Welcome, {client.name}!
        </h1>

        <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, margin: "0 0 24px 0" }}>
          <b>{trainerName}</b> has invited you to their coaching portal on <b>STRKYR Fitness</b>. Access your assigned workouts, strength PR records, and nutrition targets.
        </p>

        {/* Benefits Checklist */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "16px",
            textAlign: "left",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>Assigned workout routines &amp; coaching cues</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>Weight &amp; rep tracking with 1RM strength analytics</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>Daily nutrition macro goals &amp; rest timer</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="btn-primary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "14px 20px",
            fontSize: "14px",
            fontWeight: 700,
            textDecoration: "none",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
          }}
        >
          <span>Accept Invite &amp; Sign In</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}