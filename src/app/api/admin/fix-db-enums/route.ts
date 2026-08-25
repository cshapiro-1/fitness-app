import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { verifyAdminAccess } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.authorized) {
      return auth.response || NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const updated = await prisma.user.updateMany({
      data: { role: UserRole.TRAINER },
    });
    return NextResponse.json({
      success: true,
      message: "Successfully updated user roles to TRAINER",
      updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}