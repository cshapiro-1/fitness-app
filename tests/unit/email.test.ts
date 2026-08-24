import { describe, it, expect, vi } from "vitest";
import { generateWorkoutEmailHtml, sendWorkoutNotification } from "@/lib/email";

describe("Workout Email Notification Generator", () => {
  it("should generate ASSIGNED workout email with exercises, sets, and unsubscribe link", () => {
    const payload = {
      recipientEmail: "client@gym.com",
      recipientName: "Sarah Connor",
      trainerName: "Coach Mike",
      type: "ASSIGNED" as const,
      notes: "Focus on slow tempo on negatives",
      exercises: [
        {
          name: "Barbell Back Squat",
          sets: [
            { weight: 185, reps: 8, notes: "Warmup" },
            { weight: 225, reps: 5, notes: "Working set" },
          ],
        },
        {
          name: "Romanian Deadlift",
          sets: [{ weight: 135, reps: 10 }],
        },
      ],
    };

    const { subject, html } = generateWorkoutEmailHtml(payload);

    expect(subject).toContain("New Workout Assigned by Coach Coach Mike");
    expect(html).toContain("Sarah Connor");
    expect(html).toContain("Barbell Back Squat");
    expect(html).toContain("225 lbs × 5 reps");
    expect(html).toContain("Focus on slow tempo on negatives");
    expect(html).toContain("api/notifications/unsubscribe?email=client%40gym.com");
  });

  it("should generate COMPLETED workout email with summary", () => {
    const payload = {
      recipientEmail: "athlete@pro.com",
      recipientName: "Dave",
      trainerName: "Coach Mike",
      type: "COMPLETED" as const,
      dateStr: "8/13/2026",
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [{ weight: 205, reps: 5 }],
        },
      ],
    };

    const { subject, html } = generateWorkoutEmailHtml(payload);

    expect(subject).toContain("Workout Summary Logged with Coach Coach Mike");
    expect(html).toContain("Dave");
    expect(html).toContain("Barbell Bench Press");
    expect(html).toContain("205 lbs × 5 reps");
    expect(html).toContain("api/notifications/unsubscribe?email=athlete%40pro.com");
  });

  it("should successfully trigger simulated email delivery when no RESEND_API_KEY is present", async () => {
    const result = await sendWorkoutNotification({
      recipientEmail: "test@fit.com",
      recipientName: "Test User",
      trainerName: "Coach",
      type: "ASSIGNED",
      exercises: [{ name: "Pull-Up", sets: [{ weight: 0, reps: 10 }] }],
    });

    expect(result).toBe(true);
  });

  it("should generate 2-day trial expiry reminder email with founder contact link", async () => {
    const { generateTrialExpiryEmailHtml, sendTrialExpiryReminderEmail } = await import("@/lib/email");
    const { subject, html } = generateTrialExpiryEmailHtml({
      recipientEmail: "coach@gym.com",
      recipientName: "Coach Dave",
      daysRemaining: 2,
    });

    expect(subject).toContain("2 Days Left");
    expect(html).toContain("Coach Dave");
    expect(html).toContain("collin.shapiro1@gmail.com");
    expect(html).toContain("Subscribe Now");

    const res = await sendTrialExpiryReminderEmail({
      recipientEmail: "coach@gym.com",
      recipientName: "Coach Dave",
      daysRemaining: 2,
    });
    expect(res).toBe(true);
  });

  it("should generate lapsed subscription dunning email with reactivate link and founder email", async () => {
    const { generateLapsedSubscriptionEmailHtml, sendLapsedSubscriptionReminderEmail } = await import("@/lib/email");
    const { subject, html } = generateLapsedSubscriptionEmailHtml({
      recipientEmail: "lapsed@gym.com",
      recipientName: "Coach Sarah",
      daysLapsed: 3,
    });

    expect(subject).toContain("Reactivate Your STRKYR Coach Studio Access");
    expect(html).toContain("3 days ago");
    expect(html).toContain("collin.shapiro1@gmail.com");
    expect(html).toContain("Reactivate Studio");

    const res = await sendLapsedSubscriptionReminderEmail({
      recipientEmail: "lapsed@gym.com",
      recipientName: "Coach Sarah",
      daysLapsed: 3,
    });
    expect(res).toBe(true);
  });

  it("should generate quarterly 90-day feedback survey email for trainers and clients", async () => {
    const { generateQuarterlyFeedbackEmailHtml, sendQuarterlyFeedbackEmail } = await import("@/lib/email");
    const { subject, html } = generateQuarterlyFeedbackEmailHtml({
      recipientEmail: "trainer@gym.com",
      recipientName: "Coach Alex",
      role: "TRAINER",
    });

    expect(subject).toContain("Quick Check-in from Collin");
    expect(html).toContain("Coach Alex");
    expect(html).toContain("collin.shapiro1@gmail.com");
    expect(html).toContain("3 months");

    const res = await sendQuarterlyFeedbackEmail({
      recipientEmail: "trainer@gym.com",
      recipientName: "Coach Alex",
      role: "TRAINER",
    });
    expect(res).toBe(true);
  });
});
