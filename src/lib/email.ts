export interface WorkoutNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  trainerName: string;
  type: "ASSIGNED" | "COMPLETED";
  workoutTitle?: string;
  notes?: string | null;
  exercises: {
    name: string;
    sets: { weight: number | string; reps: number | string; notes?: string | null }[];
  }[];
  dateStr?: string;
  clientId?: string;
}

export function generateWorkoutEmailHtml(payload: WorkoutNotificationPayload): {
  subject: string;
  html: string;
} {
  const appUrl = process.env.NEXTAUTH_URL || "https://strkyr.fit";
  const unsubscribeUrl = `${appUrl}/api/notifications/unsubscribe?email=${encodeURIComponent(
    payload.recipientEmail
  )}`;

  const isAssigned = payload.type === "ASSIGNED";
  const subject = isAssigned
    ? `🏋️ New Workout Assigned by Coach ${payload.trainerName}`
    : `🏆 Workout Summary Logged with Coach ${payload.trainerName}`;

  const exerciseRows = payload.exercises
    .map((ex, idx) => {
      const setsHtml = ex.sets
        .map(
          (s, sIdx) =>
            `<li style="margin: 3px 0; color: #475569; font-size: 13px;">
              <b>Set ${sIdx + 1}:</b> ${s.weight ? `${s.weight} lbs × ` : ""}${s.reps} reps ${
              s.notes ? `<i>(${s.notes})</i>` : ""
            }
            </li>`
        )
        .join("");

      return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 6px;">
            ${idx + 1}. ${ex.name}
          </div>
          <ul style="margin: 0; padding-left: 18px;">
            ${setsHtml}
          </ul>
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        </style>
      </head>
      <body style="background-color: #f8fafc; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">FitCoach</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">
              ${isAssigned ? "New Planned Workout Routine" : "Workout Session Completed"}
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #334155; margin-top: 0;">
              Hi <b>${payload.recipientName}</b>,
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              ${
                isAssigned
                  ? `Coach <b>${payload.trainerName}</b> has programmed a new workout routine for you in FitCoach:`
                  : `A workout session was completed with Coach <b>${payload.trainerName}</b> on ${payload.dateStr || "today"}:`
              }
            </p>

            ${
              payload.notes
                ? `<div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 10px 14px; border-radius: 4px; font-size: 13px; color: #334155; margin: 16px 0;">
                    <b>Coach Notes:</b> ${payload.notes}
                  </div>`
                : ""
            }

            <div style="margin: 20px 0;">
              <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 10px;">
                Exercises (${payload.exercises.length})
              </h3>
              ${exerciseRows}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${appUrl}/dashboard" style="background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
                ${isAssigned ? "Open Workout Portal" : "View Workout History"}
              </a>
            </div>
          </div>

          <!-- Footer with Unsubscribe -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            <p style="margin: 0 0 6px 0;">
              FitCoach • Professional Workout &amp; Strength Coaching
            </p>
            <p style="margin: 0;">
              Don't want to receive workout updates? 
              <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">
                Unsubscribe from email notifications
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

export async function sendWorkoutNotification(payload: WorkoutNotificationPayload): Promise<boolean> {
  const { subject, html } = generateWorkoutEmailHtml(payload);
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(
    `[EMAIL_DISPATCHER] Dispatching "${subject}" to ${payload.recipientEmail} (${payload.type})`
  );

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "FitCoach Notifications <notifications@fitnesscoach.app>",
          to: payload.recipientEmail,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Resend API error:", errorText);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Failed to send email via Resend:", e);
      return false;
    }
  }

  // Simulated delivery fallback (logs formatted HTML output)
  console.log(`[EMAIL_SENT_SIMULATED] Successfully sent email to ${payload.recipientEmail}`);
  return true;
}

// -------------------------------------------------------------
// 1. TRIAL EXPIRY REMINDER (2 Days Prior)
// -------------------------------------------------------------
export interface TrialExpiryPayload {
  recipientEmail: string;
  recipientName: string;
  daysRemaining: number;
}

export function generateTrialExpiryEmailHtml(payload: TrialExpiryPayload): { subject: string; html: string } {
  const appUrl = process.env.NEXTAUTH_URL || "https://strkyr.fit";
  const subject = `⏳ ${payload.daysRemaining} Days Left: Your STRKYR Coach Studio Free Trial Ends Soon`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">STRKYR Coach Studio</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Trial Expiration Reminder</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #334155;">Hi <b>${payload.recipientName}</b>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              You have <b>${payload.daysRemaining} days remaining</b> in your 30-Day Free Trial of STRKYR Coach Studio.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <div style="font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 8px;">Keep Your Studio Active:</div>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #475569; line-height: 1.6;">
                <li>Unlimited athlete roster & 100% free client companion portals</li>
                <li>AI 3D anatomical kinesiology guides for 120+ movements</li>
                <li>Instant on-the-fly AI routine generator with periodized cues</li>
                <li>Comprehensive 1RM analytics, plate math, & CSV export reports</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 28px 0 20px 0;">
              <a href="${appUrl}/dashboard" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
                Subscribe Now ($19/mo or $200/yr)
              </a>
            </div>
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; border-radius: 4px; font-size: 12px; color: #1e40af; margin-top: 24px;">
              <b>Need custom invoicing, billing assistance, or team rates?</b><br>
              Reach out directly to founder Collin Shapiro at <a href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Trial%20Inquiry" style="color: #2563eb; font-weight: 700;">collin.shapiro1@gmail.com</a>.
            </div>
          </div>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            STRKYR Fitness • Professional Workout &amp; Strength Coaching
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

export async function sendTrialExpiryReminderEmail(payload: TrialExpiryPayload): Promise<boolean> {
  const { subject, html } = generateTrialExpiryEmailHtml(payload);
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`[EMAIL_DISPATCHER] Dispatching "${subject}" to ${payload.recipientEmail}`);

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "STRKYR Fitness <notifications@strkyr.fit>",
          to: payload.recipientEmail,
          subject,
          html,
        }),
      });
      return res.ok;
    } catch (e) {
      console.error("Resend API error:", e);
      return false;
    }
  }

  console.log(`[EMAIL_SENT_SIMULATED] Successfully sent trial expiry reminder to ${payload.recipientEmail}`);
  return true;
}

// -------------------------------------------------------------
// 2. LAPSED SUBSCRIPTION REMINDER (Day 3 & Weekly)
// -------------------------------------------------------------
export interface LapsedSubscriptionPayload {
  recipientEmail: string;
  recipientName: string;
  daysLapsed: number;
}

export function generateLapsedSubscriptionEmailHtml(payload: LapsedSubscriptionPayload): { subject: string; html: string } {
  const appUrl = process.env.NEXTAUTH_URL || "https://strkyr.fit";
  const subject = `🔒 Reactivate Your STRKYR Coach Studio Access`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%); padding: 24px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">STRKYR Coach Studio</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Studio Access Suspended</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #334155;">Hi <b>${payload.recipientName}</b>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              Your STRKYR Coach Studio trial ended <b>${payload.daysLapsed} days ago</b>. Your athletes currently cannot view newly assigned programs until your studio subscription is reactivated.
            </p>
            <div style="text-align: center; margin: 28px 0 20px 0;">
              <a href="${appUrl}/dashboard" style="background: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
                Reactivate Studio ($19/mo or $200/yr)
              </a>
            </div>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 14px; border-radius: 4px; font-size: 12px; color: #991b1b; margin-top: 24px;">
              <b>Questions about billing or account data?</b><br>
              Contact founder Collin Shapiro directly at <a href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Reactivation%20Assistance" style="color: #b91c1c; font-weight: 700;">collin.shapiro1@gmail.com</a>.
            </div>
          </div>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            STRKYR Fitness • Professional Workout &amp; Strength Coaching
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

export async function sendLapsedSubscriptionReminderEmail(payload: LapsedSubscriptionPayload): Promise<boolean> {
  const { subject, html } = generateLapsedSubscriptionEmailHtml(payload);
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`[EMAIL_DISPATCHER] Dispatching "${subject}" to ${payload.recipientEmail}`);

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "STRKYR Fitness <notifications@strkyr.fit>",
          to: payload.recipientEmail,
          subject,
          html,
        }),
      });
      return res.ok;
    } catch (e) {
      console.error("Resend API error:", e);
      return false;
    }
  }

  console.log(`[EMAIL_SENT_SIMULATED] Successfully sent lapsed subscription reminder to ${payload.recipientEmail}`);
  return true;
}

// -------------------------------------------------------------
// 3. QUARTERLY SUBSCRIBER FEEDBACK SURVEY (Every 3 Months)
// -------------------------------------------------------------
export interface FeedbackSurveyPayload {
  recipientEmail: string;
  recipientName: string;
  role: "TRAINER" | "CLIENT";
}

export function generateQuarterlyFeedbackEmailHtml(payload: FeedbackSurveyPayload): { subject: string; html: string } {
  const isTrainer = payload.role === "TRAINER";
  const subject = `💬 Quick Check-in from Collin: How is STRKYR Working For You?`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 24px;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">STRKYR Fitness</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Quarterly Community &amp; Product Check-in</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 15px; color: #334155;">Hi <b>${payload.recipientName}</b>,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              This is Collin Shapiro, creator of STRKYR Fitness. You’ve been an active part of our platform over the past 3 months, and I wanted to personally reach out and see how everything is going with your ${isTrainer ? "client coaching and workout programming" : "daily workout tracking and fitness progress"}.
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
              We build STRKYR directly around your feedback. If you have 60 seconds, reply directly to this email and let me know:
            </p>
            <ul style="font-size: 13px; color: #475569; line-height: 1.6; padding-left: 20px;">
              <li>What features or tools do you use the most?</li>
              <li>What is one thing we could build or improve to make your training even better?</li>
              <li>Are there any specific exercises or anatomical movements you'd like added?</li>
            </ul>
            <div style="text-align: center; margin: 28px 0 20px 0;">
              <a href="mailto:collin.shapiro1@gmail.com?subject=STRKYR%20Quarterly%20Feedback%20(${payload.role})" style="background: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
                Reply Directly to Collin (collin.shapiro1@gmail.com)
              </a>
            </div>
            <p style="font-size: 13px; color: #64748b; text-align: center; margin: 16px 0 0 0;">
              Thank you for being part of STRKYR!
            </p>
          </div>
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            STRKYR Fitness • Direct Founder Support: collin.shapiro1@gmail.com
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

export async function sendQuarterlyFeedbackEmail(payload: FeedbackSurveyPayload): Promise<boolean> {
  const { subject, html } = generateQuarterlyFeedbackEmailHtml(payload);
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`[EMAIL_DISPATCHER] Dispatching "${subject}" to ${payload.recipientEmail}`);

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "STRKYR Fitness <collin@strkyr.fit>",
          to: payload.recipientEmail,
          subject,
          html,
        }),
      });
      return res.ok;
    } catch (e) {
      console.error("Resend API error:", e);
      return false;
    }
  }

  console.log(`[EMAIL_SENT_SIMULATED] Successfully sent quarterly feedback email to ${payload.recipientEmail}`);
  return true;
}
