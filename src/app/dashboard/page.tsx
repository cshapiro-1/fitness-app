import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Dashboard } from "./Dashboard";
import { ClientDashboard } from "./ClientDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");
  if (session.user.role === "CLIENT") {
    return <ClientDashboard userName={session.user.name ?? "Client"} userImage={session.user.image ?? null} />;
  }
  return <Dashboard userName={session.user.name ?? "Trainer"} userImage={session.user.image ?? null} />;
}
