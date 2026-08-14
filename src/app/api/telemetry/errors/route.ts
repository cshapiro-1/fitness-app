export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      message = "Unknown client error",
      stack,
      url,
      userAgent,
      timestamp = new Date().toISOString(),
    } = body;

    console.error("[CLIENT_TELEMETRY_ERROR]", {
      timestamp,
      user: session?.user?.email || "anonymous",
      url,
      message,
      stack: stack?.substring(0, 500),
      userAgent: userAgent || req.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true, logged: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to log telemetry" }, { status: 500 });
  }
}
