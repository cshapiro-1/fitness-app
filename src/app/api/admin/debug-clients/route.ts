export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });

    const clients = await prisma.client.findMany({
      select: { id: true, userId: true, name: true, email: true, inviteStatus: true },
    });

    return NextResponse.json({ users, clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
