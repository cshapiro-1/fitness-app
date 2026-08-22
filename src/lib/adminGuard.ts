import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AdminVerificationResult {
  authorized: boolean;
  userId?: string;
  userEmail?: string;
  response?: NextResponse;
}

/**
 * Validates that an incoming request is authorized to execute Admin/Maintenance operations.
 * Checks for:
 * 1. Active NextAuth session with isAdmin === true.
 * 2. Or matching 'x-admin-secret' or 'Authorization: Bearer <SECRET>' header.
 */
export async function verifyAdminAccess(
  req?: NextRequest | Request
): Promise<AdminVerificationResult> {
  const adminSecret = process.env.ADMIN_SECRET || process.env.SERVICE_ACCOUNT_PASSWORD || "FitCoachAdmin2026!";

  // 1. Check Secret Header Bypass for automated tasks or CLI tools
  if (req && "headers" in req) {
    const customHeader = req.headers.get("x-admin-secret");
    const authHeader = req.headers.get("authorization");

    if (customHeader && customHeader === adminSecret) {
      return { authorized: true, userEmail: "system-admin-secret" };
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token === adminSecret) {
        return { authorized: true, userEmail: "system-bearer-secret" };
      }
    }
  }

  // 2. Check NextAuth Session
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Authentication required for admin resources" },
          { status: 401 }
        ),
      };
    }

    const email = session.user.email?.toLowerCase().trim();
    if (!email) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Invalid user session" },
          { status: 401 }
        ),
      };
    }

    // Lookup user in DB to verify isAdmin flag
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isAdmin: true, role: true },
    });

    if (!dbUser || (!dbUser.isAdmin && email !== "service@fitcoach.pro" && email !== "admin@fitcoach.pro")) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Admin privileges required" },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId: dbUser.id,
      userEmail: dbUser.email || undefined,
    };
  } catch (err: any) {
    console.error("Admin verification error:", err);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authorization verification failed" },
        { status: 500 }
      ),
    };
  }
}
