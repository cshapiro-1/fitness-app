import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Dashboard } from "./Dashboard";
import { ClientDashboard } from "./ClientDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userName = session.user.name ?? (session.user.role === "CLIENT" ? "Client" : "Trainer");
  const userImage = session.user.image ?? null;

  if (session.user.role === "CLIENT") {
    return <ClientDashboard userName={userName} userImage={userImage} />;
  }

  return <Dashboard userName={userName} userImage={userImage} />;
}
