export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || session?.user?.email;

    if (!email) {
      return new NextResponse("Unauthorized or missing email", { status: 401 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { image: true, name: true },
    });

    const imageUrl = user?.image || session?.user?.image;

    if (!imageUrl) {
      return new NextResponse("No avatar image found", { status: 404 });
    }

    // Fetch the image from Google CDN on the server
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!imgRes.ok) {
      return NextResponse.redirect(imageUrl);
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    return new NextResponse("Failed to load avatar", { status: 500 });
  }
}
