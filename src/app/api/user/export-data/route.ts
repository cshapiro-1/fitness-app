export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/export-data
// GDPR Article 15 (Right of Access), Article 20 (Right to Data Portability), and CCPA/CPRA Data Access API
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId: string | null = null;
    const email = session.user.email?.toLowerCase().trim();

    if (email) {
      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) userId = dbUser.id;
    }

    if (!userId) {
      userId = (session.user as any).id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Query all personal data for export
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        fitnessGoals: true,
        notes: true,
        subscriptionStatus: true,
        subscribedUntil: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch clients created by trainer
    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        workoutSessions: {
          include: {
            exercises: {
              include: {
                sets: true,
              },
            },
          },
        },
      },
    });

    // Fetch client profile if user is a client
    let clientProfile = null;
    let clientWorkouts: any[] = [];
    if (email) {
      clientProfile = await prisma.client.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        include: {
          workoutSessions: {
            include: {
              exercises: {
                include: {
                  sets: true,
                },
              },
            },
          },
        },
      });

      if (clientProfile) {
        clientWorkouts = clientProfile.workoutSessions;
      }
    }

    const exportBundle = {
      formatVersion: "STRKYR-GDPR-CCPA-1.0",
      exportedAt: new Date().toISOString(),
      compliance: {
        gdprCompliant: true,
        ccpaCompliant: true,
        dataPortabilityArticle: "GDPR Article 20 / CCPA § 1798.100",
      },
      userProfile: user,
      trainerData: {
        totalClients: clients.length,
        clients: clients.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          fitnessGoals: c.fitnessGoals,
          notes: c.notes,
          createdAt: c.createdAt,
          workoutSessionsCount: c.workoutSessions.length,
          workoutSessions: c.workoutSessions.map((ws) => ({
            id: ws.id,
            status: ws.status,
            startedAt: ws.startedAt,
            completedAt: ws.completedAt,
            notes: ws.notes,
            createdAt: ws.createdAt,
            exercises: ws.exercises.map((ex) => ({
              id: ex.id,
              name: ex.name,
              category: ex.category,
              isBodyweight: ex.category === "BODYWEIGHT" || (ex as any).isBodyweight,
              order: ex.order,
              sets: ex.sets.map((s) => ({
                id: s.id,
                order: s.order,
                weight: s.weight,
                reps: s.reps,
                notes: s.notes,
              })),
            })),
          })),
        })),
      },
      athleteData: clientProfile
        ? {
            clientProfileId: clientProfile.id,
            trainerId: clientProfile.userId,
            workoutSessionsCount: clientWorkouts.length,
            workoutSessions: clientWorkouts.map((ws: any) => ({
              id: ws.id,
              status: ws.status,
              startedAt: ws.startedAt,
              completedAt: ws.completedAt,
              notes: ws.notes,
              createdAt: ws.createdAt,
              exercises: (ws.exercises || []).map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                category: ex.category,
                isBodyweight: ex.category === "BODYWEIGHT" || ex.isBodyweight,
                order: ex.order,
                sets: (ex.sets || []).map((s: any) => ({
                  id: s.id,
                  order: s.order,
                  weight: s.weight,
                  reps: s.reps,
                  notes: s.notes,
                })),
              })),
            })),
          }
        : null,
    };

    const filename = `strkyr_privacy_data_export_${userId}_${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("GDPR/CCPA Data Export Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate privacy data export" },
      { status: 500 }
    );
  }
}
