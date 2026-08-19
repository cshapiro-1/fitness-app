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
