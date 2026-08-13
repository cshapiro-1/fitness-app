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

  // If user is client accessing their own plan
  if (user.clientProfileId === clientId) {
    return prisma.client.findUnique({ where: { id: clientId } });
  }

  // If user is trainer who owns this client
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId: user.id,
    },
  });

  return client;
}

// GET /api/nutrition/plan?clientId=...
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const client = await getAuthorizedClient(clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    let plan = await prisma.nutritionPlan.findUnique({
      where: { clientId },
    });

    if (!plan) {
      // Create default plan if none exists
      plan = await prisma.nutritionPlan.create({
        data: {
          clientId,
          goalType: "CUT",
          dailyCalories: 2000,
          proteinGrams: 160,
          carbsGrams: 180,
          fatsGrams: 60,
          waterOz: 100,
          currentWeight: 185,
          targetWeight: 175,
          notes: "Focus on 1g protein per lb of bodyweight. Stay hydrated!",
        },
      });
    }

    return NextResponse.json({ success: true, plan, client });
  } catch (error: any) {
    console.error("Nutrition plan GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch nutrition plan" }, { status: 500 });
  }
}

// PUT /api/nutrition/plan
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientId,
      goalType = "CUT",
      dailyCalories = 2000,
      proteinGrams = 150,
      carbsGrams = 200,
      fatsGrams = 65,
      waterOz = 100,
      currentWeight,
      targetWeight,
      notes,
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const client = await getAuthorizedClient(clientId, session.user.email);
    if (!client) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    const plan = await prisma.nutritionPlan.upsert({
      where: { clientId },
      create: {
        clientId,
        goalType,
        dailyCalories: parseInt(dailyCalories, 10) || 2000,
        proteinGrams: parseInt(proteinGrams, 10) || 150,
        carbsGrams: parseInt(carbsGrams, 10) || 200,
        fatsGrams: parseInt(fatsGrams, 10) || 65,
        waterOz: waterOz ? parseInt(waterOz, 10) : 100,
        currentWeight: currentWeight ? parseFloat(currentWeight) : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        notes: notes || null,
      },
      update: {
        goalType,
        dailyCalories: parseInt(dailyCalories, 10) || 2000,
        proteinGrams: parseInt(proteinGrams, 10) || 150,
        carbsGrams: parseInt(carbsGrams, 10) || 200,
        fatsGrams: parseInt(fatsGrams, 10) || 65,
        waterOz: waterOz ? parseInt(waterOz, 10) : 100,
        currentWeight: currentWeight ? parseFloat(currentWeight) : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Nutrition plan PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update nutrition plan" }, { status: 500 });
  }
}
