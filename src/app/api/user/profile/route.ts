export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTrainerSubscription } from "@/lib/subscription";

// GET /api/user/profile - Fetch current user/trainer profile and billing details
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        _count: {
          select: {
            clients: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Resolve avatar with fallbacks if user.image is empty
    let userAvatar = user.image;
    if (!userAvatar && user.clientProfile?.image) {
      userAvatar = user.clientProfile.image;
    }
    if (!userAvatar && email) {
      const matchedClient = await prisma.client.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { image: true },
      });
      if (matchedClient?.image) {
        userAvatar = matchedClient.image;
      }
    }

    // If session has an OAuth image and DB had none, sync it into DB
    const sessionImage = (session.user as any)?.image;
    if (!userAvatar && sessionImage) {
      userAvatar = sessionImage;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: sessionImage },
        });
      } catch (err) {
        console.error("Auto-sync image error:", err);
      }
    }

    const subInfo = await checkTrainerSubscription(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: userAvatar,
        phone: user.phone,
        notes: user.notes,
        fitnessGoals: user.fitnessGoals,
        role: user.role,
        isAdmin: user.isAdmin,
        subscriptionProvider: user.subscriptionProvider || "stripe",
        subscriptionStatus: user.subscriptionStatus || "trial",
        subscribedUntil: user.subscribedUntil,
        trialEndsAt: user.trialEndsAt,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        hasSeenTour: user.hasSeenTour,
        clientCount: user._count.clients,
      },
      subscription: subInfo,
    });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update trainer profile details & picture
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { name, image, phone, notes, fitnessGoals, hasCompletedOnboarding, hasSeenTour } = body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name?.trim() || null }),
        ...(image !== undefined && { image: image?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(fitnessGoals !== undefined && { fitnessGoals: fitnessGoals?.trim() || null }),
        ...(hasCompletedOnboarding !== undefined && { hasCompletedOnboarding: !!hasCompletedOnboarding }),
        ...(hasSeenTour !== undefined && { hasSeenTour: !!hasSeenTour }),
      },
    });

    // Also synchronize client table if linked
    if (image !== undefined && (updated.clientProfileId || updated.email) && prisma.client && typeof prisma.client.updateMany === "function") {
      try {
        await prisma.client.updateMany({
          where: {
            OR: [
              ...(updated.clientProfileId ? [{ id: updated.clientProfileId }] : []),
              ...(updated.email ? [{ email: { equals: updated.email, mode: "insensitive" as const } }] : []),
            ],
          },
          data: {
            image: image?.trim() || null,
          },
        });
      } catch (clientErr) {
        console.error("Failed to sync client avatar:", clientErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        image: updated.image,
        phone: updated.phone,
        notes: updated.notes,
        fitnessGoals: updated.fitnessGoals,
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
