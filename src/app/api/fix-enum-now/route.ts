import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const updated = await prisma.user.updateMany({
      data: { role: UserRole.TRAINER },
    });
    return NextResponse.json({
      success: true,
      message: "Successfully synchronized user roles",
      updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}