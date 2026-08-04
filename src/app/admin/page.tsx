import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, role: true, email: true, subscriptionStatus: true, trialEndsAt: true, subscribedUntil: true },
  });

  if (!user?.isAdmin) redirect("/dashboard");

  const trainers = await prisma.user.findMany({
    where: { role: "TRAINER" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, subscriptionStatus: true, trialEndsAt: true, subscribedUntil: true, createdAt: true },
  });

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <h1>Admin</h1>
      <p>Manage trainer accounts and billing access.</p>
      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {trainers.map((trainer) => (
          <div key={trainer.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{trainer.name || trainer.email}</strong>
                <div style={{ color: "#64748b" }}>{trainer.email}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>Status: {trainer.subscriptionStatus || "trial"}</div>
                <div style={{ color: "#64748b" }}>
                  Trial ends: {trainer.trialEndsAt ? new Date(trainer.trialEndsAt).toLocaleDateString() : "—"}
                </div>
                <div style={{ color: "#64748b" }}>
                  Paid until: {trainer.subscribedUntil ? new Date(trainer.subscribedUntil).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
