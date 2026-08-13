export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// GET /api/health/ping - Fast uptime monitoring ping probe
export async function GET() {
  return new NextResponse("PONG", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
