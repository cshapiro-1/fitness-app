export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { generateAnalyticsInsights } from "@/app/dashboard/utils/aiAnalyticsInsights";

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, RATE_LIMIT_PRESETS.AI);
    if (rateCheck.limited && rateCheck.response) {
      return rateCheck.response;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const analytics = body.analytics;

    const insights = generateAnalyticsInsights(analytics);

    return NextResponse.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI Analytics Insights Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate analytics insights" }, { status: 500 });
  }
}
