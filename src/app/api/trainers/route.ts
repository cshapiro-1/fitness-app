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
    if (existingUser.role === "TRAINER") {
      return NextResponse.json({ error: "This email already has a trainer account" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "TRAINER",
        isAdmin: false,
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true, message: "Trainer access activated" });
  }

  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.user.create({
    data: {
      email,
      name,
      role: "TRAINER",
      subscriptionStatus: "trial",
      trialEndsAt,
    },
  });

  return NextResponse.json({ ok: true, message: "Trainer signup complete. Your first month is free." });
}
