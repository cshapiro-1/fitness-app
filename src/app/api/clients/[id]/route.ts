export const dynamic = "force-dynamic";
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
    const { name, image, email, phone, notes, fitnessGoals } = await req.json();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: name !== undefined ? name.trim() : client.name,
        image: image !== undefined ? (image ? image.trim() : null) : client.image,
        email: email !== undefined ? (email ? email.trim() : null) : client.email,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : client.phone,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : client.notes,
        fitnessGoals: fitnessGoals !== undefined ? (fitnessGoals ? fitnessGoals.trim() : null) : client.fitnessGoals,
      },
    });

    // If there is an associated login user, update their profile too
    const loginUser = await prisma.user.findFirst({
      where: { clientProfileId: clientId },
    });
    if (loginUser) {
      await prisma.user.update({
        where: { id: loginUser.id },
        data: {
          name: name !== undefined ? name.trim() : loginUser.name,
          image: image !== undefined ? (image ? image.trim() : null) : loginUser.image,
          email: email !== undefined ? (email ? email.trim() : null) : loginUser.email,
          phone: phone !== undefined ? (phone ? phone.trim() : null) : loginUser.phone,
          notes: notes !== undefined ? (notes ? notes.trim() : null) : loginUser.notes,
          fitnessGoals: fitnessGoals !== undefined ? (fitnessGoals ? fitnessGoals.trim() : null) : loginUser.fitnessGoals,
        },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";

    return NextResponse.json({
      id: updatedClient.id,
      userId: updatedClient.userId,
      name: updatedClient.name,
      image: updatedClient.image,
      email: updatedClient.email,
      phone: updatedClient.phone,
      notes: updatedClient.notes,
      fitnessGoals: updatedClient.fitnessGoals,
      inviteStatus: updatedClient.inviteStatus,
      inviteToken: updatedClient.inviteToken,
      inviteUrl: updatedClient.inviteToken ? (baseUrl ? `${baseUrl}/invite/${updatedClient.inviteToken}` : `/invite/${updatedClient.inviteToken}`) : null,
    });
  } catch (error) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: clientId } = await params;

    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ success: true, id: clientId });
  } catch (error) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}