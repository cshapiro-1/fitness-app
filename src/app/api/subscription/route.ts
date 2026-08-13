export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkTrainerSubscription } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subInfo = await checkTrainerSubscription(session.user.id);
    return NextResponse.json(subInfo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch subscription status" }, { status: 500 });
  }
}