import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

const hasGoogleCredentials = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const shouldEnableFallbackLogin = process.env.NODE_ENV !== "production" || !hasGoogleCredentials;
const adapter = hasDatabaseUrl ? PrismaAdapter(prisma) : undefined;

const providers: NextAuthOptions["providers"] = [];

if (hasGoogleCredentials) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}

if (shouldEnableFallbackLogin) {
  providers.push(
    CredentialsProvider({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials) {
        if (!hasDatabaseUrl) {
          const mode = credentials?.mode === "trainer" ? "TRAINER" : "CLIENT";
          return {
            id: mode === "TRAINER" ? "trainer-fallback" : "client-fallback",
            email: mode === "TRAINER" ? "trainer.local@local.test" : "client.local@local.test",
            name: mode === "TRAINER" ? "Local Trainer" : "Local Client",
            role: mode === "TRAINER" ? "trainer" : "client",
          };
        }

        const mode = credentials?.mode === "trainer" ? "TRAINER" : "CLIENT";
        const email = mode === "TRAINER" ? "trainer.local@local.test" : "client.local@local.test";
        const name = mode === "TRAINER" ? "Local Trainer" : "Local Client";

        const user = await prisma.user.upsert({
          where: { email },
          update: { name, role: mode },
          create: { email, name, role: mode },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name || name,
          role: mode === "TRAINER" ? "trainer" : "client",
        };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  ...(adapter ? { adapter } : {}),
  secret: process.env.NEXTAUTH_SECRET || "local-dev-secret",
  useSecureCookies: process.env.NODE_ENV === "production",
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;

      if (!hasDatabaseUrl) {
        token.role = "client" as never;
        token.isAdmin = false;
        token.subscriptionStatus = "trial";
        token.trialEndsAt = null;
        token.subscribedUntil = null;
        return token;
      }

      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId },
          include: {
            clients: { select: { id: true }, take: 1 },
            clientProfile: { select: { id: true } },
          },
        });

        if (dbUser) {
          let role: "trainer" | "client" | "pending" = dbUser.role === "TRAINER" ? "trainer" : dbUser.role === "CLIENT" ? "client" : "pending";
          let clientProfileId = dbUser.clientProfileId;
          token.isAdmin = dbUser.isAdmin;
          token.subscriptionStatus = dbUser.subscriptionStatus;
          token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null;
          token.subscribedUntil = dbUser.subscribedUntil?.toISOString() ?? null;

          if (dbUser.role === "TRAINER" && !dbUser.clientProfileId) {
            const existingClient = await prisma.client.findFirst({
              where: {
                OR: [
                  { email: dbUser.email, loginUser: null },
                  { userId: dbUser.id, name: "My Workouts" },
                ],
              },
              select: { id: true },
            });

            const selfProfile = existingClient ?? await prisma.client.create({
              data: {
                userId: dbUser.id,
                name: "My Workouts",
                email: dbUser.email,
                notes: "Personal trainer workouts",
              },
              select: { id: true },
            });

            const updated = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                clientProfileId: selfProfile.id,
              },
              select: {
                role: true,
                clientProfileId: true,
              },
            });

            role = updated.role === "TRAINER" ? "trainer" : updated.role === "CLIENT" ? "client" : "pending";
            clientProfileId = updated.clientProfileId;
          }

          token.role = role as never;
          token.clientProfileId = clientProfileId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as typeof session.user & {
          id: string;
          role: "trainer" | "client" | "pending";
          clientProfileId?: string | null;
          isAdmin?: boolean;
          subscriptionStatus?: string | null;
          trialEndsAt?: Date | null;
          subscribedUntil?: Date | null;
        };
        user.id = token.userId as string;
        user.role = (token.role as "trainer" | "client" | "pending") ?? "pending";
        user.clientProfileId = token.clientProfileId ?? null;
        user.isAdmin = Boolean(token.isAdmin);
        user.subscriptionStatus = (token.subscriptionStatus as string | undefined) ?? "trial";
        user.trialEndsAt = token.trialEndsAt ? new Date(token.trialEndsAt as string) : null;
        user.subscribedUntil = token.subscribedUntil ? new Date(token.subscribedUntil as string) : null;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
};
