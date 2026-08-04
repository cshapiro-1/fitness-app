import { prisma } from "./prisma";

export type AppUserRole = "pending" | "trainer" | "client";

export function normalizeRole(role?: string | null): AppUserRole {
  if (role === "trainer" || role === "client") return role;
  return "pending";
}

export async function getUserRole(userId: string): Promise<AppUserRole> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return normalizeRole(user?.role);
}

export async function isTrainerUser(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === "trainer";
}
