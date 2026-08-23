export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRole } from "@/lib/roles";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { extendTrialDays, grantSubscriptionDays, subscriptionStatus, role } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (role !== undefined && role !== null) {
      updateData.role = parseRole(role);
    }

    if (subscriptionStatus) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    if (extendTrialDays && typeof extendTrialDays === "number") {
      const currentEnd = targetUser.trialEndsAt && new Date(targetUser.trialEndsAt) > new Date()
        ? new Date(targetUser.trialEndsAt)
        : new Date();
      currentEnd.setDate(currentEnd.getDate() + extendTrialDays);
      updateData.trialEndsAt = currentEnd;
      updateData.subscriptionStatus = "trial";
    }

    if (grantSubscriptionDays && typeof grantSubscriptionDays === "number") {
      const currentSub = targetUser.subscribedUntil && new Date(targetUser.subscribedUntil) > new Date()
        ? new Date(targetUser.subscribedUntil)
        : new Date();
      currentSub.setDate(currentSub.getDate() + grantSubscriptionDays);
      updateData.subscribedUntil = currentSub;
      updateData.subscriptionStatus = "active";
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update user" }, { status: 500 });
  }
}