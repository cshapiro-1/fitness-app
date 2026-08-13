import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const targetEmail = "collin.shapiro1@gmail.com";

    const revoked = await prisma.user.updateMany({
      data: { isAdmin: false },
    });

    const user = await prisma.user.findFirst({
      where: {
        email: { contains: targetEmail, mode: "insensitive" },
      },
    });

    if (!user) {
      const allUsers = await prisma.user.findMany({ select: { email: true, name: true } });
      return NextResponse.json(
        {
          error: `User ${targetEmail} not found`,
          registeredUsers: allUsers,
        },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully granted exclusive Admin privileges to ${user.email}!`,
      revokedCount: revoked.count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to assign admin" }, { status: 500 });
  }
}