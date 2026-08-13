export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAuthorizedClient(clientId: string, userEmail?: string | null) {
  if (!userEmail) return null;
  const user = await prisma.user.findUnique({
    where: { email: userEmail.toLowerCase().trim() },
    include: { clients: true, clientProfile: true },
  });

  if (!user) return null;

  if (user.clientProfileId === clientId) {
    return prisma.client.findUnique({ where: { id: clientId } });
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId: user.id,
    },
  });

  return client;
}

// GET /api/nutrition/supplements?clientId=...&date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const client = await getAuthorizedClient(clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    const supplements = await prisma.supplementLog.findMany({
      where: { clientId, date },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, date, supplements });
  } catch (error: any) {
    console.error("Supplements GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch supplements" }, { status: 500 });
  }
}

// POST /api/nutrition/supplements
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientId,
      date = new Date().toISOString().split("T")[0],
      name,
      dosage,
      timing = "Morning",
      taken = true,
      notes,
    } = body;

    if (!clientId || !name?.trim()) {
      return NextResponse.json({ error: "clientId and supplement name are required" }, { status: 400 });
    }

    const client = await getAuthorizedClient(clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    const supplement = await prisma.supplementLog.create({
      data: {
        clientId,
        date,
        name: name.trim(),
        dosage: dosage ? dosage.trim() : null,
        timing: timing ? timing.trim() : "Morning",
        taken: taken !== false,
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({ success: true, supplement });
  } catch (error: any) {
    console.error("Supplements POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create supplement" }, { status: 500 });
  }
}

// PATCH /api/nutrition/supplements (toggle taken status or edit)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, taken, dosage, timing, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.supplementLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplement not found" }, { status: 404 });
    }

    const client = await getAuthorizedClient(existing.clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.supplementLog.update({
      where: { id },
      data: {
        taken: taken !== undefined ? taken : existing.taken,
        dosage: dosage !== undefined ? (dosage ? dosage.trim() : null) : existing.dosage,
        timing: timing !== undefined ? timing : existing.timing,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
      },
    });

    return NextResponse.json({ success: true, supplement: updated });
  } catch (error: any) {
    console.error("Supplements PATCH error:", error);
    return NextResponse.json({ error: error.message || "Failed to update supplement" }, { status: 500 });
  }
}

// DELETE /api/nutrition/supplements?id=...
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.supplementLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supplement not found" }, { status: 404 });
    }

    const client = await getAuthorizedClient(existing.clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Unauthorized to delete this supplement" }, { status: 403 });
    }

    await prisma.supplementLog.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Supplement deleted" });
  } catch (error: any) {
    console.error("Supplements DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete supplement" }, { status: 500 });
  }
}
