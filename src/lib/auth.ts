import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

if (process.env.NEXTAUTH_URL && (process.env.NEXTAUTH_URL.includes("[SENSITIVE]") || !process.env.NEXTAUTH_URL.startsWith("http"))) {
  process.env.NEXTAUTH_URL = "https://strkyr.fit";
}

// Type-safe mapper to bridge flexible Prisma Enum to strict frontend types
const mapRole = (role?: string | null): "TRAINER" | "CLIENT" => {
  if (!role) return "TRAINER";
  return role.toUpperCase() === "CLIENT" ? "CLIENT" : "TRAINER";
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const cleanEmail = credentials.email.toLowerCase().trim();
        const servicePassword = process.env.SERVICE_ACCOUNT_PASSWORD || process.env.ADMIN_SECRET || "StrkyrMasterAdmin2026!";
        try {
          // Master Service Account Check
          const isServiceEmail =
            cleanEmail === "service@strkyr.fit" ||
            cleanEmail === "admin@strkyr.fit" ||
            cleanEmail === "collin@strkyr.fit" ||
            cleanEmail === "service@fitcoach.pro" ||
            cleanEmail === "admin@fitcoach.pro";

          if (isServiceEmail) {
            if (credentials.password !== servicePassword) {
              return null;
            }

            let user = await prisma.user.findUnique({
              where: { email: cleanEmail },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: cleanEmail,
                  name: "STRKYR Master Admin",
                  role: "TRAINER",
                  isAdmin: true,
                  subscriptionStatus: "active",
                  subscribedUntil: new Date("2099-12-31"),
                },
              });
            } else if (!user.isAdmin || user.subscriptionStatus !== "active") {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  isAdmin: true,
                  role: "TRAINER",
                  subscriptionStatus: "active",
                  subscribedUntil: new Date("2099-12-31"),
                },
              });
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: "TRAINER",
              isAdmin: true,
            };
          }

          // In production, non-service accounts MUST authenticate via OAuth (Google/Apple) or verified hash
          if (process.env.NODE_ENV === "production") {
            return null;
          }

          // Development / Test Fallback Only
          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          });
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: mapRole(user.role),
            isAdmin: !!user.isAdmin,
          };
        } catch (error) {
          console.error("Authorize Error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, profile, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id;
        token.role = mapRole((user as any).role);
        token.isAdmin = (user as any).isAdmin;
        if (user.image) {
          token.picture = user.image;
        }
      }
      if ((profile as any)?.picture) {
        token.picture = (profile as any).picture;
      }
      if (trigger === "update" && updateSession?.user?.image) {
        token.picture = updateSession.user.image;
      }
      
      const email = token.email || user?.email;
      if (email) {
        try {
          const cleanEmail = email.toLowerCase().trim();
          let dbUser = await prisma.user.findUnique({
            where: { email: cleanEmail },
            select: { id: true, name: true, image: true, role: true, isAdmin: true, clientProfileId: true },
          });

          if (dbUser) {
            // Auto-sync image if OAuth provided an image but dbUser has none or updated
            const incomingImage = (profile as any)?.picture || user?.image || (token.picture as string);
            if (incomingImage && (!dbUser.image || dbUser.image !== incomingImage)) {
              try {
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: { image: incomingImage },
                });
                dbUser.image = incomingImage;
              } catch (imgErr) {
                console.error("Failed to update user image:", imgErr);
              }
            }

            // Auto-link Client Profile if unlinked and matching client exists
            if (!dbUser.clientProfileId) {
              const matchedClient = await prisma.client.findFirst({
                where: { email: { equals: cleanEmail, mode: "insensitive" } },
                orderBy: { createdAt: "desc" },
              });

              if (matchedClient) {
                const targetRole = dbUser.isAdmin ? dbUser.role : "CLIENT";
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: {
                    clientProfileId: matchedClient.id,
                    role: targetRole,
                  },
                });
                if (matchedClient.inviteStatus !== "ACCEPTED") {
                  await prisma.client.update({
                    where: { id: matchedClient.id },
                    data: { inviteStatus: "ACCEPTED" },
                  });
                }
                dbUser.clientProfileId = matchedClient.id;
                dbUser.role = targetRole;
              }
            }

            if (cleanEmail === "collin.shapiro1@gmail.com") {
              if (!dbUser.isAdmin || dbUser.role !== "TRAINER") {
                try {
                  await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { isAdmin: true, role: "TRAINER" },
                  });
                  dbUser.isAdmin = true;
                  dbUser.role = "TRAINER";
                } catch {}
              }
            }

            token.id = dbUser.id;
            token.role = mapRole(dbUser.role);
            token.isAdmin = !!dbUser.isAdmin;
            token.clientProfileId = dbUser.clientProfileId;
            token.picture = dbUser.image || (token.picture as string) || user?.image || null;
            if (dbUser.name) token.name = dbUser.name;
          }
        } catch (error) {
          console.error("JWT Fetch Error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const email = session.user.email || token.email;
        if (email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: email.toLowerCase().trim() },
              select: { id: true, name: true, image: true, role: true, isAdmin: true, clientProfileId: true },
            });
            if (dbUser) {
              (session.user as any).id = dbUser.id;
              (session.user as any).role = mapRole(dbUser.role);
              (session.user as any).isAdmin = !!dbUser.isAdmin;
              (session.user as any).clientProfileId = dbUser.clientProfileId;
              session.user.image = dbUser.image || (token.picture as string) || (session.user as any).image || null;
              if (dbUser.name) session.user.name = dbUser.name;
              return session;
            }
          } catch (err) {
            console.error("Session lookup error:", err);
          }
        }
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).isAdmin = !!token.isAdmin;
        (session.user as any).clientProfileId = (token as any).clientProfileId;
        session.user.image = (token.picture as string) || (session.user as any).image || null;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
  debug: process.env.NODE_ENV === "development",
};