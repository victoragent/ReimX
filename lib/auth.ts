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

                const emailInput = parsed.data.email.toLowerCase();

                // 1. Case-insensitive search to handle historical data
                // Using raw query to be compatible with both SQLite and Postgres
                const users = await prisma.$queryRaw<any[]>`
                    SELECT * FROM "User" WHERE LOWER(email) = LOWER(${emailInput})
                `;

                if (users.length === 0) return null;

                // 2. Conflict Protection: strict safety check
                if (users.length > 1) {
                    console.error(`Login blocked: Multiple users found for email ${emailInput}`);
                    throw new Error("账户存在冲突，请联系管理员处理");
                }

                const user = users[0];

                // Normalize boolean fields for SQLite compatibility (might return 1/0)
                if (typeof user.isApproved === 'number') {
                    user.isApproved = user.isApproved === 1;
                }



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

                // 3. Opportunistic Fix: Auto-correct email casing if needed
                if (user.email !== emailInput) {
                    try {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { email: emailInput }
                        });
                        console.log(`Auto-corrected email casing for user ${user.id}: ${user.email} -> ${emailInput}`);
                        user.email = emailInput; // Update local object for returned session
                    } catch (error) {
                        // Non-blocking error, log and continue
                        console.error("Failed to auto-correct email casing:", error);
                    }
                }

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
                token.id = (user as { id?: string }).id;
                token.role = (user as { role?: string }).role ?? "user";
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = (token.role as string) ?? "user";
            }
            return session;
        }
    }
};
