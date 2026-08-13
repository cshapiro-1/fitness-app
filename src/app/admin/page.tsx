export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPortal } from "./AdminPortal";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // Verify Admin Permission directly in DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, name: true, email: true },
  });

  if (!user?.isAdmin) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", padding: "32px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 8px 0", color: "#dc2626", fontSize: "20px" }}>Access Denied</h2>
          <p style={{ color: "#64748b", margin: "0 0 20px 0", fontSize: "14px" }}>
            You do not have administrative privileges to access this portal.
          </p>
          <a
            href="/dashboard"
            style={{ display: "inline-block", background: "#2563eb", color: "#ffffff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: 600, fontSize: "13px" }}
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <AdminPortal userName={user.name || user.email || "Admin"} />;
}