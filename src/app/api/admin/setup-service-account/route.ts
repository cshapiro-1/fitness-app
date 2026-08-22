export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";

export async function GET(req: Request) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const serviceEmail = "service@fitcoach.pro";

    // 1. Ensure master service account exists with Trainer + Admin privileges & active subscription
    const serviceUser = await prisma.user.upsert({
      where: { email: serviceEmail },
      update: {
        name: "FitCoach Master Admin",
        role: "TRAINER",
        isAdmin: true,
        subscriptionStatus: "active",
        subscribedUntil: new Date("2099-12-31"),
      },
      create: {
        email: serviceEmail,
        name: "FitCoach Master Admin",
        role: "TRAINER",
        isAdmin: true,
        subscriptionStatus: "active",
        subscribedUntil: new Date("2099-12-31"),
      },
    });

    // 2. Separate Collin's personal Google account as pure CLIENT
    const personalEmail = "collin.shapiro1@gmail.com";
    const personalUser = await prisma.user.findUnique({
      where: { email: personalEmail },
    });

    let updatedPersonal = null;
    if (personalUser) {
      // Find or create a Client profile linked to the service trainer
      let clientProfile = await prisma.client.findFirst({
        where: { email: personalEmail },
      });

      if (!clientProfile) {
        clientProfile = await prisma.client.create({
          data: {
            userId: serviceUser.id,
            name: personalUser.name || "Collin",
            email: personalEmail,
            fitnessGoals: "Client Workouts & Nutrition Tracking",
            inviteStatus: "ACCEPTED",
          },
        });
      }

      updatedPersonal = await prisma.user.update({
        where: { id: personalUser.id },
        data: {
          role: "CLIENT",
          isAdmin: false,
          clientProfileId: clientProfile.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      serviceAccount: {
        email: serviceUser.email,
        name: serviceUser.name,
        role: serviceUser.role,
        isAdmin: serviceUser.isAdmin,
        subscriptionStatus: serviceUser.subscriptionStatus,
      },
      personalClientAccount: updatedPersonal
        ? {
            email: updatedPersonal.email,
            role: updatedPersonal.role,
            isAdmin: updatedPersonal.isAdmin,
            clientProfileId: updatedPersonal.clientProfileId,
          }
        : "Personal account will be assigned CLIENT role upon next sign-in.",
    });
  } catch (error: any) {
    console.error("Setup Service Account Error:", error);
    return NextResponse.json({ error: error.message || "Failed to setup service account" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
