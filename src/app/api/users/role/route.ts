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
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      const body = await req.json().catch(() => ({}));
      rawRole = body.role || body.userRole || body.selectedRole || "TRAINER";
    } else {
      const { searchParams } = new URL(req.url);
      rawRole = searchParams.get("role") || "TRAINER";
    }

    const clean = String(rawRole).trim().toUpperCase();
    const targetRole: UserRole = clean === "CLIENT" ? UserRole.CLIENT : UserRole.TRAINER;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: targetRole,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
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
      select: { id: true, email: true, role: true, isAdmin: true },
    });
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch role" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return handleRoleUpdate(req); }
export async function PUT(req: NextRequest) { return handleRoleUpdate(req); }
export async function PATCH(req: NextRequest) { return handleRoleUpdate(req); }
