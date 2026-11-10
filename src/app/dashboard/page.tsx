export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Dashboard } from "./Dashboard";
import { ClientDashboard } from "./ClientDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage client workout programs, active logs, and strength progression.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if this is a fresh user who needs role onboarding
  const userId = (session.user as any).id;
  const userEmail = session.user.email?.toLowerCase().trim();

  if (userId || userEmail) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(userId ? [{ id: userId }] : []),
            ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" as const } }] : []),
          ],
        },
        select: {
          id: true,
          role: true,
          hasCompletedOnboarding: true,
          clientProfileId: true,
          _count: {
            select: { clients: true, loggedWorkouts: true },
          },
        },
      });

      // If fresh new user with no clients, no workouts, and has not completed onboarding
      if (
        dbUser &&
        !dbUser.hasCompletedOnboarding &&
        !dbUser.clientProfileId &&
        dbUser._count.clients === 0 &&
        dbUser._count.loggedWorkouts === 0
      ) {
        redirect("/onboarding");
      }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      console.warn("User onboarding check warning:", err?.message);
    }
  }

  const userName = session.user.name ?? (session.user.role === "CLIENT" ? "Client" : "Trainer");
  const userImage = session.user.image ?? null;
  const isAdmin = (session.user as any).isAdmin === true;

  if (session.user.role === "CLIENT") {
    return <ClientDashboard userName={userName} userImage={userImage} isAdmin={isAdmin} />;
  }

  return <Dashboard userName={userName} userImage={userImage} isAdmin={isAdmin} />;
}
