import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedClient(userId: string, clientId: string) {
  return prisma.client.findFirst({ where: { id: clientId, userId } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "trainer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const client = await getOwnedClient(session.user.id, id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "trainer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const client = await getOwnedClient(session.user.id, id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { name, notes, email } = await req.json();
  const normalizedEmail = email?.trim()?.toLowerCase() || null;

  if (normalizedEmail) {
    const existingClientEmail = await prisma.client.findFirst({ where: { email: normalizedEmail, id: { not: id } }, select: { id: true } });
    if (existingClientEmail) {
      return NextResponse.json({ error: "Client email already in use" }, { status: 409 });
    }
  }

  const updated = await prisma.client.update({ where: { id }, data: { name, notes, email: normalizedEmail } });
  return NextResponse.json(updated);
}
