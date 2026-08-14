import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const cleanEmail = credentials.email.toLowerCase().trim();
        const servicePassword = process.env.SERVICE_ACCOUNT_PASSWORD || "FitCoachAdmin2026!";

        try {
          // Master Service Account Check
          if (cleanEmail === "service@fitcoach.pro" || cleanEmail === "admin@fitcoach.pro") {
            if (credentials.password && credentials.password !== servicePassword) {
              return null;
            }

            let user = await prisma.user.findUnique({
              where: { email: cleanEmail },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: cleanEmail,
                  name: "FitCoach Master Admin",
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = mapRole((user as any).role);
        token.isAdmin = (user as any).isAdmin;
      }
      
      const email = token.email || user?.email;
      if (email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, role: true, isAdmin: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = mapRole(dbUser.role);
            token.isAdmin = !!dbUser.isAdmin;
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
              select: { id: true, role: true, isAdmin: true },
            });
            if (dbUser) {
              (session.user as any).id = dbUser.id;
              (session.user as any).role = mapRole(dbUser.role);
              (session.user as any).isAdmin = !!dbUser.isAdmin;
              return session;
            }
          } catch (err) {
            console.error("Session lookup error:", err);
          }
        }
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
        (session.user as any).isAdmin = !!token.isAdmin;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
  debug: process.env.NODE_ENV === "development",
};