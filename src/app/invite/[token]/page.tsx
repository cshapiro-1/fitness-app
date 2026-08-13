import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  const session = await getServerSession(authOptions);

  // Look up client profile by invite token
  const client = await prisma.client.findFirst({
    where: { inviteToken: token },
  });

  if (!client) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>Invalid or Expired Invite Link</h2>
          <p style={{ color: "#64748b", margin: 0 }}>Please request a new link from your trainer.</p>
        </div>
      </div>
    );
  }

  // If user is logged in, associate their account with this client profile
  if (session?.user?.id) {
    await prisma.client.update({
      where: { id: client.id },
      data: {
        email: session.user.email,
        inviteStatus: "ACCEPTED",
      },
    });
    redirect("/dashboard");
  }

  // If user is not logged in, redirect to sign-in page with callback back to this invite
  redirect(`/auth/signin?callbackUrl=/invite/${token}`);
}