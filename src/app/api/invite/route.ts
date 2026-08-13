import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 });
    }

    try {
      await (prisma as any).invitation.updateMany({
        where: { clientId, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
    } catch (e) {}

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await (prisma as any).invitation.create({
      data: {
        token,
        clientId,
        trainerId: (session.user as any).id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    return NextResponse.json({ inviteUrl, token: invitation.token });
  } catch (error) {
    console.error("Invite generation error:", error);
    return NextResponse.json({ error: "Failed to generate invite" }, { status: 500 });
  }
}