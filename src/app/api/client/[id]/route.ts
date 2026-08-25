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

    let userId = (session.user as any)?.id;
    if (!userId && session.user.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = dbUser?.id;
    }
    const isAdmin = (session.user as any)?.isAdmin === true;

    if (userId !== clientId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot modify another user's profile" }, { status: 403 });
    }

    const updatedClient = await prisma.user.update({
      where: { id: clientId },
      data: {
        name,
        notes,
        fitnessGoals,
      },
    });

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}