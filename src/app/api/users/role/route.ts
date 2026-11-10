export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

async function handleRoleUpdate(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let rawRole = "TRAINER";
    let inviteCode: string | null = null;
    let coachEmail: string | null = null;
    let athleteGoals: string | null = null;
    let athleteName: string | null = null;

    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      const body = await req.json().catch(() => ({}));
      rawRole = body.role || body.userRole || body.selectedRole || "TRAINER";
      inviteCode = body.inviteCode || body.token || body.inviteToken || null;
      coachEmail = body.coachEmail || null;
      athleteGoals = body.fitnessGoals || body.goals || null;
      athleteName = body.name || null;
    } else {
      const { searchParams } = new URL(req.url);
      rawRole = searchParams.get("role") || "TRAINER";
      inviteCode = searchParams.get("inviteCode") || searchParams.get("token") || null;
      coachEmail = searchParams.get("coachEmail") || null;
    }

    const clean = String(rawRole).trim().toUpperCase();
    const targetRole: UserRole = clean === "CLIENT" ? UserRole.CLIENT : UserRole.TRAINER;

    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, image: true, role: true, clientProfileId: true, trainerId: true, isAdmin: true },
    });

    let clientProfileId = existingUser?.clientProfileId;
    let trainerId = existingUser?.trainerId || null;

    if (targetRole === UserRole.CLIENT) {
      // 1. If an invite code was provided, redeem and link it
      if (inviteCode) {
        const cleanCode = String(inviteCode).trim();
        const foundClient = await prisma.client.findFirst({
          where: {
            OR: [
              { inviteToken: cleanCode },
              { inviteToken: cleanCode.toLowerCase() },
              { id: cleanCode },
            ],
          },
        });
        if (foundClient) {
          clientProfileId = foundClient.id;
          trainerId = foundClient.userId;
          try {
            await prisma.client.update({
              where: { id: foundClient.id },
              data: {
                inviteStatus: "ACCEPTED",
                ...(existingUser?.email ? { email: existingUser.email } : {}),
              },
            });
          } catch {}
        }
      }

      // 2. If a coach email was provided, connect with coach
      if (!clientProfileId && coachEmail) {
        const cleanCoachEmail = String(coachEmail).trim().toLowerCase();
        const coachUser = await prisma.user.findFirst({
          where: { email: { equals: cleanCoachEmail, mode: "insensitive" } },
        });
        if (coachUser) {
          trainerId = coachUser.id;
          let matchingClientUnderCoach = await prisma.client.findFirst({
            where: {
              userId: coachUser.id,
              OR: [
                ...(existingUser?.email ? [{ email: { equals: existingUser.email, mode: "insensitive" as const } }] : []),
                ...(existingUser?.name ? [{ name: { equals: existingUser.name, mode: "insensitive" as const } }] : []),
              ],
            },
          });
          if (!matchingClientUnderCoach) {
            try {
              matchingClientUnderCoach = await prisma.client.create({
                data: {
                  userId: coachUser.id,
                  name: athleteName || existingUser?.name || "Athlete",
                  email: existingUser?.email || null,
                  image: existingUser?.image || null,
                  fitnessGoals: athleteGoals || null,
                  inviteStatus: "ACCEPTED",
                  notes: `Coached by ${coachUser.name || coachUser.email}`,
                },
              });
            } catch (err) {
              console.error("Failed to create client under coach:", err);
            }
          } else {
            try {
              await prisma.client.update({
                where: { id: matchingClientUnderCoach.id },
                data: {
                  inviteStatus: "ACCEPTED",
                  ...(existingUser?.email ? { email: existingUser.email } : {}),
                },
              });
            } catch {}
          }
          if (matchingClientUnderCoach) {
            clientProfileId = matchingClientUnderCoach.id;
          }
        }
      }

      // 3. Check existing profile by email if still not linked
      if (!clientProfileId && existingUser?.email) {
        const existingByEmail = await prisma.client.findFirst({
          where: { email: { equals: existingUser.email, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
        });
        if (existingByEmail) {
          clientProfileId = existingByEmail.id;
          trainerId = existingByEmail.userId;
        }
      }

      // 4. Solo Athlete fallback
      if (!clientProfileId) {
        try {
          const soloClient = await prisma.client.create({
            data: {
              userId: session.user.id,
              name: athleteName || existingUser?.name || "Solo Athlete",
              email: existingUser?.email || null,
              image: existingUser?.image || null,
              fitnessGoals: athleteGoals || "General Fitness & Strength",
              inviteStatus: "ACCEPTED",
              notes: "Personal Solo Athlete Profile",
            },
          });
          clientProfileId = soloClient.id;
        } catch (e) {
          console.error("Auto solo client creation failed:", e);
        }
      }
    } else if (targetRole === UserRole.TRAINER) {
      // Ensure the coach has a dedicated personal client profile for their own workouts
      let trainerSelfClient = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          OR: [
            { name: { in: ["My Workouts", "My Workouts (Personal)", "Personal", "Self"] } },
            { name: { contains: "(You)" } },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      if (!trainerSelfClient) {
        try {
          trainerSelfClient = await prisma.client.create({
            data: {
              userId: session.user.id,
              name: existingUser?.name ? `${existingUser.name} (You)` : "Personal Workouts (You)",
              email: existingUser?.email || null,
              image: existingUser?.image || null,
              inviteStatus: "ACCEPTED",
              notes: "Personal workout tracking",
            },
          });
        } catch (e) {
          console.error("Auto trainer self client creation failed:", e);
        }
      }

      if (trainerSelfClient) {
        clientProfileId = trainerSelfClient.id;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: targetRole,
        hasCompletedOnboarding: true,
        ...(clientProfileId ? { clientProfileId } : {}),
        ...(trainerId ? { trainerId } : {}),
        ...(athleteName ? { name: athleteName } : {}),
        ...(athleteGoals ? { fitnessGoals: athleteGoals } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      role: targetRole,
      clientProfileId: updatedUser.clientProfileId,
      trainerId: updatedUser.trainerId,
    });
  } catch (error: any) {
    console.error("Role update error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update role" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, clientProfileId: true, trainerId: true, isAdmin: true, hasCompletedOnboarding: true },
    });
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch role" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleRoleUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handleRoleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleRoleUpdate(req);
}
