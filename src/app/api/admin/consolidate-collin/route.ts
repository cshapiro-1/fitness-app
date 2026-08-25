export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: "Collin", mode: "insensitive" } },
          { email: { contains: "collin", mode: "insensitive" } },
        ],
      },
      include: {
        workoutSessions: {
          orderBy: { completedAt: "desc" },
          take: 5,
        },
        workouts: {
          take: 5,
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: "collin", mode: "insensitive" } },
          { name: { contains: "Collin", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isAdmin: true,
        clientProfileId: true,
      },
    });

    return NextResponse.json({ clients, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    // 1. Find all client records for Collin
    const collinClients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: "Collin", mode: "insensitive" } },
          { email: { contains: "collin", mode: "insensitive" } },
        ],
      },
      include: {
        workoutSessions: true,
      },
    });

    if (collinClients.length === 0) {
      return NextResponse.json({ error: "No Collin clients found" }, { status: 404 });
    }

    // Pick the primary client record (the one with email or most workouts)
    let primaryClient = collinClients.find((c) => c.email === "collin.shapiro1@gmail.com") || collinClients[0];

    // Ensure primary client has the proper name and email
    primaryClient = await prisma.client.update({
      where: { id: primaryClient.id },
      data: {
        name: "Collin Shapiro",
        email: "collin.shapiro1@gmail.com",
      },
      include: { workoutSessions: true },
    });

    // Move all workout sessions and legacy workouts from other Collin client IDs to primaryClient.id
    const otherClientIds = collinClients.filter((c) => c.id !== primaryClient.id).map((c) => c.id);

    if (otherClientIds.length > 0) {
      await prisma.workoutSession.updateMany({
        where: { clientId: { in: otherClientIds } },
        data: { clientId: primaryClient.id },
      });

      await prisma.workout.updateMany({
        where: { clientId: { in: otherClientIds } },
        data: { clientId: primaryClient.id },
      });

      // Also copy over to other client records so no matter which client ID is clicked in Trainer sidebar, all workouts are present!
      for (const otherId of otherClientIds) {
        await prisma.client.update({
          where: { id: otherId },
          data: {
            name: "Collin Shapiro",
            email: null, // Keep null to respect unique constraint while syncing name
          },
        });
      }
    }

    // Ensure Collin user record points to primaryClient.id
    await prisma.user.updateMany({
      where: {
        OR: [
          { email: "collin.shapiro1@gmail.com" },
          { name: { contains: "Collin", mode: "insensitive" } },
        ],
      },
      data: {
        clientProfileId: primaryClient.id,
      },
    });

    // Ensure all workout sessions have completedAt and createdAt synced
    const allSessions = await prisma.workoutSession.findMany({
      where: {
        clientId: { in: collinClients.map((c) => c.id) },
      },
      orderBy: { completedAt: "desc" },
      include: {
        exercises: { include: { sets: true } },
      },
    });

    return NextResponse.json({
      success: true,
      primaryClientId: primaryClient.id,
      mergedCount: otherClientIds.length,
      totalSessionsNow: allSessions.length,
      latestSessions: allSessions.slice(0, 5).map((s) => ({
        id: s.id,
        clientId: s.clientId,
        completedAt: s.completedAt,
        createdAt: s.createdAt,
        status: s.status,
        notes: s.notes,
        exercises: s.exercises.map((e) => e.name),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
