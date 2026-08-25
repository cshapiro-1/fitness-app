import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
  return NextResponse.json(
    { error: "This maintenance endpoint is permanently disabled." },
    { status: 403 }
  );
}