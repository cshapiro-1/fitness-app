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
  INDIVIDUAL_MONTHLY: {
    id: "strkyr-pro-monthly",
    name: "STRKYR Pro Monthly",
    price: "$4.99/mo",
    amountCents: 499,
    interval: "month",
    tier: "pro_individual",
    features: [
      "Unlimited Personal Workouts & History",
      "AI Periodized Routine Generator",
      "Interactive 3D Muscle Anatomy Guides",
      "Live Rest Stopwatch & Barbell Math",
      "Advanced 1RM & Volume Tonnage Analytics",
      "Nutrition & Supplement Log Tracker",
    ],
  },
  INDIVIDUAL_ANNUAL: {
    id: "strkyr-pro-annual",
    name: "STRKYR Pro Annual (Best Value — $2.49/mo)",
    price: "$29.99/yr",
    amountCents: 2999,
    interval: "year",
    tier: "pro_individual",
    features: [
      "Everything in Monthly",
      "Save 50% vs Monthly ($2.49/month)",
      "Priority AI Periodization Tuning",
      "Early Access to iOS & Android Native Features",
    ],
  },
  LIFETIME_FOUNDER: {
    id: "strkyr-pro-lifetime",
    name: "Founder Lifetime Pass (Limited)",
    price: "$79.99 one-time",
    amountCents: 7999,
    interval: "lifetime",
    tier: "pro_individual",
    features: [
      "Pay Once, Own Forever",
      "All Future Pro Features & AI Updates Included",
      "Founder Badge on Profile & Leaderboards",
      "Zero Recurring Fees",
    ],
  },
  COACH_PRO: {
    id: "strkyr-coach-pro",
    name: "Coach Studio Pro",
    price: "$19.00/mo",
    amountCents: 1900,
    interval: "month",
    tier: "coach_pro",
    features: [
      "Unlimited Athlete / Client Rosters",
      "1-Click Athlete Invite Links",
      "Client Nutrition & Adherence Monitoring",
      "Custom Branded Workout PDF Reports",
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