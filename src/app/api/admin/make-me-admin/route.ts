import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAccess } from "@/lib/adminGuard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { error: "Admin role modifications are disabled. Admin permissions are strictly immutable." },
    { status: 403 }
  );
}