export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSystemAlert } from "@/lib/alerts";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = `error: ${error.message}`;
    // Trigger instant alert notification if DB is down!
    await sendSystemAlert({
      level: "CRITICAL",
      title: "Database Connection Failure",
      message: `Health check failed to query PostgreSQL database: ${error.message}`,
      context: { latencyMs: Date.now() - startTime, error: error.stack },
    });
  }

  const isHealthy = dbStatus === "connected";
  const uptimeSeconds = Math.floor(process.uptime ? process.uptime() : 0);

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      responseTimeMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      environment: process.env.NODE_ENV || "production",
      version: "1.0.0",
    },
    { status: isHealthy ? 200 : 503 }
  );
}
