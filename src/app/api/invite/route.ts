export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
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

    const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "strkyr.fit";
    const host = rawHost.split(",")[0].trim();
    const rawProto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const proto = rawProto.split(",")[0].trim();
    const baseUrl = `${proto}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      success: true,
      inviteUrl,
      token,
      inviteToken: token,
      client: updatedClient,
    });
  } catch (error: any) {
    console.error("Invite generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate invite" }, { status: 500 });
  }
}