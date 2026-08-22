export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWorkoutSummary } from "@/app/dashboard/utils/aiWorkoutSummary";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const workout = body.workout;

    const result = generateWorkoutSummary(workout);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Workout Summary Error:", error);
    return NextResponse.json({ error: "Failed to summarize workout" }, { status: 500 });
  }
}
