import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;
    const { name, notes, fitnessGoals } = await req.json();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true },
    });

    let targetUserId = clientId;
    if (client) {
      targetUserId = client.userId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { name, notes, fitnessGoals } as any,
    });

    return NextResponse.json({
      id: clientId,
      userId: targetUserId,
      name: updatedUser.name,
      email: updatedUser.email,
      notes: (updatedUser as any).notes || null,
      fitnessGoals: (updatedUser as any).fitnessGoals || null,
    });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}