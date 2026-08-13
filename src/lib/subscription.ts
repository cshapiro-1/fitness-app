import { prisma } from "@/lib/prisma";

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  status: "trial" | "active" | "expired";
  daysRemaining: number;
  trialEndsAt: Date | null;
  subscribedUntil: Date | null;
  isAdmin: boolean;
  reason?: string;
}

export async function checkTrainerSubscription(userId: string): Promise<SubscriptionCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      trialEndsAt: true,
      subscriptionStatus: true,
      subscribedUntil: true,
      createdAt: true,
      isAdmin: true,
    },
  });

  if (!user) {
    return {
      hasAccess: false,
      status: "expired",
      daysRemaining: 0,
      trialEndsAt: null,
      subscribedUntil: null,
      isAdmin: false,
      reason: "User not found",
    };
  }

  const now = new Date();
  let trialEnd = user.trialEndsAt;
  if (!trialEnd && user.createdAt) {
    trialEnd = new Date(user.createdAt);
    trialEnd.setDate(trialEnd.getDate() + 30);
  }

  const isAdmin = !!user.isAdmin;

  if (user.subscribedUntil && new Date(user.subscribedUntil) > now) {
    const daysRemaining = Math.max(0, Math.ceil((new Date(user.subscribedUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      hasAccess: true,
      status: "active",
      daysRemaining,
      trialEndsAt: trialEnd,
      subscribedUntil: user.subscribedUntil,
      isAdmin,
    };
  }

  if (trialEnd && trialEnd > now) {
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      hasAccess: true,
      status: "trial",
      daysRemaining,
      trialEndsAt: trialEnd,
      subscribedUntil: user.subscribedUntil,
      isAdmin,
    };
  }

  return {
    hasAccess: false,
    status: "expired",
    daysRemaining: 0,
    trialEndsAt: trialEnd,
    subscribedUntil: user.subscribedUntil,
    isAdmin,
    reason: "Your 30-day free trial has expired. Upgrade to continue adding clients and logging workouts.",
  };
}