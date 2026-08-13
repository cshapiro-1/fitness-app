export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/user/delete-account
// Mandatory compliance endpoint for Apple App Store (Guideline 5.1.1(v)) & Google Play Data Safety
export async function DELETE() {
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

    // Cascade delete user's data:
    // 1. Delete associated client profile link if user is a client
    await prisma.user.updateMany({
      where: { trainerId: userId },
      data: { trainerId: null },
    });

    // 2. Delete clients owned by this trainer (cascades workouts & sessions)
    await prisma.client.deleteMany({
      where: { userId: userId },
    });

    // 3. Delete accounts and sessions
    await prisma.account.deleteMany({
      where: { userId: userId },
    });

    await prisma.session.deleteMany({
      where: { userId: userId },
    });

    // 4. Delete user record permanently
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Account and all associated fitness data permanently deleted.",
    });
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
