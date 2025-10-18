import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key-change-in-production",
  session: {
    strategy: "jwt" as const
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || user.status !== "active") return null;
        if (!user.password) return null;
        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
