export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTrainerSubscription } from "@/lib/subscription";

// POST /api/billing/restore
// Mandatory App Store & Google Play requirement: Restore existing purchases
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string | null = null;
    const email = session.user.email?.toLowerCase().trim();

    if (email) {
      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      userId = (session.user as any).id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user already has an active subscription period or valid token, confirm active
    const now = new Date();
    if (user.subscribedUntil && new Date(user.subscribedUntil) > now) {
      return NextResponse.json({
        success: true,
        restored: true,
        message: "Active subscription successfully restored!",
        status: "active",
        subscribedUntil: user.subscribedUntil,
      });
    }

    // Check subscription status
    const subInfo = await checkTrainerSubscription(user.id);
    if (subInfo.hasAccess) {
      return NextResponse.json({
        success: true,
        restored: true,
        message: "Active membership restored!",
        status: subInfo.status,
        daysRemaining: subInfo.daysRemaining,
      });
    }

    return NextResponse.json({
      success: true,
      restored: false,
      message: "No active past purchases found for this account.",
      status: "expired",
    });
  } catch (error: any) {
    console.error("Restore purchase error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore purchases" },
      { status: 500 }
    );
  }
}
