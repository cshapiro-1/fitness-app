export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const clientId = searchParams.get("clientId");
    const resubscribe = searchParams.get("resubscribe") === "true";

    if (!email && !clientId) {
      return new NextResponse("Invalid unsubscribe request: missing email or clientId.", {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    const targetNotifications = resubscribe ? true : false;

    // Update Client record
    if (email) {
      await prisma.client.updateMany({
        where: { email },
        data: { emailNotifications: targetNotifications },
      });

      await prisma.user.updateMany({
        where: { email },
        data: { emailNotifications: targetNotifications },
      });
    } else if (clientId) {
      await prisma.client.update({
        where: { id: clientId },
        data: { emailNotifications: targetNotifications },
      });
    }

    const appUrl = process.env.NEXTAUTH_URL || "https://strkyr.fit";
    const toggleUrl = `${appUrl}/api/notifications/unsubscribe?${
      email ? `email=${encodeURIComponent(email)}` : `clientId=${clientId}`
    }&resubscribe=${!resubscribe}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${resubscribe ? "Subscribed to Notifications" : "Unsubscribed from Notifications"}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 16px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
            .card { max-width: 460px; width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center; }
            .badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; margin-bottom: 16px; }
            .btn { display: inline-block; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; text-decoration: none; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge" style="background: ${resubscribe ? "#f0fdf4" : "#fef2f2"}; color: ${resubscribe ? "#16a34a" : "#dc2626"};">
              ${resubscribe ? "🔔" : "🔕"}
            </div>
            <h2 style="margin: 0 0 8px 0; font-size: 20px;">
              ${resubscribe ? "Notifications Re-enabled" : "Successfully Unsubscribed"}
            </h2>
            <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0;">
              ${
                resubscribe
                  ? `You will now receive email notifications when your coach assigns or completes workouts.`
                  : `You have unsubscribed <b>${email || "your account"}</b> from FitCoach workout notification emails.`
              }
            </p>
            <div>
              <a href="${appUrl}/dashboard" class="btn" style="background: #2563eb; color: #ffffff;">
                Return to FitCoach
              </a>
            </div>
            <div style="margin-top: 16px;">
              <a href="${toggleUrl}" style="font-size: 12px; color: #94a3b8; text-decoration: underline;">
                ${resubscribe ? "Want to unsubscribe again?" : "Clicked by mistake? Re-subscribe here"}
              </a>
            </div>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: any) {
    console.error("Unsubscribe error:", error);
    return new NextResponse("An error occurred while updating your notification preferences.", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, clientId, enabled } = body;

    if (!email && !clientId) {
      return NextResponse.json({ error: "email or clientId is required" }, { status: 400 });
    }

    if (email) {
      await prisma.client.updateMany({
        where: { email: email.toLowerCase().trim() },
        data: { emailNotifications: enabled ?? true },
      });
      await prisma.user.updateMany({
        where: { email: email.toLowerCase().trim() },
        data: { emailNotifications: enabled ?? true },
      });
    } else if (clientId) {
      await prisma.client.update({
        where: { id: clientId },
        data: { emailNotifications: enabled ?? true },
      });
    }

    return NextResponse.json({ success: true, enabled: enabled ?? true });
  } catch (error: any) {
    console.error("Unsubscribe POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
