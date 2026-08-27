import { prisma } from "@/lib/prisma";

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  status: "trial" | "active" | "expired";
  tier?: "free" | "pro_individual" | "coach_pro";
  daysRemaining: number;
  trialEndsAt: Date | null;
  subscribedUntil: Date | null;
  isAdmin: boolean;
  reason?: string;
}

export const PRICING_PLANS = {
  COACH_MONTHLY: {
    id: "strkyr-coach-monthly",
    name: "Coach Studio Monthly",
    price: "$19.00/mo",
    amountCents: 1900,
    interval: "month",
    tier: "coach_pro",
    features: [
      "Unlimited Athlete / Client Rosters",
      "Instant 1-Click Athlete Invite Links",
      "AI Periodized Routine Builder",
      "Interactive 3D Muscle Anatomy Guides",
      "Client Nutrition & Supplement Monitoring",
      "Strength Analytics & Volume Tonnage Tracking",
      "Personal & Client Workout Logging",
    ],
  },
  COACH_ANNUAL: {
    id: "strkyr-coach-annual",
    name: "Coach Studio Annual",
    price: "$200.00/yr",
    amountCents: 20000,
    interval: "year",
    tier: "coach_pro",
    features: [
      "Everything in Monthly Plan",
      "Discounted Annual Billing ($16.67/mo)",
      "Priority AI Routine Engineering",
      "Custom Branded Workout PDF Reports",
      "Dedicated Coach Support & OTA Updates",
    ],
  },
  STUDIO_LIFETIME: {
    id: "strkyr-coach-lifetime",
    name: "Founder Coach Lifetime VIP",
    price: "$299.00 one-time",
    amountCents: 29900,
    interval: "lifetime",
    tier: "coach_pro",
    features: [
      "Pay Once, Unlimited Clients Forever",
      "All Future Coaching & AI Features Included",
      "Founder Coach Badge & Early Beta Access",
      "Zero Recurring Monthly Fees",
    ],
  },
};

export async function checkUserSubscription(userId: string): Promise<SubscriptionCheckResult> {
  return checkTrainerSubscription(userId);
}

export async function checkTrainerSubscription(userId: string): Promise<SubscriptionCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
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

  const isAdmin = !!user.isAdmin;

  // Clients / Athletes are 100% free and never expire
  if (user.role === "CLIENT") {
    return {
      hasAccess: true,
      status: "active",
      daysRemaining: 9999,
      trialEndsAt: null,
      subscribedUntil: null,
      isAdmin,
    };
  }

  const now = new Date();
  let trialEnd = user.trialEndsAt;
  if (!trialEnd && user.createdAt) {
    trialEnd = new Date(user.createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);
  }

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
    reason: "Your 14-day free trial has expired. Upgrade to continue adding clients and logging workouts.",
  };
}