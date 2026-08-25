import { UserRole } from "@prisma/client";
import { normalizeUserRole } from '@/lib/utils/role-helpers';
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();

  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email address already exists. Please sign in." },
      { status: 409 }
    );
  }

  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.user.create({
    data: {
      email,
      name,
      role: UserRole.TRAINER,
      subscriptionStatus: "trial",
      trialEndsAt,
    },
  });

  return NextResponse.json({ ok: true, message: "Trainer signup complete. Your first month is free." });
}
