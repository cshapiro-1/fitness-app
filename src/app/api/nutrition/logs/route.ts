export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to resolve client access
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

// GET /api/nutrition/logs?clientId=...&date=YYYY-MM-DD
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

    const logs = await prisma.nutritionLog.findMany({
      where: { clientId, date },
      orderBy: { createdAt: "asc" },
    });

    const totals = logs.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fats: acc.fats + item.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return NextResponse.json({ success: true, date, logs, totals });
  } catch (error: any) {
    console.error("Nutrition log GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch food logs" }, { status: 500 });
  }
}

// POST /api/nutrition/logs
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
      mealName = "Breakfast",
      foodName,
      calories,
      protein = 0,
      carbs = 0,
      fats = 0,
      notes,
    } = body;

    if (!clientId || !foodName || calories === undefined) {
      return NextResponse.json({ error: "clientId, foodName, and calories are required" }, { status: 400 });
    }

    const client = await getAuthorizedClient(clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    const log = await prisma.nutritionLog.create({
      data: {
        clientId,
        date,
        mealName,
        foodName: foodName.trim(),
        calories: parseInt(calories, 10) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("Nutrition log POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create food log" }, { status: 500 });
  }
}

// DELETE /api/nutrition/logs?id=...
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

    const existingLog = await prisma.nutritionLog.findUnique({ where: { id } });
    if (!existingLog) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const client = await getAuthorizedClient(existingLog.clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Unauthorized to delete this log" }, { status: 403 });
    }

    await prisma.nutritionLog.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Food log deleted" });
  } catch (error: any) {
    console.error("Nutrition log DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete food log" }, { status: 500 });
  }
}
