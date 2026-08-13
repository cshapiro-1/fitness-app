export const dynamic = "force-dynamic";
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

    const token = crypto.randomBytes(32).toString("hex");

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        inviteToken: token,
        inviteStatus: "PENDING",
        invitedAt: new Date(),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const inviteUrl = baseUrl ? `${baseUrl}/invite/${token}` : `/invite/${token}`;

    return NextResponse.json({
      inviteUrl,
      token,
      inviteToken: token,
      client: updatedClient,
    });
  } catch (error) {
    console.error("Invite generation error:", error);
    return NextResponse.json({ error: "Failed to generate invite" }, { status: 500 });
  }
}