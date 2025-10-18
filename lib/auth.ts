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
                
                const user = await prisma.user.findUnique({ 
                    where: { email: parsed.data.email },
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        password: true,
                        role: true,
                        status: true,
                        isApproved: true
                    }
                });
                
                if (!user) return null;
                
                // 检查用户状态
                if (user.status === "suspended") {
                    throw new Error("账户已被暂停，请联系管理员");
                }
                
                if (user.status === "pending" || !user.isApproved) {
                    throw new Error("账户待审核，请等待管理员审核通过");
                }
                
                if (user.status !== "active") {
                    throw new Error("账户状态异常，请联系管理员");
                }
                
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
        async jwt({ token, user }: any) {
            if (user) {
                token.role = (user as { role?: string }).role ?? "user";
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = (token.role as string) ?? "user";
            }
            return session;
        }
    }
};
