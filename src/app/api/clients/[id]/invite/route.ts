export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const inviteToken = crypto.randomBytes(32).toString("hex");

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        inviteToken,
        inviteStatus: "PENDING",
        invitedAt: new Date(),
      },
    });

    const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "strkyr.fit";
    const host = rawHost.split(",")[0].trim();
    const rawProto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const proto = rawProto.split(",")[0].trim();
    const baseUrl = `${proto}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    return NextResponse.json({
      success: true,
      token: inviteToken,
      inviteToken,
      inviteUrl,
      client: updatedClient,
    });
  } catch (error: any) {
    console.error("POST /api/clients/[id]/invite Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invite" },
      { status: 500 }
    );
  }
}
